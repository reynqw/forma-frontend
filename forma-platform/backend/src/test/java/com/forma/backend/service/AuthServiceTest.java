package com.forma.backend.service;

import com.forma.backend.dto.request.LoginRequest;
import com.forma.backend.dto.request.RegisterRequest;
import com.forma.backend.dto.response.AuthResponse;
import com.forma.backend.entity.User;
import com.forma.backend.enums.UserRole;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ConflictException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.exception.UnauthorizedException;
import com.forma.backend.repository.UserRepository;
import com.forma.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — модуль аутентификации")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;

    // Реальный экземпляр вместо мока — Mockito/Java 23 не может мокать этот класс
    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    private static final String JWT_SECRET =
            "my-super-secret-key-for-testing-that-is-at-least-32-bytes-long!!";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(JWT_SECRET, 900_000L, 604_800_000L);
        authService = new AuthService(
                userRepository, jwtTokenProvider, passwordEncoder,
                emailService, notificationService);
        ReflectionTestUtils.setField(authService, "maxLoginAttempts", 5);
        ReflectionTestUtils.setField(authService, "lockoutMinutes", 15);
    }

    private User createTestUser() {
        return User.builder()
                .id(1L)
                .firstName("Дмитрий")
                .lastName("Новосёлов")
                .email("test@forma.ru")
                .passwordHash("$2a$10$hashedpassword")
                .role(UserRole.BUYER)
                .status("active")
                .emailConfirmed(true)
                .loginAttempts(0)
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Регистрация")
    class Registration {

        @Test
        @DisplayName("Успешная регистрация нового пользователя")
        void register_Success() {
            RegisterRequest request = new RegisterRequest(
                    "Дмитрий", "Новосёлов", "new@forma.ru", "Password1", null);

            when(userRepository.existsByEmail("new@forma.ru")).thenReturn(false);
            when(passwordEncoder.encode("Password1")).thenReturn("$2a$encoded");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(1L);
                return u;
            });

            AuthResponse response = authService.register(request);

            assertThat(response.accessToken()).isNotBlank();
            assertThat(response.refreshToken()).isNotBlank();
            assertThat(response.user().email()).isEqualTo("new@forma.ru");
            assertThat(response.user().role()).isEqualTo("BUYER");

            verify(emailService).sendEmailConfirmation(eq("new@forma.ru"), eq("Дмитрий"), anyString());
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Ошибка: email уже зарегистрирован")
        void register_DuplicateEmail_ThrowsConflict() {
            RegisterRequest request = new RegisterRequest(
                    "Дмитрий", "Новосёлов", "existing@forma.ru", "Password1", null);

            when(userRepository.existsByEmail("existing@forma.ru")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("уже зарегистрирован");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Email приводится к нижнему регистру")
        void register_EmailNormalized() {
            RegisterRequest request = new RegisterRequest(
                    "Иван", "Петров", "Test@FORMA.RU", "Password1", null);

            when(userRepository.existsByEmail("test@forma.ru")).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("$2a$encoded");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(2L);
                return u;
            });

            authService.register(request);

            verify(userRepository).existsByEmail("test@forma.ru");
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Авторизация")
    class Login {

        @Test
        @DisplayName("Успешный вход")
        void login_Success() {
            User user = createTestUser();
            LoginRequest request = new LoginRequest("test@forma.ru", "Password1");

            when(userRepository.findByEmail("test@forma.ru")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("Password1", "$2a$10$hashedpassword")).thenReturn(true);

            AuthResponse response = authService.login(request);

            assertThat(response.accessToken()).isNotBlank();
            assertThat(response.refreshToken()).isNotBlank();
            assertThat(response.user().id()).isEqualTo(1L);

            verify(userRepository).resetLoginAttempts(1L);
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Ошибка: пользователь не найден")
        void login_UserNotFound_ThrowsUnauthorized() {
            LoginRequest request = new LoginRequest("nouser@forma.ru", "Password1");

            when(userRepository.findByEmail("nouser@forma.ru")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("Неверный email или пароль");
        }

        @Test
        @DisplayName("Ошибка: неверный пароль — инкрементирует попытки")
        void login_WrongPassword_IncrementsAttempts() {
            User user = createTestUser();
            LoginRequest request = new LoginRequest("test@forma.ru", "WrongPass1");

            when(userRepository.findByEmail("test@forma.ru")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("WrongPass1", "$2a$10$hashedpassword")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(UnauthorizedException.class);

            verify(userRepository).incrementLoginAttempts(eq(1L), isNull());
        }

        @Test
        @DisplayName("Ошибка: аккаунт заблокирован по времени")
        void login_AccountLocked_ThrowsUnauthorized() {
            User user = createTestUser();
            user.setLockedUntil(LocalDateTime.now().plusMinutes(10));
            LoginRequest request = new LoginRequest("test@forma.ru", "Password1");

            when(userRepository.findByEmail("test@forma.ru")).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("временно заблокирован");
        }

        @Test
        @DisplayName("Ошибка: аккаунт заблокирован администратором")
        void login_AccountBlocked_ThrowsUnauthorized() {
            User user = createTestUser();
            user.setStatus("blocked");
            LoginRequest request = new LoginRequest("test@forma.ru", "Password1");

            when(userRepository.findByEmail("test@forma.ru")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("Password1", "$2a$10$hashedpassword")).thenReturn(true);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("Аккаунт заблокирован");
        }

        @Test
        @DisplayName("Блокировка после 5 неудачных попыток")
        void login_MaxAttemptsReached_LocksAccount() {
            User user = createTestUser();
            user.setLoginAttempts(4); // следующая попытка = 5-я
            LoginRequest request = new LoginRequest("test@forma.ru", "WrongPass1");

            when(userRepository.findByEmail("test@forma.ru")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("WrongPass1", "$2a$10$hashedpassword")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(UnauthorizedException.class);

            verify(userRepository).incrementLoginAttempts(eq(1L), argThat(lock ->
                    lock != null && lock.isAfter(LocalDateTime.now().plusMinutes(14))));
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Подтверждение email")
    class ConfirmEmail {

        @Test
        @DisplayName("Успешное подтверждение email")
        void confirmEmail_Success() {
            User user = createTestUser();
            user.setEmailConfirmed(false);
            user.setStatus("pending_email");
            user.setEmailConfirmToken("valid-token");

            when(userRepository.findByEmailConfirmToken("valid-token"))
                    .thenReturn(Optional.of(user));

            authService.confirmEmail("valid-token");

            assertThat(user.isEmailConfirmed()).isTrue();
            assertThat(user.getStatus()).isEqualTo("active");
            assertThat(user.getEmailConfirmToken()).isNull();
            verify(userRepository).save(user);
            verify(notificationService).send(eq(user), any(), anyString(), anyString());
        }

        @Test
        @DisplayName("Ошибка: невалидный токен подтверждения")
        void confirmEmail_InvalidToken_Throws() {
            when(userRepository.findByEmailConfirmToken("bad-token"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.confirmEmail("bad-token"))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Сброс пароля")
    class PasswordReset {

        @Test
        @DisplayName("Запрос сброса пароля — отправляет email")
        void forgotPassword_ExistingEmail_SendsEmail() {
            User user = createTestUser();
            when(userRepository.findByEmail("test@forma.ru")).thenReturn(Optional.of(user));

            authService.forgotPassword("test@forma.ru");

            verify(emailService).sendPasswordReset(eq("test@forma.ru"), eq("Дмитрий"), anyString());
            verify(userRepository).save(user);
            assertThat(user.getPasswordResetToken()).isNotNull();
            assertThat(user.getPasswordResetExpires()).isAfter(LocalDateTime.now());
        }

        @Test
        @DisplayName("Запрос сброса — несуществующий email — не выбрасывает ошибку")
        void forgotPassword_NonExistingEmail_NoException() {
            when(userRepository.findByEmail("nouser@forma.ru")).thenReturn(Optional.empty());

            assertThatCode(() -> authService.forgotPassword("nouser@forma.ru"))
                    .doesNotThrowAnyException();

            verify(emailService, never()).sendPasswordReset(any(), any(), any());
        }

        @Test
        @DisplayName("Успешный сброс пароля")
        void resetPassword_Success() {
            User user = createTestUser();
            user.setPasswordResetToken("reset-token");
            user.setPasswordResetExpires(LocalDateTime.now().plusMinutes(30));

            when(userRepository.findByPasswordResetToken("reset-token"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.encode("NewPassword1")).thenReturn("$2a$newencoded");

            authService.resetPassword("reset-token", "NewPassword1");

            assertThat(user.getPasswordHash()).isEqualTo("$2a$newencoded");
            assertThat(user.getPasswordResetToken()).isNull();
            assertThat(user.getPasswordResetExpires()).isNull();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Ошибка: ссылка сброса истекла")
        void resetPassword_ExpiredToken_Throws() {
            User user = createTestUser();
            user.setPasswordResetToken("expired-token");
            user.setPasswordResetExpires(LocalDateTime.now().minusMinutes(5));

            when(userRepository.findByPasswordResetToken("expired-token"))
                    .thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.resetPassword("expired-token", "NewPass1"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("истекла");
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Обновление токена")
    class RefreshToken {

        @Test
        @DisplayName("Успешное обновление токена")
        void refreshToken_Success() {
            User user = createTestUser();
            String realRefresh = jwtTokenProvider.generateRefreshToken(1L, "test@forma.ru", "BUYER");

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            AuthResponse response = authService.refreshToken(realRefresh);

            assertThat(response.accessToken()).isNotBlank();
            assertThat(response.refreshToken()).isNotBlank();
        }

        @Test
        @DisplayName("Ошибка: невалидный refresh-токен")
        void refreshToken_Invalid_Throws() {
            assertThatThrownBy(() -> authService.refreshToken("invalid-token"))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        @DisplayName("Ошибка: передан access-токен вместо refresh")
        void refreshToken_WrongType_Throws() {
            String accessToken = jwtTokenProvider.generateAccessToken(1L, "test@forma.ru", "BUYER");

            assertThatThrownBy(() -> authService.refreshToken(accessToken))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("Неверный тип токена");
        }

        @Test
        @DisplayName("Ошибка: пользователь не найден по ID из токена")
        void refreshToken_UserNotFound_Throws() {
            String realRefresh = jwtTokenProvider.generateRefreshToken(999L, "x@forma.ru", "BUYER");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshToken(realRefresh))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Ошибка: заблокированный пользователь не может обновить токен")
        void refreshToken_BlockedUser_Throws() {
            User user = createTestUser();
            user.setStatus("blocked");
            String realRefresh = jwtTokenProvider.generateRefreshToken(1L, "test@forma.ru", "BUYER");

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.refreshToken(realRefresh))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("заблокирован");
        }
    }
}
