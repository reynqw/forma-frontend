package com.forma.backend.repository;

import com.forma.backend.entity.User;
import com.forma.backend.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByEmailConfirmToken(String token);

    Optional<User> findByPasswordResetToken(String token);

    Page<User> findByRole(UserRole role, Pageable pageable);

    @Query("""
        SELECT u FROM User u
        WHERE LOWER(u.email) LIKE LOWER(CONCAT('%',:query,'%'))
           OR LOWER(u.firstName) LIKE LOWER(CONCAT('%',:query,'%'))
           OR LOWER(u.lastName) LIKE LOWER(CONCAT('%',:query,'%'))
        """)
    Page<User> searchUsers(String query, Pageable pageable);

    @Modifying
    @Query("UPDATE User u SET u.loginAttempts = 0, u.lockedUntil = null WHERE u.id = :id")
    void resetLoginAttempts(Long id);

    @Modifying
    @Query("UPDATE User u SET u.loginAttempts = u.loginAttempts + 1, u.lockedUntil = :lockUntil WHERE u.id = :id")
    void incrementLoginAttempts(Long id, LocalDateTime lockUntil);
}
