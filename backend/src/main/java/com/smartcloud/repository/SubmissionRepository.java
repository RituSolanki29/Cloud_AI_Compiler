package com.smartcloud.repository;

import com.smartcloud.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // FIX: These method signatures were missing — referenced in HistoryService but
    // never declared
    // Spring Data JPA auto-implements them from the method name pattern
    List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Submission> findByIdAndUserId(Long id, Long userId);

    // Count submissions per user (useful for dashboard stats)
    long countByUserId(Long userId);
}