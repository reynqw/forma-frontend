package com.forma.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ResourceResponse(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        BigDecimal effectivePrice,
        int discount,
        BigDecimal avgRating,
        int downloadCount,
        int viewCount,
        String status,
        LocalDateTime createdAt,
        List<String> previewUrls,
        AuthorInfo author,
        TypeInfo type,
        LicenseInfo license,
        FontInfo font,
        List<String> tags
) {
    public record AuthorInfo(Long id, String username, String fullName) {}

    public record TypeInfo(Long id, String name, String slug) {}

    public record LicenseInfo(Long id, String name, String type) {}

    public record FontInfo(String style, String family, String format, String fileUrl) {}
}
