package com.smartselect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync          // enables CompletableFuture parallel calls
@EnableScheduling
public class SmartSelectBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartSelectBackendApplication.class, args);
    }

}
