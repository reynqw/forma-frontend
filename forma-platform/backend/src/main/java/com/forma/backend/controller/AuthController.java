package com.forma.backend.controller;

import com.forma.backend.dto.request.LoginRequest;
import com.forma.backend.dto.request.RegisterRequest;
import com.forma.backend.dto.response.AuthResponse;
import com.forma.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Авторизация", description = "Регистрация, вход, токены")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Регистрация нового пользователя")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Вход в систему")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Обновление access-токена")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @GetMapping("/confirm-email")
    @Operation(summary = "Подтверждение email по токену")
    public ResponseEntity<Map<String, String>> confirmEmail(@RequestParam String token) {
        authService.confirmEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email успешно подтверждён. Теперь вы можете войти."));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Запрос на сброс пароля")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        authService.forgotPassword(body.getOrDefault("email", ""));
        return ResponseEntity.ok(Map.of("message",
                "Если указанный email зарегистрирован, на него отправлено письмо со ссылкой для сброса пароля."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Установка нового пароля")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetPassword(body.get("token"), body.get("password"));
        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён. Войдите с новым паролем."));
    }
}
