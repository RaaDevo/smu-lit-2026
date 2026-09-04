export type RiskLevel = "low" | "medium" | "high";

export interface AnalysisIssue {
  title: string;
  severity: RiskLevel;
  explanation: string;
  recommendation: string;
}

export interface AnalysisRequest {
  text: string;
}

export interface AnalysisResponse {
  summary: string;
  risk_level: RiskLevel;
  issues: AnalysisIssue[];
}

export interface HealthResponse {
  status: "ok";
  ai_mode: "mock" | "live";
}

