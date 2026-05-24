package com.forma.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String status,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        List<OrderItemResponse> items
) {
    public record OrderItemResponse(
            Long id,
            BigDecimal price,
            String licenseType,
            String licenseKey,
            ResourceInfo resource
    ) {}

    public record ResourceInfo(
            Long id,
            String name,
            String slug,
            List<String> previewUrls,
            AuthorInfo author,
            TypeInfo type
    ) {}

    public record AuthorInfo(String username) {}

    public record TypeInfo(String name) {}
}
