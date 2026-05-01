package com.smartcloud.controller;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.service.CodeExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// CodeController — handles code submission and execution
//
// Routes:
//   POST /api/execute  → run code in Docker container → return output
//
// PROTECTED — requires valid JWT token
// @AuthenticationPrincipal UserDetails injects the currently logged-in user
// (Spring Security populates this from the JWT token via JwtAuthFilter)

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CodeController {

    private final CodeExecutionService codeExecutionService;

    // POST /api/execute
    // 1. Validates the request body (language, code fields)
    // 2. Passes to CodeExecutionService which spins up a Docker container
    // 3. Saves the result to the submissions table
    // 4. Returns stdout, stderr, status, and execution time
    //
    // @AuthenticationPrincipal — Spring injects the UserDetails of whoever sent this request
    // We use it to associate the submission with the correct user
    @PostMapping("/execute")
    public ResponseEntity<ExecuteResponse> execute(
        @Valid @RequestBody ExecuteRequest request,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        ExecuteResponse response = codeExecutionService.execute(request, currentUser.getUsername());
        return ResponseEntity.ok(response);
    }
}
