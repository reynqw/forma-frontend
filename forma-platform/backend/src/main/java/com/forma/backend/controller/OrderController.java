package com.forma.backend.controller;

import com.forma.backend.dto.response.OrderResponse;
import com.forma.backend.entity.*;
import com.forma.backend.enums.NotificationType;
import com.forma.backend.enums.OrderStatus;
import com.forma.backend.enums.PaymentStatus;
import com.forma.backend.repository.DownloadTokenRepository;
import com.forma.backend.repository.LicenseKeyRepository;
import com.forma.backend.repository.PaymentRepository;
import com.forma.backend.service.NotificationService;
import com.forma.backend.service.OrderService;
import com.forma.backend.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Заказы", description = "Оформление и история заказов")
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final LicenseKeyRepository licenseKeyRepository;
    private final PaymentRepository paymentRepository;
    private final DownloadTokenRepository downloadTokenRepository;
    private final NotificationService notificationService;

    @PostMapping
    @Operation(summary = "Создать заказ из корзины")
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal UserDetails principal) {
        Order order = orderService.createFromCart(Long.parseLong(principal.getUsername()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(order));
    }

    @GetMapping
    @Operation(summary = "История заказов пользователя")
    public ResponseEntity<Map<String, Object>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails principal) {
        Long userId = Long.parseLong(principal.getUsername());
        List<Order> allOrders = orderService.getUserOrdersWithItems(userId);

        int totalElements = allOrders.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);

        List<OrderResponse> content = allOrders.subList(fromIndex, toIndex)
                .stream().map(this::toResponse).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        result.put("totalElements", totalElements);
        result.put("totalPages", totalPages);
        result.put("number", page);
        result.put("size", size);
        result.put("first", page == 0);
        result.put("last", page >= totalPages - 1);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить детали заказа")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        Order order = orderService.getOrderById(id, Long.parseLong(principal.getUsername()));
        return ResponseEntity.ok(toResponse(order));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Получить URL для оплаты заказа через Robokassa")
    public ResponseEntity<Map<String, String>> initiatePayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        String paymentUrl = paymentService.initiatePayment(
                id, Long.parseLong(principal.getUsername()));
        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    /**
     * Демо-оплата: имитирует успешный платёж без Robokassa.
     * Используется для демонстрации на защите диплома.
     */
    @PostMapping("/{id}/demo-pay")
    @Transactional
    @Operation(summary = "Демо-оплата (имитация Robokassa)")
    public ResponseEntity<OrderResponse> demoPay(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        Long userId = Long.parseLong(principal.getUsername());
        Order order = orderService.getOrderById(id, userId);

        if (order.getStatus() != OrderStatus.PENDING) {
            return ResponseEntity.ok(toResponse(order)); // уже оплачен
        }

        // 1. Обновляем статус платежа
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment != null) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId("DEMO-" + UUID.randomUUID().toString().substring(0, 8));
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);
        }

        // 2. Помечаем заказ как оплаченный
        orderService.markOrderPaid(order);

        // 3. Генерируем лицензионные ключи
        orderService.generateLicenseKeys(order);

        // 3.5. Начисляем баланс авторам
        orderService.creditAuthors(order);

        // 4. Очищаем корзину
        orderService.clearCartAfterPayment(userId);

        // 5. Генерируем токен скачивания
        String downloadTokenStr = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        DownloadToken downloadToken = DownloadToken.builder()
                .token(downloadTokenStr)
                .user(order.getUser())
                .order(order)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        downloadTokenRepository.save(downloadToken);

        // 6. Уведомления
        try {
            if (order.getItems() != null) {
                order.getItems().forEach(item ->
                    notificationService.send(order.getUser(), NotificationType.PURCHASE,
                        "Покупка успешна: " + item.getResource().getName(),
                        "Демо-оплата прошла успешно. Ресурс доступен для скачивания.",
                        "RESOURCE", item.getResource().getId())
                );
            }
        } catch (Exception e) {
            log.warn("Failed to send notification for demo payment: {}", e.getMessage());
        }

        log.info("DEMO payment SUCCESS: orderId={}, userId={}", order.getId(), userId);

        // Перечитываем заказ для полной информации
        Order updatedOrder = orderService.getOrderById(id, userId);
        return ResponseEntity.ok(toResponse(updatedOrder));
    }

    private OrderResponse toResponse(Order order) {
        // Получаем лицензионные ключи для заказа
        Map<Long, String> licenseKeys = Map.of();
        try {
            List<LicenseKey> keys = licenseKeyRepository.findByOrderId(order.getId());
            licenseKeys = keys.stream()
                    .collect(Collectors.toMap(
                            k -> k.getResource().getId(),
                            LicenseKey::getUniqueKey,
                            (a, b) -> a));
        } catch (Exception ignored) {}

        final Map<Long, String> finalKeys = licenseKeys;

        List<OrderResponse.OrderItemResponse> items = List.of();
        if (order.getItems() != null) {
            items = order.getItems().stream().map(item -> {
                Resource r = item.getResource();
                List<String> previewUrls = r.getPreviewUrl() != null
                        ? List.of(r.getPreviewUrl()) : List.of();

                return new OrderResponse.OrderItemResponse(
                        item.getId(),
                        item.getPrice(),
                        item.getLicenseType(),
                        finalKeys.getOrDefault(r.getId(), null),
                        new OrderResponse.ResourceInfo(
                                r.getId(),
                                r.getName(),
                                r.getSlug(),
                                previewUrls,
                                r.getAuthor() != null
                                        ? new OrderResponse.AuthorInfo(r.getAuthor().getUsername())
                                        : null,
                                r.getType() != null
                                        ? new OrderResponse.TypeInfo(r.getType().getName())
                                        : null
                        )
                );
            }).toList();
        }

        return new OrderResponse(
                order.getId(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getOrderDate(),
                order.getPaidAt(),
                items
        );
    }
}
