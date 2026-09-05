import test from "node:test";
import assert from "node:assert/strict";
import { withPersistenceDeadline } from "../lib/persistence-deadline.ts";

test("unacknowledged cloud write releases caller and acknowledges possible later commit", async () => {
  let acknowledge!: (value: string) => void;
  const write = new Promise<string>((resolve) => {
    acknowledge = resolve;
  });
  await assert.rejects(
    withPersistenceDeadline(write, "save", 5),
    /not confirmed.*may still commit/,
  );
  acknowledge("saved later");
  assert.equal(await write, "saved later");
});

test("confirmed writes and rejected reads preserve their result", async () => {
  assert.equal(
    await withPersistenceDeadline(Promise.resolve("saved"), "save", 50),
    "saved",
  );
  await assert.rejects(
    withPersistenceDeadline(
      Promise.reject(new Error("permission denied")),
      "load",
      50,
    ),
    /permission denied/,
  );
});
