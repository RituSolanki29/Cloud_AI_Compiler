package com.smartcloud.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartcloud.model.Submission;
import com.smartcloud.model.User;
import com.smartcloud.repository.SubmissionRepository;
import com.smartcloud.repository.UserRepository;
import com.smartcloud.security.JwtUtil;
import com.smartcloud.service.CodeExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
@Slf4j
@RequiredArgsConstructor
public class ExecutionWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final CodeExecutionService codeExecutionService;
    private final SubmissionRepository submissionRepository;

    private final Map<String, ProcessSession> sessions = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    private static class ProcessSession {
        Process process;
        OutputStream outputStream;
        User user;
        String language;
        String code;
        long startTime;
        StringBuilder fullOutput = new StringBuilder();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        JsonNode jsonNode = objectMapper.readTree(payload);
        String type = jsonNode.path("type").asText();

        if ("init".equals(type)) {
            handleInit(session, jsonNode);
        } else if ("input".equals(type)) {
            handleInput(session, jsonNode);
        }
    }

    private void handleInit(WebSocketSession session, JsonNode jsonNode) throws Exception {
        String token = jsonNode.path("token").asText();
        String language = jsonNode.path("language").asText();
        String code = jsonNode.path("code").asText();

        // 1. Authenticate
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            sendError(session, "Invalid token");
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            sendError(session, "User not found");
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        // 2. Prepare Docker process
        String encodedCode = Base64.getEncoder().encodeToString(code.getBytes(StandardCharsets.UTF_8));
        String dockerImage;
        try {
            dockerImage = codeExecutionService.resolveImage(language);
        } catch (IllegalArgumentException e) {
            sendError(session, e.getMessage());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        ProcessBuilder pb = codeExecutionService.createDockerProcess(dockerImage, encodedCode);
        pb.redirectErrorStream(true); // merge stderr and stdout
        Process process = pb.start();

        // 3. Store session
        ProcessSession ps = new ProcessSession();
        ps.process = process;
        ps.outputStream = process.getOutputStream();
        ps.user = user;
        ps.language = language;
        ps.code = code;
        ps.startTime = System.currentTimeMillis();
        sessions.put(session.getId(), ps);

        // 4. Start reading stream
        executorService.submit(() -> readProcessStream(session, process.getInputStream(), ps));
    }

    private void handleInput(WebSocketSession session, JsonNode jsonNode) throws Exception {
        ProcessSession ps = sessions.get(session.getId());
        if (ps == null || ps.process == null || !ps.process.isAlive()) {
            return;
        }

        String inputData = jsonNode.path("data").asText();
        if (inputData != null) {
            // Echo input back to fullOutput so it's saved in DB
            ps.fullOutput.append(inputData).append("\n");
            try {
                ps.outputStream.write((inputData + "\n").getBytes(StandardCharsets.UTF_8));
                ps.outputStream.flush();
            } catch (IOException e) {
                log.error("Error writing input to process", e);
            }
        }
    }

    private void readProcessStream(WebSocketSession session, InputStream inputStream, ProcessSession ps) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            char[] buffer = new char[1024];
            int read;
            while ((read = reader.read(buffer)) != -1) {
                String chunk = new String(buffer, 0, read);
                ps.fullOutput.append(chunk);
                if (session.isOpen()) {
                    ObjectNode msg = objectMapper.createObjectNode();
                    msg.put("type", "stdout");
                    msg.put("data", chunk);
                    session.sendMessage(new TextMessage(msg.toString()));
                }
            }

            int exitCode = ps.process.waitFor();
            long elapsed = System.currentTimeMillis() - ps.startTime;
            
            if (session.isOpen()) {
                ObjectNode finishMsg = objectMapper.createObjectNode();
                finishMsg.put("type", "status");
                finishMsg.put("status", exitCode == 0 ? "SUCCESS" : "ERROR");
                finishMsg.put("executionTime", elapsed);
                session.sendMessage(new TextMessage(finishMsg.toString()));
                session.close(CloseStatus.NORMAL);
            }

            // Save submission
            saveSubmission(ps, exitCode == 0);

        } catch (Exception e) {
            log.error("Error reading process stream", e);
            saveSubmission(ps, false);
        }
    }

    private void saveSubmission(ProcessSession ps, boolean success) {
        try {
            Submission submission = Submission.builder()
                    .user(ps.user)
                    .language(ps.language)
                    .code(ps.code)
                    .input("[Interactive Session]")
                    .stdout(ps.fullOutput.toString())
                    .stderr("")
                    .status(success ? Submission.ExecutionStatus.SUCCESS : Submission.ExecutionStatus.ERROR)
                    .executionTime(System.currentTimeMillis() - ps.startTime)
                    .build();
            submissionRepository.save(submission);
        } catch (Exception e) {
            log.error("Failed to save interactive submission", e);
        }
    }

    private void sendError(WebSocketSession session, String errorMsg) throws IOException {
        ObjectNode err = objectMapper.createObjectNode();
        err.put("type", "status");
        err.put("status", "ERROR");
        err.put("data", errorMsg);
        session.sendMessage(new TextMessage(err.toString()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        ProcessSession ps = sessions.remove(session.getId());
        if (ps != null && ps.process != null && ps.process.isAlive()) {
            ps.process.destroyForcibly();
        }
    }
}
