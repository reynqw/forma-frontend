package com.forma.backend.dto.request;

import jakarta.validation.constraints.*;

public record CreateReviewRequest(
        @NotNull(message = "ID ресурса обязателен")
        Long resourceId,

        @NotNull(message = "Оценка обязательна")
        @Min(value = 1, message = "Минимальная оценка: 1")
        @Max(value = 5, message = "Максимальная оценка: 5")
        Integer rating,

        @Size(max = 2000, message = "Комментарий не более 2000 символов")
        String comment
) {}
