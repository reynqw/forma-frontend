package com.forma.backend.controller;

import com.forma.backend.dto.response.CartResponse;
import com.forma.backend.entity.Cart;
import com.forma.backend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Корзина", description = "Управление корзиной покупателя")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Получить содержимое корзины")
    public ResponseEntity<List<CartResponse>> getCart(@AuthenticationPrincipal UserDetails principal) {
        List<Cart> items = cartService.getCart(Long.parseLong(principal.getUsername()));
        List<CartResponse> response = items.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{resourceId}")
    @Operation(summary = "Добавить ресурс в корзину")
    public ResponseEntity<CartResponse> addToCart(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal UserDetails principal) {
        Cart cart = cartService.addToCart(Long.parseLong(principal.getUsername()), resourceId);
        return ResponseEntity.ok(toResponse(cart));
    }

    @DeleteMapping("/{resourceId}")
    @Operation(summary = "Удалить ресурс из корзины")
    public ResponseEntity<Void> removeFromCart(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal UserDetails principal) {
        cartService.removeFromCart(Long.parseLong(principal.getUsername()), resourceId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Operation(summary = "Очистить корзину")
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal UserDetails principal) {
        cartService.clearCart(Long.parseLong(principal.getUsername()));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    @Operation(summary = "Количество товаров в корзине")
    public ResponseEntity<Map<String, Long>> getCount(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(
                Map.of("count", cartService.getCartCount(Long.parseLong(principal.getUsername()))));
    }

    private CartResponse toResponse(Cart cart) {
        var r = cart.getResource();
        return new CartResponse(
                cart.getId(),
                r.getId(),
                r.getName(),
                r.getSlug(),
                r.getEffectivePrice(),
                r.getPreviewUrl(),
                r.getType() != null ? r.getType().getName() : null,
                r.getAuthor() != null ? r.getAuthor().getUsername() : null,
                cart.getAddedAt()
        );
    }
}
