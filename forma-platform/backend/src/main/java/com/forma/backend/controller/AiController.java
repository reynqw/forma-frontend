package com.forma.backend.controller;

import com.forma.backend.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Studio", description = "AI-консультант и генератор шрифтов для продвинутых авторов")
public class AiController {

    private final AiService aiService;

    // ──────────────────────────────────────────────────────────────────
    // Проверка доступа
    // ──────────────────────────────────────────────────────────────────

    @GetMapping("/access")
    @Operation(summary = "Проверить доступ к AI Studio")
    public ResponseEntity<Map<String, Object>> checkAccess(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(aiService.checkAccess(userId));
    }

    // ──────────────────────────────────────────────────────────────────
    // AI-консультант
    // ──────────────────────────────────────────────────────────────────

    @PostMapping("/chat")
    @Operation(summary = "Отправить сообщение AI-консультанту по типографике с историей диалога")
    public ResponseEntity<Map<String, String>> chat(
            Authentication auth,
            @RequestBody ChatRequest request) {
        Long userId = Long.parseLong(auth.getName());
        String response = aiService.chat(userId, request.getMessage(), request.getHistory());
        return ResponseEntity.ok(Map.of("response", response));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Потоковый чат с AI-консультантом (SSE)")
    public SseEmitter chatStream(
            Authentication auth,
            @RequestBody ChatRequest request) {
        Long userId = Long.parseLong(auth.getName());
        return aiService.chatStream(userId, request.getMessage(), request.getHistory());
    }

    /**
     * DTO для запроса чата с историей.
     */
    @lombok.Data
    public static class ChatRequest {
        private String message;
        private java.util.List<java.util.Map<String, String>> history;
    }

    // ──────────────────────────────────────────────────────────────────
    // Генерация эскизов шрифтов
    // ──────────────────────────────────────────────────────────────────

    @PostMapping("/generate-font")
    @Operation(summary = "Сгенерировать эскиз дизайна шрифта")
    public ResponseEntity<Map<String, Object>> generateFont(
            Authentication auth,
            @RequestBody Map<String, String> request) {
        Long userId = Long.parseLong(auth.getName());
        String style = request.get("style");
        String letters = request.get("letters");

        // Генерируем эскиз через Hugging Face (FLUX.1) + сохраняем в историю
        Map<String, Object> result = aiService.generateFontImage(userId, style, letters);

        // Получаем текстовые рекомендации от Ollama и сохраняем к генерации
        try {
            String advice = aiService.generateFontAdvice(userId, style, letters);
            result = new java.util.HashMap<>(result);
            result.put("advice", advice);
            // Сохраняем advice в запись генерации
            Object genId = result.get("generationId");
            if (genId != null) {
                aiService.updateGenerationAdvice(((Number) genId).longValue(), advice);
            }
        } catch (Exception e) {
            // Рекомендации не критичны — если Ollama не ответил, отдаём только картинку
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/font-prompt")
    @Operation(summary = "Сгенерировать промпт для шрифта (только текст)")
    public ResponseEntity<Map<String, String>> generatePrompt(
            Authentication auth,
            @RequestBody Map<String, String> request) {
        Long userId = Long.parseLong(auth.getName());
        String style = request.get("style");
        String prompt = aiService.generateFontPrompt(userId, style);
        return ResponseEntity.ok(Map.of("prompt", prompt));
    }

    // ──────────────────────────────────────────────────────────────────
    // История генераций шрифтов
    // ──────────────────────────────────────────────────────────────────

    @GetMapping("/generations")
    @Operation(summary = "Получить историю генераций шрифтов")
    public ResponseEntity<?> getGenerations(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(aiService.getUserGenerations(userId));
    }

    @GetMapping("/generations/{id}")
    @Operation(summary = "Получить конкретную генерацию")
    public ResponseEntity<?> getGeneration(Authentication auth, @PathVariable Long id) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(aiService.getGeneration(userId, id));
    }

    @PostMapping("/generations/{id}/favorite")
    @Operation(summary = "Добавить/убрать из избранного")
    public ResponseEntity<?> toggleFavorite(Authentication auth, @PathVariable Long id) {
        Long userId = Long.parseLong(auth.getName());
        aiService.toggleFavorite(userId, id);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @DeleteMapping("/generations/{id}")
    @Operation(summary = "Удалить генерацию")
    public ResponseEntity<?> deleteGeneration(Authentication auth, @PathVariable Long id) {
        Long userId = Long.parseLong(auth.getName());
        aiService.deleteGeneration(userId, id);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @DeleteMapping("/generations")
    @Operation(summary = "Удалить всю историю генераций")
    public ResponseEntity<?> deleteAllGenerations(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        aiService.deleteAllGenerations(userId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    // ──────────────────────────────────────────────────────────────────
    // Обратная связь
    // ──────────────────────────────────────────────────────────────────

    @PostMapping("/feedback")
    @Operation(summary = "Отправить обратную связь по ответу AI (👍/👎)")
    public ResponseEntity<Map<String, String>> feedback(
            Authentication auth,
            @RequestBody FeedbackRequest request) {
        Long userId = Long.parseLong(auth.getName());
        aiService.saveFeedback(userId, request.getMessageText(), request.getResponseText(),
                request.isPositive(), request.getComment());
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @lombok.Data
    public static class FeedbackRequest {
        private String messageText;
        private String responseText;
        private boolean positive;
        private String comment;
    }

    // ──────────────────────────────────────────────────────────────────
    // Сессии чатов
    // ──────────────────────────────────────────────────────────────────

    @GetMapping("/sessions")
    @Operation(summary = "Получить список сессий чатов")
    public ResponseEntity<?> getSessions(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(aiService.getUserSessions(userId));
    }

    @PostMapping("/sessions")
    @Operation(summary = "Создать новую сессию чата")
    public ResponseEntity<?> createSession(Authentication auth, @RequestBody(required = false) Map<String, String> body) {
        Long userId = Long.parseLong(auth.getName());
        String title = body != null ? body.get("title") : null;
        var session = aiService.createSession(userId, title);
        return ResponseEntity.ok(Map.of("id", session.getId(), "title", session.getTitle()));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Получить сессию с сообщениями")
    public ResponseEntity<?> getSession(Authentication auth, @PathVariable Long id) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(aiService.getSessionWithMessages(userId, id));
    }

    @PostMapping("/sessions/{id}/messages")
    @Operation(summary = "Сохранить сообщение в сессию")
    public ResponseEntity<?> saveMessage(Authentication auth, @PathVariable Long id,
                                         @RequestBody Map<String, String> body) {
        aiService.saveMessageToSession(id, body.get("role"), body.get("content"));
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Удалить сессию чата")
    public ResponseEntity<?> deleteSession(Authentication auth, @PathVariable Long id) {
        Long userId = Long.parseLong(auth.getName());
        aiService.deleteSession(userId, id);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @DeleteMapping("/sessions")
    @Operation(summary = "Удалить все сессии чатов")
    public ResponseEntity<?> deleteAllSessions(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        aiService.deleteAllSessions(userId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
