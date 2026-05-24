package com.forma.backend.repository;

import com.forma.backend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    @Query("SELECT c FROM Cart c JOIN FETCH c.resource r LEFT JOIN FETCH r.type LEFT JOIN FETCH r.author WHERE c.user.id = :userId")
    List<Cart> findByUserId(@Param("userId") Long userId);
    Optional<Cart> findByUserIdAndResourceId(Long userId, Long resourceId);
    boolean existsByUserIdAndResourceId(Long userId, Long resourceId);
    void deleteByUserIdAndResourceId(Long userId, Long resourceId);
    void deleteAllByUserId(Long userId);
    long countByUserId(Long userId);
}
