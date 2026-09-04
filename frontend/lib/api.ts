import type {
  AnalysisRequest,
  AnalysisResponse,
  HealthResponse,
} from "@/types/api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "The backend is unavailable. Check that FastAPI is running and try again.",
    );
  }

  if (!response.ok) {
    let message = `The request failed (${response.status}).`;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        message = payload.detail;
      }
    } catch {
      // Keep the safe status-based message when the server did not return JSON.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function analyseText(text: string): Promise<AnalysisResponse> {
  const body: AnalysisRequest = { text };
  return request<AnalysisResponse>("/analyse", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

