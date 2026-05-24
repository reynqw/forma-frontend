package com.forma.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FavoriteResponse(
        Long id,
        Long resourceId,
        String resourceName,
        String resourceSlug,
        BigDecimal resourcePrice,
        String previewUrl,
        String typeName,
        String authorName,
        BigDecimal avgRating,
        LocalDateTime addedAt
) {}
