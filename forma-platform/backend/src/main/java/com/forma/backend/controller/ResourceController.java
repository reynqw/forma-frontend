package com.forma.backend.controller;

import com.forma.backend.dto.response.ResourceResponse;
import com.forma.backend.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
@Tag(name = "Ресурсы", description = "Каталог шрифтов и дизайн-ресурсов")
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    @Operation(summary = "Каталог ресурсов с фильтрацией по типу и цене")
    public ResponseEntity<Page<ResourceResponse>> getCatalog(
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) List<Long> typeIds,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        // Если передан typeIds (несколько типов) — используем мульти-фильтр
        if (typeIds != null && !typeIds.isEmpty()) {
            return ResponseEntity.ok(resourceService.getCatalogMultiType(
                    typeIds, minPrice, maxPrice,
                    PageRequest.of(page, Math.min(size, 100), sort)));
        }

        return ResponseEntity.ok(resourceService.getCatalog(
                typeId, minPrice, maxPrice,
                PageRequest.of(page, Math.min(size, 100), sort)));
    }

    @GetMapping("/search")
    @Operation(summary = "Полнотекстовый поиск ресурсов")
    public ResponseEntity<Page<ResourceResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(resourceService.search(q, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить ресурс по ID")
    public ResponseEntity<ResourceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Получить ресурс по slug")
    public ResponseEntity<ResourceResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(resourceService.getBySlug(slug));
    }

    @GetMapping("/{id}/edit")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Получить ресурс для редактирования (без фильтра по статусу)")
    public ResponseEntity<ResourceResponse> getForEdit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(resourceService.getByIdForOwner(id, Long.parseLong(principal.getUsername())));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Загрузить новый ресурс")
    public ResponseEntity<ResourceResponse> create(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam Long typeId,
            @RequestParam Long licenseId,
            @RequestParam(defaultValue = "0") BigDecimal price,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) String tags,
            // Поля шрифта (только для type=шрифт)
            @RequestParam(required = false) String fontFamily,
            @RequestParam(required = false) String fontStyle,
            @RequestParam(required = false) String fontFormat,
            @RequestPart("files") List<MultipartFile> files,
            @RequestPart(value = "preview", required = false) MultipartFile preview) {

        Long userId = Long.parseLong(principal.getUsername());

        com.forma.backend.dto.request.CreateResourceRequest.FontDetails fontDetails = null;
        if (fontFamily != null && !fontFamily.isBlank()) {
            fontDetails = new com.forma.backend.dto.request.CreateResourceRequest.FontDetails(
                    fontStyle, fontFamily, fontFormat);
        }

        // Поддержка текстовых тегов (через запятую) — создаёт если не существует
        List<Long> resolvedTagIds = tagIds;
        if ((resolvedTagIds == null || resolvedTagIds.isEmpty()) && tags != null && !tags.isBlank()) {
            resolvedTagIds = resourceService.resolveTagsByName(tags);
        }

        com.forma.backend.dto.request.CreateResourceRequest request =
                new com.forma.backend.dto.request.CreateResourceRequest(
                        name, description, typeId, licenseId, price, resolvedTagIds, fontDetails);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.create(userId, request, files, preview));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Обновить ресурс (название, описание, цену, превью, статус)")
    public ResponseEntity<ResourceResponse> update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) BigDecimal price,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) String tags,
            @RequestPart(value = "preview", required = false) MultipartFile preview) {

        Long userId = Long.parseLong(principal.getUsername());

        List<Long> resolvedTagIds = tagIds;
        if ((resolvedTagIds == null || resolvedTagIds.isEmpty()) && tags != null && !tags.isBlank()) {
            resolvedTagIds = resourceService.resolveTagsByName(tags);
        }

        return ResponseEntity.ok(resourceService.update(id, userId, name, description, price, status, resolvedTagIds, preview));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Удалить ресурс (soft delete)")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        resourceService.delete(id, Long.parseLong(principal.getUsername()));
        return ResponseEntity.noContent().build();
    }
}
