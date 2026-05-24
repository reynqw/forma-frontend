package com.forma.backend.repository;

import com.forma.backend.entity.Complaint;
import com.forma.backend.enums.ModerationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    Page<Complaint> findByStatus(ModerationStatus status, Pageable pageable);
    Page<Complaint> findByUserId(Long userId, Pageable pageable);
}
