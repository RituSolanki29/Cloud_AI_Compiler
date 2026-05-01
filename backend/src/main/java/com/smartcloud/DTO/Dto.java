package com.smartcloud.dto;

import com.smartcloud.model.Submission;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import java.time.LocalDateTime;

// DTOs (Data Transfer Objects) — define the shape of request bodies and response bodies
// We use DTOs instead of exposing raw model classes to:
//   1. Hide sensitive fields (like password hashes, internal IDs)
//   2. Validate incoming data with annotations before it hits the service layer
//   3. Keep API contracts separate from database schema

public class Dto {

    // ── AUTH REQUEST DTOs ────────────────────────────────────────

    // Body of POST /api/auth/register
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    // Body of POST /api/auth/login
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;
    }

    // Response from both login and register — contains the JWT token + user info
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private UserInfo user;
    }

    // Safe user info to return in responses (no password hash)
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
    }

    // ── CODE EXECUTION DTOs ─────────────────────────────────────

    // Body of POST /api/execute
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ExecuteRequest {
        // @Pattern ensures only allowed languages are submitted
        @Pattern(regexp = "python|java|cpp", message = "Language must be python, java, or cpp")
        private String language;

        @NotBlank(message = "Code cannot be empty")
        private String code;

        private String input; // optional stdin for the program
    }

    // Response from POST /api/execute — what the frontend OutputPanel displays
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ExecuteResponse {
        private Long submissionId;
        private String stdout;
        private String stderr;
        private String status;         // "SUCCESS" or "ERROR"
        private Long executionTime;    // milliseconds
    }

    // ── AI DTOs ─────────────────────────────────────────────────

    // Body of POST /api/ai/explain
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ExplainRequest {
        private String language;
        private String code;
        private String error;
    }

    // Body of POST /api/ai/analyze
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AnalyzeRequest {
        private String language;
        private String code;
    }

    // Shared AI response wrapper
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AIResponse {
        private String explanation; // used for /explain
        private String analysis;    // used for /analyze
    }

    // ── HISTORY DTOs ─────────────────────────────────────────────

    // Safe submission data to return to the frontend
    // Excludes internal DB references (user object), includes flattened fields
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubmissionResponse {
        private Long id;
        private String language;
        private String code;
        private String stdout;
        private String stderr;
        private String status;
        private Long executionTime;
        private LocalDateTime createdAt;

        // Factory method: converts a Submission entity → SubmissionResponse DTO
        public static SubmissionResponse from(Submission s) {
            return SubmissionResponse.builder()
                .id(s.getId())
                .language(s.getLanguage())
                .code(s.getCode())
                .stdout(s.getStdout())
                .stderr(s.getStderr())
                .status(s.getStatus().name())
                .executionTime(s.getExecutionTime())
                .createdAt(s.getCreatedAt())
                .build();
        }
    }
}
