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
// What it does:
//   1. Receives code + language from the controller
//   2. Base64-encodes the code (safe to pass as environment variable)
//   3. Spawns a Docker container with resource limits (CPU, memory, no network)
//   4. Feeds stdin input to the container process
//   5. Captures stdout and stderr
//   6. Kills the container after timeout (prevents infinite loops)
//   7. Saves the result to PostgreSQL
//   8. Returns the output to the controller
//
// Security model:
//   - Each execution runs in an ISOLATED Docker container
//   - --network=none: no internet access inside the container
//   - --memory=256m: can't eat all server RAM
//   - --cpus=0.5: can't use all CPU
//   - --rm: container is destroyed after execution (no persistence)
//   - ExecutorService timeout: kills the process after N seconds

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
    // These images are stored in Amazon ECR and pulled by Kubernetes
    private static final String IMAGE_PYTHON = "smartcloud-runner-python";
    private static final String IMAGE_JAVA   = "smartcloud-runner-java";
    private static final String IMAGE_CPP    = "smartcloud-runner-cpp";

    public ExecuteResponse execute(ExecuteRequest request, String username) {
        long startTime = System.currentTimeMillis();

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        String dockerImage = resolveImage(request.getLanguage());
        // Base64-encode the code so special characters (quotes, newlines) don't break the shell command
        String encodedCode = Base64.getEncoder().encodeToString(
            request.getCode().getBytes(StandardCharsets.UTF_8)
        );

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

        // Persist the result to PostgreSQL regardless of success/error
        Submission submission = Submission.builder()
            .user(user)
            .language(request.getLanguage())
            .code(request.getCode())
            .input(request.getInput())
            .stdout(response.getStdout())
            .stderr(response.getStderr())
            .status(Submission.ExecutionStatus.valueOf(response.getStatus()))
            .executionTime(response.getExecutionTime())
            .build();

        Submission saved = submissionRepository.save(submission);
        response.setSubmissionId(saved.getId());

        return response;
    }

    // Spawns the Docker container and captures its output
    private ExecuteResponse runInDocker(String image, String encodedCode, String stdin, long startTime)
        throws IOException, InterruptedException {

        // Build the docker run command
        // Each flag explained:
        //   --rm         = remove container after it exits (no cleanup needed)
        //   --memory     = hard memory cap (OOM killer will terminate if exceeded)
        //   --cpus       = fractional CPU limit (0.5 = half a CPU core)
        //   --network=none = no internet access inside the container
        //   -e CODE      = pass base64-encoded code as environment variable
        ProcessBuilder pb = new ProcessBuilder(
            "docker", "run", "--rm",
            "--memory=" + memoryLimit,
            "--cpus=" + cpuLimit,
            "--network=none",
            "--ulimit", "nofile=64:64",   // limit file descriptors
            "--ulimit", "nproc=64:64",    // limit process count (prevents fork bombs)
            "-e", "CODE=" + encodedCode,
            image
        );

        pb.redirectErrorStream(false); // keep stdout and stderr separate
        Process process = pb.start();

        // If the program reads stdin (e.g. input()), write it to the process
        if (stdin != null && !stdin.isBlank()) {
            try (OutputStream os = process.getOutputStream()) {
                os.write(stdin.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }
        }

        // Use a thread pool with timeout to kill runaway processes
        ExecutorService executor = Executors.newFixedThreadPool(2);

        // Read stdout on a background thread (prevents blocking if output is large)
        Future<String> stdoutFuture = executor.submit(() ->
            new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
        );

        // Read stderr on another background thread
        Future<String> stderrFuture = executor.submit(() ->
            new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8)
        );

        // Wait for the process — but kill it if it runs too long
        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

        if (!finished) {
            // TIMEOUT — forcibly terminate the Docker container
            process.destroyForcibly();
            executor.shutdownNow();
            long elapsed = System.currentTimeMillis() - startTime;
            return ExecuteResponse.builder()
                .stdout("")
                .stderr("Execution timed out after " + timeoutSeconds + " seconds.")
                .status("ERROR")
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

    // Maps language name to Docker image name
    private String resolveImage(String language) {
        return switch (language.toLowerCase()) {
            case "python" -> IMAGE_PYTHON;
            case "java"   -> IMAGE_JAVA;
            case "cpp"    -> IMAGE_CPP;
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }
}
