package com.forma.backend.repository;

import com.forma.backend.entity.LicenseKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LicenseKeyRepository extends JpaRepository<LicenseKey, Long> {
    Optional<LicenseKey> findByUniqueKey(String uniqueKey);
    List<LicenseKey> findByUserIdAndResourceId(Long userId, Long resourceId);
    boolean existsByUserIdAndResourceId(Long userId, Long resourceId);
    Page<LicenseKey> findByUserIdOrderByIssuedAtDesc(Long userId, Pageable pageable);
    List<LicenseKey> findByOrderId(Long orderId);
}
