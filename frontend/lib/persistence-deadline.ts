/** Bound UI waiting, not the Firebase operation: queued writes may still commit later. */
export async function withPersistenceDeadline<T>(
  operation: Promise<T>,
  kind: "save" | "load",
  timeoutMs = 12000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            kind === "save"
              ? "Save not confirmed. Firestore may still commit this snapshot when the connection recovers. You can continue working locally."
              : "Load timed out. Your local run is unchanged; reconnect and try again.",
          ),
        ),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
