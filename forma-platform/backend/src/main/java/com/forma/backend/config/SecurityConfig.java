package com.forma.backend.config;

import com.forma.backend.security.JwtAuthenticationFilter;
import com.forma.backend.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Публичные эндпоинты — доступны без авторизации
                .requestMatchers(HttpMethod.POST,
                    "/auth/register",
                    "/auth/login",
                    "/auth/refresh",
                    "/auth/forgot-password",
                    "/auth/reset-password",
                    "/auth/confirm-email"
                ).permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/resources",
                    "/resources/{id}",
                    "/resources/{id}/previews",
                    "/resources/search",
                    "/resources/slug/**",
                    "/reviews/resource/**",
                    "/types",
                    "/categories",
                    "/tags",
                    "/licenses",
                    "/authors/{username}",
                    "/authors/{username}/resources",
                    "/files/**"
                ).permitAll()
                // Заявка «Стать автором» — доступна любому авторизованному пользователю
                .requestMatchers(HttpMethod.POST, "/authors/apply").authenticated()
                .requestMatchers(HttpMethod.GET, "/authors/apply/status").authenticated()
                // Одноразовые ссылки скачивания (из email)
                .requestMatchers(HttpMethod.GET, "/downloads/token/**").permitAll()
                // Платёжные endpoints Robokassa (callback + redirect)
                .requestMatchers("/payments/robokassa/**").permitAll()
                // Swagger документация
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                // Только администраторы
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // Только авторы и администраторы
                .requestMatchers(
                    HttpMethod.POST, "/resources"
                ).hasAnyRole("AUTHOR", "ADMIN")
                .requestMatchers(
                    HttpMethod.PUT, "/resources/**"
                ).hasAnyRole("AUTHOR", "ADMIN")
                .requestMatchers("/author/**").hasAnyRole("AUTHOR", "ADMIN")
                // Всё остальное требует авторизации
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(401);
                    response.getWriter().write(
                        "{\"error\":\"Unauthorized\",\"message\":\"Требуется авторизация\"}"
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(403);
                    response.getWriter().write(
                        "{\"error\":\"Forbidden\",\"message\":\"Недостаточно прав\"}"
                    );
                })
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl, "http://localhost:3000", "http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Content-Disposition"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
