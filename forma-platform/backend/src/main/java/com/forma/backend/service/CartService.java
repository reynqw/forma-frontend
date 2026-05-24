package com.forma.backend.service;

import com.forma.backend.entity.Cart;
import com.forma.backend.entity.Resource;
import com.forma.backend.entity.User;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ConflictException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.CartRepository;
import com.forma.backend.repository.LicenseKeyRepository;
import com.forma.backend.repository.ResourceRepository;
import com.forma.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final LicenseKeyRepository licenseKeyRepository;

    @Transactional(readOnly = true)
    public List<Cart> getCart(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    @Transactional
    public Cart addToCart(Long userId, Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .filter(r -> r.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", resourceId));

        // Нельзя добавить уже купленный ресурс
        if (licenseKeyRepository.existsByUserIdAndResourceId(userId, resourceId)) {
            throw new BadRequestException("Вы уже приобрели этот ресурс");
        }

        // Нельзя добавить свой собственный ресурс
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));
        if (user.getAuthor() != null &&
                resource.getAuthor().getId().equals(user.getAuthor().getId())) {
            throw new BadRequestException("Нельзя добавить в корзину собственный ресурс");
        }

        if (cartRepository.existsByUserIdAndResourceId(userId, resourceId)) {
            throw new ConflictException("Ресурс уже в корзине");
        }

        Cart cart = Cart.builder()
                .user(user)
                .resource(resource)
                .build();

        return cartRepository.save(cart);
    }

    @Transactional
    public void removeFromCart(Long userId, Long resourceId) {
        if (!cartRepository.existsByUserIdAndResourceId(userId, resourceId)) {
            throw new ResourceNotFoundException("Ресурс не найден в корзине");
        }
        cartRepository.deleteByUserIdAndResourceId(userId, resourceId);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartRepository.deleteAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public long getCartCount(Long userId) {
        return cartRepository.countByUserId(userId);
    }
}
