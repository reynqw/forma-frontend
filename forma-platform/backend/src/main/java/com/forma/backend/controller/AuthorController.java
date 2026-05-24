package com.forma.backend.controller;

import com.forma.backend.dto.request.BecomeAuthorRequest;
import com.forma.backend.dto.response.ResourceResponse;
import com.forma.backend.entity.Author;
import com.forma.backend.entity.Resource;
import com.forma.backend.entity.User;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.enums.UserRole;
import com.forma.backend.enums.VerificationStatus;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.AuthorRepository;
import com.forma.backend.repository.ResourceRepository;
import com.forma.backend.repository.UserRepository;
import com.forma.backend.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AuthorController {

    private final AuthorRepository authorRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final ResourceService resourceService;

    // ==================== Заявка «Стать автором» ====================

    @PostMapping("/authors/apply")
    public ResponseEntity<Map<String, Object>> becomeAuthor(
            @Valid @RequestBody BecomeAuthorRequest request,
            Authentication authentication) {

        Long userId = Long.parseLong(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        // Проверка: уже автор
        if (authorRepository.findByUserId(userId).isPresent()) {
            throw new BadRequestException("Вы уже являетесь автором");
        }

        // Проверка: username занят
        if (authorRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Имя автора \"" + request.username() + "\" уже занято");
        }

        Author author = Author.builder()
                .user(user)
                .username(request.username())
                .portfolio(request.portfolio())
                .biography(request.biography())
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        authorRepository.save(author);

        // Обновляем роль пользователя на AUTHOR
        user.setRole(UserRole.AUTHOR);
        userRepository.save(user);

        log.info("Author application created: userId={}, username={}", userId, request.username());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Заявка на статус автора отправлена на модерацию");
        response.put("authorId", author.getId());
        response.put("username", author.getUsername());
        response.put("verificationStatus", author.getVerificationStatus().name());

        return ResponseEntity.ok(response);
    }

    // Проверка статуса заявки
    @GetMapping("/authors/apply/status")
    public ResponseEntity<Map<String, Object>> getAuthorApplicationStatus(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());

        Map<String, Object> response = new HashMap<>();

        authorRepository.findByUserId(userId).ifPresentOrElse(
                author -> {
                    response.put("hasApplication", true);
                    response.put("username", author.getUsername());
                    response.put("verificationStatus", author.getVerificationStatus().name());
                    response.put("createdAt", author.getCreatedAt());
                },
                () -> response.put("hasApplication", false)
        );

        return ResponseEntity.ok(response);
    }

    // ==================== Публичные профили авторов ====================

    @GetMapping("/authors/{username}")
    public ResponseEntity<Map<String, Object>> getAuthorByUsername(@PathVariable String username) {
        Author author = authorRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Автор не найд��н"));

        // Статистика автора
        long resourceCount = resourceRepository.countPublishedByAuthorId(author.getId());
        long totalDownloads = resourceRepository.sumDownloadsByAuthorId(author.getId());
        BigDecimal avgRating = resourceRepository.avgRatingByAuthorId(author.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("id", author.getId());
        response.put("username", author.getUsername());
        response.put("displayName", author.getUser().getFirstName() + " " + author.getUser().getLastName());
        response.put("bio", author.getBiography());
        response.put("website", author.getPortfolio());
        response.put("avatarUrl", null);
        response.put("resourceCount", resourceCount);
        response.put("totalDownloads", totalDownloads);
        response.put("avgRating", avgRating != null ? avgRating : BigDecimal.ZERO);
        response.put("verificationStatus", author.getVerificationStatus().name());
        response.put("createdAt", author.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/authors/{username}/resources")
    public ResponseEntity<Page<ResourceResponse>> getAuthorResources(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Author author = authorRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Автор не найден"));

        Page<ResourceResponse> resources = resourceService.getAuthorResources(
                author.getId(),
                PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending()));

        return ResponseEntity.ok(resources);
    }
}
