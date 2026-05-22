package com.smartcloud.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;
    private final ObjectMapper objectMapper;

    @Value("${aws.s3.bucket:smartcloud-outputs}")
    private String bucketName;

    /**
     * Uploads the execution logs (stdout and stderr) to AWS S3 as a structured JSON object.
     * Returns the S3 key of the uploaded log object.
     */
    public String uploadLogs(Long userId, Long submissionId, String stdout, String stderr) {
        String key = String.format("submissions/user-%d/submission-%d.json", userId, submissionId);
        try {
            ObjectNode logNode = objectMapper.createObjectNode();
            logNode.put("stdout", stdout != null ? stdout : "");
            logNode.put("stderr", stderr != null ? stderr : "");
            String jsonContent = objectMapper.writeValueAsString(logNode);

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType("application/json")
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromString(jsonContent, StandardCharsets.UTF_8));
            log.info("Successfully uploaded logs to S3: {}", key);
            return key;
        } catch (Exception e) {
            log.error("Failed to upload logs to S3 for submissionId: {}", submissionId, e);
            return null; // Return null to allow safe fallback or failure handling
        }
    }

    /**
     * Retrieves the logs from S3 and parses stdout/stderr.
     * Returns an array of two elements: [stdout, stderr].
     */
    public String[] getLogs(String s3LogKey) {
        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3LogKey)
                    .build();

            byte[] bytes = s3Client.getObject(getRequest).readAllBytes();
            String jsonContent = new String(bytes, StandardCharsets.UTF_8);
            ObjectNode logNode = (ObjectNode) objectMapper.readTree(jsonContent);
            
            String stdout = logNode.has("stdout") ? logNode.get("stdout").asText() : "";
            String stderr = logNode.has("stderr") ? logNode.get("stderr").asText() : "";
            return new String[]{stdout, stderr};
        } catch (Exception e) {
            log.error("Failed to retrieve logs from S3 for key: {}", s3LogKey, e);
            return new String[]{"", "Failed to retrieve logs from S3: " + e.getMessage()};
        }
    }

    /**
     * Deletes the logs from S3.
     */
    public void deleteLogs(String s3LogKey) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3LogKey)
                    .build();
            s3Client.deleteObject(deleteRequest);
            log.info("Successfully deleted logs from S3 for key: {}", s3LogKey);
        } catch (Exception e) {
            log.error("Failed to delete logs from S3 for key: {}", s3LogKey, e);
        }
    }
}
