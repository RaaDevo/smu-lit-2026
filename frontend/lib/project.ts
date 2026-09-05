import {
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreEnabled, getFirebaseServices } from "./firebase";
import { request } from "./api";
import type { ProjectState } from "./project-state";
import { withPersistenceDeadline } from "./persistence-deadline";

function services() {
  const value = getFirebaseServices();
  if (!firestoreEnabled || !value?.auth.currentUser)
    throw new Error(
      "Enable Firestore and sign in to save or restore a project.",
    );
  return value;
}

export async function saveProject(project: ProjectState) {
  const value = services();
  const user = value.auth.currentUser!;
  const validated = await request<ProjectState>(
    "/reports/validate-project",
    project,
  );
  if (new TextEncoder().encode(JSON.stringify(validated)).byteLength > 700000)
    throw new Error(
      "Project exceeds the MVP snapshot size. Export the brief instead.",
    );
  await withPersistenceDeadline(
    setDoc(doc(value.db, "projects", user.uid), {
      ownerUid: user.uid,
      name: "Online safety stress test",
      schemaVersion: 1,
      snapshot: validated,
      updatedAt: serverTimestamp(),
    }),
    "save",
  );
}

export async function loadProject(): Promise<ProjectState> {
  const value = services();
  const snapshot = await withPersistenceDeadline(
    getDocFromServer(doc(value.db, "projects", value.auth.currentUser!.uid)),
    "load",
  );
  if (!snapshot.exists())
    throw new Error("No saved project yet. Save the current workflow first.");
  const data = snapshot.data();
  if (data.schemaVersion !== 1 || data.ownerUid !== value.auth.currentUser!.uid)
    throw new Error("This project cannot be restored by the current user.");
  return request<ProjectState>("/reports/validate-project", data.snapshot);
}
