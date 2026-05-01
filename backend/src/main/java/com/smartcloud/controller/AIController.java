package com.smartcloud.controller;

import com.smartcloud.dto.Dto.*;
import com.smartcloud.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// AIController — handles AI-powered features via OpenAI API
//
// Routes:
//   POST /api/ai/explain  → explain a code error in plain English
//   POST /api/ai/analyze  → analyze code complexity and suggest optimizations
//
// PROTECTED — requires valid JWT token
// Both endpoints call AIService which makes the actual OpenAI API call

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    // POST /api/ai/explain
    // Receives: language, code, and the error message
    // Returns: AI-generated plain-English explanation of the error + fix suggestions
    // Example output: "The error 'IndexError: list index out of range' means you
    //                  tried to access index 5 of a list that only has 3 items..."
    @PostMapping("/explain")
    public ResponseEntity<AIResponse> explainError(@RequestBody ExplainRequest request) {
        String explanation = aiService.explainError(
            request.getLanguage(),
            request.getCode(),
            request.getError()
        );
        return ResponseEntity.ok(AIResponse.builder().explanation(explanation).build());
    }

    // POST /api/ai/analyze
    // Receives: language and code
    // Returns: time complexity (Big-O), space complexity, and optimization suggestions
    // Example output: "Your solution has O(n²) time complexity due to the nested loop.
    //                  You can optimize this to O(n) using a HashMap..."
    @PostMapping("/analyze")
    public ResponseEntity<AIResponse> analyzeCode(@RequestBody AnalyzeRequest request) {
        String analysis = aiService.analyzeCode(
            request.getLanguage(),
            request.getCode()
        );
        return ResponseEntity.ok(AIResponse.builder().analysis(analysis).build());
    }
}
