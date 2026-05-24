package com.forma.backend.controller;

import com.forma.backend.dto.request.CreateReviewRequest;
import com.forma.backend.dto.response.ReviewResponse;
import com.forma.backend.entity.Review;
import com.forma.backend.entity.Resource;
import com.forma.backend.entity.User;
import com.forma.backend.entity.Author;
import com.forma.backend.enums.NotificationType;
import com.forma.backend.exception.ConflictException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.exception.UnauthorizedException;
import com.forma.backend.repository.LicenseKeyRepository;
import com.forma.backend.repository.ResourceRepository;
import com.forma.backend.repository.ReviewRepository;
import com.forma.backend.repository.UserRepository;
import com.forma.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Отзывы", description = "Отзывы и рейтинги ресурсов")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final LicenseKeyRepository licenseKeyRepository;
    private final NotificationService notificationService;

    @GetMapping("/resource/{resourceId}")
    @Operation(summary = "Получить отзывы к ресурсу")
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @PathVariable Long resourceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Review> reviews = reviewRepository.findByResourceIdOrderByCreatedAtDesc(
                resourceId, PageRequest.of(page, size));
        return ResponseEntity.ok(reviews.map(this::toResponse));
    }

    @PostMapping
    @Transactional
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Оставить отзыв (только для купивших ресурс)")
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserDetails principal) {

        Long userId = Long.parseLong(principal.getUsername());

        // Проверяем, что пользователь купил этот ресурс
        if (!licenseKeyRepository.existsByUserIdAndResourceId(userId, request.resourceId())) {
            throw new UnauthorizedException(
                "Оставить отзыв можно только после приобретения ресурса");
        }

        if (reviewRepository.existsByUserIdAndResourceId(userId, request.resourceId())) {
            throw new ConflictException("Вы уже оставляли отзыв на этот ресурс");
        }

        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", request.resourceId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));

        Review review = Review.builder()
                .user(user)
                .resource(resource)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        review = reviewRepository.save(review);

        // Пересчитываем средний рейтинг ресурса
        try {
            resourceRepository.recalcAvgRating(resource.getId());
        } catch (Exception e) {
            log.warn("Failed to recalc avg rating for resource {}: {}", resource.getId(), e.getMessage());
        }

        // Уведомляем автора (безопасно — через try/catch чтобы не ронять создание отзыва)
        try {
            Author author = resource.getAuthor();
            if (author != null && author.getUser() != null) {
                User authorUser = userRepository.findById(author.getUser().getId()).orElse(null);
                if (authorUser != null) {
                    notificationService.send(
                            authorUser, NotificationType.NEW_REVIEW,
                            "Новый отзыв на «" + resource.getName() + "»",
                            user.getFirstName() + " оставил отзыв: " + request.rating() + "/5",
                            "RESOURCE", resource.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to notify author about review: {}", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(review));
    }

    @DeleteMapping("/{id}")
    @Transactional
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Удалить свой отзыв")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        Long userId = Long.parseLong(principal.getUsername());
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Отзыв", id));

        if (!review.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Нет доступа к этому отзыву");
        }

        Long resourceId = review.getResource().getId();
        reviewRepository.delete(review);

        // Пересчитываем средний рейтинг ресурса
        try {
            resourceRepository.recalcAvgRating(resourceId);
        } catch (Exception e) {
            log.warn("Failed to recalc avg rating for resource {}: {}", resourceId, e.getMessage());
        }

        return ResponseEntity.noContent().build();
    }

    private ReviewResponse toResponse(Review review) {
        var u = review.getUser();
        var r = review.getResource();
        return new ReviewResponse(
                review.getId(),
                r.getId(),
                r.getName(),
                review.getRating(),
                review.getComment(),
                new ReviewResponse.UserInfo(u.getId(), u.getFirstName(), u.getLastName()),
                review.getCreatedAt()
        );
    }
}
