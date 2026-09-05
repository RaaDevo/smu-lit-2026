import { getFirebaseServices } from "./firebase";
import type {
  ComparativeInput,
  ComparativeResult,
  HealthResponse,
  ImpactResult,
  PatchReviewInput,
  PatchReviewResult,
  RemediationInput,
  RemediationResult,
  ReportInput,
  ResilienceBrief,
  SeedPack,
  StressInput,
} from "@/types/domain";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export async function request<T>(path: string, body?: unknown): Promise<T> {
  const user = getFirebaseServices()?.auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(65000),
    });
  } catch {
    throw new Error(
      "The backend is unavailable or the request timed out. Check the server and retry.",
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      typeof payload?.detail === "string"
        ? payload.detail
        : `Request failed (${response.status}).`,
    );
  }
  return response.json() as Promise<T>;
}

export const getSeed = () => request<SeedPack>("/seed");
export const getHealth = () => request<HealthResponse>("/health");
export const compare = (data: ComparativeInput) =>
  request<ComparativeResult>("/analyse/comparative", data);
export const stressTest = (data: StressInput) =>
  request<ImpactResult>("/analyse/stress-test", data);
export const remediate = (data: RemediationInput) =>
  request<RemediationResult>("/analyse/remediation", data);
export const reviewPatch = (data: PatchReviewInput) =>
  request<PatchReviewResult>("/reports/review-patch", data);
export const generateBrief = (data: ReportInput) =>
  request<ResilienceBrief>("/reports/generate", data);
