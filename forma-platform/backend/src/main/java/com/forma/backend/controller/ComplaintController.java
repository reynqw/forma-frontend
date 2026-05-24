package com.forma.backend.controller;

import com.forma.backend.entity.Complaint;
import com.forma.backend.entity.Resource;
import com.forma.backend.entity.User;
import com.forma.backend.enums.ModerationStatus;
import com.forma.backend.exception.ResourceNotFoundException;
import com.forma.backend.repository.ComplaintRepository;
import com.forma.backend.repository.ResourceRepository;
import com.forma.backend.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Complaints", description = "Подача жалоб на ресурсы")
public class ComplaintController {

    private final ComplaintRepository complaintRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    @Data
    public static class CreateComplaintRequest {
        @NotNull(message = "Укажите ID ресурса")
        private Long resourceId;

        @NotBlank(message = "Укажите причину жалобы")
        @Size(max = 255, message = "Причина не должна превышать 255 символов")
        private String reason;

        @Size(max = 2000, message = "Комментарий не должен превышать 2000 символов")
        private String comment;
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Подать жалобу на ресурс")
    public ResponseEntity<Map<String, Object>> createComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            @AuthenticationPrincipal UserDetails principal) {

        Long userId = Long.parseLong(principal.getUsername());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Ресурс не найден"));

        log.info("Creating complaint: userId={}, resourceId={}, reason={}", userId, request.getResourceId(), request.getReason());

        Complaint complaint = Complaint.builder()
                .user(user)
                .resource(resource)
                .reason(request.getReason())
                .comment(request.getComment())
                .status(ModerationStatus.PENDING)
                .build();

        complaint = complaintRepository.save(complaint);

        log.info("Complaint created: id={}", complaint.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("id", complaint.getId());
        response.put("message", "Жалоба успешно отправлена");

        return ResponseEntity.ok(response);
    }
}
