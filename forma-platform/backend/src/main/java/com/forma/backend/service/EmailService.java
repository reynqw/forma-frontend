package com.forma.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendEmailConfirmation(String to, String name, String token) {
        String subject = "FORMA — Подтверждение email";
        String link = frontendUrl + "/auth/confirm-email?token=" + token;
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#1a1a2e">Добро пожаловать на FORMA!</h2>
              <p>Привет, %s!</p>
              <p>Для подтверждения вашего email нажмите кнопку:</p>
              <a href="%s" style="display:inline-block;padding:12px 24px;
                 background:#6C63FF;color:#fff;text-decoration:none;
                 border-radius:8px;font-weight:bold">Подтвердить email</a>
              <p style="color:#666;font-size:12px;margin-top:24px">
                Ссылка действительна 24 часа. Если вы не регистрировались,
                проигнорируйте это письмо.
              </p>
            </div>
            """.formatted(name, link);
        sendHtml(to, subject, html);
    }

    @Async
    public void sendPasswordReset(String to, String name, String token) {
        String subject = "FORMA — Сброс пароля";
        String link = frontendUrl + "/auth/reset-password?token=" + token;
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#1a1a2e">Сброс пароля</h2>
              <p>Привет, %s!</p>
              <p>Для установки нового пароля нажмите кнопку:</p>
              <a href="%s" style="display:inline-block;padding:12px 24px;
                 background:#6C63FF;color:#fff;text-decoration:none;
                 border-radius:8px;font-weight:bold">Сбросить пароль</a>
              <p style="color:#666;font-size:12px;margin-top:24px">
                Ссылка действительна 1 час. Если вы не запрашивали сброс,
                проигнорируйте это письмо.
              </p>
            </div>
            """.formatted(name, link);
        sendHtml(to, subject, html);
    }

    @Async
    public void sendPurchaseConfirmation(String to, String name, String resourceName, String licenseKey) {
        String subject = "FORMA — Покупка оформлена: " + resourceName;
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#1a1a2e">Спасибо за покупку!</h2>
              <p>Привет, %s!</p>
              <p>Вы успешно приобрели ресурс <strong>%s</strong>.</p>
              <p>Ваш лицензионный ключ:</p>
              <div style="background:#f4f4f4;padding:12px;border-radius:8px;
                   font-family:monospace;font-size:14px">%s</div>
              <p>Скачать файл и управлять покупками можно в
                 <a href="%s/profile/purchases">личном кабинете</a>.</p>
            </div>
            """.formatted(name, resourceName, licenseKey, frontendUrl);
        sendHtml(to, subject, html);
    }

    @Async
    public void sendModerationResult(String to, String name, String resourceName,
                                     boolean approved, String comment) {
        String status = approved ? "одобрен" : "отклонён";
        String subject = "FORMA — Ресурс " + status + ": " + resourceName;
        String color = approved ? "#28a745" : "#dc3545";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:%s">Ресурс %s</h2>
              <p>Привет, %s!</p>
              <p>Ваш ресурс <strong>%s</strong> был %s модерацией.</p>
              %s
            </div>
            """.formatted(color, status, name, resourceName, status,
                comment != null ? "<p>Комментарий модератора: " + comment + "</p>" : "");
        sendHtml(to, subject, html);
    }

    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.debug("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
