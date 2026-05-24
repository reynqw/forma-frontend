package com.forma.backend.service;

import com.forma.backend.entity.*;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.enums.UserRole;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ConflictException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.CartRepository;
import com.forma.backend.repository.LicenseKeyRepository;
import com.forma.backend.repository.ResourceRepository;
import com.forma.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CartService — модуль корзины")
class CartServiceTest {

    @Mock private CartRepository cartRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private LicenseKeyRepository licenseKeyRepository;

    @InjectMocks private CartService cartService;

    private User createBuyer() {
        return User.builder()
                .id(1L).firstName("Покупатель").lastName("Тестов")
                .email("buyer@forma.ru").role(UserRole.BUYER).status("active")
                .build();
    }

    private Resource createPublishedResource() {
        Author author = Author.builder().id(5L).username("seller")
                .user(User.builder().id(10L).firstName("A").lastName("B")
                        .email("a@b.ru").role(UserRole.AUTHOR).build())
                .balance(BigDecimal.ZERO).totalEarnings(BigDecimal.ZERO).build();
        return Resource.builder()
                .id(20L).name("Ресурс").price(new BigDecimal("300.00"))
                .status(ResourceStatus.PUBLISHED).author(author).build();
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Получение корзины")
    class GetCart {

        @Test
        @DisplayName("Возвращает список товаров в корзине")
        void getCart_ReturnsList() {
            Cart item = Cart.builder().id(1L).user(createBuyer())
                    .resource(createPublishedResource()).build();
            when(cartRepository.findByUserId(1L)).thenReturn(List.of(item));

            List<Cart> result = cartService.getCart(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getResource().getName()).isEqualTo("Ресурс");
        }

        @Test
        @DisplayName("Пустая корзина")
        void getCart_Empty() {
            when(cartRepository.findByUserId(1L)).thenReturn(List.of());

            List<Cart> result = cartService.getCart(1L);

            assertThat(result).isEmpty();
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Добавление в корзину")
    class AddToCart {

        @Test
        @DisplayName("Успешное добавление")
        void addToCart_Success() {
            User buyer = createBuyer();
            Resource resource = createPublishedResource();

            when(resourceRepository.findById(20L)).thenReturn(Optional.of(resource));
            when(licenseKeyRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
            when(cartRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(false);
            when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> {
                Cart c = inv.getArgument(0);
                c.setId(1L);
                return c;
            });

            Cart result = cartService.addToCart(1L, 20L);

            assertThat(result.getId()).isEqualTo(1L);
            verify(cartRepository).save(any(Cart.class));
        }

        @Test
        @DisplayName("Ошибка: ресурс не найден или не опубликован")
        void addToCart_ResourceNotFound_Throws() {
            when(resourceRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> cartService.addToCart(1L, 99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Ошибка: ресурс уже куплен")
        void addToCart_AlreadyPurchased_Throws() {
            Resource resource = createPublishedResource();
            when(resourceRepository.findById(20L)).thenReturn(Optional.of(resource));
            when(licenseKeyRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(true);

            assertThatThrownBy(() -> cartService.addToCart(1L, 20L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("уже приобрели");
        }

        @Test
        @DisplayName("Ошибка: свой собственный ресурс")
        void addToCart_OwnResource_Throws() {
            Author myAuthor = Author.builder().id(5L).username("myself")
                    .balance(BigDecimal.ZERO).totalEarnings(BigDecimal.ZERO).build();
            User buyer = createBuyer();
            buyer.setAuthor(myAuthor);

            Resource resource = createPublishedResource();
            // resource's author has id=5, same as buyer's author

            when(resourceRepository.findById(20L)).thenReturn(Optional.of(resource));
            when(licenseKeyRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));

            assertThatThrownBy(() -> cartService.addToCart(1L, 20L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("собственный ресурс");
        }

        @Test
        @DisplayName("Ошибка: ресурс уже в корзине")
        void addToCart_AlreadyInCart_Throws() {
            User buyer = createBuyer();
            Resource resource = createPublishedResource();

            when(resourceRepository.findById(20L)).thenReturn(Optional.of(resource));
            when(licenseKeyRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
            when(cartRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(true);

            assertThatThrownBy(() -> cartService.addToCart(1L, 20L))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("уже в корзине");
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Удаление из корзины")
    class RemoveFromCart {

        @Test
        @DisplayName("Успешное удаление")
        void removeFromCart_Success() {
            when(cartRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(true);

            cartService.removeFromCart(1L, 20L);

            verify(cartRepository).deleteByUserIdAndResourceId(1L, 20L);
        }

        @Test
        @DisplayName("Ошибка: ресурс не в корзине")
        void removeFromCart_NotInCart_Throws() {
            when(cartRepository.existsByUserIdAndResourceId(1L, 20L)).thenReturn(false);

            assertThatThrownBy(() -> cartService.removeFromCart(1L, 20L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Очистка и подсчёт")
    class ClearAndCount {

        @Test
        @DisplayName("clearCart — очищает всю корзину")
        void clearCart_DeletesAll() {
            cartService.clearCart(1L);

            verify(cartRepository).deleteAllByUserId(1L);
        }

        @Test
        @DisplayName("getCartCount — возвращает количество")
        void getCartCount_ReturnsCount() {
            when(cartRepository.countByUserId(1L)).thenReturn(3L);

            long count = cartService.getCartCount(1L);

            assertThat(count).isEqualTo(3);
        }
    }
}
