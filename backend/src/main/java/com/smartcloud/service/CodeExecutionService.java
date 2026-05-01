package com.smartcloud.service;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.model.Submission;
import com.smartcloud.model.User;
import com.smartcloud.repository.SubmissionRepository;
import com.smartcloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.*;

// CodeExecutionService — the heart of the compiler platform
//
// BEFORE DOCKER (current phase):
//   Code execution requires Docker to be installed on the host running the Spring Boot app.
//   The service spawns Docker containers directly from the JVM using ProcessBuilder.
//   In production (Phase 4+), these containers run inside Kubernetes pods on AWS EC2.
//
// Security model:
//   - Each execution runs in an ISOLATED Docker container
//   - --network=none: no internet access
//   - --memory=256m: memory cap
//   - --cpus=0.5: CPU cap
//   - --rm: container destroyed after execution
//   - ExecutorService timeout: kills process after N seconds

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeExecutionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    @Value("${execution.timeout:10}")
    private int timeoutSeconds;

    @Value("${execution.memory.limit:256m}")
    private String memoryLimit;

    @Value("${execution.cpu.limit:0.5}")
    private String cpuLimit;

    // Docker image names — must match what you built in Phase 4
    private static final String IMAGE_PYTHON = "smartcloud-runner-python";
    private static final String IMAGE_JAVA = "smartcloud-runner-java";
    private static final String IMAGE_CPP = "smartcloud-runner-cpp";

    public ExecuteResponse execute(ExecuteRequest request, String username) {
        long startTime = System.currentTimeMillis();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String dockerImage = resolveImage(request.getLanguage());
        String encodedCode = Base64.getEncoder().encodeToString(
                request.getCode().getBytes(StandardCharsets.UTF_8));

        ExecuteResponse response;
        try {
            response = runInDocker(dockerImage, encodedCode, request.getInput(), startTime);
        } catch (Exception e) {
            log.error("Execution failed for user {}: {}", username, e.getMessage());
            response = ExecuteResponse.builder()
                    .stdout("")
                    .stderr("Internal execution error: " + e.getMessage())
                    .status("ERROR")
                    .executionTime(System.currentTimeMillis() - startTime)
                    .build();
        }

        // BUG FIX: Map status string to correct ExecutionStatus enum
        // Timeout returns "TIMEOUT", success returns "SUCCESS", errors return "ERROR"
        Submission.ExecutionStatus execStatus;
        try {
            execStatus = Submission.ExecutionStatus.valueOf(response.getStatus());
        } catch (IllegalArgumentException e) {
            execStatus = Submission.ExecutionStatus.ERROR;
        }

        Submission submission = Submission.builder()
                .user(user)
                .language(request.getLanguage())
                .code(request.getCode())
                .input(request.getInput())
                .stdout(response.getStdout())
                .stderr(response.getStderr())
                .status(execStatus)
                .executionTime(response.getExecutionTime())
                .build();

        Submission saved = submissionRepository.save(submission);
        response.setSubmissionId(saved.getId());

        return response;
    }

    private ExecuteResponse runInDocker(String image, String encodedCode, String stdin, long startTime)
            throws IOException, InterruptedException {

        ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", "--rm",
                "--memory=" + memoryLimit,
                "--cpus=" + cpuLimit,
                "--network=none",
                "--ulimit", "nofile=64:64",
                "--ulimit", "nproc=64:64",
                "-e", "CODE=" + encodedCode,
                image);

        pb.redirectErrorStream(false);
        Process process = pb.start();

        if (stdin != null && !stdin.isBlank()) {
            try (OutputStream os = process.getOutputStream()) {
                os.write(stdin.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }
        }

        ExecutorService executor = Executors.newFixedThreadPool(2);

        Future<String> stdoutFuture = executor
                .submit(() -> new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8));

        Future<String> stderrFuture = executor
                .submit(() -> new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8));

        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            executor.shutdownNow();
            long elapsed = System.currentTimeMillis() - startTime;
            // BUG FIX: Was "ERROR" — now correctly returns "TIMEOUT" to match
            // ExecutionStatus enum
            return ExecuteResponse.builder()
                    .stdout("")
                    .stderr("Execution timed out after " + timeoutSeconds + " seconds.")
                    .status("TIMEOUT")
                    .executionTime(elapsed)
                    .build();
        }

        String stdout = "";
        String stderr = "";
        try {
            stdout = stdoutFuture.get(2, TimeUnit.SECONDS);
            stderr = stderrFuture.get(2, TimeUnit.SECONDS);
        } catch (ExecutionException | TimeoutException e) {
            stderr = "Failed to read process output";
        } finally {
            executor.shutdown();
        }

        long elapsed = System.currentTimeMillis() - startTime;
        boolean success = process.exitValue() == 0 && stderr.isBlank();

        return ExecuteResponse.builder()
                .stdout(stdout)
                .stderr(stderr)
                .status(success ? "SUCCESS" : "ERROR")
                .executionTime(elapsed)
                .build();
    }

    private String resolveImage(String language) {
        return switch (language.toLowerCase()) {
            case "python" -> IMAGE_PYTHON;
            case "java" -> IMAGE_JAVA;
            case "cpp" -> IMAGE_CPP;
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }
}