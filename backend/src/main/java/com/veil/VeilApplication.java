package com.veil;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class VeilApplication {

    public static void main(String[] args) {
        SpringApplication.run(VeilApplication.class, args);
    }
}
