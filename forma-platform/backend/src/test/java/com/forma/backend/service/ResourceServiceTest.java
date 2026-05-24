package com.forma.backend.service;

import com.forma.backend.dto.response.ResourceResponse;
import com.forma.backend.entity.*;
import com.forma.backend.enums.ModerationStatus;
import com.forma.backend.enums.ResourceStatus;
import com.forma.backend.enums.UserRole;
import com.forma.backend.enums.VerificationStatus;
import com.forma.backend.exception.BadRequestException;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.exception.UnauthorizedException;
import com.forma.backend.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ResourceService — модуль ресурсов")
class ResourceServiceTest {

    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuthorRepository authorRepository;
    @Mock private ModerationRepository moderationRepository;
    @Mock private TagRepository tagRepository;
    @Mock private NotificationService notificationService;
    @Mock private HashingService hashingService;
    @Mock private FileStorageService fileStorageService;
    @Mock private EntityManager entityManager;

    @InjectMocks private ResourceService resourceService;

    private User createUser(Long id, UserRole role) {
        return User.builder()
                .id(id).firstName("Тест").lastName("Тестов")
                .email("user" + id + "@forma.ru").role(role).status("active").build();
    }

    private Author createAuthor(User user) {
        Author a = Author.builder()
                .id(1L).user(user).username("testauthor")
                .balance(BigDecimal.ZERO).totalEarnings(BigDecimal.ZERO)
                .verificationStatus(VerificationStatus.VERIFIED).build();
        return a;
    }

    private Resource createResource(Author author, ResourceStatus status) {
        ResourceType type = ResourceType.builder().id(1L).name("Шрифт").slug("font").build();
        License license = License.builder().id(1L).name("Standard").type("PERSONAL").build();
        return Resource.builder()
                .id(10L).author(author).type(type).license(license)
                .name("Тестовый ресурс").slug("test-resource-abc12345")
                .description("Описание ресурса").price(new BigDecimal("500.00"))
                .status(status).avgRating(BigDecimal.ZERO).downloadCount(0).viewCount(0)
                .tags(new HashSet<>()).createdAt(LocalDateTime.now())
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Обновление ресурса")
    class Update {

        @Test
        @DisplayName("Автор обновляет имя и описание")
        void update_OwnerUpdatesNameDesc() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            ResourceResponse response = resourceService.update(
                    10L, 2L, "Новое название", "Новое описание",
                    null, null, null, null);

            assertThat(response.name()).isEqualTo("Новое название");
            assertThat(response.description()).isEqualTo("Новое описание");
        }

        @Test
        @DisplayName("Автор обновляет цену")
        void update_OwnerUpdatesPrice() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            ResourceResponse response = resourceService.update(
                    10L, 2L, null, null,
                    new BigDecimal("750.00"), null, null, null);

            assertThat(response.price()).isEqualByComparingTo("750.00");
        }

        @Test
        @DisplayName("Ошибка: отрицательная цена")
        void update_NegativePrice_Throws() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));

            assertThatThrownBy(() -> resourceService.update(
                    10L, 2L, null, null,
                    new BigDecimal("-100.00"), null, null, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("отрицательной");
        }

        @Test
        @DisplayName("Автор: DRAFT → PENDING (отправка на модерацию)")
        void update_DraftToPending() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            resourceService.update(10L, 2L, null, null, null, "PENDING", null, null);

            assertThat(resource.getStatus()).isEqualTo(ResourceStatus.PENDING);
            verify(moderationRepository).save(any(Moderation.class));
        }

        @Test
        @DisplayName("Автор: PUBLISHED → HIDDEN (скрыть из каталога)")
        void update_PublishedToHidden() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.PUBLISHED);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            resourceService.update(10L, 2L, null, null, null, "HIDDEN", null, null);

            assertThat(resource.getStatus()).isEqualTo(ResourceStatus.HIDDEN);
        }

        @Test
        @DisplayName("Автор: HIDDEN → PENDING (повторная модерация)")
        void update_HiddenToPending() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.HIDDEN);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            resourceService.update(10L, 2L, null, null, null, "PENDING", null, null);

            assertThat(resource.getStatus()).isEqualTo(ResourceStatus.PENDING);
            verify(moderationRepository).save(any(Moderation.class));
        }

        @Test
        @DisplayName("Ошибка: автор пытается DRAFT → PUBLISHED напрямую")
        void update_AuthorDraftToPublished_Throws() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));

            assertThatThrownBy(() -> resourceService.update(
                    10L, 2L, null, null, null, "PUBLISHED", null, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Невозможно сменить статус");
        }

        @Test
        @DisplayName("Админ может установить любой статус")
        void update_AdminCanSetAnyStatus() {
            User admin = createUser(99L, UserRole.ADMIN);
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(99L)).thenReturn(Optional.of(admin));
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            resourceService.update(10L, 99L, null, null, null, "PUBLISHED", null, null);

            assertThat(resource.getStatus()).isEqualTo(ResourceStatus.PUBLISHED);
        }

        @Test
        @DisplayName("Ошибка: нет доступа (не владелец и не админ)")
        void update_NotOwnerNotAdmin_Throws() {
            User stranger = createUser(55L, UserRole.BUYER);
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(55L)).thenReturn(Optional.of(stranger));

            assertThatThrownBy(() -> resourceService.update(
                    10L, 55L, "Hack", null, null, null, null, null))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("Нет доступа");
        }

        @Test
        @DisplayName("Ошибка: ресурс не найден")
        void update_ResourceNotFound_Throws() {
            when(resourceRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> resourceService.update(
                    999L, 2L, "Name", null, null, null, null, null))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Загрузка нового превью")
        void update_NewPreview() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            MultipartFile mockPreview = mock(MultipartFile.class);
            when(mockPreview.isEmpty()).thenReturn(false);
            when(mockPreview.getOriginalFilename()).thenReturn("preview.png");

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));
            when(fileStorageService.uploadFile(eq(mockPreview), anyString()))
                    .thenReturn("https://s3.example.com/previews/new-preview.png");
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            resourceService.update(10L, 2L, null, null, null, null, null, mockPreview);

            assertThat(resource.getPreviewUrl()).isEqualTo("https://s3.example.com/previews/new-preview.png");
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Получение ресурса по ID")
    class GetById {

        @Test
        @DisplayName("Опубликованный ресурс — увеличивает просмотры")
        void getById_Published_IncrementsViews() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.PUBLISHED);
            resource.setViewCount(5);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

            ResourceResponse response = resourceService.getById(10L);

            assertThat(response.viewCount()).isEqualTo(6);
            verify(resourceRepository).save(resource);
        }

        @Test
        @DisplayName("Ошибка: неопубликованный ресурс — не найден")
        void getById_NotPublished_Throws() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));

            assertThatThrownBy(() -> resourceService.getById(10L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Ошибка: ресурс не существует")
        void getById_NotExists_Throws() {
            when(resourceRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> resourceService.getById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Получение ресурса для владельца")
    class GetByIdForOwner {

        @Test
        @DisplayName("Владелец видит свой черновик")
        void getByIdForOwner_OwnerSeesDraft() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));

            ResourceResponse response = resourceService.getByIdForOwner(10L, 2L);

            assertThat(response.id()).isEqualTo(10L);
            assertThat(response.status()).isEqualTo("DRAFT");
        }

        @Test
        @DisplayName("Админ видит любой ресурс")
        void getByIdForOwner_AdminSeesAll() {
            User admin = createUser(99L, UserRole.ADMIN);
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.HIDDEN);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(99L)).thenReturn(Optional.of(admin));

            ResourceResponse response = resourceService.getByIdForOwner(10L, 99L);

            assertThat(response.status()).isEqualTo("HIDDEN");
        }

        @Test
        @DisplayName("Ошибка: посторонний пользователь не имеет доступа")
        void getByIdForOwner_Stranger_Throws() {
            User stranger = createUser(55L, UserRole.BUYER);
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.DRAFT);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(55L)).thenReturn(Optional.of(stranger));

            assertThatThrownBy(() -> resourceService.getByIdForOwner(10L, 55L))
                    .isInstanceOf(UnauthorizedException.class);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Удаление ресурса (soft delete)")
    class Delete {

        @Test
        @DisplayName("Владелец мягко удаляет ресурс")
        void delete_OwnerSoftDeletes() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.PUBLISHED);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(2L)).thenReturn(Optional.of(authorUser));

            resourceService.delete(10L, 2L);

            assertThat(resource.getStatus()).isEqualTo(ResourceStatus.DELETED);
            verify(resourceRepository).save(resource);
        }

        @Test
        @DisplayName("Админ может удалить любой ресурс")
        void delete_AdminDeletes() {
            User admin = createUser(99L, UserRole.ADMIN);
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.PUBLISHED);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(99L)).thenReturn(Optional.of(admin));

            resourceService.delete(10L, 99L);

            assertThat(resource.getStatus()).isEqualTo(ResourceStatus.DELETED);
        }

        @Test
        @DisplayName("Ошибка: посторонний пользователь не может удалить")
        void delete_Stranger_Throws() {
            User stranger = createUser(55L, UserRole.BUYER);
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.PUBLISHED);

            when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
            when(userRepository.findById(55L)).thenReturn(Optional.of(stranger));

            assertThatThrownBy(() -> resourceService.delete(10L, 55L))
                    .isInstanceOf(UnauthorizedException.class);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Разрешение тегов по имени")
    class ResolveTags {

        @Test
        @DisplayName("Создаёт новые теги если не найдены")
        void resolveTagsByName_CreatesNewTags() {
            when(tagRepository.findByNameIgnoreCase("Modern")).thenReturn(Optional.empty());
            when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> {
                Tag t = inv.getArgument(0);
                t.setId(1L);
                return t;
            });

            List<Long> ids = resourceService.resolveTagsByName("Modern");

            assertThat(ids).hasSize(1);
            verify(tagRepository).save(any(Tag.class));
        }

        @Test
        @DisplayName("Находит существующие теги")
        void resolveTagsByName_FindsExisting() {
            Tag existing = Tag.builder().id(5L).name("Sans-Serif").slug("sans-serif").build();
            when(tagRepository.findByNameIgnoreCase("Sans-Serif")).thenReturn(Optional.of(existing));

            List<Long> ids = resourceService.resolveTagsByName("Sans-Serif");

            assertThat(ids).containsExactly(5L);
            verify(tagRepository, never()).save(any());
        }

        @Test
        @DisplayName("Пустая строка — возвращает пустой список")
        void resolveTagsByName_Empty_ReturnsEmpty() {
            List<Long> ids = resourceService.resolveTagsByName("");

            assertThat(ids).isEmpty();
        }

        @Test
        @DisplayName("null — возвращает пустой список")
        void resolveTagsByName_Null_ReturnsEmpty() {
            List<Long> ids = resourceService.resolveTagsByName(null);

            assertThat(ids).isEmpty();
        }

        @Test
        @DisplayName("Несколько тегов через запятую")
        void resolveTagsByName_MultipleTags() {
            Tag t1 = Tag.builder().id(1L).name("Bold").slug("bold").build();
            when(tagRepository.findByNameIgnoreCase("Bold")).thenReturn(Optional.of(t1));
            when(tagRepository.findByNameIgnoreCase("Italic")).thenReturn(Optional.empty());
            when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> {
                Tag t = inv.getArgument(0);
                t.setId(2L);
                return t;
            });

            List<Long> ids = resourceService.resolveTagsByName("Bold, Italic");

            assertThat(ids).hasSize(2).containsExactly(1L, 2L);
        }

        @Test
        @DisplayName("Дубликаты в строке — удаляются")
        void resolveTagsByName_Duplicates_Deduplicated() {
            Tag t = Tag.builder().id(1L).name("Modern").slug("modern").build();
            when(tagRepository.findByNameIgnoreCase("Modern")).thenReturn(Optional.of(t));

            List<Long> ids = resourceService.resolveTagsByName("Modern, Modern, Modern");

            assertThat(ids).hasSize(1).containsExactly(1L);
        }
    }

    // ────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Каталог и поиск")
    class CatalogAndSearch {

        @Test
        @DisplayName("getCatalog возвращает страницу ресурсов")
        void getCatalog_ReturnsPage() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.PUBLISHED);

            Page<Resource> page = new PageImpl<>(List.of(resource));
            when(resourceRepository.findWithFilters(any(), any(), any(), any()))
                    .thenReturn(page);

            Page<ResourceResponse> result = resourceService.getCatalog(
                    null, null, null, PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).name()).isEqualTo("Тестовый ресурс");
        }

        @Test
        @DisplayName("getPendingResources возвращает только PENDING")
        void getPendingResources_ReturnsPage() {
            User authorUser = createUser(2L, UserRole.AUTHOR);
            Author author = createAuthor(authorUser);
            Resource resource = createResource(author, ResourceStatus.PENDING);

            Page<Resource> page = new PageImpl<>(List.of(resource));
            when(resourceRepository.findByStatus(eq(ResourceStatus.PENDING), any(Pageable.class)))
                    .thenReturn(page);

            Page<ResourceResponse> result = resourceService.getPendingResources(PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).status()).isEqualTo("PENDING");
        }
    }
}
