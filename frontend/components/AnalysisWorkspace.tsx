"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { analyseText, getHealth } from "@/lib/api";
import {
  firebaseConfigured,
  firestoreEnabled,
  getFirebaseServices,
} from "@/lib/firebase";
import type { AnalysisResponse, HealthResponse, RiskLevel } from "@/types/api";
import { AuthControls } from "./AuthControls";

const severityStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  medium: "bg-amber-50 text-amber-800 ring-amber-200",
  high: "bg-red-50 text-red-800 ring-red-200",
};

function SeverityBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${severityStyles[level]}`}
    >
      {level}
    </span>
  );
}

export function AnalysisWorkspace() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState("");

  const handleUserChange = useCallback((nextUser: User | null) => {
    setUser(nextUser);
  }, []);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthChecked(true));
  }, []);

  async function handleAnalyse() {
    const input = text.trim();
    if (!input) {
      setError("Enter some text before running an analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSaveState("idle");
    setSaveError("");
    try {
      setResult(await analyseText(input));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setText("");
    setResult(null);
    setError("");
    setSaveState("idle");
    setSaveError("");
  }

  async function handleSave() {
    if (!result || !user) return;
    const services = getFirebaseServices();
    if (!services) {
      setSaveError("Firebase is unavailable. Check the frontend configuration.");
      return;
    }

    setSaveState("saving");
    setSaveError("");
    try {
      await addDoc(collection(services.db, "analyses"), {
        userId: user.uid,
        inputText: text.trim(),
        summary: result.summary,
        riskLevel: result.risk_level,
        issues: result.issues,
        createdAt: serverTimestamp(),
      });
      setSaveState("saved");
    } catch {
      setSaveState("idle");
      setSaveError("The analysis could not be saved. Check Firestore access rules.");
    }
  }

  const canSave =
    firestoreEnabled && firebaseConfigured && Boolean(user) && Boolean(result);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                SMU LIT Hackathon Starter
              </p>
              {health?.ai_mode === "mock" && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-200">
                  Demo Mode
                </span>
              )}
              {healthChecked && !health && (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-200">
                  Backend offline
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              LegalTech Sandbox
            </h1>
          </div>
          <AuthControls onUserChange={handleUserChange} />
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <label className="mb-2 block text-sm font-semibold text-slate-900" htmlFor="analysis-input">
          Input
        </label>
        <textarea
          id="analysis-input"
          className="min-h-56 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-900 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste a scenario, document excerpt, argument, question, or other material..."
          value={text}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="button-primary" disabled={loading} onClick={handleAnalyse}>
            {loading ? "Analysing…" : "Analyse"}
          </button>
          <button className="button-secondary" disabled={loading || (!text && !result)} onClick={handleClear}>
            Clear
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}
      </section>

      {loading && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-7" aria-live="polite">
          <p className="font-medium text-slate-700">Reviewing the supplied information…</p>
        </section>
      )}

      {result && (
        <section className="mt-6 space-y-5" aria-live="polite">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950">Analysis</h2>
              <SeverityBadge level={result.risk_level} />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
            <p className="mt-2 leading-7 text-slate-700">{result.summary}</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-950">Issues</h2>
            {result.issues.length ? (
              <div className="grid gap-4">
                {result.issues.map((issue, index) => (
                  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" key={`${issue.title}-${index}`}>
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">{issue.title}</h3>
                      <SeverityBadge level={issue.severity} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Explanation</h4>
                        <p className="mt-1 leading-7 text-slate-700">{issue.explanation}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Recommendation</h4>
                        <p className="mt-1 leading-7 text-slate-700">{issue.recommendation}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
                No notable issues were identified from the supplied information.
              </p>
            )}
          </div>

          {canSave && (
            <div className="flex flex-wrap items-center gap-3">
              <button className="button-primary" disabled={saveState !== "idle"} onClick={handleSave}>
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save Analysis"}
              </button>
              {saveError && <p className="text-sm text-red-700" role="alert">{saveError}</p>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

