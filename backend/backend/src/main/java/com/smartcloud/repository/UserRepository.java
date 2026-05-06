package com.smartcloud.repository;

import com.smartcloud.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

// UserRepository — the data access layer for the users table
//
// By extending JpaRepository<User, Long>, Spring automatically generates:
//   save(user), findById(id), findAll(), deleteById(id), count(), etc.
// We only need to define custom queries that aren't provided by default.
//
// Spring Data JPA reads method names and generates the SQL automatically:
//   findByUsername → SELECT * FROM users WHERE username = ?
//   existsByEmail  → SELECT COUNT(*) > 0 FROM users WHERE email = ?

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Used during login: load user by username to verify password
    Optional<User> findByUsername(String username);

    // Used during JWT token validation: load user by username from token claims
    Optional<User> findByEmail(String email);

    // Used during registration: reject duplicate usernames before saving
    boolean existsByUsername(String username);

    // Used during registration: reject duplicate emails before saving
    boolean existsByEmail(String email);
}
