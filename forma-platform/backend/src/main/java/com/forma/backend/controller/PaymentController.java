package com.forma.backend.controller;

import com.forma.backend.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Платежи", description = "Интеграция с Robokassa")
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Result URL — вызывается Robokassa при успешной оплате.
     * Должен быть доступен без авторизации (публичный endpoint).
     */
    @PostMapping(value = "/robokassa/callback",
                 consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "Webhook от Robokassa (Result URL)")
    public ResponseEntity<String> robokassaCallback(
            @RequestParam Map<String, String> params) {
        String result = paymentService.handleRobokassaCallback(params);
        return ResponseEntity.ok(result);
    }

    /**
     * Success URL — Robokassa перенаправляет пользователя сюда после оплаты.
     * Мы делаем redirect на фронтенд.
     */
    @GetMapping("/robokassa/success")
    @Operation(summary = "Redirect на фронтенд после успешной оплаты")
    public ResponseEntity<Void> robokassaSuccess(@RequestParam Map<String, String> params) {
        String invoiceId = params.getOrDefault("InvoiceID", "");
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl + "/payment/success?orderId=" + invoiceId))
                .build();
    }

    /**
     * Fail URL — Robokassa перенаправляет при отмене/ошибке.
     * Мы делаем redirect на фронтенд.
     */
    @GetMapping("/robokassa/fail")
    @Operation(summary = "Redirect на фронтенд при ошибке оплаты")
    public ResponseEntity<Void> robokassaFail(@RequestParam Map<String, String> params) {
        String invoiceId = params.getOrDefault("InvoiceID", "");
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl + "/payment/fail?orderId=" + invoiceId))
                .build();
    }
}
