package com.forma.backend.repository;

import com.forma.backend.entity.AiFontGeneration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiFontGenerationRepository extends JpaRepository<AiFontGeneration, Long> {

    List<AiFontGeneration> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AiFontGeneration> findByUserIdAndIsFavoriteTrueOrderByCreatedAtDesc(Long userId);

    Optional<AiFontGeneration> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    void deleteAllByUserId(Long userId);
}
