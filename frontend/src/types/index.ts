export type OperationType =
  | 'ENCODE_TEXT'
  | 'ENCODE_FILE'
  | 'EXTRACT_PAYLOAD'
  | 'ANALYZE_IMAGE'
  | 'COMPARE_IMAGES';

export type PayloadType = 'TEXT' | 'FILE' | 'UNKNOWN';

export type OperationStatus = 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';

export interface DiffMetrics {
  width: number;
  height: number;
  totalPixels: number;
  modifiedPixels: number;
  modifiedPercentage: number;
  mse: number;
  psnrDb: number;
  maxChannelDifference: number;
  diffMaskBase64: string;
}

export interface CapacityEvaluation {
  width: number;
  height: number;
  pixelCount: number;
  availableChannels: number;
  rawCapacityBytes: number;
  envelopeOverheadBytes: number;
  usableCapacityBytes: number;
  payloadBytes: number;
  estimatedTotalRequiredBytes: number;
  remainingBytes: number;
  utilizationPercentage: number;
  status: 'SUFFICIENT' | 'NEAR_CAPACITY' | 'INSUFFICIENT';
}

export interface PreflightCheckItem {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PreflightReport {
  readyToEncode: boolean;
  checks: PreflightCheckItem[];
  evaluation: CapacityEvaluation;
}

export interface AnalyzeResponse {
  filename: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  pixelCount: number;
  detectedFormat: string;
  colorModel: string;
  hasAlphaChannel: boolean;
  colorDepthBits: number;
  rawCapacityBytes: number;
  usableCapacityBytes: number;
  samplePayloadBytes: number;
  estimatedTotalRequiredBytes: number;
  utilizationPercentage: number;
  capacityStatus: 'SUFFICIENT' | 'NEAR_CAPACITY' | 'INSUFFICIENT';
  preflightReport: PreflightReport;
}

export interface ImageInspectionReport {
  filename: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  pixelCount: number;
  detectedFormat: string;
  colorModel: string;
  hasAlphaChannel: boolean;
  colorDepthBits: number;
  supportedEmbeddingMethod: string;
  rawCapacityBytes: number;
  usableCapacityBytes: number;
  formatLimitations: string;
}

export interface EncodeResponse {
  operationId: string;
  encodedImageBase64: string;
  outputFilename: string;
  width: number;
  height: number;
  originalFileSizeBytes: number;
  outputFileSizeBytes: number;
  payloadBytes: number;
  encryptedPayloadBytes: number;
  carrierCapacityBytes: number;
  capacityUtilizationPercentage: number;
  diffMetrics: DiffMetrics;
  recoverabilityVerified: boolean;
  encryptionAlgorithm: string;
  keyDerivationAlgorithm: string;
  pbkdf2Iterations: number;
}

export interface ExtractResponse {
  operationId: string;
  payloadType: 'TEXT' | 'FILE';
  recoveredText?: string;
  recoveredFileBase64?: string;
  originalFilename?: string;
  sanitizedFilename?: string;
  recoveredSizeBytes: number;
  sha256Checksum?: string;
  authenticationPassed: boolean;
  envelopeVersion: number;
  encryptionAlgorithm: string;
  keyDerivationAlgorithm: string;
}

export interface CompareResponse {
  metrics: DiffMetrics;
  verdict: string;
  explanation: string;
}

export interface SecurityInfoResponse {
  cipher: string;
  keyDerivation: string;
  pbkdf2Iterations: number;
  keyLengthBits: number;
  saltLengthBytes: number;
  nonceLengthBytes: number;
  authTagLengthBits: number;
  steganographyMethod: string;
  carrierTraversal: string;
  supportedFormats: string[];
  localOnlyProcessing: boolean;
  threatModelDisclosures: Record<string, string>;
  securityGuarantees: string[];
}

export interface OperationRecord {
  id: string;
  operationType: OperationType;
  payloadType?: PayloadType;
  inputFilename?: string;
  outputFilename?: string;
  createdAt: string;
  completedAt?: string;
  status: OperationStatus;
  inputImageWidth?: number;
  inputImageHeight?: number;
  payloadSizeBytes?: number;
  encryptedPayloadSizeBytes?: number;
  estimatedCapacityBytes?: number;
  formatVersion?: number;
  failureCategory?: string;
}

export interface HistoryListResponse {
  items: OperationRecord[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: Record<string, string>;
}
