import {
  AnalyzeResponse,
  CompareResponse,
  EncodeResponse,
  ExtractResponse,
  HealthResponse,
  HistoryListResponse,
  ImageInspectionReport,
  SecurityInfoResponse,
  OperationRecord,
  SteganalysisResponse,
  BinaryEncodeResult,
  DualEncodeResponse,
  SplitResult,
  CombineResult,
  ProvenanceManifest,
  ProvenanceVerificationResult,
  ProvenanceKeyPair,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

export class ApiError extends Error {
  status: number;
  errorCode: string;
  details?: Record<string, unknown>;

  constructor(status: number, errorCode: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errJson: any;
    try {
      errJson = await res.json();
    } catch {
      throw new ApiError(res.status, 'UNKNOWN_ERROR', `Request failed with status ${res.status}`);
    }
    throw new ApiError(
      res.status,
      errJson.errorCode || 'API_ERROR',
      errJson.message || 'An error occurred during processing',
      errJson.details
    );
  }
  return res.json() as Promise<T>;
}

export const api = {
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getSecurityInfo(): Promise<SecurityInfoResponse> {
    const res = await fetch(`${API_BASE}/security/info`);
    return handleResponse<SecurityInfoResponse>(res);
  },

  async analyzeImage(imageFile: File, samplePayloadBytes: number = 1024): Promise<AnalyzeResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('samplePayloadBytes', samplePayloadBytes.toString());

    const res = await fetch(`${API_BASE}/images/analyze`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<AnalyzeResponse>(res);
  },

  async inspectImage(imageFile: File): Promise<ImageInspectionReport> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${API_BASE}/images/inspect`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ImageInspectionReport>(res);
  },

  async encodeText(
    imageFile: File,
    message: string,
    password: string,
    strategyCode: number = 2,
    fecMode: number = 1
  ): Promise<EncodeResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('message', message);
    formData.append('password', password);
    formData.append('strategyCode', strategyCode.toString());
    formData.append('fecMode', fecMode.toString());

    const res = await fetch(`${API_BASE}/steganography/encode/text`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<EncodeResponse>(res);
  },

  async encodeTextBinary(
    imageFile: File,
    message: string,
    password: string,
    strategyCode: number = 2,
    fecMode: number = 1
  ): Promise<BinaryEncodeResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('message', message);
    formData.append('password', password);
    formData.append('strategyCode', strategyCode.toString());
    formData.append('fecMode', fecMode.toString());

    const res = await fetch(`${API_BASE}/steganography/encode/text/binary`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let errJson: any;
      try { errJson = await res.json(); } catch {
        throw new ApiError(res.status, 'UNKNOWN_ERROR', `Request failed with status ${res.status}`);
      }
      throw new ApiError(res.status, errJson.errorCode || 'API_ERROR', errJson.message || 'Encoding failed');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    const outputFilename = filenameMatch ? filenameMatch[1] : 'veil_encoded.png';

    return {
      blob,
      outputFilename,
      operationId: res.headers.get('X-Veil-Operation-Id') || '',
      width: parseInt(res.headers.get('X-Veil-Width') || '0', 10),
      height: parseInt(res.headers.get('X-Veil-Height') || '0', 10),
      payloadBytes: parseInt(res.headers.get('X-Veil-Payload-Bytes') || '0', 10),
      encryptedBytes: parseInt(res.headers.get('X-Veil-Encrypted-Bytes') || '0', 10),
      carrierCapacityBytes: parseInt(res.headers.get('X-Veil-Carrier-Capacity-Bytes') || '0', 10),
      utilizationPercent: parseFloat(res.headers.get('X-Veil-Utilization-Percent') || '0'),
      psnr: parseFloat(res.headers.get('X-Veil-PSNR') || '0'),
      mse: parseFloat(res.headers.get('X-Veil-MSE') || '0'),
      encryptionAlgorithm: res.headers.get('X-Veil-Encryption-Algorithm') || 'AES-256-GCM',
      kdfAlgorithm: res.headers.get('X-Veil-KDF-Algorithm') || 'Argon2id',
    };
  },

  async encodeFile(
    imageFile: File,
    payloadFile: File,
    password: string,
    strategyCode: number = 2,
    fecMode: number = 1
  ): Promise<EncodeResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('payloadFile', payloadFile);
    formData.append('password', password);
    formData.append('strategyCode', strategyCode.toString());
    formData.append('fecMode', fecMode.toString());

    const res = await fetch(`${API_BASE}/steganography/encode/file`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<EncodeResponse>(res);
  },

  async encodeDual(
    imageFile: File,
    primaryMessage: string,
    primaryPassword: string,
    decoyMessage: string,
    decoyPassword: string,
    fecMode: number = 1
  ): Promise<DualEncodeResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('primaryMessage', primaryMessage);
    formData.append('primaryPassword', primaryPassword);
    formData.append('decoyMessage', decoyMessage);
    formData.append('decoyPassword', decoyPassword);
    formData.append('fecMode', fecMode.toString());

    const res = await fetch(`${API_BASE}/steganography/encode/dual`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<DualEncodeResponse>(res);
  },

  async splitSecret(
    images: File[],
    message: string,
    threshold: number,
    password: string,
    strategyCode: number = 2,
    fecMode: number = 1
  ): Promise<SplitResult> {
    const formData = new FormData();
    images.forEach((img) => formData.append('images', img));
    formData.append('message', message);
    formData.append('threshold', threshold.toString());
    formData.append('password', password);
    formData.append('strategyCode', strategyCode.toString());
    formData.append('fecMode', fecMode.toString());

    const res = await fetch(`${API_BASE}/steganography/sharding/split`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<SplitResult>(res);
  },

  async combineShares(images: File[], password: string): Promise<CombineResult> {
    const formData = new FormData();
    images.forEach((img) => formData.append('images', img));
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/steganography/sharding/combine`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<CombineResult>(res);
  },

  async generateProvenanceKeyPair(): Promise<ProvenanceKeyPair> {
    const res = await fetch(`${API_BASE}/provenance/keypair`);
    return handleResponse<ProvenanceKeyPair>(res);
  },

  async signProvenanceImage(
    imageFile: File,
    privateKey: string,
    publicKey: string,
    attribution?: string
  ): Promise<ProvenanceManifest> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('privateKey', privateKey);
    formData.append('publicKey', publicKey);
    if (attribution) formData.append('attribution', attribution);

    const res = await fetch(`${API_BASE}/provenance/sign`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ProvenanceManifest>(res);
  },

  async verifyProvenanceImage(
    imageFile: File,
    publicKey: string,
    signature: string,
    timestamp: string,
    attribution?: string
  ): Promise<ProvenanceVerificationResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('publicKey', publicKey);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    if (attribution) formData.append('attribution', attribution);

    const res = await fetch(`${API_BASE}/provenance/verify`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ProvenanceVerificationResult>(res);
  },

  async encodeFileBinary(imageFile: File, payloadFile: File, password: string): Promise<BinaryEncodeResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('payloadFile', payloadFile);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/steganography/encode/file/binary`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let errJson: any;
      try { errJson = await res.json(); } catch {
        throw new ApiError(res.status, 'UNKNOWN_ERROR', `Request failed with status ${res.status}`);
      }
      throw new ApiError(res.status, errJson.errorCode || 'API_ERROR', errJson.message || 'Encoding failed');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    const outputFilename = filenameMatch ? filenameMatch[1] : 'veil_encoded.png';

    return {
      blob,
      outputFilename,
      operationId: res.headers.get('X-Veil-Operation-Id') || '',
      width: parseInt(res.headers.get('X-Veil-Width') || '0', 10),
      height: parseInt(res.headers.get('X-Veil-Height') || '0', 10),
      payloadBytes: parseInt(res.headers.get('X-Veil-Payload-Bytes') || '0', 10),
      encryptedBytes: parseInt(res.headers.get('X-Veil-Encrypted-Bytes') || '0', 10),
      carrierCapacityBytes: parseInt(res.headers.get('X-Veil-Carrier-Capacity-Bytes') || '0', 10),
      utilizationPercent: parseFloat(res.headers.get('X-Veil-Utilization-Percent') || '0'),
      psnr: parseFloat(res.headers.get('X-Veil-PSNR') || '0'),
      mse: parseFloat(res.headers.get('X-Veil-MSE') || '0'),
      encryptionAlgorithm: res.headers.get('X-Veil-Encryption-Algorithm') || 'AES-256-GCM',
      kdfAlgorithm: res.headers.get('X-Veil-KDF-Algorithm') || 'Argon2id',
    };
  },

  async analyzeSteganography(imageFile: File): Promise<SteganalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${API_BASE}/steganalysis/analyze`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<SteganalysisResponse>(res);
  },

  async extractPayload(imageFile: File, password: string): Promise<ExtractResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/steganography/extract`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ExtractResponse>(res);
  },

  async compareImages(originalFile: File, encodedFile: File): Promise<CompareResponse> {
    const formData = new FormData();
    formData.append('original', originalFile);
    formData.append('encoded', encodedFile);

    const res = await fetch(`${API_BASE}/steganography/compare`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<CompareResponse>(res);
  },

  async getHistory(params?: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<HistoryListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') searchParams.append('type', params.type);
    if (params?.status && params.status !== 'ALL') searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    const url = `${API_BASE}/history${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const res = await fetch(url);
    return handleResponse<HistoryListResponse>(res);
  },

  async getHistoryById(id: string): Promise<OperationRecord> {
    const res = await fetch(`${API_BASE}/history/${id}`);
    return handleResponse<OperationRecord>(res);
  },

  async clearHistory(): Promise<{ cleared: boolean; recordsDeleted: number }> {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'DELETE',
    });
    return handleResponse<{ cleared: boolean; recordsDeleted: number }>(res);
  },

  async deleteHistoryItem(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ deleted: boolean; id: string }>(res);
  },
};
