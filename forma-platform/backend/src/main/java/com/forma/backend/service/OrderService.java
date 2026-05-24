package com.forma.backend.service;

import com.forma.backend.entity.*;
import com.forma.backend.enums.OrderStatus;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final LicenseKeyRepository licenseKeyRepository;
    private final UserRepository userRepository;
    private final AuthorRepository authorRepository;

    @org.springframework.beans.factory.annotation.Value("${app.platform-commission:0.30}")
    private BigDecimal platformCommission;

    @Transactional
    public Order createFromCart(Long userId) {
        List<Cart> cartItems = cartRepository.findByUserId(userId);

        if (cartItems.isEmpty()) {
            throw new BadRequestException(
                    "Корзина пуста. Добавьте ресурсы перед оформлением заказа.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));

        List<OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (Cart cartItem : cartItems) {
            Resource resource = cartItem.getResource();
            BigDecimal price = resource.getEffectivePrice();
            total = total.add(price);

            OrderItem orderItem = OrderItem.builder()
                    .resource(resource)
                    .price(price)
                    .build();
            items.add(orderItem);
        }

        Order order = Order.builder()
                .user(user)
                .totalAmount(total)
                .status(OrderStatus.PENDING)
                .build();

        order = orderRepository.save(order);

        for (OrderItem item : items) {
            item.setOrder(order);
        }
        order.setItems(items);
        orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(order)
                .amount(total)
                .robokassaInvoiceId(String.valueOf(order.getId()))
                .build();
        paymentRepository.save(payment);

        // Бесплатные заказы — сразу PAID + генерируем ключи + чистим корзину
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            markOrderPaid(order);
            generateLicenseKeys(order);
            cartRepository.deleteAllByUserId(userId);
            log.info("Free order auto-completed: id={}, userId={}", order.getId(), userId);
        } else {
            // Платные заказы — корзину НЕ чистим до оплаты
            log.info("Order created: id={}, userId={}, total={}", order.getId(), userId, total);
        }

        return order;
    }

    @Transactional
    public void generateLicenseKeys(Order order) {
        if (order.getItems() == null) return;
        for (OrderItem item : order.getItems()) {
            LicenseKey key = LicenseKey.builder()
                    .uniqueKey(UUID.randomUUID().toString())
                    .user(order.getUser())
                    .resource(item.getResource())
                    .order(order)
                    .license(item.getResource().getLicense())
                    .build();
            licenseKeyRepository.save(key);
        }
    }

    /**
     * Начисляет долю автора (70%) за каждый проданный ресурс.
     * Вызывается после успешной оплаты.
     */
    @Transactional
    public void creditAuthors(Order order) {
        if (order.getItems() == null) return;
        for (OrderItem item : order.getItems()) {
            Author author = item.getResource().getAuthor();
            BigDecimal authorShare = item.getPrice()
                    .multiply(BigDecimal.ONE.subtract(platformCommission))
                    .setScale(2, RoundingMode.HALF_UP);

            if (authorShare.compareTo(BigDecimal.ZERO) > 0) {
                author.setBalance(author.getBalance().add(authorShare));
                author.setTotalEarnings(author.getTotalEarnings().add(authorShare));
                author.setSalesCount(author.getSalesCount() + 1);
                authorRepository.save(author);
                log.info("Credited author {} with {} (resource {})",
                        author.getUsername(), authorShare, item.getResource().getId());
            }
        }
    }

    @Transactional
    public void clearCartAfterPayment(Long userId) {
        cartRepository.deleteAllByUserId(userId);
        log.info("Cart cleared after payment for userId={}", userId);
    }

    @Transactional
    public void markOrderPaid(Order order) {
        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Page<Order> getUserOrders(Long userId, Pageable pageable) {
        // Используем обычный запрос с пагинацией — items будут загружены в контроллере через fetch join
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public List<Order> getUserOrdersWithItems(Long userId) {
        return orderRepository.findByUserIdWithItems(userId);
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId, Long userId) {
        return orderRepository.findByIdAndUserIdWithItems(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Заказ", orderId));
    }
}
