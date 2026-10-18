package com.veil.controller;

import com.veil.service.SteganalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/steganalysis")
@Tag(name = "Steganalysis", description = "Statistical analysis, Pairs of Values (PoV) Chi-Square detection, and anomaly assessment")
public class SteganalysisController {

    private final SteganalysisService steganalysisService;

    public SteganalysisController(SteganalysisService steganalysisService) {
        this.steganalysisService = steganalysisService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Perform statistical steganalysis and Chi-Square anomaly evaluation on an image")
    public ResponseEntity<SteganalysisService.SteganalysisResult> analyzeImage(
            @RequestPart("image") MultipartFile imageFile
    ) throws IOException {
        SteganalysisService.SteganalysisResult result = steganalysisService.analyze(
                imageFile.getBytes(),
                imageFile.getOriginalFilename()
        );
        return ResponseEntity.ok(result);
    }
}
