package com.forma.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forma.backend.entity.Author;
import com.forma.backend.entity.Resource;
import com.forma.backend.entity.User;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.enums.UserRole;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.exception.UnauthorizedException;
import com.forma.backend.entity.AiChatMessage;
import com.forma.backend.entity.AiChatSession;
import com.forma.backend.entity.AiFeedback;
import com.forma.backend.entity.AiFontGeneration;
import com.forma.backend.repository.AiChatMessageRepository;
import com.forma.backend.repository.AiChatSessionRepository;
import com.forma.backend.repository.AiFeedbackRepository;
import com.forma.backend.repository.AiFontGenerationRepository;
import com.forma.backend.repository.AuthorRepository;
import com.forma.backend.repository.ResourceRepository;
import com.forma.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final UserRepository userRepository;
    private final AuthorRepository authorRepository;
    private final ResourceRepository resourceRepository;
    private final AiFeedbackRepository aiFeedbackRepository;
    private final AiChatSessionRepository chatSessionRepository;
    private final AiChatMessageRepository chatMessageRepository;
    private final AiFontGenerationRepository fontGenerationRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.ollama.base-url}")
    private String ollamaBaseUrl;

    @Value("${ai.ollama.model}")
    private String ollamaModel;

    @Value("${ai.ollama.timeout}")
    private long ollamaTimeout;

    @Value("${ai.huggingface.api-token}")
    private String hfApiToken;

    @Value("${ai.huggingface.model}")
    private String hfModel;

    @Value("${ai.huggingface.base-url}")
    private String hfBaseUrl;

    @Value("${ai.access.min-published-resources}")
    private int minPublishedResources;

    @Value("${ai.access.min-sales}")
    private int minSales;

    @Value("${ai.access.min-days-on-platform}")
    private int minDaysOnPlatform;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // ──────────────────────────────────────────────────────────────────
    // Проверка доступа
    // ──────────────────────────────────────────────────────────────────

    /**
     * Проверяет, имеет ли пользователь доступ к AI Studio.
     * Доступ получают продвинутые авторы или те, кому админ выдал вручную.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkAccess(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));

        if (user.getRole() != UserRole.AUTHOR) {
            return Map.of(
                    "hasAccess", false,
                    "reason", "AI Studio доступна только авторам"
            );
        }

        Author author = authorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Профиль автора не найден"));

        // Админ выдал доступ вручную
        if (author.isAiAccess()) {
            return Map.of("hasAccess", true);
        }

        // Проверяем критерии автоматического доступа
        long publishedCount = resourceRepository.countPublishedByAuthorId(author.getId());
        long daysOnPlatform = ChronoUnit.DAYS.between(author.getCreatedAt(), LocalDateTime.now());

        boolean meetsResources = publishedCount >= minPublishedResources;
        boolean meetsSales = author.getSalesCount() >= minSales;
        boolean meetsDays = daysOnPlatform >= minDaysOnPlatform;

        boolean hasAccess = meetsResources && meetsSales && meetsDays;

        if (hasAccess && !author.isAiAccess()) {
            // Автоматически активируем доступ
            author.setAiAccess(true);
            authorRepository.save(author);
        }

        return Map.of(
                "hasAccess", hasAccess,
                "publishedResources", publishedCount,
                "requiredResources", minPublishedResources,
                "sales", author.getSalesCount(),
                "requiredSales", minSales,
                "daysOnPlatform", daysOnPlatform,
                "requiredDays", minDaysOnPlatform
        );
    }

    private void validateAccess(Long userId) {
        Map<String, Object> access = checkAccess(userId);
        if (!(boolean) access.get("hasAccess")) {
            throw new UnauthorizedException("У вас нет доступа к AI Studio. " +
                    "Необходимо: " + minPublishedResources + " ресурсов, " +
                    minSales + " продаж, " + minDaysOnPlatform + " дней на платформе.");
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Системный промпт для чата
    // ──────────────────────────────────────────────────────────────────

    private String buildChatSystemPrompt(String catalogContext) {
        return """
                Ты — AI-консультант платформы FORMA (маркетплейс шрифтов и дизайн-ресурсов). Твоё имя: FORMA AI.

                ГЛАВНОЕ ПРАВИЛО: Пиши ТОЛЬКО на русском языке. Ни одного слова на китайском, английском или другом языке. Только русский язык. Названия шрифтов можно писать латиницей (например Roboto, Playfair Display).

                Стиль общения:
                - Дружелюбный, краткий (2-5 предложений)
                - На приветствия отвечай по-русски и предлагай помощь
                - На непонятные сообщения вежливо проси уточнить
                - Используй markdown: **жирный**, списки

                Компетенции: подбор шрифтов, шрифтовые пары, типографика, рекомендации из каталога FORMA.

                Каталог FORMA:
                %s
                """.formatted(catalogContext);
    }

    // ──────────────────────────────────────────────────────────────────
    // AI-консультант (Ollama)
    // ──────────────────────────────────────────────────────────────────

    /**
     * AI-консультант по типографике и дизайну.
     * Знает о ресурсах на платформе и может рекомендовать шрифты.
     */
    /**
     * AI-консультант с поддержкой истории диалога.
     * Ollama получает последние сообщения для контекста беседы.
     */
    @Transactional(readOnly = true)
    public String chat(Long userId, String userMessage, List<Map<String, String>> history) {
        validateAccess(userId);

        if (userMessage == null || userMessage.isBlank()) {
            throw new BadRequestException("Сообщение не может быть пустым");
        }

        // Собираем контекст — список шрифтов на платформе
        List<Resource> fonts = resourceRepository.findByStatus(
                ResourceStatus.PUBLISHED,
                org.springframework.data.domain.PageRequest.of(0, 50)
        ).getContent();

        String catalogContext;
        try {
            catalogContext = fonts.stream()
                    .map(r -> String.format("- %s (тип: %s, цена: %s руб., рейтинг: %s, скачиваний: %d)",
                            r.getName(),
                            r.getType() != null ? r.getType().getName() : "N/A",
                            r.getPrice() != null ? r.getPrice() : "0",
                            r.getAvgRating() != null ? r.getAvgRating() : "0",
                            r.getDownloadCount()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            log.warn("Не удалось загрузить каталог для контекста AI: {}", e.getMessage());
            catalogContext = "(каталог временно недоступен)";
        }

        String systemPrompt = buildChatSystemPrompt(catalogContext);

        String response = callOllamaWithHistory(systemPrompt, userMessage, history);
        return stripNonRussianText(response).trim();
    }

    /**
     * AI-консультант с потоковым выводом (SSE).
     * Токены отправляются клиенту по мере генерации.
     */
    @Transactional(readOnly = true)
    public SseEmitter chatStream(Long userId, String userMessage, List<Map<String, String>> history) {
        validateAccess(userId);

        if (userMessage == null || userMessage.isBlank()) {
            throw new BadRequestException("Сообщение не может быть пустым");
        }

        // Собираем контекст каталога
        List<Resource> fonts = resourceRepository.findByStatus(
                ResourceStatus.PUBLISHED,
                org.springframework.data.domain.PageRequest.of(0, 50)
        ).getContent();

        String catalogContext;
        try {
            catalogContext = fonts.stream()
                    .map(r -> String.format("- %s (тип: %s, цена: %s руб., рейтинг: %s, скачиваний: %d)",
                            r.getName(),
                            r.getType() != null ? r.getType().getName() : "N/A",
                            r.getPrice() != null ? r.getPrice() : "0",
                            r.getAvgRating() != null ? r.getAvgRating() : "0",
                            r.getDownloadCount()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            catalogContext = "(каталог временно недоступен)";
        }

        String systemPrompt = buildChatSystemPrompt(catalogContext);

        // Собираем сообщения с историей
        List<Map<String, String>> messages = new java.util.ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (history != null && !history.isEmpty()) {
            int maxHistory = 10;
            List<Map<String, String>> recentHistory = history.size() > maxHistory
                    ? history.subList(history.size() - maxHistory, history.size())
                    : history;
            for (Map<String, String> msg : recentHistory) {
                String role = msg.get("role");
                String content = msg.get("content");
                if (role != null && content != null &&
                        (role.equals("user") || role.equals("assistant"))) {
                    messages.add(Map.of("role", role, "content", content));
                }
            }
        }
        messages.add(Map.of("role", "user", "content",
                "[Отвечай только на русском языке] " + userMessage));

        SseEmitter emitter = new SseEmitter(ollamaTimeout);

        // Запускаем streaming в отдельном потоке
        new Thread(() -> {
            try {
                String requestBody = objectMapper.writeValueAsString(Map.of(
                        "model", ollamaModel,
                        "messages", messages,
                        "stream", true,
                        "options", Map.of(
                                "temperature", 0.6,
                                "num_predict", 512,
                                "repeat_penalty", 1.3,
                                "top_p", 0.9
                        )
                ));

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(ollamaBaseUrl + "/api/chat"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .timeout(Duration.ofMillis(ollamaTimeout))
                        .build();

                HttpResponse<java.io.InputStream> response = httpClient.send(
                        request, HttpResponse.BodyHandlers.ofInputStream());

                if (response.statusCode() != 200) {
                    emitter.send(SseEmitter.event().name("error").data("AI-сервис временно недоступен"));
                    emitter.complete();
                    return;
                }

                // Читаем NDJSON поток от Ollama построчно
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.isBlank()) continue;
                        JsonNode chunk = objectMapper.readTree(line);
                        String token = chunk.path("message").path("content").asText("");
                        boolean done = chunk.path("done").asBoolean(false);

                        String cleanToken = stripNonRussianText(token);
                        if (!cleanToken.isEmpty()) {
                            emitter.send(SseEmitter.event()
                                    .data(cleanToken, org.springframework.http.MediaType.TEXT_PLAIN));
                        }
                        if (done) {
                            emitter.send(SseEmitter.event()
                                    .data("[DONE]", org.springframework.http.MediaType.TEXT_PLAIN));
                            break;
                        }
                    }
                }
                emitter.complete();

            } catch (Exception e) {
                log.error("Streaming chat failed", e);
                try {
                    emitter.send(SseEmitter.event().name("error")
                            .data("AI-сервис временно недоступен"));
                    emitter.complete();
                } catch (IOException ignored) {}
            }
        }).start();

        return emitter;
    }

    // ──────────────────────────────────────────────────────────────────
    // Обратная связь (👍/👎)
    // ──────────────────────────────────────────────────────────────────

    @Transactional
    public void saveFeedback(Long userId, String messageText, String responseText,
                             boolean isPositive, String comment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        AiFeedback feedback = AiFeedback.builder()
                .user(user)
                .messageText(messageText)
                .responseText(responseText)
                .isPositive(isPositive)
                .comment(comment)
                .build();

        aiFeedbackRepository.save(feedback);
        log.info("AI feedback saved: userId={}, positive={}", userId, isPositive);
    }

    // ──────────────────────────────────────────────────────────────────
    // Сессии чатов (CRUD)
    // ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserSessions(Long userId) {
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "title", s.getTitle(),
                        "createdAt", s.getCreatedAt().toString(),
                        "updatedAt", s.getUpdatedAt().toString()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public AiChatSession createSession(Long userId, String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
        AiChatSession session = AiChatSession.builder()
                .user(user)
                .title(title != null && !title.isBlank() ? title : "Новый чат")
                .build();
        return chatSessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSessionWithMessages(Long userId, Long sessionId) {
        AiChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена"));
        List<Map<String, String>> msgs = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(m -> Map.of("role", m.getRole().name(), "content", m.getContent()))
                .collect(Collectors.toList());
        return Map.of("id", session.getId(), "title", session.getTitle(), "messages", msgs);
    }

    @Transactional
    public void saveMessageToSession(Long sessionId, String role, String content) {
        AiChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена"));
        AiChatMessage msg = AiChatMessage.builder()
                .session(session)
                .role(AiChatMessage.Role.valueOf(role))
                .content(content)
                .build();
        chatMessageRepository.save(msg);

        // Автоназвание: по первому сообщению пользователя
        if (role.equals("user") && session.getTitle().equals("Новый чат")) {
            String autoTitle = content.length() > 40 ? content.substring(0, 40) + "..." : content;
            session.setTitle(autoTitle);
            chatSessionRepository.save(session);
        }
        session.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(session);
    }

    @Transactional
    public void deleteSession(Long userId, Long sessionId) {
        chatSessionRepository.deleteByIdAndUserId(sessionId, userId);
    }

    @Transactional
    public void deleteAllSessions(Long userId) {
        chatSessionRepository.deleteAllByUserId(userId);
    }

    // ──────────────────────────────────────────────────────────────────
    // История генераций шрифтов (CRUD)
    // ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserGenerations(Long userId) {
        return fontGenerationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(g -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", g.getId());
                    map.put("styleDescription", g.getStyleDescription());
                    map.put("letters", g.getLetters());
                    map.put("createdAt", g.getCreatedAt().toString());
                    map.put("isFavorite", g.getIsFavorite());
                    // Отдаём превью (первые 200 символов base64) для галереи,
                    // полное изображение — по отдельному запросу
                    map.put("image", g.getImageBase64());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGeneration(Long userId, Long genId) {
        AiFontGeneration gen = fontGenerationRepository.findByIdAndUserId(genId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Генерация не найдена"));
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", gen.getId());
        map.put("styleDescription", gen.getStyleDescription());
        map.put("letters", gen.getLetters());
        map.put("promptUsed", gen.getPromptUsed());
        map.put("image", gen.getImageBase64());
        map.put("advice", gen.getAdvice());
        map.put("createdAt", gen.getCreatedAt().toString());
        map.put("isFavorite", gen.getIsFavorite());
        return map;
    }

    @Transactional
    public void updateGenerationAdvice(Long genId, String advice) {
        fontGenerationRepository.findById(genId).ifPresent(gen -> {
            gen.setAdvice(advice);
            fontGenerationRepository.save(gen);
        });
    }

    @Transactional
    public void toggleFavorite(Long userId, Long genId) {
        AiFontGeneration gen = fontGenerationRepository.findByIdAndUserId(genId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Генерация не найдена"));
        gen.setIsFavorite(!gen.getIsFavorite());
        fontGenerationRepository.save(gen);
    }

    @Transactional
    public void deleteGeneration(Long userId, Long genId) {
        fontGenerationRepository.deleteByIdAndUserId(genId, userId);
    }

    @Transactional
    public void deleteAllGenerations(Long userId) {
        fontGenerationRepository.deleteAllByUserId(userId);
    }

    // ──────────────────────────────────────────────────────────────────
    // Постобработка — удаление китайского текста
    // ──────────────────────────────────────────────────────────────────

    /**
     * Убирает китайские/японские/корейские символы из ответа AI.
     */
    private String stripNonRussianText(String text) {
        if (text == null) return "";
        // Удаляем CJK символы (китайский, японский, корейский)
        String cleaned = text.replaceAll("[\\u4e00-\\u9fff\\u3400-\\u4dbf\\u3000-\\u303f\\uff00-\\uffef]+", "");
        // Удаляем эмодзи и символы-картинки
        cleaned = cleaned.replaceAll("[\\x{1F600}-\\x{1F64F}\\x{1F300}-\\x{1F5FF}\\x{1F680}-\\x{1F6FF}\\x{1F1E0}-\\x{1F1FF}\\x{2600}-\\x{27BF}\\x{2B50}\\x{2764}\\x{FE0F}\\x{200D}\\x{20E3}\\x{E0020}-\\x{E007F}]+", "");
        // Схлопываем множественные пробелы внутри, НО НЕ ТРОГАЕМ ведущие/замыкающие
        // (ведущие пробелы в токенах LLM — это пробелы между словами!)
        cleaned = cleaned.replaceAll(" {3,}", " ");
        return cleaned;
    }

    /**
     * Генерация описания стиля шрифта для Kandinsky.
     * Ollama создаёт детализированный промпт на английском для генерации изображения.
     */
    @Transactional(readOnly = true)
    public String generateFontPrompt(Long userId, String styleDescription) {
        validateAccess(userId);

        String systemPrompt = """
                You are a font design expert. Based on the user's description of a desired font style,
                generate a detailed English prompt for an AI image generator.
                The prompt should describe individual alphabet letters in the specified style.

                Format your response as ONLY the prompt text, nothing else.
                The prompt should be for generating a clean display of the full alphabet A-Z
                in the described font style on a white background.

                Include details about: stroke weight, serifs/sans-serif, letter spacing,
                artistic style, mood, and visual characteristics.
                """;

        return callOllama(systemPrompt, styleDescription);
    }

    /**
     * Вызов Ollama с историей диалога.
     * Формирует: system → [history...] → user (текущее сообщение).
     * Ограничиваем историю до 10 последних сообщений, чтобы не превышать контекст модели.
     */
    private String callOllamaWithHistory(String systemPrompt, String userMessage,
                                          List<Map<String, String>> history) {
        List<Map<String, String>> messages = new java.util.ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Добавляем историю (максимум 10 последних сообщений)
        if (history != null && !history.isEmpty()) {
            int maxHistory = 10;
            List<Map<String, String>> recentHistory = history.size() > maxHistory
                    ? history.subList(history.size() - maxHistory, history.size())
                    : history;

            for (Map<String, String> msg : recentHistory) {
                String role = msg.get("role");
                String content = msg.get("content");
                if (role != null && content != null &&
                        (role.equals("user") || role.equals("assistant"))) {
                    messages.add(Map.of("role", role, "content", content));
                }
            }
        }

        // Текущее сообщение пользователя
        messages.add(Map.of("role", "user", "content",
                "[Отвечай только на русском языке] " + userMessage));

        return callOllamaMessages(messages);
    }

    private String callOllama(String systemPrompt, String userMessage) {
        return callOllamaMessages(List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
        ));
    }

    /**
     * Общий метод вызова Ollama API с произвольным списком сообщений.
     */
    private String callOllamaMessages(List<Map<String, String>> messages) {
        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "model", ollamaModel,
                    "messages", messages,
                    "stream", false,
                    "options", Map.of(
                            "temperature", 0.6,
                            "num_predict", 512,
                            "repeat_penalty", 1.3,
                            "top_p", 0.9
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaBaseUrl + "/api/chat"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofMillis(ollamaTimeout))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Ollama error: status={}, body={}", response.statusCode(), response.body());
                throw new BadRequestException("AI-сервис временно недоступен");
            }

            JsonNode json = objectMapper.readTree(response.body());
            return json.path("message").path("content").asText();

        } catch (IOException | InterruptedException e) {
            log.error("Ollama request failed", e);
            throw new BadRequestException("AI-сервис временно недоступен. Убедитесь, что Ollama запущена.");
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Генерация эскизов шрифтов (Hugging Face + FLUX.1)
    // ──────────────────────────────────────────────────────────────────

    /**
     * Генерация эскиза шрифта через Hugging Face Inference API (FLUX.1-schnell).
     * Синхронный вызов — возвращает base64 изображения и сохраняет в историю.
     */
    @Transactional
    public Map<String, Object> generateFontImage(Long userId, String styleDescription, String letters) {
        validateAccess(userId);

        if (hfApiToken == null || hfApiToken.isBlank()) {
            throw new BadRequestException("Hugging Face API не настроен. Обратитесь к администратору.");
        }

        String lettersToUse = (letters != null && !letters.isBlank()) ? letters : "A B C D E";

        // Определяем тип алфавита для точного указания в промпте
        boolean hasCyrillic = lettersToUse.matches(".*[А-Яа-яЁё].*");
        boolean hasLatin = lettersToUse.matches(".*[A-Za-z].*");
        String alphabetHint;
        if (hasCyrillic && !hasLatin) {
            alphabetHint = "CYRILLIC (Russian alphabet)";
        } else if (hasLatin && !hasCyrillic) {
            alphabetHint = "LATIN (English alphabet)";
        } else {
            alphabetHint = "mixed CYRILLIC and LATIN";
        }

        // Если кириллица — транслитерируем для FLUX (он плохо понимает кириллицу)
        String lettersForPrompt = lettersToUse;
        if (hasCyrillic) {
            lettersForPrompt = transliterateCyrillic(lettersToUse);
        }

        // Шаг 1: Ollama создаёт точный промпт для FLUX
        String prompt;
        try {
            String promptSystemMsg = """
                    You write prompts for FLUX.1 image generator. Output ONLY the prompt, no explanations.

                    Task: create a prompt for a TYPOGRAPHY SPECIMEN image.
                    The image must show these individual letters arranged in a row: %s
                    Font style requested by user (in Russian): will be provided.

                    STRICT RULES:
                    1. Output ONLY the English prompt text — no quotes, no labels, no commentary
                    2. Start with: "Typography specimen sheet,"
                    3. Describe the FONT STYLE in detail: serif/sans-serif, stroke weight (thin/bold/heavy), contrast, texture (smooth/rough/hand-drawn), edges (sharp/rounded/decorative)
                    4. Specify: "displaying individual letters %s evenly spaced in a single row"
                    5. End with: "centered on clean white background, professional font design, high resolution, 4k"
                    6. Maximum 50 words total
                    7. Do NOT mention any letters or words other than: %s
                    8. Do NOT write words like "kitchen", "hello", or any readable word — ONLY separate individual letters
                    """.formatted(lettersForPrompt, lettersForPrompt, lettersForPrompt);
            prompt = callOllama(promptSystemMsg, styleDescription);
            // Очистка — убираем кавычки, переносы, markdown-обёртки
            prompt = prompt.replace("\"", "").replace("\n", " ")
                           .replaceAll("^[\\s]*```[\\s]*", "").replaceAll("[\\s]*```[\\s]*$", "")
                           .replaceAll("(?i)^prompt:?\\s*", "")
                           .trim();
            if (prompt.length() < 20) {
                throw new RuntimeException("Prompt too short");
            }
            log.info("Ollama generated prompt: {}", prompt);
        } catch (Exception e) {
            log.warn("Ollama prompt generation failed, using fallback: {}", e.getMessage());
            prompt = String.format(
                    "Typography specimen sheet, %s style font, displaying individual letters %s " +
                    "evenly spaced in a single row, each letter large and clearly legible, " +
                    "centered on clean white background, professional font design, high resolution, 4k",
                    styleDescription, lettersForPrompt
            );
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "inputs", prompt
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(hfBaseUrl + "/" + hfModel))
                    .header("Authorization", "Bearer " + hfApiToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(90))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() == 503) {
                log.warn("HF model loading, retry needed");
                throw new BadRequestException("Модель загружается, попробуйте через 30 секунд");
            }

            if (response.statusCode() != 200) {
                log.error("HF error: status={}, body={}", response.statusCode(),
                        new String(response.body(), java.nio.charset.StandardCharsets.UTF_8));
                throw new BadRequestException("Ошибка генерации изображения");
            }

            String contentType = response.headers().firstValue("Content-Type").orElse("");
            if (!contentType.contains("image")) {
                log.error("HF returned non-image: {}", contentType);
                throw new BadRequestException("Ошибка генерации: неверный формат ответа");
            }

            // Конвертируем в base64
            String base64Image = java.util.Base64.getEncoder().encodeToString(response.body());

            log.info("Font sketch generated: userId={}, size={}KB", userId, response.body().length / 1024);

            // Сохраняем в историю
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
            AiFontGeneration gen = AiFontGeneration.builder()
                    .user(user)
                    .styleDescription(styleDescription)
                    .letters(lettersToUse)
                    .promptUsed(prompt)
                    .imageBase64(base64Image)
                    .build();
            gen = fontGenerationRepository.save(gen);

            return Map.of(
                    "status", "DONE",
                    "image", base64Image,
                    "generationId", gen.getId()
            );

        } catch (IOException | InterruptedException e) {
            log.error("HF request failed", e);
            throw new BadRequestException("Сервис генерации изображений временно недоступен");
        }
    }

    /**
     * Генерирует текстовые рекомендации по стилю шрифта (дополнение к эскизу).
     */
    @Transactional(readOnly = true)
    public String generateFontAdvice(Long userId, String styleDescription, String letters) {
        validateAccess(userId);

        String systemPrompt = """
                Ты — эксперт по шрифтовому дизайну платформы FORMA.
                ОБЯЗАТЕЛЬНО: весь ответ ТОЛЬКО на русском языке. Ни одного слова на китайском или английском.

                Дай краткие профессиональные рекомендации по стилю шрифта:

                1. Характеристики стиля — что определяет этот стиль (2 предложения)
                2. Штрихи и засечки — толщина штрихов, контраст, наличие засечек (2 предложения)
                3. Метрики — кернинг, интерлиньяж, высота строчных (1-2 предложения)
                4. Шрифтовая пара — какой шрифт хорошо сочетается с этим стилем (1 предложение)
                5. Совет автору — главный совет по доработке шрифта (1 предложение)

                Пиши нумерованным списком, без заголовков markdown. Максимум 150 слов.
                Каждое слово на русском языке.
                """;

        String userMsg = String.format("Стиль: %s. Буквы: %s", styleDescription, letters);
        String response = callOllama(systemPrompt, userMsg);
        return stripNonRussianText(response).trim();
    }

    // ──────────────────────────────────────────────────────────────────
    // Транслитерация кириллицы → латиницы для FLUX промптов
    // ──────────────────────────────────────────────────────────────────

    private static final Map<Character, String> CYRILLIC_MAP = Map.ofEntries(
            Map.entry('А', "A"), Map.entry('Б', "B"), Map.entry('В', "V"), Map.entry('Г', "G"),
            Map.entry('Д', "D"), Map.entry('Е', "E"), Map.entry('Ё', "Yo"), Map.entry('Ж', "Zh"),
            Map.entry('З', "Z"), Map.entry('И', "I"), Map.entry('Й', "Y"), Map.entry('К', "K"),
            Map.entry('Л', "L"), Map.entry('М', "M"), Map.entry('Н', "N"), Map.entry('О', "O"),
            Map.entry('П', "P"), Map.entry('Р', "R"), Map.entry('С', "S"), Map.entry('Т', "T"),
            Map.entry('У', "U"), Map.entry('Ф', "F"), Map.entry('Х', "Kh"), Map.entry('Ц', "Ts"),
            Map.entry('Ч', "Ch"), Map.entry('Ш', "Sh"), Map.entry('Щ', "Sch"), Map.entry('Ъ', ""),
            Map.entry('Ы', "Y"), Map.entry('Ь', ""), Map.entry('Э', "E"), Map.entry('Ю', "Yu"),
            Map.entry('Я', "Ya"),
            Map.entry('а', "a"), Map.entry('б', "b"), Map.entry('в', "v"), Map.entry('г', "g"),
            Map.entry('д', "d"), Map.entry('е', "e"), Map.entry('ё', "yo"), Map.entry('ж', "zh"),
            Map.entry('з', "z"), Map.entry('и', "i"), Map.entry('й', "y"), Map.entry('к', "k"),
            Map.entry('л', "l"), Map.entry('м', "m"), Map.entry('н', "n"), Map.entry('о', "o"),
            Map.entry('п', "p"), Map.entry('р', "r"), Map.entry('с', "s"), Map.entry('т', "t"),
            Map.entry('у', "u"), Map.entry('ф', "f"), Map.entry('х', "kh"), Map.entry('ц', "ts"),
            Map.entry('ч', "ch"), Map.entry('ш', "sh"), Map.entry('щ', "sch"), Map.entry('ъ', ""),
            Map.entry('ы', "y"), Map.entry('ь', ""), Map.entry('э', "e"), Map.entry('ю', "yu"),
            Map.entry('я', "ya")
    );

    private String transliterateCyrillic(String text) {
        StringBuilder sb = new StringBuilder();
        for (char c : text.toCharArray()) {
            String mapped = CYRILLIC_MAP.get(c);
            sb.append(mapped != null ? mapped : c);
        }
        return sb.toString();
    }
}
