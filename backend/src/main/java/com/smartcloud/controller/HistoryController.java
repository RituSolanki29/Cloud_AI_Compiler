package com.smartcloud.controller;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    public ResponseEntity<List<SubmissionResponse>> getHistory(
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(historyService.getUserHistory(currentUser.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponse> getSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(historyService.getSubmission(id, currentUser.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        historyService.deleteSubmission(id, currentUser.getUsername());
        return ResponseEntity.noContent().build();
    }
}