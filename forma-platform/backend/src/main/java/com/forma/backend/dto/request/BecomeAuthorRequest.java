package com.forma.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BecomeAuthorRequest(
        @NotBlank(message = "Имя автора обязательно")
        @Size(min = 3, max = 100, message = "Имя автора должно быть от 3 до 100 символов")
        String username,

        @Size(max = 500, message = "Ссылка на портфолио не должна превышать 500 символов")
        String portfolio,

        @Size(max = 2000, message = "Биография не должна превышать 2000 символов")
        String biography
) {}
