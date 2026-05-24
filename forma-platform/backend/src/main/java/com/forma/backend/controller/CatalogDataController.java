package com.forma.backend.controller;

import com.forma.backend.entity.License;
import com.forma.backend.entity.ResourceType;
import com.forma.backend.entity.Tag;
import com.forma.backend.repository.LicenseRepository;
import com.forma.backend.repository.ResourceTypeRepository;
import com.forma.backend.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CatalogDataController {

    private final ResourceTypeRepository typeRepository;
    private final TagRepository tagRepository;
    private final LicenseRepository licenseRepository;

    @GetMapping("/types")
    public ResponseEntity<List<ResourceType>> getAllTypes() {
        return ResponseEntity.ok(typeRepository.findAll());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ResourceType>> getCategories() {
        return ResponseEntity.ok(typeRepository.findAll());
    }

    @GetMapping("/tags")
    public ResponseEntity<List<Tag>> getAllTags() {
        return ResponseEntity.ok(tagRepository.findAll());
    }

    @GetMapping("/licenses")
    public ResponseEntity<List<License>> getAllLicenses() {
        return ResponseEntity.ok(licenseRepository.findAll());
    }
}
