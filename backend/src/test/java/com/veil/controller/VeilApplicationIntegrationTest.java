package com.veil.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class VeilApplicationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private byte[] createTestPngBytes(int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(25, 50, 75));
        g.fillRect(0, 0, width, height);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Health endpoint returns 200 OK with UP status")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("VEIL Steganography Platform"));
    }

    @Test
    @DisplayName("Security Info endpoint returns cryptographic and steganographic specifications")
    void testSecurityInfoEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/security/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cipher").value("AES-256-GCM (Authenticated Encryption with Associated Data)"))
                .andExpect(jsonPath("$.keyDerivation").value("PBKDF2-HMAC-SHA-256"))
                .andExpect(jsonPath("$.localOnlyProcessing").value(true));
    }

    @Test
    @DisplayName("End-to-end Encode and Extract workflow via REST API")
    void testEndToEndEncodeAndExtractFlow() throws Exception {
        byte[] carrierBytes = createTestPngBytes(80, 80);
        MockMultipartFile carrierFile = new MockMultipartFile(
                "image",
                "carrier.png",
                "image/png",
                carrierBytes
        );

        String secretText = "Antigravity Secure Stealth Payload 2026!";
        String password = "StrongUserPassword#1";

        // 1. Encode text into carrier image
        MvcResult encodeResult = mockMvc.perform(multipart("/api/v1/steganography/encode/text")
                        .file(carrierFile)
                        .param("message", secretText)
                        .param("password", password))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recoverabilityVerified").value(true))
                .andExpect(jsonPath("$.encodedImageBase64").isNotEmpty())
                .andReturn();

        JsonNode encodeNode = objectMapper.readTree(encodeResult.getResponse().getContentAsString());
        String encodedBase64 = encodeNode.get("encodedImageBase64").asText();
        // Remove data URL prefix
        String base64Data = encodedBase64.substring(encodedBase64.indexOf(",") + 1);
        byte[] encodedImageBytes = Base64.getDecoder().decode(base64Data);

        // 2. Extract with correct password -> verify 200 OK and recovered text
        MockMultipartFile stegoFile = new MockMultipartFile(
                "image",
                "stego.png",
                "image/png",
                encodedImageBytes
        );

        mockMvc.perform(multipart("/api/v1/steganography/extract")
                        .file(stegoFile)
                        .param("password", password))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticationPassed").value(true))
                .andExpect(jsonPath("$.recoveredText").value(secretText));

        // 3. Extract with wrong password -> verify 400 Bad Request
        mockMvc.perform(multipart("/api/v1/steganography/extract")
                        .file(stegoFile)
                        .param("password", "IncorrectPassword!"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("AUTHENTICATION_FAILED"));

        // 4. Check that operation history recorded the events without storing secret messages
        MvcResult historyResult = mockMvc.perform(get("/api/v1/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andReturn();

        String historyJson = historyResult.getResponse().getContentAsString();
        assertFalse(historyJson.contains(secretText), "Operation history must never store plaintext secrets!");
        assertFalse(historyJson.contains(password), "Operation history must never store plaintext passwords!");
    }
}
