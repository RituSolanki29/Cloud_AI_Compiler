package com.smartcloud.service;

import com.smartcloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// UserDetailsServiceImpl — loads user data for Spring Security authentication
//
// WHY this is a separate class (not a @Bean inside SecurityConfig):
//   SecurityConfig injects JwtAuthFilter, and JwtAuthFilter injects UserDetailsService.
//   If UserDetailsService is defined as a @Bean inside SecurityConfig, Spring sees:
//       JwtAuthFilter → UserDetailsService → SecurityConfig → JwtAuthFilter  (cycle!)
//   Moving it here as a @Service breaks the cycle entirely — Spring can create this
//   bean independently, before either SecurityConfig or JwtAuthFilter are initialized.

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        com.smartcloud.model.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();
    }
}
