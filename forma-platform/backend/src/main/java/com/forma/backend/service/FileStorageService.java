package com.forma.backend.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final AmazonS3 s3Client;

    @Value("${storage.type}")
    private String storageType;

    @Value("${storage.s3.bucket:forma-files}")
    private String s3Bucket;

    @Value("${storage.s3.endpoint:http://localhost:9000}")
    private String s3Endpoint;

    @Value("${storage.local.base-path:./uploads}")
    private String localBasePath;

    @Value("${storage.local.base-url:http://localhost:8080/api/files}")
    private String localBaseUrl;

    public FileStorageService(AmazonS3 s3Client) {
        this.s3Client = s3Client;
    }

    public String uploadFile(MultipartFile file, String key) {
        if ("s3".equalsIgnoreCase(storageType)) {
            return uploadToS3(file, key);
        }
        return uploadToLocal(file, key);
    }

    public String uploadFile(byte[] data, String key, String contentType) {
        if ("s3".equalsIgnoreCase(storageType)) {
            return uploadBytesToS3(data, key, contentType);
        }
        return uploadBytesToLocal(data, key);
    }

    public void deleteFile(String key) {
        if ("s3".equalsIgnoreCase(storageType)) {
            s3Client.deleteObject(s3Bucket, key);
        } else {
            try {
                Path basePath = Paths.get(localBasePath).toAbsolutePath().normalize();
                Path target = basePath.resolve(key).normalize();
                if (!target.startsWith(basePath)) {
                    throw new SecurityException("Недопустимый путь для удаления файла");
                }
                Files.deleteIfExists(target);
            } catch (IOException e) {
                log.error("Failed to delete local file: {}", key, e);
            }
        }
    }

    private String uploadToS3(MultipartFile file, String key) {
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());
            s3Client.putObject(new PutObjectRequest(s3Bucket, key, file.getInputStream(), metadata));
            return s3Endpoint + "/" + s3Bucket + "/" + key;
        } catch (IOException e) {
            throw new RuntimeException("Ошибка загрузки файла в S3", e);
        }
    }

    private String uploadBytesToS3(byte[] data, String key, String contentType) {
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(data.length);
        metadata.setContentType(contentType);
        try (InputStream is = new java.io.ByteArrayInputStream(data)) {
            s3Client.putObject(new PutObjectRequest(s3Bucket, key, is, metadata));
        } catch (IOException e) {
            throw new RuntimeException("Ошибка загрузки в S3", e);
        }
        return s3Endpoint + "/" + s3Bucket + "/" + key;
    }

    private String uploadToLocal(MultipartFile file, String key) {
        try {
            Path basePath = Paths.get(localBasePath).toAbsolutePath().normalize();
            Path destination = basePath.resolve(key).normalize();
            if (!destination.startsWith(basePath)) {
                throw new SecurityException("Недопустимый путь для сохранения файла");
            }
            Files.createDirectories(destination.getParent());
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return localBaseUrl + "/" + key;
        } catch (IOException e) {
            throw new RuntimeException("Ошибка сохранения файла", e);
        }
    }

    private String uploadBytesToLocal(byte[] data, String key) {
        try {
            Path basePath = Paths.get(localBasePath).toAbsolutePath().normalize();
            Path destination = basePath.resolve(key).normalize();
            if (!destination.startsWith(basePath)) {
                throw new SecurityException("Недопустимый путь для сохранения файла");
            }
            Files.createDirectories(destination.getParent());
            Files.write(destination, data);
            return localBaseUrl + "/" + key;
        } catch (IOException e) {
            throw new RuntimeException("Ошибка сохранения файла", e);
        }
    }
}
