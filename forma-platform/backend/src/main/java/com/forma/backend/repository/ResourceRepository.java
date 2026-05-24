package com.forma.backend.repository;

import com.forma.backend.entity.Resource;
import com.forma.backend.enums.ResourceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    Optional<Resource> findBySlug(String slug);

    List<Resource> findByAuthorId(Long authorId);

    boolean existsByFileHash(String fileHash);

    Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);

    Page<Resource> findByAuthorIdAndStatus(Long authorId, ResourceStatus status, Pageable pageable);

    @Query("""
        SELECT r FROM Resource r
        WHERE r.status = com.forma.backend.enums.ResourceStatus.PUBLISHED
          AND (:typeId IS NULL OR r.type.id = :typeId)
          AND (:minPrice IS NULL OR r.price >= :minPrice)
          AND (:maxPrice IS NULL OR r.price <= :maxPrice)
        """)
    Page<Resource> findWithFilters(@Param("typeId") Long typeId,
                                   @Param("minPrice") BigDecimal minPrice,
                                   @Param("maxPrice") BigDecimal maxPrice,
                                   Pageable pageable);

    @Query("""
        SELECT r FROM Resource r
        WHERE r.status = com.forma.backend.enums.ResourceStatus.PUBLISHED
          AND (:typeIds IS NULL OR r.type.id IN :typeIds)
          AND (:minPrice IS NULL OR r.price >= :minPrice)
          AND (:maxPrice IS NULL OR r.price <= :maxPrice)
        """)
    Page<Resource> findWithMultiTypeFilters(@Param("typeIds") List<Long> typeIds,
                                            @Param("minPrice") BigDecimal minPrice,
                                            @Param("maxPrice") BigDecimal maxPrice,
                                            Pageable pageable);

    @Query("""
        SELECT r FROM Resource r
        WHERE r.status = com.forma.backend.enums.ResourceStatus.PUBLISHED
          AND (LOWER(r.name) LIKE LOWER(CONCAT('%',:query,'%'))
               OR LOWER(r.description) LIKE LOWER(CONCAT('%',:query,'%')))
        """)
    Page<Resource> searchByQuery(@Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Resource r WHERE r.author.id = :authorId AND r.status = com.forma.backend.enums.ResourceStatus.PUBLISHED")
    long countPublishedByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT COALESCE(SUM(r.downloadCount), 0) FROM Resource r WHERE r.author.id = :authorId")
    long sumDownloadsByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT COALESCE(AVG(r.avgRating), 0) FROM Resource r WHERE r.author.id = :authorId AND r.avgRating > 0")
    BigDecimal avgRatingByAuthorId(@Param("authorId") Long authorId);

    Page<Resource> findByAuthorId(Long authorId, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Resource r SET r.avgRating = COALESCE((SELECT AVG(rv.rating) FROM Review rv WHERE rv.resource.id = :resourceId), 0) WHERE r.id = :resourceId")
    void recalcAvgRating(@Param("resourceId") Long resourceId);

    @Modifying
    @Query("UPDATE Resource r SET r.downloadCount = r.downloadCount + 1 WHERE r.id = :id")
    void incrementDownloadCount(@Param("id") Long id);
}
