package com.forma.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.forma.backend.enums.UserRole;
import com.forma.backend.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(name = "registered_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime registeredAt = LocalDateTime.now();

    // status хранится строкой (active, blocked, pending_email) — соответствует forma_db.sql
    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "pending_email";

    // Технические поля безопасности — добавляются через ddl-auto:update
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private UserRole role = UserRole.BUYER;

    @Column(name = "email_confirmed", nullable = false)
    @Builder.Default
    private boolean emailConfirmed = false;

    @JsonIgnore
    @Column(name = "email_confirm_token", length = 255)
    private String emailConfirmToken;

    @JsonIgnore
    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;

    @JsonIgnore
    @Column(name = "password_reset_expires")
    private LocalDateTime passwordResetExpires;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "two_factor_enabled", nullable = false)
    @Builder.Default
    private boolean twoFactorEnabled = false;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @JsonIgnore
    @Column(name = "login_attempts", nullable = false)
    @Builder.Default
    private int loginAttempts = 0;

    @JsonIgnore
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @JsonIgnore
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Author author;
}
