package com.smartcloud.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class AIService {

    @Value("${openai.api.key}")
    private String openAiKey;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;

    @Value("${openai.api.url}")
    private String openAiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String explainError(String language, String code, String error) {
        String prompt = String.format("""
                You are an expert %s programmer helping a student debug their code.

                Here is the code that was submitted:
                ```%s
                %s
                ```

                The following error occurred:
                ```
                %s
                ```

                Please:
                1. Explain what this error means in simple, beginner-friendly terms
                2. Point to the exact line or part of the code causing the issue
                3. Show a corrected version of the problematic section
                4. Give a brief tip to prevent this error in the future

                Keep the response clear and structured.
                """, language, language, code, error);

        return callOpenAI(prompt);
    }

    public String analyzeCode(String language, String code) {
        String prompt = String.format("""
                You are an expert %s programmer performing a code review.

                Here is the code to analyze:
                ```%s
                %s
                ```

                Please provide:
                1. **Time Complexity**: State the Big-O notation and explain why
                2. **Space Complexity**: State the Big-O notation and explain why
                3. **Code Quality**: Note any anti-patterns, potential bugs, or style issues
                4. **Optimization**: If possible, suggest a more efficient approach with example code
                5. **Best Practices**: Any %s-specific best practices the code should follow

                Be specific and educational.
                """, language, language, code, language);

        return callOpenAI(prompt);
    }

    // Called once after Spring injects the @Value fields — catches missing/blank key early
    @jakarta.annotation.PostConstruct
    private void validateConfig() {
        if (openAiKey == null || openAiKey.isBlank()) {
            log.error("⚠️  openai.api.key is not set! AI features will not work. " +
                      "Set it in application.properties or via the OPENAI_API_KEY env variable.");
        } else {
            log.info("✅ OpenAI key loaded (model: {})", model);
        }
    }

    private String callOpenAI(String userMessage) {
        // Guard: fail fast with a clear message instead of a cryptic auth error
        if (openAiKey == null || openAiKey.isBlank()) {
            return "AI service is not configured. Please set the OpenAI API key in application.properties " +
                   "(openai.api.key=sk-...) or via the OPENAI_API_KEY environment variable.";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("max_tokens", 1000);
            body.put("messages", List.of(
                    Map.of("role", "user", "content", userMessage)));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(openAiUrl, entity, Map.class);

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }

            return "AI service returned an unexpected response. Please try again.";

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Catches 401 Unauthorized (bad key), 429 Too Many Requests (quota), 400 bad model, etc.
            log.error("OpenAI API HTTP error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 401) {
                return "AI service error: Invalid API key. Please check your openai.api.key in application.properties.";
            } else if (e.getStatusCode().value() == 429) {
                return "AI service error: OpenAI rate limit or quota exceeded. Please check your billing at platform.openai.com.";
            }
            return "AI service error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString();
        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            return "AI service is temporarily unavailable. Please try again later.";
        }
    }
}