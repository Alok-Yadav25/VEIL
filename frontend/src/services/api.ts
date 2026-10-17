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
} from '../types';

const API_BASE = '/api/v1';

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

  async encodeText(imageFile: File, message: string, password: string): Promise<EncodeResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('message', message);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/steganography/encode/text`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<EncodeResponse>(res);
  },

  async encodeFile(imageFile: File, payloadFile: File, password: string): Promise<EncodeResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('payloadFile', payloadFile);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/steganography/encode/file`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<EncodeResponse>(res);
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
