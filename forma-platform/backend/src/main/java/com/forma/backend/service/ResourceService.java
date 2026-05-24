package com.forma.backend.service;

import com.forma.backend.dto.request.CreateResourceRequest;
import com.forma.backend.dto.response.ResourceResponse;
import com.forma.backend.entity.*;
import com.forma.backend.enums.ModerationStatus;
import com.forma.backend.enums.NotificationType;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.enums.UserRole;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.DuplicateResourceException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.exception.UnauthorizedException;
import com.forma.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final AuthorRepository authorRepository;
    private final ModerationRepository moderationRepository;
    private final TagRepository tagRepository;
    private final NotificationService notificationService;
    private final HashingService hashingService;
    private final FileStorageService fileStorageService;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public ResourceResponse create(Long userId, CreateResourceRequest request,
                                   List<MultipartFile> files, MultipartFile previewFile) {
        Author author = authorRepository.findByUserId(userId)
                .orElseThrow(() -> new UnauthorizedException(
                        "Требуется статус автора для загрузки ресурсов"));

        if (files == null || files.isEmpty()) {
            throw new BadRequestException("Необходимо загрузить хотя бы один файл");
        }

        MultipartFile primaryFile = files.get(0);
        String fileHash = hashingService.computeSha256(primaryFile);

        if (resourceRepository.existsByFileHash(fileHash)) {
            throw new DuplicateResourceException(
                "Данный ресурс уже существует на платформе. " +
                "Загрузка дубликатов запрещена согласно политике FORMA.");
        }

        String originalFilename = primaryFile.getOriginalFilename();
        String fileExt = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExt = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }
        String fileUrl = fileStorageService.uploadFile(primaryFile, "resources/" + UUID.randomUUID() + fileExt);

        // Загрузка превью-изображения
        String previewUrl = null;
        if (previewFile != null && !previewFile.isEmpty()) {
            String previewName = previewFile.getOriginalFilename();
            String previewExt = "";
            if (previewName != null && previewName.contains(".")) {
                previewExt = previewName.substring(previewName.lastIndexOf('.'));
            }
            previewUrl = fileStorageService.uploadFile(previewFile, "previews/" + UUID.randomUUID() + previewExt);
        }

        ResourceType type = entityManager.getReference(ResourceType.class, request.typeId());
        License license   = entityManager.getReference(License.class, request.licenseId());

        Set<Tag> tags = new HashSet<>();
        if (request.tagIds() != null) {
            request.tagIds().forEach(tagId ->
                tags.add(entityManager.getReference(Tag.class, tagId)));
        }

        Resource resource = Resource.builder()
                .author(author)
                .type(type)
                .license(license)
                .name(request.name())
                .slug(generateSlug(request.name()))
                .description(request.description())
                .price(request.price())
                .fileHash(fileHash)
                .filePath(fileUrl)
                .previewUrl(previewUrl)
                .status(ResourceStatus.PENDING)
                .tags(tags)
                .build();

        resource = resourceRepository.save(resource);

        // Создаём запись шрифта при необходимости
        if (request.fontDetails() != null) {
            Font font = Font.builder()
                    .resource(resource)
                    .style(request.fontDetails().style())
                    .family(request.fontDetails().family())
                    .format(request.fontDetails().format())
                    .build();
            entityManager.persist(font);
        }

        // Отправляем на модерацию
        Moderation moderation = Moderation.builder()
                .resource(resource)
                .status(ModerationStatus.PENDING)
                .comment("Ожидает рассмотрения")
                .build();
        moderationRepository.save(moderation);

        log.info("Resource created: id={}, author={}, status=PENDING",
                resource.getId(), userId);
        return toResponse(resource);
    }

    @Transactional
    public ResourceResponse update(Long resourceId, Long userId, String name, String description,
                                    BigDecimal price, String statusStr, List<Long> tagIds,
                                    MultipartFile previewFile) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", resourceId));

        User caller = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));

        boolean isAdmin = caller.getRole() == UserRole.ADMIN;
        boolean isOwner = resource.getAuthor().getUser().getId().equals(userId);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedException("Нет доступа к данному ресурсу");
        }

        // Обновляем поля (только не-null)
        if (name != null && !name.isBlank()) {
            resource.setName(name);
        }
        if (description != null) {
            resource.setDescription(description);
        }
        if (price != null) {
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Цена не может быть отрицательной");
            }
            resource.setPrice(price);
        }

        // Смена статуса: автор может DRAFT → PENDING, админ — что угодно
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                ResourceStatus newStatus = ResourceStatus.valueOf(statusStr.toUpperCase());
                ResourceStatus currentStatus = resource.getStatus();

                if (isAdmin) {
                    resource.setStatus(newStatus);
                } else {
                    // Автор может: DRAFT → PENDING (отправить на модерацию)
                    //               PUBLISHED → HIDDEN (скрыть)
                    //               HIDDEN → PENDING (повторная модерация)
                    boolean allowed =
                        (currentStatus == ResourceStatus.DRAFT && newStatus == ResourceStatus.PENDING) ||
                        (currentStatus == ResourceStatus.PUBLISHED && newStatus == ResourceStatus.HIDDEN) ||
                        (currentStatus == ResourceStatus.HIDDEN && newStatus == ResourceStatus.PENDING);

                    if (!allowed) {
                        throw new BadRequestException(
                            "Невозможно сменить статус с " + currentStatus + " на " + newStatus);
                    }
                    resource.setStatus(newStatus);

                    // Если отправляется на модерацию — создаём запись
                    if (newStatus == ResourceStatus.PENDING) {
                        Moderation moderation = Moderation.builder()
                                .resource(resource)
                                .status(ModerationStatus.PENDING)
                                .comment("Повторная модерация после редактирования")
                                .build();
                        moderationRepository.save(moderation);
                    }
                }
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Неизвестный статус: " + statusStr);
            }
        }

        // Обновляем теги
        if (tagIds != null) {
            Set<Tag> tags = new HashSet<>();
            tagIds.forEach(tagId -> tags.add(entityManager.getReference(Tag.class, tagId)));
            resource.setTags(tags);
        }

        // Обновляем превью
        if (previewFile != null && !previewFile.isEmpty()) {
            String previewName = previewFile.getOriginalFilename();
            String previewExt = "";
            if (previewName != null && previewName.contains(".")) {
                previewExt = previewName.substring(previewName.lastIndexOf('.'));
            }
            String previewUrl = fileStorageService.uploadFile(previewFile, "previews/" + UUID.randomUUID() + previewExt);
            resource.setPreviewUrl(previewUrl);
        }

        resource = resourceRepository.save(resource);
        log.info("Resource updated: id={}, by userId={}", resourceId, userId);
        return toResponse(resource);
    }

    @Transactional(readOnly = true)
    public Page<ResourceResponse> getCatalog(Long typeId, BigDecimal minPrice,
                                              BigDecimal maxPrice, Pageable pageable) {
        return resourceRepository.findWithFilters(typeId, minPrice, maxPrice, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ResourceResponse> getCatalogMultiType(List<Long> typeIds, BigDecimal minPrice,
                                                       BigDecimal maxPrice, Pageable pageable) {
        List<Long> effectiveTypeIds = (typeIds != null && !typeIds.isEmpty()) ? typeIds : null;
        return resourceRepository.findWithMultiTypeFilters(effectiveTypeIds, minPrice, maxPrice, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ResourceResponse getById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .filter(r -> r.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", id));
        resource.setViewCount(resource.getViewCount() + 1);
        resourceRepository.save(resource);
        return toResponse(resource);
    }

    /**
     * Получить ресурс по ID для автора/админа (без фильтра по статусу)
     */
    @Transactional(readOnly = true)
    public ResourceResponse getByIdForOwner(Long id, Long userId) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", id));

        User caller = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));

        boolean isAdmin = caller.getRole() == UserRole.ADMIN;
        boolean isOwner = resource.getAuthor().getUser().getId().equals(userId);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedException("Нет доступа к данному ресурсу");
        }

        return toResponse(resource);
    }

    @Transactional
    public ResourceResponse getBySlug(String slug) {
        Resource resource = resourceRepository.findBySlug(slug)
                .filter(r -> r.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс не найден: " + slug));
        resource.setViewCount(resource.getViewCount() + 1);
        resourceRepository.save(resource);
        return toResponse(resource);
    }

    @Transactional(readOnly = true)
    public Page<ResourceResponse> search(String query, Pageable pageable) {
        return resourceRepository.searchByQuery(query, pageable).map(this::toResponse);
    }

    @Transactional
    public void delete(Long resourceId, Long userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс", resourceId));

        User caller = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь", userId));

        boolean isAdmin = caller.getRole() == UserRole.ADMIN;
        boolean isOwner = resource.getAuthor().getUser().getId().equals(userId);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedException("Нет доступа к данному ресурсу");
        }

        resource.setStatus(ResourceStatus.DELETED);
        resourceRepository.save(resource);
        log.info("Resource soft-deleted: id={}, by userId={}", resourceId, userId);
    }

    /**
     * Принимает строку тегов через запятую, ищет или создаёт каждый тег.
     * Возвращает список ID тегов.
     */
    @Transactional
    public List<Long> resolveTagsByName(String tagsString) {
        if (tagsString == null || tagsString.isBlank()) return List.of();

        return Arrays.stream(tagsString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .map(tagName -> {
                    return tagRepository.findByNameIgnoreCase(tagName)
                            .orElseGet(() -> {
                                Tag newTag = Tag.builder()
                                        .name(tagName)
                                        .slug(tagName.toLowerCase().replaceAll("[^a-zа-яё0-9]+", "-")
                                                .replaceAll("^-|-$", ""))
                                        .build();
                                return tagRepository.save(newTag);
                            });
                })
                .map(Tag::getId)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ResourceResponse> getAuthorResources(Long authorId, Pageable pageable) {
        return resourceRepository
                .findByAuthorIdAndStatus(authorId, ResourceStatus.PUBLISHED, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ResourceResponse> getPendingResources(Pageable pageable) {
        return resourceRepository.findByStatus(ResourceStatus.PENDING, pageable)
                .map(this::toResponse);
    }

    public ResourceResponse toResponse(Resource r) {
        List<String> tagNames = r.getTags() != null
                ? r.getTags().stream().map(Tag::getName).toList()
                : List.of();

        ResourceResponse.FontInfo fontInfo = null;
        if (r.getFont() != null) {
            Font f = r.getFont();
            fontInfo = new ResourceResponse.FontInfo(f.getStyle(), f.getFamily(), f.getFormat(), r.getFilePath());
        }

        Author author = r.getAuthor();
        User authorUser = author.getUser();

        // previewUrls — массив из одного URL (или пустой)
        List<String> previewUrls = r.getPreviewUrl() != null
                ? List.of(r.getPreviewUrl())
                : List.of();

        return new ResourceResponse(
                r.getId(),
                r.getName(),
                r.getSlug(),
                r.getDescription(),
                r.getPrice(),
                r.getEffectivePrice(),
                0, // discount (пока не реализован)
                r.getAvgRating(),
                r.getDownloadCount(),
                r.getViewCount(),
                r.getStatus().name(),
                r.getCreatedAt(),
                previewUrls,
                new ResourceResponse.AuthorInfo(
                        author.getId(),
                        author.getUsername(),
                        authorUser.getFirstName() + " " + authorUser.getLastName()),
                new ResourceResponse.TypeInfo(
                        r.getType().getId(),
                        r.getType().getName(),
                        r.getType().getSlug()),
                new ResourceResponse.LicenseInfo(
                        r.getLicense().getId(),
                        r.getLicense().getName(),
                        r.getLicense().getType()),
                fontInfo,
                tagNames
        );
    }

    private String generateSlug(String name) {
        String slug = name.toLowerCase()
                .replaceAll("[^a-zа-яёa-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .strip();
        if (slug.isEmpty()) slug = "resource";
        return slug + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
