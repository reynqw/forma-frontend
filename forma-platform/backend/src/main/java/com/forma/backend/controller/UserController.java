package com.forma.backend.controller;

import com.forma.backend.entity.User;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.UserRepository;
import com.forma.backend.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Пользователи", description = "Профиль и настройки пользователя")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    // ==================== Профиль ====================

    @GetMapping("/me")
    @Operation(summary = "Получить профиль текущего пользователя")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication auth) {
        User user = getUserByAuth(auth);
        return ResponseEntity.ok(toProfileMap(user));
    }

    public record UpdateProfileRequest(
            @Size(min = 2, max = 100, message = "Имя: от 2 до 100 символов")
            String firstName,
            @Size(min = 2, max = 100, message = "Фамилия: от 2 до 100 символов")
            String lastName,
            @Size(max = 20, message = "Телефон: максимум 20 символов")
            String phone
    ) {}

    @PutMapping("/me")
    @Operation(summary = "Обновить профиль пользователя")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth) {
        User user = getUserByAuth(auth);

        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.phone() != null) user.setPhone(request.phone());

        userRepository.save(user);
        return ResponseEntity.ok(toProfileMap(user));
    }

    // ==================== Аватарка ====================

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Загрузить аватарку пользователя")
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @RequestPart("avatar") MultipartFile avatarFile,
            Authentication auth) {
        User user = getUserByAuth(auth);

        if (avatarFile.isEmpty()) {
            throw new BadRequestException("Файл аватарки пуст");
        }

        // Проверяем тип файла
        String contentType = avatarFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Допускаются только изображения (JPG, PNG, GIF, WebP)");
        }

        // Проверяем размер (макс 5MB)
        if (avatarFile.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Максимальный размер аватарки — 5 МБ");
        }

        String originalFilename = avatarFile.getOriginalFilename();
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }

        String key = "avatars/" + UUID.randomUUID() + ext;
        String avatarUrl = fileStorageService.uploadFile(avatarFile, key);

        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        return ResponseEntity.ok(toProfileMap(user));
    }

    @DeleteMapping("/me/avatar")
    @Operation(summary = "Удалить аватарку пользователя")
    public ResponseEntity<Map<String, Object>> deleteAvatar(Authentication auth) {
        User user = getUserByAuth(auth);
        user.setAvatarUrl(null);
        userRepository.save(user);
        return ResponseEntity.ok(toProfileMap(user));
    }

    // ==================== Смена пароля ====================

    public record ChangePasswordRequest(
            String currentPassword,
            @Size(min = 8, max = 100, message = "Пароль: от 8 до 100 символов")
            String newPassword
    ) {}

    @PutMapping("/me/password")
    @Operation(summary = "Сменить пароль")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication auth) {
        User user = getUserByAuth(auth);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Неверный текущий пароль");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
    }

    // ==================== Вспомогательные ====================

    private User getUserByAuth(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }

    private Map<String, Object> toProfileMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("firstName", user.getFirstName());
        map.put("lastName", user.getLastName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("avatarUrl", user.getAvatarUrl());
        map.put("role", user.getRole().name());
        map.put("status", user.getStatus());
        map.put("emailConfirmed", user.isEmailConfirmed());
        map.put("registeredAt", user.getRegisteredAt());
        map.put("lastLoginAt", user.getLastLoginAt());
        return map;
    }
}
