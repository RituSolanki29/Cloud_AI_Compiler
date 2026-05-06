package com.smartcloud.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

// JwtAuthFilter — intercepts every HTTP request before it reaches any controller
//
// Flow for each request:
//   1. Read the Authorization header: "Bearer eyJhbGc..."
//   2. Extract the username from the JWT token
//   3. Load the user from DB
//   4. Validate the token
//   5. If valid → set the user as authenticated in SecurityContext
//   6. Continue to the controller
//
// If no token / invalid token → SecurityContext stays empty
// → Spring Security will reject the request with 401 if the route is protected

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // If no Authorization header or doesn't start with "Bearer ", skip this filter
        // (public routes like /api/auth/login will have no token)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Strip "Bearer " prefix to get the raw token string
        final String jwt = authHeader.substring(7);
        final String username;

        try {
            username = jwtUtil.extractUsername(jwt);
        } catch (Exception e) {
            // Token is malformed or tampered — reject silently, controller will handle 401
            filterChain.doFilter(request, response);
            return;
        }

        // Only proceed if username extracted and user not already authenticated
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                // Create an authentication token and register it in the security context
                // This is what makes Spring consider the request "authenticated"
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,               // no credentials needed (we have JWT)
                        userDetails.getAuthorities()
                    );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
