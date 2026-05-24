package com.forma.backend.service;

import com.forma.backend.entity.*;
import com.forma.backend.enums.OrderStatus;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.enums.UserRole;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService — модуль заказов")
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartRepository cartRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private LicenseKeyRepository licenseKeyRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuthorRepository authorRepository;

    @InjectMocks private OrderService orderService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderService, "platformCommission", new BigDecimal("0.30"));
    }

    private User createBuyer() {
        return User.builder()
                .id(1L)
                .firstName("Покупатель")
                .lastName("Тестов")
                .email("buyer@forma.ru")
                .role(UserRole.BUYER)
                .status("active")
                .build();
    }

    private Author createAuthor() {
        User authorUser = User.builder()
                .id(2L).firstName("Автор").lastName("Тестов").email("author@forma.ru")
                .role(UserRole.AUTHOR).status("active").build();
        return Author.builder()
                .id(1L)
                .user(authorUser)
                .username("author1")
                .balance(BigDecimal.ZERO)
                .totalEarnings(BigDecimal.ZERO)
                .salesCount(0)
                .build();
    }

    private Resource createResource(Author author, BigDecimal price) {
        return Resource.builder()
                .id(10L)
                .author(author)
                .name("Тестовый шрифт")
                .price(price)
                .status(ResourceStatus.PUBLISHED)
                .license(License.builder().id(1L).name("Standard").type("PERSONAL").build())
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Создание заказа из корзины")
    class CreateFromCart {

        @Test
        @DisplayName("Успешное создание платного заказа")
        void createFromCart_PaidOrder_Success() {
            User buyer = createBuyer();
            Author author = createAuthor();
            Resource resource = createResource(author, new BigDecimal("500.00"));

            Cart cartItem = Cart.builder().user(buyer).resource(resource).build();

            when(cartRepository.findByUserId(1L)).thenReturn(List.of(cartItem));
            when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
            when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
                Order o = inv.getArgument(0);
                o.setId(100L);
                return o;
            });

            Order order = orderService.createFromCart(1L);

            assertThat(order.getId()).isEqualTo(100L);
            assertThat(order.getTotalAmount()).isEqualByComparingTo("500.00");
            assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
            assertThat(order.getItems()).hasSize(1);

            verify(paymentRepository).save(any(Payment.class));
            // Корзина НЕ очищается для платного заказа
            verify(cartRepository, never()).deleteAllByUserId(anyLong());
        }

        @Test
        @DisplayName("Бесплатный заказ — автоматически оплачен")
        void createFromCart_FreeOrder_AutoCompleted() {
            User buyer = createBuyer();
            Author author = createAuthor();
            Resource freeResource = createResource(author, BigDecimal.ZERO);

            Cart cartItem = Cart.builder().user(buyer).resource(freeResource).build();

            when(cartRepository.findByUserId(1L)).thenReturn(List.of(cartItem));
            when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
            when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
                Order o = inv.getArgument(0);
                o.setId(101L);
                return o;
            });

            Order order = orderService.createFromCart(1L);

            assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
            assertThat(order.getPaidAt()).isNotNull();
            // Корзина очищается для бесплатного заказа
            verify(cartRepository).deleteAllByUserId(1L);
            // Генерируются лицензионные ключи
            verify(licenseKeyRepository).save(any(LicenseKey.class));
        }

        @Test
        @DisplayName("Ошибка: пустая корзина")
        void createFromCart_EmptyCart_Throws() {
            when(cartRepository.findByUserId(1L)).thenReturn(List.of());

            assertThatThrownBy(() -> orderService.createFromCart(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Корзина пуста");
        }

        @Test
        @DisplayName("Несколько товаров — сумма рассчитывается корректно")
        void createFromCart_MultipleItems_CorrectTotal() {
            User buyer = createBuyer();
            Author author = createAuthor();
            Resource r1 = createResource(author, new BigDecimal("200.00"));
            Resource r2 = Resource.builder()
                    .id(11L).author(author).name("Шрифт 2")
                    .price(new BigDecimal("350.00")).status(ResourceStatus.PUBLISHED)
                    .license(License.builder().id(1L).name("Standard").type("PERSONAL").build())
                    .build();

            Cart c1 = Cart.builder().user(buyer).resource(r1).build();
            Cart c2 = Cart.builder().user(buyer).resource(r2).build();

            when(cartRepository.findByUserId(1L)).thenReturn(List.of(c1, c2));
            when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
            when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
                Order o = inv.getArgument(0);
                o.setId(102L);
                return o;
            });

            Order order = orderService.createFromCart(1L);

            assertThat(order.getTotalAmount()).isEqualByComparingTo("550.00");
            assertThat(order.getItems()).hasSize(2);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Начисление авторам")
    class CreditAuthors {

        @Test
        @DisplayName("70% от стоимости начисляется автору")
        void creditAuthors_CorrectCommission() {
            Author author = createAuthor();
            Resource resource = createResource(author, new BigDecimal("1000.00"));

            Order order = Order.builder().id(1L).user(createBuyer())
                    .totalAmount(new BigDecimal("1000.00")).status(OrderStatus.PAID).build();
            OrderItem item = OrderItem.builder()
                    .order(order).resource(resource).price(new BigDecimal("1000.00")).build();
            order.setItems(List.of(item));

            orderService.creditAuthors(order);

            // 1000 * (1 - 0.30) = 700
            assertThat(author.getBalance()).isEqualByComparingTo("700.00");
            assertThat(author.getTotalEarnings()).isEqualByComparingTo("700.00");
            assertThat(author.getSalesCount()).isEqualTo(1);
            verify(authorRepository).save(author);
        }

        @Test
        @DisplayName("Несколько товаров — все авторы получают долю")
        void creditAuthors_MultipleItems() {
            Author author1 = createAuthor();
            Author author2 = Author.builder()
                    .id(2L).username("author2")
                    .balance(new BigDecimal("100.00"))
                    .totalEarnings(new BigDecimal("100.00"))
                    .salesCount(3).build();

            Resource r1 = createResource(author1, new BigDecimal("500.00"));
            Resource r2 = Resource.builder()
                    .id(20L).author(author2).name("Ресурс 2")
                    .price(new BigDecimal("300.00")).status(ResourceStatus.PUBLISHED)
                    .license(License.builder().id(1L).name("Standard").type("PERSONAL").build())
                    .build();

            Order order = Order.builder().id(2L).user(createBuyer())
                    .totalAmount(new BigDecimal("800.00")).status(OrderStatus.PAID).build();
            OrderItem item1 = OrderItem.builder().order(order).resource(r1).price(new BigDecimal("500.00")).build();
            OrderItem item2 = OrderItem.builder().order(order).resource(r2).price(new BigDecimal("300.00")).build();
            order.setItems(List.of(item1, item2));

            orderService.creditAuthors(order);

            // author1: 500 * 0.7 = 350
            assertThat(author1.getBalance()).isEqualByComparingTo("350.00");
            assertThat(author1.getSalesCount()).isEqualTo(1);

            // author2: 300 * 0.7 = 210, + existing 100 = 310
            assertThat(author2.getBalance()).isEqualByComparingTo("310.00");
            assertThat(author2.getSalesCount()).isEqualTo(4);

            verify(authorRepository, times(2)).save(any(Author.class));
        }

        @Test
        @DisplayName("Бесплатный ресурс — автору не начисляется")
        void creditAuthors_FreeItem_NoCredit() {
            Author author = createAuthor();
            Resource freeResource = createResource(author, BigDecimal.ZERO);

            Order order = Order.builder().id(3L).user(createBuyer())
                    .totalAmount(BigDecimal.ZERO).status(OrderStatus.PAID).build();
            OrderItem item = OrderItem.builder().order(order).resource(freeResource).price(BigDecimal.ZERO).build();
            order.setItems(List.of(item));

            orderService.creditAuthors(order);

            assertThat(author.getBalance()).isEqualByComparingTo("0");
            verify(authorRepository, never()).save(any());
        }

        @Test
        @DisplayName("null items — метод не падает")
        void creditAuthors_NullItems_NoException() {
            Order order = Order.builder().id(4L).user(createBuyer())
                    .totalAmount(BigDecimal.ZERO).status(OrderStatus.PAID).build();
            order.setItems(null);

            assertThatCode(() -> orderService.creditAuthors(order))
                    .doesNotThrowAnyException();
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Генерация лицензионных ключей")
    class GenerateLicenseKeys {

        @Test
        @DisplayName("Ключи генерируются для каждого товара")
        void generateLicenseKeys_CreatesKeys() {
            User buyer = createBuyer();
            Author author = createAuthor();
            Resource resource = createResource(author, new BigDecimal("100.00"));

            Order order = Order.builder().id(5L).user(buyer)
                    .totalAmount(new BigDecimal("100.00")).status(OrderStatus.PAID).build();
            OrderItem item = OrderItem.builder().order(order).resource(resource)
                    .price(new BigDecimal("100.00")).build();
            order.setItems(List.of(item));

            orderService.generateLicenseKeys(order);

            ArgumentCaptor<LicenseKey> captor = ArgumentCaptor.forClass(LicenseKey.class);
            verify(licenseKeyRepository).save(captor.capture());

            LicenseKey key = captor.getValue();
            assertThat(key.getUniqueKey()).isNotBlank();
            assertThat(key.getUser()).isEqualTo(buyer);
            assertThat(key.getResource()).isEqualTo(resource);
            assertThat(key.getOrder()).isEqualTo(order);
        }

        @Test
        @DisplayName("null items — не генерирует ключи")
        void generateLicenseKeys_NullItems_Noop() {
            Order order = Order.builder().id(6L).user(createBuyer())
                    .totalAmount(BigDecimal.ZERO).status(OrderStatus.PAID).build();
            order.setItems(null);

            assertThatCode(() -> orderService.generateLicenseKeys(order))
                    .doesNotThrowAnyException();
            verify(licenseKeyRepository, never()).save(any());
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Вспомогательные методы")
    class UtilMethods {

        @Test
        @DisplayName("markOrderPaid — устанавливает статус и время")
        void markOrderPaid_SetsStatus() {
            Order order = Order.builder().id(7L).user(createBuyer())
                    .totalAmount(BigDecimal.TEN).status(OrderStatus.PENDING).build();

            orderService.markOrderPaid(order);

            assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
            assertThat(order.getPaidAt()).isNotNull();
            assertThat(order.getPaidAt()).isBeforeOrEqualTo(LocalDateTime.now());
            verify(orderRepository).save(order);
        }

        @Test
        @DisplayName("clearCartAfterPayment — удаляет корзину пользователя")
        void clearCartAfterPayment_ClearsCart() {
            orderService.clearCartAfterPayment(1L);

            verify(cartRepository).deleteAllByUserId(1L);
        }

        @Test
        @DisplayName("getOrderById — возвращает заказ")
        void getOrderById_Found() {
            Order order = Order.builder().id(8L).user(createBuyer())
                    .totalAmount(BigDecimal.TEN).status(OrderStatus.PAID).build();

            when(orderRepository.findByIdAndUserIdWithItems(8L, 1L))
                    .thenReturn(Optional.of(order));

            Order result = orderService.getOrderById(8L, 1L);

            assertThat(result.getId()).isEqualTo(8L);
        }

        @Test
        @DisplayName("getOrderById — не найден — выбрасывает исключение")
        void getOrderById_NotFound_Throws() {
            when(orderRepository.findByIdAndUserIdWithItems(99L, 1L))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> orderService.getOrderById(99L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
