package com.forma.backend.entity;

import com.forma.backend.enums.ResourceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "resources")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK → authors.id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Author author;

    // FK → types.id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    private ResourceType type;

    // FK → licenses.id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id", nullable = false)
    private License license;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // SHA-256 хеш для проверки уникальности файла
    @Column(name = "file_hash", length = 64)
    private String fileHash;

    // Путь к скачиваемому файлу ресурса
    @Column(name = "file_path", length = 500)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ResourceStatus status = ResourceStatus.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Дополнительные технические поля — добавляются через ddl-auto:update
    @Column(name = "preview_url", length = 500)
    private String previewUrl;

    @Column(length = 255, unique = true)
    private String slug;

    @Column(name = "avg_rating", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private int downloadCount = 0;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private int viewCount = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // M:N с тегами через таблицу resource_tags
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "resource_tags",
        joinColumns = @JoinColumn(name = "resource_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    // 1:1 с таблицей fonts (только для шрифтов)
    @OneToOne(mappedBy = "resource", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Font font;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public BigDecimal getEffectivePrice() {
        return price;
    }
}
