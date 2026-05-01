package com.smartcloud.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

// @Entity — maps this Java class to a PostgreSQL table called "users"
// Every field becomes a column in that table
// Spring Data JPA handles all the SQL automatically

@Entity
@Table(name = "users",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),  // no duplicate usernames
        @UniqueConstraint(columnNames = "email")      // no duplicate emails
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    // @Id = primary key
    // @GeneratedValue = auto-increment (PostgreSQL uses SEQUENCE strategy)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String username;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    // Stored as BCrypt hash — never the raw password
    @NotBlank
    @Column(nullable = false)
    private String password;

    // Role-based access: USER or ADMIN
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    // @CreationTimestamp equivalent — set once when record is first saved
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // One user can have many submissions (one-to-many relationship)
    // mappedBy = "user" refers to the 'user' field inside Submission
    // cascade = ALL means if user is deleted, their submissions are deleted too
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Submission> submissions;

    // @PrePersist runs automatically before the first database INSERT
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Role {
        USER, ADMIN
    }
}
