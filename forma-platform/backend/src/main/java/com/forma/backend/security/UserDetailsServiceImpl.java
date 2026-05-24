package com.forma.backend.security;

import com.forma.backend.entity.User;
import com.forma.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return buildUserDetails(user);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;
        return buildUserDetails(user);
    }

    private UserDetails buildUserDetails(User user) {
        boolean locked = user.getLockedUntil() != null &&
                user.getLockedUntil().isAfter(LocalDateTime.now());
        // Аккаунт активен, если email подтверждён или статус 'active'
        boolean enabled = user.isEmailConfirmed() || "active".equals(user.getStatus());

        return org.springframework.security.core.userdetails.User.builder()
                .username(String.valueOf(user.getId()))
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .accountExpired(false)
                .accountLocked(locked)
                .credentialsExpired(false)
                .disabled(!enabled || "blocked".equals(user.getStatus()))
                .build();
    }
}
