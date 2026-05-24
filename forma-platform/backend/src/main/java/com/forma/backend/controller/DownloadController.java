package com.forma.backend.controller;

import com.forma.backend.entity.DownloadToken;
import com.forma.backend.entity.LicenseKey;
import com.forma.backend.entity.Order;
import com.forma.backend.entity.Resource;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.exception.UnauthorizedException;
import com.forma.backend.repository.DownloadTokenRepository;
import com.forma.backend.repository.LicenseKeyRepository;
import com.forma.backend.repository.ResourceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/downloads")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Скачивание", description = "Скачивание купленных ресурсов")
@Slf4j
public class DownloadController {

    private final ResourceRepository resourceRepository;
    private final LicenseKeyRepository licenseKeyRepository;
    private final DownloadTokenRepository downloadTokenRepository;

    @Value("${storage.local.base-path:./uploads}")
    private String localBasePath;

    @Value("${storage.local.base-url:http://localhost:8080/api/files}")
    private String localBaseUrl;

    /**
     * Скачивание файла ресурса.
     * Доступно если: ресурс бесплатный ИЛИ пользователь имеет лицензионный ключ.
     */
    @GetMapping("/{resourceId}")
    @Operation(summary = "Скачать файл ресурса")
    @Transactional
    public ResponseEntity<org.springframework.core.io.Resource> downloadResource(
            @PathVariable Long resourceId,
            Authentication auth) {

        Long userId = Long.parseLong(auth.getName());
        Resource resource = resourceRepository.findById(resourceId)
                .filter(r -> r.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", resourceId));

        // Проверка доступа: бесплатный ресурс или куплен
        boolean isFree = resource.getPrice().compareTo(BigDecimal.ZERO) == 0;
        boolean hasLicense = licenseKeyRepository.existsByUserIdAndResourceId(userId, resourceId);
        boolean isAuthor = resource.getAuthor().getUser().getId().equals(userId);

        if (!isFree && !hasLicense && !isAuthor) {
            throw new UnauthorizedException("Для скачивания необходимо приобрести ресурс");
        }

        // Получаем файл
        String filePath = resource.getFilePath();
        if (filePath == null || filePath.isBlank()) {
            throw new BadRequestException("Файл ресурса не найден");
        }

        try {
            // filePath содержит полный URL вроде http://localhost:8080/api/files/resources/UUID
            // Извлекаем относительный путь
            String relativePath = filePath;
            if (filePath.startsWith(localBaseUrl)) {
                relativePath = filePath.substring(localBaseUrl.length());
                if (relativePath.startsWith("/")) relativePath = relativePath.substring(1);
            }

            Path basePath = Paths.get(localBasePath).toAbsolutePath().normalize();
            Path file = basePath.resolve(relativePath).normalize();

            // Защита от path traversal — файл должен находиться внутри uploads
            if (!file.startsWith(basePath)) {
                log.warn("Path traversal attempt: resourceId={}, path={}", resourceId, relativePath);
                throw new BadRequestException("Недопустимый путь к файлу");
            }

            UrlResource fileResource = new UrlResource(file.toUri());

            if (!fileResource.exists() || !fileResource.isReadable()) {
                throw new ResourceNotFoundException("Файл не найден на диске");
            }

            // Атомарный инкремент счётчика скачиваний
            resourceRepository.incrementDownloadCount(resourceId);

            // Определяем имя файла для скачивания
            String filename = resource.getName().replaceAll("[^a-zA-Zа-яА-ЯёЁ0-9._\\- ]", "");
            if (filename.isBlank()) filename = "resource";
            String extension = detectExtension(filePath, file);
            if (!filename.contains(".") && !extension.isEmpty()) {
                filename = filename + "." + extension;
            }

            log.info("Download: resourceId={}, userId={}", resourceId, userId);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(fileResource);

        } catch (IOException e) {
            throw new BadRequestException("Ошибка чтения файла");
        }
    }

    /**
     * Проверить: может ли пользователь скачать ресурс
     */
    @GetMapping("/{resourceId}/check")
    @Operation(summary = "Проверить доступность скачивания")
    public ResponseEntity<Map<String, Object>> checkDownloadAccess(
            @PathVariable Long resourceId,
            Authentication auth) {

        Long userId = Long.parseLong(auth.getName());
        Resource resource = resourceRepository.findById(resourceId)
                .filter(r -> r.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", resourceId));

        boolean isFree = resource.getPrice().compareTo(BigDecimal.ZERO) == 0;
        boolean hasLicense = licenseKeyRepository.existsByUserIdAndResourceId(userId, resourceId);
        boolean isAuthor = resource.getAuthor().getUser().getId().equals(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("canDownload", isFree || hasLicense || isAuthor);
        result.put("isFree", isFree);
        result.put("hasLicense", hasLicense);
        result.put("isAuthor", isAuthor);
        return ResponseEntity.ok(result);
    }

    /**
     * Список купленных ресурсов (мои покупки)
     */
    @GetMapping("/my")
    @Operation(summary = "Список купленных ресурсов")
    public ResponseEntity<List<Map<String, Object>>> getMyPurchases(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        List<LicenseKey> keys = licenseKeyRepository.findByUserIdOrderByIssuedAtDesc(
                userId, org.springframework.data.domain.PageRequest.of(0, 100)).getContent();

        List<Map<String, Object>> purchases = keys.stream().map(key -> {
            Resource r = key.getResource();
            Map<String, Object> map = new HashMap<>();
            map.put("licenseKey", key.getUniqueKey());
            map.put("issuedAt", key.getIssuedAt());
            map.put("resourceId", r.getId());
            map.put("resourceName", r.getName());
            map.put("resourceSlug", r.getSlug());
            map.put("previewUrl", r.getPreviewUrl());
            map.put("typeName", r.getType() != null ? r.getType().getName() : null);
            map.put("authorName", r.getAuthor() != null ? r.getAuthor().getUsername() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(purchases);
    }

    /**
     * Одноразовое скачивание по токену из email (публичный, без авторизации).
     * Токен действует 7 дней и может быть использован только один раз.
     */
    @GetMapping("/token/{token}")
    @Operation(summary = "Скачать по одноразовому токену из email")
    @Transactional
    public ResponseEntity<?> downloadByToken(@PathVariable String token) {
        DownloadToken dt = downloadTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Ссылка для скачивания не найдена или недействительна"));

        if (dt.isUsed()) {
            throw new BadRequestException("Эта ссылка уже была использована. Скачивание доступно только один раз.");
        }

        if (dt.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new BadRequestException("Срок действия ссылки истёк");
        }

        // Помечаем как использованный
        dt.setUsed(true);
        dt.setUsedAt(java.time.LocalDateTime.now());
        downloadTokenRepository.save(dt);

        // Скачиваем все ресурсы из заказа — для простоты отдаём первый файл
        // В реальности можно сделать zip-архив всех ресурсов
        Order order = dt.getOrder();
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new BadRequestException("В заказе нет ресурсов");
        }

        Resource resource = order.getItems().get(0).getResource();
        return serveFile(resource);
    }

    private ResponseEntity<org.springframework.core.io.Resource> serveFile(Resource resource) {
        String filePath = resource.getFilePath();
        if (filePath == null || filePath.isBlank()) {
            throw new BadRequestException("Файл ресурса не найден");
        }
        try {
            String relativePath = filePath;
            if (filePath.startsWith(localBaseUrl)) {
                relativePath = filePath.substring(localBaseUrl.length());
                if (relativePath.startsWith("/")) relativePath = relativePath.substring(1);
            }

            Path basePath = Paths.get(localBasePath).toAbsolutePath().normalize();
            Path file = basePath.resolve(relativePath).normalize();

            // Защита от path traversal
            if (!file.startsWith(basePath)) {
                log.warn("Path traversal attempt in serveFile: path={}", relativePath);
                throw new BadRequestException("Недопустимый путь к файлу");
            }

            UrlResource fileResource = new UrlResource(file.toUri());
            if (!fileResource.exists() || !fileResource.isReadable()) {
                throw new ResourceNotFoundException("Файл не найден на диске");
            }

            // Атомарный инкремент счётчика скачиваний
            resourceRepository.incrementDownloadCount(resource.getId());

            String filename = resource.getName().replaceAll("[^a-zA-Zа-яА-ЯёЁ0-9._\\- ]", "");
            if (filename.isBlank()) filename = "resource";
            String extension = detectExtension(filePath, file);
            if (!filename.contains(".") && !extension.isEmpty()) {
                filename = filename + "." + extension;
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(fileResource);
        } catch (IOException e) {
            throw new BadRequestException("Ошибка чтения файла");
        }
    }

    /**
     * Определяет расширение файла: сначала по имени, затем по magic bytes.
     */
    private String detectExtension(String path, Path file) {
        // 1. Если путь содержит расширение — используем его
        int lastDot = path.lastIndexOf('.');
        int lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        if (lastDot > lastSlash && lastDot < path.length() - 1) {
            return path.substring(lastDot + 1);
        }

        // 2. Определяем по magic bytes файла
        try (InputStream is = Files.newInputStream(file)) {
            byte[] header = new byte[12];
            int read = is.read(header);
            if (read >= 4) {
                // ZIP (PK\x03\x04)
                if (header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04) {
                    return "zip";
                }
                // TTF (\x00\x01\x00\x00)
                if (header[0] == 0x00 && header[1] == 0x01 && header[2] == 0x00 && header[3] == 0x00) {
                    return "ttf";
                }
                // OTF (OTTO)
                if (header[0] == 0x4F && header[1] == 0x54 && header[2] == 0x54 && header[3] == 0x4F) {
                    return "otf";
                }
                // WOFF (wOFF)
                if (header[0] == 0x77 && header[1] == 0x4F && header[2] == 0x46 && header[3] == 0x46) {
                    return "woff";
                }
                // WOFF2 (wOF2)
                if (header[0] == 0x77 && header[1] == 0x4F && header[2] == 0x46 && header[3] == 0x32) {
                    return "woff2";
                }
                // PNG
                if (header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
                    return "png";
                }
                // JPEG
                if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
                    return "jpg";
                }
                // SVG (<?xm or <svg)
                String headerStr = new String(header, 0, read).trim();
                if (headerStr.startsWith("<?xm") || headerStr.startsWith("<svg")) {
                    return "svg";
                }
                // PDF (%PDF)
                if (header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) {
                    return "pdf";
                }
            }
        } catch (IOException e) {
            log.debug("Cannot read file header for extension detection: {}", file);
        }

        return "bin";
    }
}
