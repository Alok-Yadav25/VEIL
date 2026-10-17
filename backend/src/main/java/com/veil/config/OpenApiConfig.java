package com.veil.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI veilOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("VEIL — Secure Digital Steganography Platform API")
                        .description("REST API for authenticated AES-256-GCM encryption, pixel-level LSB steganography, capacity analysis, and local operation history.")
                        .version("1.0.0")
                        .contact(new Contact().name("VEIL Security Engineering Team"))
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
