package com.forma.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@Slf4j
public class HashingService {

    private static final int BUFFER_SIZE = 8192;

    public String computeSha256(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            return computeSha256(is);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось вычислить хеш файла", e);
        }
    }

    public String computeSha256(InputStream is) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[BUFFER_SIZE];
            int read;
            while ((read = is.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException | IOException e) {
            throw new RuntimeException("Ошибка вычисления SHA-256", e);
        }
    }

    public String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 недоступен", e);
        }
    }

    /**
     * Генерирует уникальный хеш для watermark-маркировки скачанного файла.
     * Привязывает файл к конкретному пользователю и лицензии.
     */
    public String generateWatermarkHash(Long userId, Long resourceFileId, Long licenseKeyId) {
        String data = "forma-watermark:" + userId + ":" + resourceFileId + ":" + licenseKeyId
                + ":" + System.currentTimeMillis();
        return computeSha256(data.getBytes());
    }
}
