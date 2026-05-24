package com.forma.backend.entity;

import jakarta.persistence.*;
import lombok.*;

// Таблица fonts: id, resource_id, style, family, format — строго по forma_db.sql
@Entity
@Table(name = "fonts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Font {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false, unique = true)
    private Resource resource;

    @Column(length = 100)
    private String style;

    @Column(length = 100)
    private String family;

    @Column(length = 50)
    private String format;
}
