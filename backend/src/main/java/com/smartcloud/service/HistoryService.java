package com.smartcloud.service;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.model.Submission;
import com.smartcloud.model.User;
import com.smartcloud.repository.SubmissionRepository;
import com.smartcloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

// HistoryService — manages retrieval and deletion of past submissions
//
// Key security concern: users must only see their OWN submissions
// We always filter queries by BOTH submission ID and user ID
// This prevents horizontal privilege escalation (user A accessing user B's code)

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    // Get all submissions for the logged-in user, newest first
    // Converts each Submission entity → SubmissionResponse DTO using the factory method
    public List<SubmissionResponse> getUserHistory(String username) {
        User user = getUser(username);
        return submissionRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(SubmissionResponse::from)  // method reference to the factory method in DTO
            .collect(Collectors.toList());
    }

    // Get a single submission by ID — only if it belongs to the requesting user
    // Returns 404 Not Found if: submission doesn't exist OR belongs to someone else
    // (we don't say "forbidden" because that would confirm the submission exists — security by obscurity)
    public SubmissionResponse getSubmission(Long submissionId, String username) {
        User user = getUser(username);
        Submission submission = submissionRepository
            .findByIdAndUserId(submissionId, user.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Submission not found"
            ));
        return SubmissionResponse.from(submission);
    }

    // Delete a submission — only if it belongs to the requesting user
    // Returns 404 if not found (same security reasoning as above)
    public void deleteSubmission(Long submissionId, String username) {
        User user = getUser(username);
        Submission submission = submissionRepository
            .findByIdAndUserId(submissionId, user.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Submission not found"
            ));
        submissionRepository.delete(submission);
    }

    // Helper: load user entity by username
    // 404 if username doesn't exist (shouldn't happen if JWT is valid, but defensive)
    private User getUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"
            ));
    }
}
