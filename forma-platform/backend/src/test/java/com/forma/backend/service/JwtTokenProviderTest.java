package com.forma.backend.service;

import com.forma.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtTokenProvider — генерация и валидация JWT")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    // 256-bit secret for HS256
    private static final String SECRET = "my-super-secret-key-for-testing-that-is-at-least-32-bytes-long!!";
    private static final long ACCESS_EXPIRATION = 900_000L;   // 15 min
    private static final long REFRESH_EXPIRATION = 604_800_000L; // 7 days

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(SECRET, ACCESS_EXPIRATION, REFRESH_EXPIRATION);
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Генерация токенов")
    class TokenGeneration {

        @Test
        @DisplayName("Access-токен генерируется и не пустой")
        void generateAccessToken_NotBlank() {
            String token = jwtTokenProvider.generateAccessToken(1L, "user@forma.ru", "BUYER");

            assertThat(token).isNotBlank();
            assertThat(token.split("\\.")).hasSize(3); // Header.Payload.Signature
        }

        @Test
        @DisplayName("Refresh-токен генерируется и не пустой")
        void generateRefreshToken_NotBlank() {
            String token = jwtTokenProvider.generateRefreshToken(1L, "user@forma.ru", "BUYER");

            assertThat(token).isNotBlank();
        }

        @Test
        @DisplayName("Access и Refresh токены различаются")
        void tokens_AreDifferent() {
            String access = jwtTokenProvider.generateAccessToken(1L, "user@forma.ru", "BUYER");
            String refresh = jwtTokenProvider.generateRefreshToken(1L, "user@forma.ru", "BUYER");

            assertThat(access).isNotEqualTo(refresh);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Валидация токенов")
    class TokenValidation {

        @Test
        @DisplayName("Валидный токен проходит проверку")
        void validateToken_Valid_ReturnsTrue() {
            String token = jwtTokenProvider.generateAccessToken(1L, "user@forma.ru", "BUYER");

            assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        }

        @Test
        @DisplayName("Невалидный токен не проходит проверку")
        void validateToken_Invalid_ReturnsFalse() {
            assertThat(jwtTokenProvider.validateToken("invalid.token.here")).isFalse();
        }

        @Test
        @DisplayName("null токен не проходит проверку")
        void validateToken_Null_ReturnsFalse() {
            assertThat(jwtTokenProvider.validateToken(null)).isFalse();
        }

        @Test
        @DisplayName("Пустой токен не проходит проверку")
        void validateToken_Empty_ReturnsFalse() {
            assertThat(jwtTokenProvider.validateToken("")).isFalse();
        }

        @Test
        @DisplayName("Токен с другим секретом не проходит")
        void validateToken_WrongSecret_ReturnsFalse() {
            JwtTokenProvider other = new JwtTokenProvider(
                    "another-super-secret-key-that-is-also-at-least-32-bytes-long!!",
                    ACCESS_EXPIRATION, REFRESH_EXPIRATION);
            String token = other.generateAccessToken(1L, "user@forma.ru", "BUYER");

            assertThat(jwtTokenProvider.validateToken(token)).isFalse();
        }

        @Test
        @DisplayName("Истекший токен не проходит")
        void validateToken_Expired_ReturnsFalse() {
            // Создаём провайдер с expiration = 0ms (сразу истекает)
            JwtTokenProvider expiredProvider = new JwtTokenProvider(SECRET, 0L, 0L);
            String token = expiredProvider.generateAccessToken(1L, "user@forma.ru", "BUYER");

            // Маленькая задержка чтобы гарантировать истечение
            assertThat(jwtTokenProvider.validateToken(token)).isFalse();
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Извлечение данных из токена")
    class TokenClaims {

        @Test
        @DisplayName("Извлечение userId")
        void getUserId_ReturnsCorrectId() {
            String token = jwtTokenProvider.generateAccessToken(42L, "user@forma.ru", "AUTHOR");

            assertThat(jwtTokenProvider.getUserId(token)).isEqualTo(42L);
        }

        @Test
        @DisplayName("Извлечение email")
        void getEmail_ReturnsCorrectEmail() {
            String token = jwtTokenProvider.generateAccessToken(1L, "admin@forma.ru", "ADMIN");

            assertThat(jwtTokenProvider.getEmail(token)).isEqualTo("admin@forma.ru");
        }

        @Test
        @DisplayName("Извлечение роли")
        void getRole_ReturnsCorrectRole() {
            String token = jwtTokenProvider.generateAccessToken(1L, "user@forma.ru", "ADMIN");

            assertThat(jwtTokenProvider.getRole(token)).isEqualTo("ADMIN");
        }

        @Test
        @DisplayName("Тип ACCESS-токена = ACCESS")
        void getTokenType_Access() {
            String token = jwtTokenProvider.generateAccessToken(1L, "user@forma.ru", "BUYER");

            assertThat(jwtTokenProvider.getTokenType(token)).isEqualTo("ACCESS");
        }

        @Test
        @DisplayName("Тип REFRESH-токена = REFRESH")
        void getTokenType_Refresh() {
            String token = jwtTokenProvider.generateRefreshToken(1L, "user@forma.ru", "BUYER");

            assertThat(jwtTokenProvider.getTokenType(token)).isEqualTo("REFRESH");
        }
    }
}
