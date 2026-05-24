package com.forma.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResourceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;
}
