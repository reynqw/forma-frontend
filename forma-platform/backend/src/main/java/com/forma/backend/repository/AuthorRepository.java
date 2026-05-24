package com.forma.backend.repository;

import com.forma.backend.entity.Author;
import com.forma.backend.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {
    Optional<Author> findByUserId(Long userId);
    Optional<Author> findByUsername(String username);
    boolean existsByUsername(String username);
    Page<Author> findByVerificationStatus(VerificationStatus status, Pageable pageable);
}
