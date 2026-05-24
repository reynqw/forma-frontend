package com.forma.backend.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record CreateResourceRequest(
        @NotBlank(message = "Название ресурса обязательно")
        @Size(max = 255, message = "Название не более 255 символов")
        String name,

        @Size(max = 5000, message = "Описание не более 5000 символов")
        String description,

        @NotNull(message = "Тип ресурса обязателен")
        Long typeId,

        @NotNull(message = "Лицензия обязательна")
        Long licenseId,

        @NotNull(message = "Цена обязательна")
        @DecimalMin(value = "0.00", message = "Цена не может быть отрицательной")
        @DecimalMax(value = "99999.99", message = "Цена не более 99999.99")
        BigDecimal price,

        List<Long> tagIds,

        // Дополнительные поля для шрифтов (таблица fonts)
        FontDetails fontDetails
) {
    public record FontDetails(
            String style,
            String family,
            String format
    ) {}
}
