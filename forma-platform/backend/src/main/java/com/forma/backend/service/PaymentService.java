package com.forma.backend.service;

import com.forma.backend.entity.DownloadToken;
import com.forma.backend.entity.Order;
import com.forma.backend.entity.Payment;
import com.forma.backend.enums.NotificationType;
import com.forma.backend.enums.OrderStatus;
import com.forma.backend.enums.PaymentStatus;
import com.forma.backend.exception.PaymentException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.DownloadTokenRepository;
import com.forma.backend.repository.OrderRepository;
import com.forma.backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final DownloadTokenRepository downloadTokenRepository;

    @Value("${robokassa.merchant-login}")
    private String merchantLogin;

    @Value("${robokassa.password1}")
    private String password1;

    @Value("${robokassa.password2}")
    private String password2;

    @Value("${robokassa.test-mode}")
    private boolean testMode;

    @Value("${robokassa.payment-url}")
    private String paymentUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Формирует URL для редиректа на страницу оплаты Robokassa
     */
    public String initiatePayment(Long orderId, Long userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Заказ", orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentException("Заказ уже обработан или отменён");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Платёж для заказа", orderId));

        String invoiceId = String.valueOf(order.getId());
        String amount = payment.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString();

        String signatureStr = merchantLogin + ":" + amount + ":" + invoiceId + ":" + password1;
        String signature = md5(signatureStr);

        String mode = testMode ? "&IsTest=1" : "";

        return paymentUrl +
               "?MerchantLogin=" + merchantLogin +
               "&OutSum=" + amount +
               "&InvoiceID=" + invoiceId +
               "&SignatureValue=" + signature +
               "&Culture=ru" +
               "&Encoding=utf-8" +
               mode;
    }

    /**
     * Обрабатывает callback от Robokassa (Result URL)
     */
    @Transactional
    public String handleRobokassaCallback(Map<String, String> params) {
        String outSum   = params.getOrDefault("OutSum", "");
        String invoiceId = params.getOrDefault("InvoiceID", "");
        String signature = params.getOrDefault("SignatureValue", "");

        String expectedSignature = md5(outSum + ":" + invoiceId + ":" + password2);
        if (!expectedSignature.equalsIgnoreCase(signature)) {
            log.warn("Robokassa signature mismatch for invoice {}", invoiceId);
            throw new PaymentException("Недействительная подпись платежа");
        }

        Payment payment = paymentRepository.findByRobokassaInvoiceId(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Платёж с invoice=" + invoiceId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return "OK" + invoiceId; // идемпотентный ответ
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionId(params.getOrDefault("InvId", invoiceId));
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        orderService.markOrderPaid(order);

        // Генерация лицензионных ключей
        orderService.generateLicenseKeys(order);

        // Начисление баланса авторам
        orderService.creditAuthors(order);

        // Очистка корзины после успешной оплаты
        orderService.clearCartAfterPayment(order.getUser().getId());

        // Генерация одноразовой ссылки скачивания
        String downloadTokenStr = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        DownloadToken downloadToken = DownloadToken.builder()
                .token(downloadTokenStr)
                .user(order.getUser())
                .order(order)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        downloadTokenRepository.save(downloadToken);

        String downloadLink = frontendUrl + "/download/" + downloadTokenStr;

        // Уведомления
        order.getItems().forEach(item -> {
            notificationService.send(order.getUser(), NotificationType.PURCHASE,
                    "Покупка успешна: " + item.getResource().getName(),
                    "Вы приобрели ресурс. Скачайте его по ссылке из email или в личном кабинете.",
                    "RESOURCE", item.getResource().getId());
            emailService.sendPurchaseConfirmation(
                    order.getUser().getEmail(),
                    order.getUser().getFirstName(),
                    item.getResource().getName(),
                    downloadLink
            );
        });

        log.info("Payment SUCCESS: orderId={}, invoice={}", order.getId(), invoiceId);
        return "OK" + invoiceId;
    }

    private String md5(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("MD5 computation failed", e);
        }
    }
}
