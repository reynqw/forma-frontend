package com.forma.backend.controller;

import com.forma.backend.dto.response.ResourceResponse;
import com.forma.backend.entity.Favorite;
import com.forma.backend.exception.ConflictException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.FavoriteRepository;
import com.forma.backend.repository.ResourceRepository;
import com.forma.backend.repository.UserRepository;
import com.forma.backend.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Избранное", description = "Список избранных ресурсов")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final ResourceService resourceService;

    @GetMapping
    @Operation(summary = "Получить список избранного")
    public ResponseEntity<Page<Map<String, Object>>> getFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails principal) {
        Page<Favorite> favPage = favoriteRepository.findByUserId(
                Long.parseLong(principal.getUsername()), PageRequest.of(page, size));
        return ResponseEntity.ok(favPage.map(this::toResponse));
    }

    @PostMapping("/{resourceId}")
    @Operation(summary = "Добавить ресурс в избранное")
    public ResponseEntity<Map<String, Object>> addToFavorites(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal UserDetails principal) {

        Long userId = Long.parseLong(principal.getUsername());

        if (favoriteRepository.existsByUserIdAndResourceId(userId, resourceId)) {
            throw new ConflictException("Ресурс уже в избранном");
        }

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));
        var resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", resourceId));

        Favorite favorite = Favorite.builder().user(user).resource(resource).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(favoriteRepository.save(favorite)));
    }

    @DeleteMapping("/{resourceId}")
    @Transactional
    @Operation(summary = "Удалить ресурс из избранного")
    public ResponseEntity<Void> removeFromFavorites(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal UserDetails principal) {
        favoriteRepository.deleteByUserIdAndResourceId(
                Long.parseLong(principal.getUsername()), resourceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{resourceId}/check")
    @Operation(summary = "Проверить: ресурс в избранном?")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal UserDetails principal) {
        boolean isFavorite = favoriteRepository.existsByUserIdAndResourceId(
                Long.parseLong(principal.getUsername()), resourceId);
        return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
    }

    private Map<String, Object> toResponse(Favorite fav) {
        ResourceResponse resourceResp = resourceService.toResponse(fav.getResource());
        Map<String, Object> map = new HashMap<>();
        map.put("id", fav.getId());
        map.put("resource", resourceResp);
        map.put("addedAt", fav.getAddedAt());
        return map;
    }
}
