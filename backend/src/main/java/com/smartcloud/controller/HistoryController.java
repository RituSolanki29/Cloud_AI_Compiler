package com.smartcloud.controller;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// HistoryController — handles submission history for the logged-in user
//
// Routes:
//   GET    /api/history         → all past submissions for current user
//   GET    /api/history/{id}    → single submission by ID
//   DELETE /api/history/{id}    → delete a submission
//
// PROTECTED — all routes require valid JWT token
// The service layer validates that {id} belongs to the requesting user
// (prevents user A from viewing or deleting user B's submissions)

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    // GET /api/history
    // Returns all submissions for the current user, newest first
    @GetMapping
    public ResponseEntity<List<SubmissionResponse>> getHistory(
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return ResponseEntity.ok(historyService.getUserHistory(currentUser.getUsername()));
    }

    // GET /api/history/{id}
    // Returns a single submission — 404 if not found OR if it doesn't belong to this user
    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponse> getSubmission(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return ResponseEntity.ok(historyService.getSubmission(id, currentUser.getUsername()));
    }

    // DELETE /api/history/{id}
    // Deletes a submission — 403/404 if it doesn't belong to this user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubmission(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        historyService.deleteSubmission(id, currentUser.getUsername());
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}
