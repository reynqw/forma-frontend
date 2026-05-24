package com.forma.backend.repository;

import com.forma.backend.entity.DownloadToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DownloadTokenRepository extends JpaRepository<DownloadToken, Long> {

    @Query("SELECT dt FROM DownloadToken dt " +
           "JOIN FETCH dt.order o " +
           "JOIN FETCH o.items oi " +
           "JOIN FETCH oi.resource " +
           "WHERE dt.token = :token")
    Optional<DownloadToken> findByToken(@Param("token") String token);
}
