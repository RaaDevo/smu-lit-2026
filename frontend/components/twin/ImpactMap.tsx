import type { ImpactResult, SeedPack } from "@/types/domain";
import { humanizeStatus } from "@/lib/presentation";

export const statusStyles: Record<string, string> = {
  UPDATE_REQUIRED: "border-red-700 bg-red-50 text-red-950",
  REVIEW_REQUIRED: "border-amber-700 bg-amber-50 text-amber-950",
  DOWNSTREAM_UPDATE: "border-[#06054d] bg-[#e8e8ed] text-[#06054d]",
  UNAFFECTED: "border-[#777] bg-[#f1f1f1] text-[#181818]",
  MONITOR: "border-[#777] bg-[#f1f1f1] text-[#181818]",
  APPROVED: "border-[#06054d] bg-[#06054d] text-[#f1f1f1]",
  EDITED: "border-[#06054d] bg-[#e8e8ed] text-[#06054d]",
  ESCALATED: "border-amber-700 bg-amber-50 text-amber-950",
  REJECTED: "border-red-700 bg-red-50 text-red-950",
  PENDING_REVIEW: "border-[#777] bg-[#f1f1f1] text-[#181818]",
};
export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block max-w-full border px-2 py-1 text-center text-[11px] font-bold leading-tight tracking-[0.04em] [overflow-wrap:anywhere] ${statusStyles[status] ?? "border-[#777] bg-[#f1f1f1] text-[#181818]"}`}
    >
      {humanizeStatus(status)}
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
      <p className="mb-4 border-l-2 border-[#06054d] pl-3 text-sm text-[#686868]">
        Approved assumption → direct semantic findings → downstream review
        requirements
      </p>
      <div className="impact-map-scroll" role="region" aria-label="Asset dependency diagram" tabIndex={0}>
      <div className="relative h-[345px] w-[820px]" aria-label="Directed asset dependencies">
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
              <path d="M0,0 L8,4 L0,8" fill="#06054d" />
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
                stroke="#181818"
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
              className={`absolute min-h-[115px] w-[240px] border-2 p-4 text-left ${statusStyles[finding.status]} ${selected === asset.id ? "ring-2 ring-[#06054d] ring-offset-2 ring-offset-[#f1f1f1]" : ""}`}
            >
              <span className="block text-xs font-semibold">
                {humanizeStatus(finding.status)}
              </span>
              <span className="my-1 block font-semibold">{asset.title}</span>
              <span className="text-xs">{finding.section}</span>
            </button>
          );
        })}
      </div>
      </div>
      <div className="mt-4 border-t border-[#c9c9c5] pt-3 text-sm">
        {seed.dependencies.map((edge) => (
          <p key={edge.id}>
            <button
              className="font-semibold underline"
              onClick={() => onSelect(edge.upstreamAssetId)}
            >
              {edge.upstreamAssetId}
            </button>
            {" → "}
            <button
              className="font-semibold underline"
              onClick={() => onSelect(edge.downstreamAssetId)}
            >
              {edge.downstreamAssetId}
            </button>
            <span className="ml-2 text-[#686868]">{edge.explanation}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
