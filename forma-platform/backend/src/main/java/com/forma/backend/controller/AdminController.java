package com.forma.backend.controller;

import com.forma.backend.dto.response.ResourceResponse;
import com.forma.backend.entity.*;
import com.forma.backend.enums.*;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.*;
import com.forma.backend.service.EmailService;
import com.forma.backend.service.NotificationService;
import com.forma.backend.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Администратор", description = "Панель администрирования")
public class AdminController {

    private final UserRepository userRepository;
    private final AuthorRepository authorRepository;
    private final ResourceService resourceService;
    private final ResourceRepository resourceRepository;
    private final ModerationRepository moderationRepository;
    private final ComplaintRepository complaintRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    // ── Пользователи ─────────────────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "Список всех пользователей")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userRepository.searchUsers(
                q, PageRequest.of(page, size, Sort.by("registeredAt").descending())));
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Изменить статус пользователя (ACTIVE / BLOCKED)")
    public ResponseEntity<Map<String, String>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", id));

        String newStatus = body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Поле status обязательно"));
        }
        // Поддержка обоих форматов: ACTIVE/active, BLOCKED/blocked
        String normalized = newStatus.toUpperCase();
        if (!"ACTIVE".equals(normalized) && !"BLOCKED".equals(normalized)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Допустимые статусы: ACTIVE, BLOCKED"));
        }
        user.setStatus(normalized);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message",
                "Ста��ус пользоват��ля " + user.getEmail() + " изменён на " + normalized));
    }

    // ── Модерация ресурсов ────────────────────────────────────────

    @GetMapping("/resources/pending")
    @Operation(summary = "Ресурсы, ожидающие модерации")
    public ResponseEntity<Page<ResourceResponse>> getPendingResources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(resourceService.getPendingResources(
                PageRequest.of(page, size, Sort.by("createdAt").ascending())));
    }

    @PostMapping("/resources/{id}/moderate")
    @Operation(summary = "Одобрить или отклонить ресурс")
    public ResponseEntity<Map<String, String>> moderateResource(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails principal) {

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", id));

        Long adminId = Long.parseLong(principal.getUsername());
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Администратор", adminId));

        String decision = body.getOrDefault("decision", "");
        boolean approved = "APPROVED".equalsIgnoreCase(decision) || "APPROVE".equalsIgnoreCase(decision);
        String comment = body.get("comment");

        resource.setStatus(approved ? ResourceStatus.PUBLISHED : ResourceStatus.HIDDEN);
        resourceRepository.save(resource);

        Moderation moderation = Moderation.builder()
                .resource(resource)
                .admin(admin)
                .status(approved ? ModerationStatus.APPROVED : ModerationStatus.REJECTED)
                .comment(comment)
                .reviewedAt(LocalDateTime.now())
                .build();
        moderationRepository.save(moderation);

        User author = resource.getAuthor().getUser();
        NotificationType notifType = approved
                ? NotificationType.MOD_APPROVED
                : NotificationType.MOD_REJECTED;
        String notifTitle = approved
                ? "Ресурс «" + resource.getName() + "» опубликован"
                : "Ресурс «" + resource.getName() + "» отклонён";

        notificationService.send(author, notifType, notifTitle, comment, "RESOURCE", id);
        emailService.sendModerationResult(
                author.getEmail(), author.getFirstName(),
                resource.getName(), approved, comment);

        return ResponseEntity.ok(Map.of("message",
                "Ресурс " + (approved ? "одобрен и опубликован" : "отклонён")));
    }

    // ── Жалобы DMCA ──────────────────────────────────────────────

    @GetMapping("/complaints")
    @Operation(summary = "Список жалоб")
    public ResponseEntity<Page<Complaint>> getComplaints(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(complaintRepository.findByStatus(
                ModerationStatus.valueOf(status),
                PageRequest.of(page, size, Sort.by("submittedAt").descending())));
    }

    @PatchMapping("/complaints/{id}/resolve")
    @Operation(summary = "Рассмотреть жалобу")
    public ResponseEntity<Map<String, String>> resolveComplaint(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Жалоба", id));

        complaint.setStatus(ModerationStatus.APPROVED);
        complaint.setResolution(body.get("resolution"));
        complaintRepository.save(complaint);

        return ResponseEntity.ok(Map.of("message", "Жалоба рассмотрена"));
    }

    // ── Верификация авторов ────────────────────────────────────────

    @GetMapping("/authors/pending")
    @Operation(summary = "Авторы, ожидающие верификации")
    public ResponseEntity<Page<Author>> getPendingAuthors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(authorRepository.findByVerificationStatus(
                VerificationStatus.PENDING,
                PageRequest.of(page, size, Sort.by("createdAt").ascending())));
    }

    @PatchMapping("/authors/{id}/verify")
    @Operation(summary = "Верифицировать или отклонить автора")
    public ResponseEntity<Map<String, String>> verifyAuthor(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Автор", id));

        String decision = body.getOrDefault("decision", "");
        boolean approved = "VERIFIED".equalsIgnoreCase(decision) || "APPROVE".equalsIgnoreCase(decision);

        author.setVerificationStatus(approved ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED);
        authorRepository.save(author);

        // Уведомляем автора
        User authorUser = author.getUser();
        NotificationType notifType = approved
                ? NotificationType.MOD_APPROVED
                : NotificationType.MOD_REJECTED;
        String title = approved
                ? "Ваша заявка на автора одобрена"
                : "Ваша заявка на автора отклонена";
        String comment = body.get("comment");

        notificationService.send(authorUser, notifType, title, comment, "AUTHOR", id);

        return ResponseEntity.ok(Map.of("message",
                "Автор " + author.getUsername() + " " + (approved ? "верифицирован" : "отклонён")));
    }

    // ── Выводы средств ───────────────────────────────────────────

    @GetMapping("/withdrawals")
    @Operation(summary = "Запросы на вывод средств")
    public ResponseEntity<Map<String, Object>> getWithdrawals(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<Withdrawal> all = withdrawalRepository.findByStatusWithAuthor(
                WithdrawalStatus.valueOf(status));

        int totalElements = all.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);

        List<Map<String, Object>> content = all.subList(fromIndex, toIndex).stream().map(w -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", w.getId());
            map.put("amount", w.getAmount());
            map.put("status", w.getStatus().name());
            map.put("paymentMethod", w.getPaymentMethod());
            map.put("paymentDetails", w.getPaymentDetails());
            map.put("adminComment", w.getAdminComment());
            map.put("requestedAt", w.getRequestedAt());
            map.put("processedAt", w.getProcessedAt());
            map.put("author", Map.of("id", w.getAuthor().getId(), "username", w.getAuthor().getUsername()));
            return map;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        result.put("totalElements", totalElements);
        result.put("totalPages", totalPages);
        result.put("number", page);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/withdrawals/{id}")
    @Operation(summary = "Обработать запрос на вывод")
    public ResponseEntity<Map<String, String>> processWithdrawal(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Withdrawal withdrawal = withdrawalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Запрос на вывод", id));

        String status = body.getOrDefault("status", "PROCESSED");
        withdrawal.setStatus(WithdrawalStatus.valueOf(status));
        withdrawal.setAdminComment(body.get("comment"));
        withdrawal.setProcessedAt(LocalDateTime.now());
        withdrawalRepository.save(withdrawal);

        return ResponseEntity.ok(Map.of("message", "Запрос обработан: " + status));
    }
}
