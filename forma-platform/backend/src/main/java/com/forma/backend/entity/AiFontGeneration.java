package com.forma.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_font_generations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiFontGeneration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "style_description", nullable = false, length = 500)
    private String styleDescription;

    @Column(nullable = false, length = 100)
    private String letters;

    @Column(name = "prompt_used", columnDefinition = "TEXT")
    private String promptUsed;

    @Lob
    @Column(name = "image_base64", nullable = false, columnDefinition = "LONGTEXT")
    private String imageBase64;

    @Column(columnDefinition = "TEXT")
    private String advice;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_favorite")
    @Builder.Default
    private Boolean isFavorite = false;
}
