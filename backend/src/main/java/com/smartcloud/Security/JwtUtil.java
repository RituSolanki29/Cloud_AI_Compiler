package com.smartcloud.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

// JwtUtil — handles all JWT token operations
//
// JWT (JSON Web Token) is how we authenticate API requests:
//   1. User logs in → we generate a signed token → send to frontend
//   2. Frontend stores token in localStorage
//   3. Every API request includes token in Authorization header
//   4. JwtFilter (below) validates the token on each request
//
// Token structure: header.payload.signature
//   payload contains: username, issued-at, expiration

@Component
public class JwtUtil {

    // Secret key from application.properties — used to sign and verify tokens
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // Convert the string secret into a cryptographic signing key
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // Generate a JWT token for a logged-in user
    // The token embeds the username as the "subject" claim
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    // Extract the username (subject) from a token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Check if a token is valid: username matches AND token is not expired
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    // Generic claim extractor — uses a function reference to pull any claim from the token
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claimsResolver.apply(claims);
    }
}
