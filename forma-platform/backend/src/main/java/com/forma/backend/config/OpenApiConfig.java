package com.forma.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "FORMA API",
        version = "1.0.0",
        description = "REST API веб-платформы для продажи шрифтов и дизайн-ресурсов «FORMA». " +
                      "Дипломный проект — Уральский государственный горный университет, 2024."
    ),
    servers = {
        @Server(url = "http://localhost:8080/api", description = "Локальная разработка"),
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT"
)
public class OpenApiConfig {}
