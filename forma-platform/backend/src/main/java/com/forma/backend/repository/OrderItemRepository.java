package com.forma.backend.repository;

import com.forma.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT COALESCE(SUM(oi.price), 0) FROM OrderItem oi WHERE oi.resource.author.id = :authorId AND oi.order.status = 'PAID'")
    BigDecimal sumRevenueByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.resource.author.id = :authorId AND oi.order.status = 'PAID'")
    long countSalesByAuthorId(@Param("authorId") Long authorId);
}
