package com.forma.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${storage.local.base-path:./uploads}")
    private String localBasePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(localBasePath).toAbsolutePath().normalize();
        String resourceLocation = "file:///" + uploadPath.toString().replace("\\", "/") + "/";

        registry.addResourceHandler("/files/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(3600);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/files/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "HEAD", "OPTIONS");
    }
}
