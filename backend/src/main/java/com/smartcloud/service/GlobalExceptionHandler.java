package com.smartcloud.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

// GlobalExceptionHandler — catches exceptions thrown anywhere in the app
// and converts them into structured JSON error responses
//
// Without this, Spring would return HTML error pages or raw stack traces to the client
// With this, the React frontend always receives a consistent JSON structure:
//   { "error": "...", "message": "...", "timestamp": "..." }

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // Handle validation failures (@Valid annotation on request bodies)
    // When @NotBlank, @Email, @Pattern etc. fail, this catches the exception
    // Returns 400 Bad Request with a map of field → error message
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
        MethodArgumentNotValidException ex
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            fieldErrors.put(field, message);
        });

        return ResponseEntity.badRequest().body(Map.of(
            "error", "Validation failed",
            "fields", fieldErrors,
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    // Handle business logic errors (duplicate username, duplicate email, etc.)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Bad Request",
            "message", ex.getMessage(),
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    // Handle wrong username/password during login
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "error", "Unauthorized",
            "message", "Invalid username or password",
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    // Handle 404 Not Found / 403 Forbidden thrown in service layer
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of(
            "error", ex.getStatusCode().toString(),
            "message", ex.getReason() != null ? ex.getReason() : "Request failed",
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    // Catch-all — any unhandled exception returns 500 Internal Server Error
    // Logs the full stack trace server-side but returns a safe message to the client
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericError(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseEntity.internalServerError().body(Map.of(
            "error", "Internal Server Error",
            "message", "An unexpected error occurred. Please try again.",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
}
