package com.forma.backend.repository;

import com.forma.backend.entity.AiChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiChatSessionRepository extends JpaRepository<AiChatSession, Long> {

    List<AiChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<AiChatSession> findByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    void deleteAllByUserId(Long userId);
}
