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
    private final S3Service s3Service;

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
        
        SubmissionResponse response = SubmissionResponse.from(submission);
        
        // If s3LogKey is present, dynamically fetch full logs from Amazon S3
        if (submission.getS3LogKey() != null) {
            String[] logs = s3Service.getLogs(submission.getS3LogKey());
            response.setStdout(logs[0]);
            response.setStderr(logs[1]);
        }
        
        return response;
    }

    public void deleteSubmission(Long submissionId, String username) {
        User user = getUser(username);
        Submission submission = submissionRepository
                .findByIdAndUserId(submissionId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Submission not found"));
        
        // Purge log file from S3 if it exists
        if (submission.getS3LogKey() != null) {
            s3Service.deleteLogs(submission.getS3LogKey());
        }
        
        submissionRepository.delete(submission);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }
}