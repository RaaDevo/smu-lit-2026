import type { ImpactResult, SeedPack } from "@/types/domain";

export const statusStyles: Record<string, string> = {
  UPDATE_REQUIRED: "border-red-300 bg-red-50 text-red-900",
  REVIEW_REQUIRED: "border-amber-300 bg-amber-50 text-amber-900",
  DOWNSTREAM_UPDATE: "border-blue-300 bg-blue-50 text-blue-900",
  UNAFFECTED: "border-emerald-300 bg-emerald-50 text-emerald-900",
  MONITOR: "border-slate-300 bg-slate-50 text-slate-700",
};
export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-1 text-xs font-semibold ${statusStyles[status] ?? "border-slate-300 bg-slate-50"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function ImpactMap({
  seed,
  impact,
  selected,
  onSelect,
}: {
  seed: SeedPack;
  impact: ImpactResult;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const positions = [
    { x: 10, y: 25 },
    { x: 285, y: 25 },
    { x: 560, y: 25 },
    { x: 285, y: 200 },
    { x: 560, y: 200 },
  ];
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        Approved assumption → direct semantic findings → downstream review
        requirements
      </p>
      <div
        className="relative h-[345px] w-[820px]"
        aria-label="Directed asset dependencies"
      >
        <svg
          className="absolute inset-0"
          width="820"
          height="345"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8" fill="#64748b" />
            </marker>
          </defs>
          {seed.dependencies.map((edge) => {
            const a =
              positions[
                seed.firmAssets.findIndex((s) => s.id === edge.upstreamAssetId)
              ];
            const b =
              positions[
                seed.firmAssets.findIndex(
                  (s) => s.id === edge.downstreamAssetId,
                )
              ];
            if (!a || !b) return null;
            return (
              <path
                key={edge.id}
                d={`M ${a.x + 120} ${a.y + 115} C ${a.x + 120} ${a.y + 155}, ${b.x + 120} ${b.y - 20}, ${b.x + 120} ${b.y}`}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>
        {seed.firmAssets.map((asset, i) => {
          const finding = impact.findings.find((f) => f.assetId === asset.id)!;
          return (
            <button
              type="button"
              key={asset.id}
              onClick={() => onSelect(asset.id)}
              aria-pressed={selected === asset.id}
              style={{ left: positions[i].x, top: positions[i].y }}
              className={`absolute min-h-[115px] w-[240px] rounded-lg border-2 p-3 text-left ${statusStyles[finding.status]} ${selected === asset.id ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
            >
              <span className="block text-xs font-semibold">
                {finding.status.replaceAll("_", " ")}
              </span>
              <span className="my-1 block font-semibold">{asset.title}</span>
              <span className="text-xs">{finding.section}</span>
            </button>
          );
        })}
      </div>
      <div className="space-y-1 text-sm">
        {seed.dependencies.map((edge) => (
          <p key={edge.id}>
            <button
              className="underline"
              onClick={() => onSelect(edge.upstreamAssetId)}
            >
              {edge.upstreamAssetId}
            </button>
            {" → "}
            <button
              className="underline"
              onClick={() => onSelect(edge.downstreamAssetId)}
            >
              {edge.downstreamAssetId}
            </button>
            <span className="ml-2 text-slate-500">{edge.explanation}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
