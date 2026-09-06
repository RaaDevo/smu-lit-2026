"""Load registered, local curated legal sources without transforming their Markdown."""
import json
from dataclasses import dataclass
from pathlib import Path

from domain import LegalSource


CURATED_SOURCE_ROOT = Path(__file__).parents[1] / 'data' / 'legal_sources' / 'online_harms'
REGISTRY_PATH = CURATED_SOURCE_ROOT / 'registry.json'


@dataclass(frozen=True)
class CuratedSourceDocument:
    source: LegalSource
    local_file_path: Path
    markdown: str


def load_curated_source_documents() -> list[CuratedSourceDocument]:
    registry = json.loads(REGISTRY_PATH.read_text(encoding='utf-8'))
    documents = []
    for item in registry['sources']:
        relative_path = Path(item['local_file_path'])
        local_path = (CURATED_SOURCE_ROOT / relative_path).resolve()
        if not local_path.is_relative_to(CURATED_SOURCE_ROOT.resolve()) or local_path.suffix != '.md':
            raise ValueError(f"Curated source path must be a Markdown file below {CURATED_SOURCE_ROOT}: {relative_path}")
        markdown = local_path.read_text(encoding='utf-8')
        relevant_text = item['relevant_text']
        if relevant_text not in markdown:
            raise ValueError(f"Curated source excerpt is not present in {relative_path}")
        source = LegalSource(
            id=item['source_id'],
            title=item['title'],
            jurisdiction=item['jurisdiction'],
            source_type=item['source_type'],
            authority=item['authority'],
            date=item.get('publication_or_effective_date') or 'Unknown',
            local_file_path=relative_path.as_posix(),
            provenance=item['provenance'],
            legal_status=item['legal_status'],
            url=item['url'],
            relevant_text=relevant_text,
            text_kind='EXCERPT',
        )
        documents.append(CuratedSourceDocument(source=source, local_file_path=local_path, markdown=markdown))
    return documents


def load_curated_sources() -> list[LegalSource]:
    """Return verified excerpts for Donna's existing evidence pipeline."""
    return [document.source for document in load_curated_source_documents()]
