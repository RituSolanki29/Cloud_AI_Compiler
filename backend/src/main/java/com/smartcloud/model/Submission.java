package com.smartcloud.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// Submission — represents one code execution attempt
// Each row stores: who ran it, what code, what language, what output came back
// This is what populates the History page in the frontend

@Entity
@Table(name = "submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many-to-one: many submissions belong to one user
    // @JoinColumn creates a foreign key column 'user_id' in the submissions table
    // LAZY = don't load the user object from DB unless explicitly accessed (performance)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Which language was used: python, java, cpp
    @Column(nullable = false)
    private String language;

    // The actual source code the user wrote
    // @Lob = Large OBject — stores as TEXT in PostgreSQL (unlimited length)
    @Lob
    @Column(nullable = false)
    private String code;

    // Optional stdin input the user provided
    @Lob
    private String input;

    // Everything the program printed to stdout
    @Lob
    private String stdout;

    // Error messages (compiler errors, runtime exceptions)
    @Lob
    private String stderr;

    // SUCCESS or ERROR — shown as ✅ / ❌ on History cards
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExecutionStatus status;

    // How long the Docker container ran (milliseconds)
    private Long executionTime;

    // S3 key where we stored the full output log (for large outputs)
    private String s3LogKey;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum ExecutionStatus {
        SUCCESS, ERROR, TIMEOUT
    }
}
