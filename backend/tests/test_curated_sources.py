from pathlib import Path

from services.curated_sources import CURATED_SOURCE_ROOT, load_curated_source_documents, load_curated_sources
from services.demo_twin import demo_comparative, load_seed


def test_curated_online_harms_sources_load_verified_markdown_evidence():
    sources = load_curated_sources()

    assert {source.id for source in sources} == {
        'sg-online-safety-relief-accountability-act-2025',
        'uk-online-safety-act-2023',
        'au-online-safety-act-2021',
        'au-online-safety-age-restricted-platforms-rules-2025',
        'nz-online-safety-minimum-age-child-safety-bill',
    }
    assert all(source.provenance == 'CURATED' for source in sources)
    assert all(source.local_file_path for source in sources)
    assert all(source.relevant_text for source in sources)
    assert all(len(source.relevant_text) <= 30000 for source in sources)


def test_curated_source_excerpts_are_preserved_in_the_original_markdown():
    for source in load_curated_sources():
        markdown = (CURATED_SOURCE_ROOT / source.local_file_path).read_text(encoding='utf-8')
        assert source.relevant_text in markdown


def test_curated_source_documents_preserve_original_utf8_markdown():
    documents = load_curated_source_documents()

    assert all(document.markdown == document.local_file_path.read_text(encoding='utf-8') for document in documents)
    assert all(document.local_file_path.suffix == '.md' for document in documents)
    assert all(document.local_file_path.is_relative_to(CURATED_SOURCE_ROOT) for document in documents)


def test_demo_comparative_groups_curated_evidence_by_jurisdiction():
    seed = load_seed()
    result = demo_comparative(seed)

    assert {assessment.jurisdiction for assessment in result.assessments} == {
        source.jurisdiction for source in seed.sources
    }
    assert all(assessment.evidence for assessment in result.assessments)
