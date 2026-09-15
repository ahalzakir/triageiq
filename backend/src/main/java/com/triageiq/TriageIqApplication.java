package com.triageiq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TriageIqApplication {

    public static void main(String[] args) {
        SpringApplication.run(TriageIqApplication.class, args);
    }
}
