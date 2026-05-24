package com.forma.backend.repository;

import com.forma.backend.entity.Moderation;
import com.forma.backend.enums.ModerationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModerationRepository extends JpaRepository<Moderation, Long> {
    Page<Moderation> findByStatus(ModerationStatus status, Pageable pageable);
}
