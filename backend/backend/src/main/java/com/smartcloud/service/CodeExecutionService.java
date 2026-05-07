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
 
    private static final String IMAGE_PYTHON = "smartcloud-runner-python";
    private static final String IMAGE_JAVA   = "smartcloud-runner-java";
    private static final String IMAGE_CPP    = "smartcloud-runner-cpp";
 
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
 
        // -i flag keeps stdin open so the container can read from it
        ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", "--rm", "-i",
                "--memory=" + memoryLimit,
                "--cpus=" + cpuLimit,
                "--network=none",
                "--ulimit", "nofile=64:64",
                "--ulimit", "nproc=64:64",
                "-e", "CODE=" + encodedCode,
                image);
 
        pb.redirectErrorStream(false);
        Process process = pb.start();
 
        // Write stdin in a separate thread BEFORE reading stdout/stderr
        // to avoid deadlock (process blocks waiting for input,
        // while we block waiting for output)
        ExecutorService executor = Executors.newFixedThreadPool(3);
 
        executor.submit(() -> {
            try (OutputStream os = process.getOutputStream()) {
                if (stdin != null && !stdin.isBlank()) {
                    os.write(stdin.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }
                // Always close stdin so the process knows input is done
            } catch (IOException e) {
                log.warn("Failed to write stdin: {}", e.getMessage());
            }
        });
 
        Future<String> stdoutFuture = executor
                .submit(() -> new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
 
        Future<String> stderrFuture = executor
                .submit(() -> new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8));
 
        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
 
        if (!finished) {
            process.destroyForcibly();
            executor.shutdownNow();
            return ExecuteResponse.builder()
                    .stdout("")
                    .stderr("Execution timed out after " + timeoutSeconds + " seconds.")
                    .status("TIMEOUT")
                    .executionTime(System.currentTimeMillis() - startTime)
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
            case "java"   -> IMAGE_JAVA;
            case "cpp"    -> IMAGE_CPP;
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }
}
 