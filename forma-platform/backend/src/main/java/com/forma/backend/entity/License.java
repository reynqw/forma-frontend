package com.forma.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "licenses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class License {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String terms;
}
