package com.smartcloud.controller;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// AuthController — handles user registration and login
//
// Routes:
//   POST /api/auth/register  → create account → return JWT token
//   POST /api/auth/login     → verify credentials → return JWT token
//
// @RestController = @Controller + @ResponseBody (auto-serializes return values to JSON)
// @RequestMapping sets the base path for all routes in this class
// These routes are PUBLIC — no JWT required (configured in SecurityConfig)

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/register
    // @Valid triggers validation on the RegisterRequest fields (@NotBlank, @Email, etc.)
    // Returns 200 OK with the AuthResponse (JWT token + user info)
    // Returns 400 Bad Request if validation fails or username/email already taken
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // POST /api/auth/login
    // Returns 200 OK with JWT token if credentials are correct
    // Returns 401 Unauthorized if credentials are wrong
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
