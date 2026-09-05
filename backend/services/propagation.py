"""Cycle-safe upstream -> downstream traversal. Never edits assets."""
from collections import Counter, deque
from domain import Dependency, DirectResult, ImpactFinding, ImpactResult, PropagationPath

def paths_from(root: str, dependencies: list[Dependency]) -> list[PropagationPath]:
    visited = {root}
    queue = deque([(root, [root], [])])
    paths = []
    while queue:
        current, assets, edges = queue.popleft()
        for edge in dependencies:
            if edge.upstream_asset_id != current or edge.downstream_asset_id in visited:
                continue
            target = edge.downstream_asset_id
            visited.add(target)
            path = PropagationPath(root_asset_id=root, asset_ids=assets + [target], dependency_ids=edges + [edge.id])
            paths.append(path)
            queue.append((target, path.asset_ids, path.dependency_ids))
    return paths

def propagate(direct: DirectResult, dependencies: list[Dependency], context_hash: str) -> ImpactResult:
    findings = {f.asset_id: ImpactFinding(**f.model_dump(), direct_status=f.status,
        downstream_asset_ids=[p.asset_ids[-1] for p in paths_from(f.asset_id, dependencies)],
        propagation_paths=[]) for f in direct.findings}
    for root in direct.findings:
        if root.status not in ('UPDATE_REQUIRED', 'REVIEW_REQUIRED'):
            continue
        for path in paths_from(root.asset_id, dependencies):
            target = findings[path.asset_ids[-1]]
            target.propagation_paths.append(path)
            if target.direct_status in ('UNAFFECTED', 'MONITOR'):
                target.status = 'DOWNSTREAM_UPDATE'
                target.reasoning = ('Review the inherited procedure because an upstream asset requires remediation. Direct assessment: '
                    + next(f.reasoning for f in direct.findings if f.asset_id == target.asset_id))
                ranks = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2}
                if ranks[root.severity] > ranks[target.severity]:
                    target.severity = root.severity
                target.confidence = min(target.confidence, root.confidence)
            for evidence in root.evidence:
                if evidence not in target.evidence:
                    target.evidence.append(evidence.model_copy(deep=True))
    counts = {s: 0 for s in ('UNAFFECTED', 'MONITOR', 'REVIEW_REQUIRED', 'UPDATE_REQUIRED', 'DOWNSTREAM_UPDATE')}
    counts.update(Counter(f.status for f in findings.values()))
    return ImpactResult(context_hash=context_hash, findings=list(findings.values()), counts=counts)
