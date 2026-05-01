package com.smartcloud.repository;

import com.smartcloud.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

// SubmissionRepository — data access layer for the submissions table
//
// Custom queries use Spring Data's method naming convention OR
// @Query with JPQL (Java Persistence Query Language — like SQL but uses class names)

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // Fetch all submissions for a user, newest first
    // → SELECT * FROM submissions WHERE user_id = ? ORDER BY created_at DESC
    List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Fetch a specific submission — but only if it belongs to the requesting user
    // (prevents users from viewing each other's code by guessing submission IDs)
    Optional<Submission> findByIdAndUserId(Long id, Long userId);

    // Count how many times a user has submitted code (for analytics)
    long countByUserId(Long userId);

    // JPQL query: fetch only submissions where stderr is not null/empty
    // Used for AI explain history — only show sessions that had errors
    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId AND s.stderr IS NOT NULL ORDER BY s.createdAt DESC")
    List<Submission> findErrorSubmissionsByUserId(Long userId);
}
