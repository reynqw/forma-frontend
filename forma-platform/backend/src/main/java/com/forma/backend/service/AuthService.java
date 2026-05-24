package com.forma.backend.service;

import com.forma.backend.dto.request.LoginRequest;
import com.forma.backend.dto.request.RegisterRequest;
import com.forma.backend.dto.response.AuthResponse;
import com.forma.backend.entity.User;
import com.forma.backend.enums.NotificationType;
import com.forma.backend.enums.UserRole;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ConflictException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.exception.UnauthorizedException;
import com.forma.backend.repository.UserRepository;
import com.forma.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Value("${app.max-login-attempts}")
    private int maxLoginAttempts;

    @Value("${app.login-lockout-minutes}")
    private int lockoutMinutes;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new ConflictException("Пользователь с таким email уже зарегистрирован");
        }

        String confirmToken = UUID.randomUUID().toString();

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .role(UserRole.BUYER)
                .status("pending_email")
                .emailConfirmed(false)
                .emailConfirmToken(confirmToken)
                .build();

        user = userRepository.save(user);

        emailService.sendEmailConfirmation(user.getEmail(), user.getFirstName(), confirmToken);

        log.info("New user registered: id={}, email={}", user.getId(), user.getEmail());

        String accessToken  = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(
                user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(accessToken, refreshToken, buildUserInfo(user),
                "Регистрация успешна. Подтвердите email.");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Неверный email или пароль"));

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new UnauthorizedException(
                "Аккаунт временно заблокирован. Попробуйте через " + lockoutMinutes + " минут.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new UnauthorizedException("Неверный email или пароль");
        }

        if ("blocked".equals(user.getStatus())) {
            throw new UnauthorizedException("Аккаунт заблокирован. Обратитесь в поддержку.");
        }

        userRepository.resetLoginAttempts(user.getId());
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken  = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(
                user.getId(), user.getEmail(), user.getRole().name());

        log.info("User logged in: id={}, email={}", user.getId(), user.getEmail());
        return new AuthResponse(accessToken, refreshToken, buildUserInfo(user), "Авторизация успешна");
    }

    @Transactional
    public void confirmEmail(String token) {
        User user = userRepository.findByEmailConfirmToken(token)
                .orElseThrow(() -> new BadRequestException(
                        "Недействительная или устаревшая ссылка подтверждения"));

        user.setEmailConfirmed(true);
        user.setStatus("active");
        user.setEmailConfirmToken(null);
        userRepository.save(user);

        notificationService.send(user, NotificationType.EMAIL_CONFIRMED,
                "Email подтверждён",
                "Ваш email успешно подтверждён. Добро пожаловать на FORMA!");

        log.info("Email confirmed for user: id={}", user.getId());
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(email.toLowerCase()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setPasswordResetToken(token);
            user.setPasswordResetExpires(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            emailService.sendPasswordReset(user.getEmail(), user.getFirstName(), token);
        });
        // Намеренно не сообщаем, найден ли email (защита от перебора)
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BadRequestException("Недействительная ссылка сброса пароля"));

        if (user.getPasswordResetExpires() == null ||
                user.getPasswordResetExpires().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Ссылка сброса пароля истекла. Запросите новую.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpires(null);
        userRepository.save(user);

        log.info("Password reset for user: id={}", user.getId());
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Недействительный refresh-токен");
        }
        if (!"REFRESH".equals(jwtTokenProvider.getTokenType(refreshToken))) {
            throw new UnauthorizedException("Неверный тип токена");
        }

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));

        if ("blocked".equals(user.getStatus())) {
            throw new UnauthorizedException("Аккаунт заблокирован");
        }

        String newAccessToken  = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(
                user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(newAccessToken, newRefreshToken, buildUserInfo(user), "Токен обновлён");
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getLoginAttempts() + 1;
        LocalDateTime lockUntil = null;
        if (attempts >= maxLoginAttempts) {
            lockUntil = LocalDateTime.now().plusMinutes(lockoutMinutes);
            log.warn("User locked after {} failed attempts: id={}", attempts, user.getId());
        }
        userRepository.incrementLoginAttempts(user.getId(), lockUntil);
    }

    private AuthResponse.UserInfo buildUserInfo(User user) {
        return new AuthResponse.UserInfo(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus(),
                user.isEmailConfirmed(),
                user.getAvatarUrl()
        );
    }
}
