package com.forma.backend.repository;

import com.forma.backend.entity.Order;
import com.forma.backend.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.resource r LEFT JOIN FETCH r.author LEFT JOIN FETCH r.type WHERE o.user.id = :userId ORDER BY o.orderDate DESC")
    List<Order> findByUserIdWithItems(@Param("userId") Long userId);

    Page<Order> findByUserIdOrderByOrderDateDesc(Long userId, Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.resource r LEFT JOIN FETCH r.author LEFT JOIN FETCH r.type WHERE o.id = :id AND o.user.id = :userId")
    Optional<Order> findByIdAndUserIdWithItems(@Param("id") Long id, @Param("userId") Long userId);

    Optional<Order> findByIdAndUserId(Long id, Long userId);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'PAID' AND o.paidAt BETWEEN :from AND :to")
    BigDecimal sumPaidOrdersBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'PAID' AND o.paidAt BETWEEN :from AND :to")
    long countPaidOrdersBetween(LocalDateTime from, LocalDateTime to);
}
