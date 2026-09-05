"use client";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import type {
  HealthResponse,
  ProposedPatch,
  ReviewDecision,
  StressInput,
} from "@/types/domain";
import * as api from "@/lib/api";
import {
  initialProject,
  selectScenario,
  editScenario,
  approveScenario,
} from "@/lib/project-state";
import { loadProject, saveProject } from "@/lib/project";
import { authEnabled, firestoreEnabled } from "@/lib/firebase";
import { AuthControls } from "@/components/AuthControls";
import { Evidence } from "./Evidence";
import { Badge, ImpactMap } from "./ImpactMap";
import { PatchCard } from "./PatchCard";
import { Brief } from "./Brief";

type View = "evidence" | "scenario" | "impact" | "review" | "brief";

export function TwinApp() {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");
  useEffect(() => {
    api
      .getHealth()
      .then(setHealth)
      .catch(() =>
        setHealthError(
          "Backend unavailable. Start FastAPI, then reload this page.",
        ),
      );
  }, []);
  return (
    <main className="mx-auto min-w-[1280px] max-w-[1600px] px-8 py-6">
      <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5 print:hidden">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
            SMU LIT · Regulatory resilience
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Firm Regulatory Resilience Twin
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {health && (
            <Badge
              status={health.aiMode === "mock" ? "Demo Mode" : "Live AI"}
            />
          )}
          <AuthControls onUserChange={setUser} />
        </div>
      </header>
      {healthError && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-4">
          {healthError}
        </p>
      )}
      {!health && !healthError && (
        <p role="status">Connecting to the analysis service…</p>
      )}
      {health &&
        ((authEnabled || health.requireAuth) && !user ? (
          <section className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8">
            <h2 className="mb-3 text-xl font-semibold">
              Sign in to your resilience workspace
            </h2>
            <p>
              Use Google sign-in above.{" "}
              {health.requireAuth && !authEnabled
                ? "Enable NEXT_PUBLIC_ENABLE_AUTH and configure Firebase to connect to this protected backend."
                : "Your project and review decisions stay associated with your account."}
            </p>
          </section>
        ) : (
          <Workspace key={user?.uid ?? "local"} user={user} health={health} />
        ))}
    </main>
  );
}

function Workspace({
  user,
  health,
}: {
  user: User | null;
  health: HealthResponse;
}) {
  const [project, setProject] = useState(initialProject);
  const [view, setView] = useState<View>("evidence");
  const [selectedAsset, setSelectedAsset] = useState("playbook");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const reviewer = user?.uid ?? "local-lawyer";
  useEffect(() => {
    api
      .getSeed()
      .then((seed) => setProject((p) => ({ ...p, seed })))
      .catch((e) => setError(e.message));
  }, []);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The operation failed. Please retry.",
      );
    } finally {
      setBusy("");
    }
  }
  function stressInput(): StressInput {
    if (!project.scenario || !project.seed)
      throw new Error("Select and approve a scenario first.");
    return {
      scenario: project.scenario,
      sources: project.seed.sources,
      firmAssets: project.seed.firmAssets,
      dependencies: project.seed.dependencies,
    };
  }
  async function handleSave() {
    setSaving(true);
    setSaveNotice(
      "Saving the current snapshot. You can continue working locally.",
    );
    try {
      await saveProject(project);
      setSaveNotice(
        "Snapshot saved to Firestore. Save again to include changes made since clicking Save.",
      );
    } catch (e) {
      setSaveNotice(
        e instanceof Error
          ? e.message
          : "Save not confirmed. Your local run is unchanged.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleReview(
    patch: ProposedPatch,
    decision: ReviewDecision["decision"],
    note: string,
    edited: string,
  ) {
    await run("Recording lawyer decision", async () => {
      const result = await api.reviewPatch({
        patch,
        decision,
        reviewerUid: reviewer,
        note,
        finalReviewedText: decision === "EDITED" ? edited : null,
      });
      setProject((p) => ({
        ...p,
        decisions: [...p.decisions, result.decision],
        brief: null,
      }));
      setNotice(
        "Decision recorded. The original artefact has not been changed. Save project to persist it.",
      );
    });
  }
  const seed = project.seed;
  if (!seed)
    return (
      <p role="status">
        {error || "Loading curated development and five synthetic assets…"}
      </p>
    );
  const selectedFinding = project.impact?.findings.find(
    (f) => f.assetId === selectedAsset,
  );
  const selected = seed.firmAssets.find((a) => a.id === selectedAsset);
  const canStress =
    project.scenario?.status === "LAWYER_APPROVED_WORKING_ASSUMPTION";

  return (
    <>
      <div className="mb-5 flex items-center justify-between print:hidden">
        <div>
          <h2 className="font-semibold">
            Online safety · Proactive stress test
          </h2>
          <p className="text-sm text-slate-500">
            1 curated development · 5 synthetic artefacts · 1 working assumption
          </p>
        </div>
        <div className="flex gap-2">
          {firestoreEnabled && (
            <>
              <button
                className="button-secondary"
                disabled={!!busy || saving || !user}
                onClick={handleSave}
              >
                Save project
              </button>
              <button
                className="button-secondary"
                disabled={!!busy || saving || !user}
                onClick={() =>
                  run("Restoring project", async () => {
                    setProject(await loadProject());
                    setView("evidence");
                    setNotice("Saved project restored.");
                  })
                }
              >
                Load saved project
              </button>
            </>
          )}
          <button
            className="button-secondary"
            disabled={!!busy}
            onClick={() => {
              setProject({ ...initialProject(), seed });
              setView("evidence");
              setNotice(
                "Local run reset. Any saved Firestore project is unchanged.",
              );
            }}
          >
            Reset local run
          </button>
        </div>
      </div>
      {saveNotice && (
        <p role="status" className="mb-4 text-sm text-slate-600 print:hidden">
          {saveNotice}
        </p>
      )}
      {health.aiMode === "mock" && (
        <p className="mb-4 rounded border border-blue-200 bg-blue-50 px-4 py-2 text-sm print:hidden">
          Demo Mode uses deterministic fixtures. Edited or alternative scenarios
          receive conservative review flags. Live mode analyses supplied text
          through OpenRouter.
        </p>
      )}
      <nav
        className="mb-5 flex gap-2 border-b border-slate-200 pb-4 print:hidden"
        aria-label="Stress-test stages"
      >
        {(["evidence", "scenario", "impact", "review", "brief"] as const).map(
          (item, i) => (
            <button
              key={item}
              className={view === item ? "button-primary" : "button-secondary"}
              disabled={
                !!busy ||
                (item === "scenario" && !project.comparative) ||
                (item === "impact" && !project.impact) ||
                (item === "review" && !project.remediation) ||
                (item === "brief" && !project.brief)
              }
              onClick={() => setView(item)}
            >
              {i + 1}.{" "}
              {
                {
                  evidence: "Evidence",
                  scenario: "Lawyer assumption",
                  impact: "Firm impact",
                  review: "Remediation review",
                  brief: "Resilience brief",
                }[item]
              }
            </button>
          ),
        )}
      </nav>
      {busy && (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 rounded border border-blue-200 bg-blue-50 p-3"
        >
          {busy}…{" "}
          {busy.startsWith("Analysing")
            ? "Each live request is limited to 25 seconds, with at most one output repair."
            : ""}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded border border-red-200 bg-red-50 p-4"
        >
          {error} Retry the operation using its button. For deterministic
          fallback, set USE_MOCK_AI=true on the backend and restart it.
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 text-sm text-slate-600">
          {notice}
        </p>
      )}

      {view === "evidence" && (
        <section className="grid grid-cols-[1fr_400px] gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <Badge status={seed.development.status} />
            <h2 className="my-3 text-2xl font-semibold">
              {seed.development.title}
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              {seed.development.jurisdiction} · {seed.development.date}
            </p>
            <p className="leading-7">{seed.development.summary}</p>
            <p className="my-4 rounded bg-amber-50 p-3 text-sm leading-6">
              {seed.evidenceNote}
            </p>
            <Evidence
              sources={seed.sources}
              references={seed.sources.map((s) => ({
                sourceId: s.id,
                relevantText: s.relevantText,
                explanation: "Curated material supplied to the model.",
              }))}
            />
            <button
              className="button-primary mt-5"
              disabled={!!busy}
              onClick={() =>
                run(
                  "Analysing comparative evidence and scenarios",
                  async () => {
                    const comparative = await api.compare({
                      development: seed.development,
                      sources: seed.sources,
                    });
                    setProject({ ...initialProject(), seed, comparative });
                    setView("scenario");
                  },
                )
              }
            >
              Analyse evidence & generate scenarios
            </button>
          </div>
          <aside className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="mb-3 font-semibold">Synthetic firm corpus</h3>
            {seed.firmAssets.map((a) => (
              <details key={a.id} className="border-b py-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {a.title}
                </summary>
                <p className="my-2 text-xs text-slate-500">
                  {a.owner} · {a.version}
                </p>
                {a.sections.map((s) => (
                  <p key={s.id} className="my-2 text-sm leading-6">
                    <strong>{s.id}</strong> — {s.text}
                  </p>
                ))}
              </details>
            ))}
          </aside>
        </section>
      )}

      {view === "scenario" && project.comparative && (
        <section className="grid grid-cols-[400px_1fr] gap-6">
          <aside className="space-y-4">
            {project.comparative.assessments.map((a, i) => (
              <article key={i} className="rounded-lg border bg-white p-5">
                <h3 className="font-semibold">{a.jurisdiction}</h3>
                <p className="my-2 text-xs uppercase text-slate-500">
                  {a.classification} · {a.relevance} relevance
                </p>
                <p className="mb-3 text-sm leading-6">{a.reasoning}</p>
                <Evidence references={a.evidence} sources={seed.sources} />
              </article>
            ))}
          </aside>
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-xl font-semibold">
              Choose one Singapore working assumption
            </h2>
            <p className="my-2 text-sm text-slate-600">
              These are possible scenarios, not predictions or current Singapore
              law. Editing invalidates prior approval and downstream results.
            </p>
            <div className="my-4 space-y-3">
              {project.comparative.scenarios.map((s) => (
                <button
                  key={s.id}
                  disabled={!!busy}
                  onClick={() => setProject((p) => selectScenario(p, s))}
                  aria-pressed={project.scenario?.id === s.id}
                  className={`block w-full rounded border p-4 text-left ${project.scenario?.id === s.id ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}
                >
                  <strong>{s.title}</strong>
                  <span className="mt-2 block text-sm">{s.description}</span>
                </button>
              ))}
            </div>
            {project.scenario && (
              <>
                <Badge status={project.scenario.status} />
                <label className="mt-4 block text-sm font-semibold">
                  Working assumption
                  <textarea
                    className="mt-2 min-h-32 w-full rounded border border-slate-300 p-3 font-normal leading-6"
                    disabled={!!busy}
                    value={project.scenario.description}
                    onChange={(e) =>
                      setProject((p) => editScenario(p, e.target.value))
                    }
                  />
                </label>
                <p className="my-3 text-sm">
                  Uncertainty: {project.scenario.uncertainty}.{" "}
                  {project.scenario.assumptions.join(" ")}
                </p>
                <ul className="mb-3 list-disc pl-5 text-sm">
                  {project.scenario.legalQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
                <Evidence
                  references={project.scenario.evidence}
                  sources={seed.sources}
                />
                <div className="mt-5 flex gap-3">
                  <button
                    className="button-secondary"
                    disabled={
                      !!busy ||
                      canStress ||
                      !project.scenario.description.trim()
                    }
                    onClick={() =>
                      setProject((p) => approveScenario(p, reviewer))
                    }
                  >
                    Approve working assumption
                  </button>
                  <button
                    className="button-primary"
                    disabled={!!busy || !canStress}
                    onClick={() =>
                      run(
                        "Analysing direct impacts and propagating dependencies",
                        async () => {
                          const impact = await api.stressTest(stressInput());
                          setProject((p) => ({
                            ...p,
                            impact,
                            remediation: null,
                            decisions: [],
                            brief: null,
                          }));
                          setView("impact");
                        },
                      )
                    }
                  >
                    Stress Test Firm
                  </button>
                </div>
                {canStress && (
                  <p className="mt-3 text-xs text-slate-500">
                    Approved by {project.scenario.approvedBy} ·{" "}
                    {project.scenario.approvedAt}
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {view === "impact" && project.impact && (
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {Object.entries(project.impact.counts)
              .filter(([, n]) => n > 0)
              .map(([status, n]) => (
                <span key={status}>
                  <strong className="mr-2">{n}</strong>
                  <Badge status={status} />
                </span>
              ))}
          </div>
          <p className="mb-4 text-sm text-slate-600">
            All impacts are conditional on the approved assumption. Direct
            semantic status and inherited dependency impact are shown
            separately.
          </p>
          <div className="grid grid-cols-[850px_1fr] gap-5">
            <div className="rounded-lg border bg-white p-4">
              <ImpactMap
                seed={seed}
                impact={project.impact}
                selected={selectedAsset}
                onSelect={setSelectedAsset}
              />
            </div>
            {selected && selectedFinding && (
              <aside className="rounded-lg border bg-white p-5">
                <h3 className="mb-2 font-semibold">{selected.title}</h3>
                <Badge status={selectedFinding.status} />
                <p className="my-2 text-xs">
                  Direct: {selectedFinding.directStatus.replaceAll("_", " ")} ·{" "}
                  {selectedFinding.severity} severity
                </p>
                <p className="text-xs text-slate-500">
                  Model confidence:{" "}
                  {Math.round(selectedFinding.confidence * 100)}% — not legal
                  certainty
                </p>
                <p className="my-3 text-sm leading-6">
                  {selectedFinding.reasoning}
                </p>
                <p className="mb-3 rounded bg-slate-50 p-3 text-sm leading-6">
                  <strong>{selectedFinding.section}</strong>
                  <br />
                  {
                    selected.sections.find(
                      (s) => s.id === selectedFinding.section,
                    )?.text
                  }
                </p>
                {selectedFinding.propagationPaths.map((p, i) => (
                  <p className="my-2 text-sm font-medium" key={i}>
                    Upstream path: {p.assetIds.join(" → ")}
                  </p>
                ))}
                <Evidence
                  references={selectedFinding.evidence}
                  sources={seed.sources}
                />
              </aside>
            )}
          </div>
          <button
            className="button-primary mt-5"
            disabled={!!busy}
            onClick={() =>
              run(
                "Analysing remediation proposals and adversarial findings",
                async () => {
                  const remediation = await api.remediate({
                    ...stressInput(),
                    impact: project.impact!,
                  });
                  setProject((p) => ({
                    ...p,
                    remediation,
                    decisions: [],
                    brief: null,
                  }));
                  setView("review");
                },
              )
            }
          >
            Propose remediation & review
          </button>
        </section>
      )}

      {view === "review" && project.remediation && (
        <section className="space-y-5">
          <div className="rounded border border-amber-300 bg-amber-50 p-5">
            <h2 className="mb-2 font-semibold">Adversarial review</h2>
            {project.remediation.reviewFindings.map((f) => (
              <div className="mb-3" key={f.id}>
                <p className="text-sm">
                  <strong>
                    {f.assetId} · {f.severity}:
                  </strong>{" "}
                  {f.issue}
                </p>
                <p className="my-2 text-sm">{f.recommendation}</p>
                <Evidence references={f.evidence} sources={seed.sources} />
              </div>
            ))}
          </div>
          {project.remediation.patches.map((p) => (
            <PatchCard
              key={p.id}
              patch={p}
              sources={seed.sources}
              decisions={project.decisions}
              busy={!!busy}
              onReview={handleReview}
            />
          ))}
          <button
            className="button-primary"
            disabled={!!busy}
            onClick={() =>
              run("Assembling the resilience brief", async () => {
                const brief = await api.generateBrief({
                  ...stressInput(),
                  development: seed.development,
                  comparative: project.comparative!,
                  impact: project.impact!,
                  remediation: project.remediation!,
                  decisions: project.decisions,
                });
                setProject((p) => ({ ...p, brief }));
                setView("brief");
              })
            }
          >
            Generate Regulatory Resilience Brief
          </button>
          <p className="text-sm text-slate-500">
            Pending, rejected and escalated proposals remain visible as
            unresolved actions in the brief.
          </p>
        </section>
      )}
      {view === "brief" && project.brief && <Brief brief={project.brief} />}
    </>
  );
}
