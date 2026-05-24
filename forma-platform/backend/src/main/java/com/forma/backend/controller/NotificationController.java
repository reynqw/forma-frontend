package com.forma.backend.controller;

import com.forma.backend.entity.Notification;
import com.forma.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Уведомления", description = "Центр уведомлений пользователя")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Получить уведомления")
    public ResponseEntity<Page<Notification>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.getUserNotifications(
                Long.parseLong(principal.getUsername()), PageRequest.of(page, size)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Количество непрочитанных уведомлений")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(Map.of("count",
                notificationService.countUnread(Long.parseLong(principal.getUsername()))));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Отметить уведомление как прочитанное")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        notificationService.markAsRead(id, Long.parseLong(principal.getUsername()));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Отметить все уведомления как прочитанные")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails principal) {
        notificationService.markAllAsRead(Long.parseLong(principal.getUsername()));
        return ResponseEntity.noContent().build();
    }
}
