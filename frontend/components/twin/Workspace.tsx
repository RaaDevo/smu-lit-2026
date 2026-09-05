"use client";
import Image from "next/image";
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
  applyComparativeResult,
  createLawyerAssumption,
} from "@/lib/project-state";
import { loadProject, saveProject } from "@/lib/project";
import { authEnabled, firestoreEnabled } from "@/lib/firebase";
import { reviewQueue } from "@/lib/review-queue";
import { AuthControls } from "@/components/AuthControls";
import { Evidence } from "./Evidence";
import { Badge, ImpactMap } from "./ImpactMap";
import { PatchCard } from "./PatchCard";
import { Brief } from "./Brief";

type View = "evidence" | "scenario" | "impact" | "review" | "brief";

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

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
    <main className="workspace-shell">
      <header className="app-header print:hidden">
        <div className="flex items-center gap-4">
          <Image
            src="/donna-dark-grey-wordmark-tight.png"
            alt="Donna"
            width={745}
            height={1016}
            priority
            className="h-14 w-auto shrink-0 object-contain"
          />
          <div className="border-l border-[#c9c9c5] pl-4">
            <p className="app-kicker">Donna · Regulatory resilience</p>
            <h1 className="app-title">Firm Regulatory Resilience Twin</h1>
          </div>
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
  const [activePatchId, setActivePatchId] = useState("");
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
  const canStress =
    project.scenario?.status === "LAWYER_APPROVED_WORKING_ASSUMPTION";
  const queue = project.remediation
    ? reviewQueue(project.remediation.patches, project.decisions)
    : null;
  const activePatch = queue && project.remediation
    ? project.remediation.patches.find((patch) => patch.id === activePatchId) ??
      queue.unresolved[0] ??
      project.remediation.patches[0]
    : null;
  const nextUnresolved = queue && activePatch && project.remediation
    ? queue.unresolved.find(
        (patch) =>
          project.remediation!.patches.findIndex((item) => item.id === patch.id) >
          project.remediation!.patches.findIndex((item) => item.id === activePatch.id),
      ) ?? queue.unresolved[0]
    : null;

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

  return (
    <>
      <div className="mb-6 flex items-end justify-between print:hidden">
        <div>
          <h2 className="workspace-heading">
            Online safety · Proactive stress test
          </h2>
          <p className="workspace-meta mt-2">
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
        <p role="status" className="notice notice-info print:hidden">
          {saveNotice}
        </p>
      )}
      {health.aiMode === "mock" && (
        <p className="notice notice-info print:hidden">
          Demo Mode uses deterministic fixtures. Edited or alternative scenarios
          receive conservative review flags. Live mode analyses supplied text
          through OpenRouter.
        </p>
      )}
      <nav
        className="stage-nav print:hidden"
        aria-label="Stress-test stages"
      >
        {(["evidence", "scenario", "impact", "review", "brief"] as const).map(
          (item, i) => (
            <button
              key={item}
              className={`stage-button ${view === item ? "stage-button-active" : ""}`}
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
          className="notice notice-info"
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
          className="notice border-red-700 bg-red-50 text-red-950"
        >
          {error} Retry the operation using its button. For deterministic
          fallback, set USE_MOCK_AI=true on the backend and restart it.
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 border-l-2 border-[#06054d] pl-3 text-sm text-[#686868]">
          {notice}
        </p>
      )}
      {canStress && project.scenario && ["impact", "review", "brief"].includes(view) && (
        <section className="assumption-strip print:hidden">
          <div>
            <p className="metadata">
              Approved hypothetical
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.015em]">{project.scenario.title}</h3>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-[#181818]">
              {project.scenario.description}
            </p>
            <p className="metadata mt-2">
              Lawyer approved by {project.scenario.approvedBy} · {formatTimestamp(project.scenario.approvedAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge status={project.scenario.status} />
            <button className="button-secondary" onClick={() => setView("scenario")}>
              Return to assumption
            </button>
          </div>
        </section>
      )}

      {view === "evidence" && (
        <section className="grid grid-cols-[1fr_400px] gap-6">
          <div className="panel pt-0">
            <Badge status={seed.development.status} />
            <h2 className="my-4 font-serif text-3xl font-semibold tracking-[-0.025em]">
              {seed.development.title}
            </h2>
            <p className="metadata mb-4">
              {seed.development.jurisdiction} · {seed.development.date}
            </p>
            <p className="leading-7">{seed.development.summary}</p>
            <p className="notice notice-warning my-5">
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
                    setProject((project) => applyComparativeResult({ ...project, seed }, comparative));
                    setView("scenario");
                  },
                )
              }
            >
              Analyse evidence & generate scenarios
            </button>
          </div>
          <aside className="panel panel-rail pt-0">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[#06054d]">Synthetic firm corpus</h3>
            {seed.firmAssets.map((a) => (
              <details key={a.id} className="border-b border-[#c9c9c5] py-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {a.title}
                </summary>
                <p className="metadata my-2">
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
              <article key={i} className="panel panel-rail py-4">
                <h3 className="font-semibold">{a.jurisdiction}</h3>
                <p className="metadata my-2">
                  {a.classification} · {a.relevance} relevance
                </p>
                <p className="mb-3 text-sm leading-6">{a.reasoning}</p>
                <Evidence references={a.evidence} sources={seed.sources} />
              </article>
            ))}
          </aside>
          <div className="panel pt-0">
            <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em]">
              Choose one Singapore working assumption
            </h2>
            <p className="my-3 max-w-3xl text-sm leading-6 text-[#686868]">
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
                  className={`block w-full border-y p-4 text-left transition-colors ${project.scenario?.id === s.id ? "border-[#06054d] bg-[#e8e8ed] text-[#06054d]" : "border-[#c9c9c5] hover:bg-[#e8e8ed]"}`}
                >
                  {project.comparative!.recommendation && s.id === project.comparative!.recommendation.scenarioId && (
                    <span className="metadata mb-2 block text-[#06054d]">AI recommended · {project.comparative!.recommendation.persuasiveWeight} persuasive weight</span>
                  )}
                  <strong>{s.title}</strong>
                  <span className="mt-2 block text-sm">{s.description}</span>
                </button>
              ))}
            </div>
            <button
              className="button-secondary"
              disabled={!!busy}
              onClick={() => setProject((p) => createLawyerAssumption(p))}
            >
              Enter my own assumption
            </button>
            {project.scenario && (
              <>
                <Badge status={project.scenario.status} />
                <label className="mt-4 block text-sm font-semibold">
                  Working assumption
                  <textarea
                    className="field-control min-h-32 leading-6"
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
                        "Running Triage, Practice Group, Sign-off, Client Alert and Evaluator agents",
                        async () => {
                          const twinRun = await api.runTwins(stressInput());
                          setProject((p) => ({
                            ...p,
                            twinRun,
                            impact: twinRun.impact,
                            remediation: null,
                            decisions: [],
                            brief: null,
                          }));
                          setView("impact");
                        },
                      )
                    }
                  >
                    Run Firm and Law Firm Twins
                  </button>
                </div>
                {canStress && (
                  <p className="mt-3 text-xs text-slate-500">
                    Approved by {project.scenario.approvedBy} ·{" "}
                    {formatTimestamp(project.scenario.approvedAt)}
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {view === "impact" && project.impact && (
        <section>
          {project.twinRun && (
            <details className="brief-appendix mb-5" open>
              <summary className="cursor-pointer font-semibold">Law Firm Twin run · {project.twinRun.evaluator.runComplete ? "complete" : "requires attention"}</summary>
              <div className="mt-4 grid grid-cols-5 gap-3 text-sm">
                {project.twinRun.auditRecords.map((record) => (
                  <div key={record.invocationId} className="border-t border-[#c9c9c5] pt-2">
                    <p className="metadata">{record.executionMode}</p>
                    <p className="font-semibold">{record.agent.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-[#686868]">Attempt {record.attempt} · {record.profileVersion}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6">{project.twinRun.evaluator.summary}</p>
              <details className="mt-4 border-t border-[#c9c9c5] pt-3">
                <summary className="cursor-pointer text-sm font-semibold">Twin Calibration Profile</summary>
                <div className="mt-3 grid grid-cols-5 gap-3 text-xs leading-5">
                  {project.twinRun.profiles.map((profile) => (
                    <div key={profile.id}>
                      <p className="font-semibold">{profile.label} · {profile.version}</p>
                      <p className="mt-1 text-[#686868]">{profile.authority.join("; ")}</p>
                      <p className="mt-1 text-[#686868]">Boundary: {profile.competenceBoundaries.join("; ")}</p>
                    </div>
                  ))}
                </div>
              </details>
              <details className="mt-4 border-t border-[#c9c9c5] pt-3">
                <summary className="cursor-pointer text-sm font-semibold">Agent handoff audit</summary>
                <div className="mt-3 space-y-3">
                  {project.twinRun.auditRecords.map((record) => (
                    <details key={`${record.invocationId}-payload`} className="border-b border-[#c9c9c5] pb-3">
                      <summary className="cursor-pointer text-xs font-semibold">{record.agent.replaceAll("_", " ")} · received and produced record</summary>
                      <pre className="mt-2 overflow-auto bg-[#f8f8f6] p-3 text-xs">{JSON.stringify({ received: record.received, produced: record.produced }, null, 2)}</pre>
                    </details>
                  ))}
                </div>
              </details>
            </details>
          )}
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
          <p className="mb-5 border-l-2 border-[#06054d] pl-3 text-sm leading-6 text-[#686868]">
            All impacts are conditional on the approved assumption. Direct
            semantic status and inherited dependency impact are shown
            separately.
          </p>
          <div className="grid grid-cols-[850px_1fr] gap-5">
            <div className="panel border-t-2 border-[#181818] px-4 pt-4">
              <ImpactMap
                seed={seed}
                impact={project.impact}
                selected={selectedAsset}
                onSelect={setSelectedAsset}
              />
            </div>
            {selected && selectedFinding && (
              <aside className="panel border-t-2 border-[#181818] pt-0">
                <h3 className="mb-3 text-lg font-semibold tracking-[-0.015em]">{selected.title}</h3>
                <Badge status={selectedFinding.status} />
                <p className="my-2 text-xs">
                  Direct: {selectedFinding.directStatus.replaceAll("_", " ")} ·{" "}
                  {selectedFinding.severity} severity
                </p>
                <p className="metadata">
                  Model confidence:{" "}
                  {Math.round(selectedFinding.confidence * 100)}% — not legal
                  certainty
                </p>
                <p className="my-3 text-sm leading-6">
                  {selectedFinding.reasoning}
                </p>
                <p className="mb-4 border-y border-[#c9c9c5] bg-[#f8f8f6] p-4 text-sm leading-6">
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
                  setActivePatchId(remediation.patches[0]?.id ?? "");
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
        <section>
          <div className="notice notice-warning">
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
          {queue && activePatch && (
            <div className="grid grid-cols-[280px_1fr] gap-5">
              <aside className="panel panel-rail h-fit pt-0">
                <div className="border-b border-[#181818] pb-4">
                  <p className="metadata">
                    Review queue
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold text-[#06054d]" aria-live="polite">
                    {queue.reviewed} of {queue.total} reviewed
                  </p>
                  <p className="mt-1 text-sm text-[#686868]">
                    {queue.unresolved.length} unresolved
                  </p>
                </div>
                <div className="mt-3 space-y-2" aria-label="Patch review queue">
                  {project.remediation.patches.map((patch, index) => {
                    const decision = queue.statusByPatchId[patch.id];
                    const isActive = patch.id === activePatch.id;
                    return (
                      <button
                        key={patch.id}
                        className={`queue-item ${isActive ? "queue-item-active" : ""}`}
                        onClick={() => setActivePatchId(patch.id)}
                        aria-current={isActive ? "step" : undefined}
                      >
                        <span className="metadata block">
                          {index + 1}. {decision ? "Reviewed" : "Unresolved"}
                        </span>
                        <span className="mt-1 block font-semibold">
                          {seed.firmAssets.find((asset) => asset.id === patch.assetId)?.title ?? patch.assetId}
                        </span>
                        <span className="mt-1 block text-xs text-[#686868]">
                          {patch.section}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  className="button-secondary mt-4 w-full"
                  disabled={!!busy || queue.unresolved.length === 0}
                  onClick={() => setActivePatchId(nextUnresolved?.id ?? activePatch.id)}
                >
                  Next unresolved
                </button>
              </aside>
              <PatchCard
                key={activePatch.id}
                patch={activePatch}
                sources={seed.sources}
                decisions={project.decisions}
                busy={!!busy}
                onReview={handleReview}
              />
            </div>
          )}
          <div className="mt-6 flex items-center justify-between gap-4 border-t-2 border-[#181818] pt-5">
            <p className="text-sm text-[#686868]">
              Pending, rejected and escalated proposals remain visible as unresolved actions in the brief.
            </p>
            <button
              className="button-primary shrink-0"
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
                    twinRun: project.twinRun,
                  });
                  setProject((p) => ({ ...p, brief }));
                  setView("brief");
                })
              }
            >
              Generate Regulatory Resilience Brief
            </button>
          </div>
        </section>
      )}
      {view === "brief" && project.brief && <Brief brief={project.brief} />}
    </>
  );
}
