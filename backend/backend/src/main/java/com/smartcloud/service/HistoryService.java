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

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    public List<SubmissionResponse> getUserHistory(String username) {
        User user = getUser(username);
        return submissionRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(SubmissionResponse::from)
                .collect(Collectors.toList());
    }

    public SubmissionResponse getSubmission(Long submissionId, String username) {
        User user = getUser(username);
        Submission submission = submissionRepository
                .findByIdAndUserId(submissionId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Submission not found"));
        return SubmissionResponse.from(submission);
    }

    public void deleteSubmission(Long submissionId, String username) {
        User user = getUser(username);
        Submission submission = submissionRepository
                .findByIdAndUserId(submissionId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Submission not found"));
        submissionRepository.delete(submission);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }
}