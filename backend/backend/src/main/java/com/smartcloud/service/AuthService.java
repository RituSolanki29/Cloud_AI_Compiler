package com.smartcloud.service;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.model.User;
import com.smartcloud.repository.UserRepository;
import com.smartcloud.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// AuthService — business logic for user registration and login
//
// This layer sits between the controller (HTTP) and the repository (database)
// It handles: input validation, password hashing, JWT generation

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    // register — creates a new user account
    // Steps:
    //   1. Check username/email not already taken
    //   2. Hash the password with BCrypt (never store plaintext!)
    //   3. Save user to PostgreSQL via JPA
    //   4. Generate a JWT token for the new user
    //   5. Return token + user info
    public AuthResponse register(RegisterRequest request) {

        // Reject if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }

        // Reject if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Build and save the User entity
        // passwordEncoder.encode() applies BCrypt hashing with an automatic random salt
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .build();

        userRepository.save(user);

        // Load UserDetails (Spring Security interface) and generate JWT
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
            .token(token)
            .user(UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build())
            .build();
    }

    // login — verifies credentials and returns a new JWT token
    // Steps:
    //   1. authenticationManager.authenticate() checks username + password
    //      → internally calls UserDetailsService to load user, then BCrypt to compare
    //      → throws BadCredentialsException if wrong (Spring converts this to 401)
    //   2. Load the user from DB to get full user info
    //   3. Generate and return JWT token
    public AuthResponse login(LoginRequest request) {

        // This single call does: load user → compare BCrypt hashed passwords → throw if wrong
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );

        // If we reach here, credentials were correct
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
            .token(token)
            .user(UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build())
            .build();
    }
}
