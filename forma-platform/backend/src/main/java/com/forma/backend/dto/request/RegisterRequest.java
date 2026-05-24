package com.forma.backend.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank(message = "Имя обязательно")
        @Size(min = 2, max = 100, message = "Имя от 2 до 100 символов")
        String firstName,

        @NotBlank(message = "Фамилия обязательна")
        @Size(min = 2, max = 100, message = "Фамилия от 2 до 100 символов")
        String lastName,

        @NotBlank(message = "Email обязателен")
        @Email(message = "Некорректный формат email")
        String email,

        @NotBlank(message = "Пароль обязателен")
        @Size(min = 8, max = 128, message = "Пароль от 8 до 128 символов")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
            message = "Пароль должен содержать заглавные, строчные буквы и цифры"
        )
        String password,

        @Pattern(regexp = "^(\\+7|8)?[\\s\\-]?\\(?\\d{3}\\)?[\\s\\-]?\\d{3}[\\s\\-]?\\d{2}[\\s\\-]?\\d{2}$",
                 message = "Некорректный формат номера телефона")
        String phone
) {}
