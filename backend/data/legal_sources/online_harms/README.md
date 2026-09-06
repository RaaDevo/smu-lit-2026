# Curated Online Harms sources

Place UTF-8 `.md` files in the jurisdiction subdirectory and add one entry to `registry.json`. The loader preserves each Markdown file unchanged, verifies that `relevant_text` is an exact passage in that file, and passes that passage to Donna through the existing evidence contract. There is no parser, index, embedding store, or crawler.

Required registry fields are `source_id`, `title`, `jurisdiction`, `source_type`, `authority`, `local_file_path`, and `provenance`; record `publication_or_effective_date` as `null` when unknown. The current runtime adapter additionally uses `legal_status`, `url`, and `relevant_text` to satisfy Donna's established `LegalSource` contract.
