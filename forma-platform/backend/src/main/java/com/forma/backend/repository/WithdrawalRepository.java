package com.forma.backend.repository;

import com.forma.backend.entity.Withdrawal;
import com.forma.backend.enums.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {
    Page<Withdrawal> findByAuthorIdOrderByRequestedAtDesc(Long authorId, Pageable pageable);
    Page<Withdrawal> findByStatus(WithdrawalStatus status, Pageable pageable);

    @Query("SELECT w FROM Withdrawal w JOIN FETCH w.author WHERE w.status = :status")
    List<Withdrawal> findByStatusWithAuthor(@Param("status") WithdrawalStatus status);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.author.id = :authorId AND w.status = 'PENDING'")
    BigDecimal sumPendingByAuthorId(@Param("authorId") Long authorId);
}
