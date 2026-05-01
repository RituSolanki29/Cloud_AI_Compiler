package com.smartcloud.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

// AIService — integrates with OpenAI API for two features:
//   1. explainError()  — explains what went wrong in plain English + suggests a fix
//   2. analyzeCode()   — analyzes time/space complexity and suggests optimizations
//
// Architecture note:
//   This service is called from the Spring Boot backend.
//   In the full architecture, these calls can be offloaded to AWS Lambda
//   to prevent blocking the main execution thread (since OpenAI can take 2–5s)

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    @Value("${openai.api.key}")
    private String openAiKey;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;

    @Value("${openai.api.url}")
    private String openAiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // explainError — helps students understand what their error means
    // Sends the code + error message to OpenAI and gets a plain-English explanation
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

    // analyzeCode — helps students understand their code's efficiency
    // Returns: Big-O time complexity, space complexity, and optimization suggestions
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

    // callOpenAI — makes the actual HTTP POST request to OpenAI's chat completions API
    // OpenAI API format: https://platform.openai.com/docs/api-reference/chat
    private String callOpenAI(String userMessage) {
        try {
            // Build the request headers (API key auth)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey); // Authorization: Bearer sk-...

            // Build the request body
            // messages: array of role/content pairs — we send a single user message
            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("max_tokens", 1000);
            body.put("messages", List.of(
                Map.of("role", "user", "content", userMessage)
            ));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // Make the POST request
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(openAiUrl, entity, Map.class);

            // Parse the response: response.choices[0].message.content
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

        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            return "AI service is temporarily unavailable. Please try again later.";
        }
    }
}
