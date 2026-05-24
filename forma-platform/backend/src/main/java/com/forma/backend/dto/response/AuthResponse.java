package com.forma.backend.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserInfo user,
        String message
) {
    public record UserInfo(
            Long id,
            String firstName,
            String lastName,
            String email,
            String role,
            String status,
            boolean emailConfirmed,
            String avatarUrl
    ) {}
}
