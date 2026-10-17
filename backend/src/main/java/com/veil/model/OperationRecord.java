package com.veil.model;

import java.time.Instant;

public class OperationRecord {

    private String id;
    private OperationType operationType;
    private PayloadTypeEnum payloadType;
    private String inputFilename;
    private String outputFilename;
    private String createdAt;
    private String completedAt;
    private OperationStatus status;
    private Integer inputImageWidth;
    private Integer inputImageHeight;
    private Long payloadSizeBytes;
    private Long encryptedPayloadSizeBytes;
    private Long estimatedCapacityBytes;
    private Integer formatVersion;
    private String failureCategory;

    public OperationRecord() {
    }

    public OperationRecord(
            String id,
            OperationType operationType,
            PayloadTypeEnum payloadType,
            String inputFilename,
            String outputFilename,
            String createdAt,
            String completedAt,
            OperationStatus status,
            Integer inputImageWidth,
            Integer inputImageHeight,
            Long payloadSizeBytes,
            Long encryptedPayloadSizeBytes,
            Long estimatedCapacityBytes,
            Integer formatVersion,
            String failureCategory
    ) {
        this.id = id;
        this.operationType = operationType;
        this.payloadType = payloadType;
        this.inputFilename = inputFilename;
        this.outputFilename = outputFilename;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
        this.status = status;
        this.inputImageWidth = inputImageWidth;
        this.inputImageHeight = inputImageHeight;
        this.payloadSizeBytes = payloadSizeBytes;
        this.encryptedPayloadSizeBytes = encryptedPayloadSizeBytes;
        this.estimatedCapacityBytes = estimatedCapacityBytes;
        this.formatVersion = formatVersion;
        this.failureCategory = failureCategory;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public OperationType getOperationType() { return operationType; }
    public void setOperationType(OperationType operationType) { this.operationType = operationType; }

    public PayloadTypeEnum getPayloadType() { return payloadType; }
    public void setPayloadType(PayloadTypeEnum payloadType) { this.payloadType = payloadType; }

    public String getInputFilename() { return inputFilename; }
    public void setInputFilename(String inputFilename) { this.inputFilename = inputFilename; }

    public String getOutputFilename() { return outputFilename; }
    public void setOutputFilename(String outputFilename) { this.outputFilename = outputFilename; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public OperationStatus getStatus() { return status; }
    public void setStatus(OperationStatus status) { this.status = status; }

    public Integer getInputImageWidth() { return inputImageWidth; }
    public void setInputImageWidth(Integer inputImageWidth) { this.inputImageWidth = inputImageWidth; }

    public Integer getInputImageHeight() { return inputImageHeight; }
    public void setInputImageHeight(Integer inputImageHeight) { this.inputImageHeight = inputImageHeight; }

    public Long getPayloadSizeBytes() { return payloadSizeBytes; }
    public void setPayloadSizeBytes(Long payloadSizeBytes) { this.payloadSizeBytes = payloadSizeBytes; }

    public Long getEncryptedPayloadSizeBytes() { return encryptedPayloadSizeBytes; }
    public void setEncryptedPayloadSizeBytes(Long encryptedPayloadSizeBytes) { this.encryptedPayloadSizeBytes = encryptedPayloadSizeBytes; }

    public Long getEstimatedCapacityBytes() { return estimatedCapacityBytes; }
    public void setEstimatedCapacityBytes(Long estimatedCapacityBytes) { this.estimatedCapacityBytes = estimatedCapacityBytes; }

    public Integer getFormatVersion() { return formatVersion; }
    public void setFormatVersion(Integer formatVersion) { this.formatVersion = formatVersion; }

    public String getFailureCategory() { return failureCategory; }
    public void setFailureCategory(String failureCategory) { this.failureCategory = failureCategory; }
}
