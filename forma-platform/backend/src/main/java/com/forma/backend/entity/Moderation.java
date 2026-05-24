package com.forma.backend.entity;

import com.forma.backend.enums.ModerationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "moderations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Moderation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ModerationStatus status;

    @Column(name = "reviewed_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime reviewedAt = LocalDateTime.now();
}
