package com.smartcloud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan
// This tells Spring Boot to:
//   1. Scan the entire com.smartcloud package for beans (controllers, services, repos)
//   2. Auto-configure databases, security, and other features based on classpath
//   3. Register all @Bean definitions
@SpringBootApplication
public class SmartCloudApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCloudApplication.class, args);
    }
}
