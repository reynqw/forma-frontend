package com.forma.backend.repository;

import com.forma.backend.entity.AiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiFeedbackRepository extends JpaRepository<AiFeedback, Long> {

    List<AiFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByIsPositiveTrue();

    long countByIsPositiveFalse();
}
