package com.forma.backend.dto.response;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long resourceId,
        String resourceName,
        int rating,
        String comment,
        UserInfo user,
        LocalDateTime createdAt
) {
    public record UserInfo(Long id, String firstName, String lastName) {}
}
