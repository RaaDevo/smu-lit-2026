import assert from "node:assert/strict";
import test from "node:test";

import { aiTimeoutGuidance, humanizeStatus } from "../lib/presentation.ts";

test("humanizeStatus renders legal workflow enums as readable labels", () => {
  assert.equal(
    humanizeStatus("LAWYER_APPROVED_WORKING_ASSUMPTION"),
    "Lawyer-approved working assumption",
  );
  assert.equal(humanizeStatus("NO_MATERIAL_GAP"), "No material gap");
  assert.equal(humanizeStatus("DRAFT_READY"), "Draft ready");
  assert.equal(humanizeStatus("CURATED"), "Curated");
  assert.equal(humanizeStatus("HIGH"), "High");
});

test("humanizeStatus preserves already readable interface labels", () => {
  assert.equal(humanizeStatus("Demo Mode"), "Demo Mode");
  assert.equal(humanizeStatus("Live AI"), "Live AI");
});

test("aiTimeoutGuidance gives mock-mode recovery steps without suggesting a mode change", () => {
  assert.equal(
    aiTimeoutGuidance("mock"),
    "Demo Mode is already active. Retry the operation; if it repeats, refresh the page and check the backend health.",
  );
  assert.equal(
    aiTimeoutGuidance("live"),
    "Retry the operation. For deterministic fallback, set USE_MOCK_AI=true on the backend and restart it.",
  );
});
