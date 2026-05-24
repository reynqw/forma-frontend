package com.forma.backend.controller;

import com.forma.backend.dto.response.ResourceResponse;
import com.forma.backend.entity.Author;
import com.forma.backend.entity.Resource;
import com.forma.backend.entity.Withdrawal;
import com.forma.backend.enums.WithdrawalStatus;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.*;
import com.forma.backend.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/author")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Панель автора", description = "Дашборд, ресурсы и выводы автора")
public class AuthorDashboardController {

    private final AuthorRepository authorRepository;
    private final ResourceRepository resourceRepository;
    private final OrderItemRepository orderItemRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final ResourceService resourceService;

    @Value("${app.platform-commission:0.30}")
    private BigDecimal platformCommission;

    // ==================== Статистика ====================

    @GetMapping("/stats")
    @Operation(summary = "Статистика автора")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        Author author = getAuthorByAuth(auth);

        BigDecimal totalRevenue = orderItemRepository.sumRevenueByAuthorId(author.getId());
        long totalSales = orderItemRepository.countSalesByAuthorId(author.getId());
        long totalDownloads = resourceRepository.sumDownloadsByAuthorId(author.getId());
        BigDecimal avgRating = resourceRepository.avgRatingByAuthorId(author.getId());
        long resourceCount = resourceRepository.countPublishedByAuthorId(author.getId());

        // Доля автора = выручка * (1 - комиссия)
        BigDecimal authorRevenue = totalRevenue.multiply(BigDecimal.ONE.subtract(platformCommission))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal platformRevenueAmount = totalRevenue.subtract(authorRevenue);

        // Баланс = то что на счету автора (из entity)
        BigDecimal availableBalance = author.getBalance();
        // Ожидает = сумма PENDING выводов
        BigDecimal pendingBalance = withdrawalRepository.sumPendingByAuthorId(author.getId());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSales", totalSales);
        stats.put("totalRevenue", totalRevenue);
        stats.put("authorRevenue", authorRevenue);
        stats.put("platformRevenue", platformRevenueAmount);
        stats.put("totalDownloads", totalDownloads);
        stats.put("avgRating", avgRating != null ? avgRating.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        stats.put("resourceCount", resourceCount);
        stats.put("pendingBalance", pendingBalance);
        stats.put("availableBalance", availableBalance);

        return ResponseEntity.ok(stats);
    }

    // ==================== Ресурсы автора ====================

    @GetMapping("/resources")
    @Operation(summary = "Ресурсы текущего автора")
    public ResponseEntity<Page<ResourceResponse>> getMyResources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication auth) {
        Author author = getAuthorByAuth(auth);
        Page<Resource> resources = resourceRepository.findByAuthorId(
                author.getId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return ResponseEntity.ok(resources.map(resourceService::toResponse));
    }

    // ==================== Выводы ====================

    public record WithdrawalRequest(
            @Min(value = 100, message = "Минимальная сумма вывода 100 ₽")
            BigDecimal amount,
            @NotBlank(message = "Укажите реквизиты")
            @Size(max = 500)
            String requisites
    ) {}

    @PostMapping("/withdrawals")
    @Operation(summary = "Запрос на вывод средств")
    public ResponseEntity<Map<String, Object>> requestWithdrawal(
            @Valid @RequestBody WithdrawalRequest request,
            Authentication auth) {
        Author author = getAuthorByAuth(auth);

        if (author.getBalance().compareTo(request.amount()) < 0) {
            throw new BadRequestException("Недостаточно средств на балансе");
        }

        // Списываем с баланса
        author.setBalance(author.getBalance().subtract(request.amount()));
        authorRepository.save(author);

        Withdrawal withdrawal = Withdrawal.builder()
                .author(author)
                .amount(request.amount())
                .paymentMethod("manual")
                .paymentDetails(request.requisites())
                .status(WithdrawalStatus.PENDING)
                .build();
        withdrawalRepository.save(withdrawal);

        Map<String, Object> response = new HashMap<>();
        response.put("id", withdrawal.getId());
        response.put("amount", withdrawal.getAmount());
        response.put("status", withdrawal.getStatus().name());
        response.put("message", "Заявка на вывод отправлена");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/withdrawals")
    @Operation(summary = "История выводов автора")
    public ResponseEntity<Page<Map<String, Object>>> getWithdrawals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        Author author = getAuthorByAuth(auth);
        Page<Withdrawal> withdrawals = withdrawalRepository.findByAuthorIdOrderByRequestedAtDesc(
                author.getId(), PageRequest.of(page, size));

        Page<Map<String, Object>> result = withdrawals.map(w -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", w.getId());
            map.put("amount", w.getAmount());
            map.put("status", w.getStatus().name());
            map.put("paymentMethod", w.getPaymentMethod());
            map.put("paymentDetails", w.getPaymentDetails());
            map.put("adminComment", w.getAdminComment());
            map.put("requestedAt", w.getRequestedAt());
            map.put("processedAt", w.getProcessedAt());
            return map;
        });

        return ResponseEntity.ok(result);
    }

    // ==================== Профиль автора ====================

    public record UpdateAuthorProfileRequest(
            @Size(max = 2000) String biography,
            @Size(max = 500) String portfolio
    ) {}

    @GetMapping("/profile")
    @Operation(summary = "Получить профиль автора")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication auth) {
        Author author = getAuthorByAuth(auth);
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", author.getId());
        profile.put("username", author.getUsername());
        profile.put("biography", author.getBiography());
        profile.put("portfolio", author.getPortfolio());
        profile.put("verificationStatus", author.getVerificationStatus().name());
        profile.put("rating", author.getRating());
        profile.put("salesCount", author.getSalesCount());
        profile.put("balance", author.getBalance());
        profile.put("createdAt", author.getCreatedAt());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    @Operation(summary = "Обновить профиль автора")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @Valid @RequestBody UpdateAuthorProfileRequest request,
            Authentication auth) {
        Author author = getAuthorByAuth(auth);
        if (request.biography() != null) author.setBiography(request.biography());
        if (request.portfolio() != null) author.setPortfolio(request.portfolio());
        authorRepository.save(author);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Профиль обновлён");
        response.put("biography", author.getBiography());
        response.put("portfolio", author.getPortfolio());
        return ResponseEntity.ok(response);
    }

    // ==================== Вспомогательные ====================

    private Author getAuthorByAuth(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return authorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Профиль автора не найден"));
    }
}
