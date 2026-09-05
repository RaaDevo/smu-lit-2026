"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  authEnabled,
  firebaseConfigured,
  getFirebaseServices,
} from "@/lib/firebase";

interface AuthControlsProps {
  onUserChange: (user: User | null) => void;
}

export function AuthControls({ onUserChange }: AuthControlsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authEnabled || !firebaseConfigured) return;
    const services = getFirebaseServices();
    if (!services) return;

    return onAuthStateChanged(services.auth, (nextUser) => {
      setUser(nextUser);
      onUserChange(nextUser);
    });
  }, [onUserChange]);

  if (!authEnabled) return null;

  if (!firebaseConfigured) {
    return (
      <p className="text-sm text-amber-800" role="status">
        Authentication is enabled but Firebase is not configured.
      </p>
    );
  }

  async function handleSignIn() {
    const services = getFirebaseServices();
    if (!services) {
      setError("Firebase could not be initialized. Check the frontend configuration.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithPopup(services.auth, new GoogleAuthProvider());
    } catch {
      setError("Google sign-in failed. Check Firebase Authentication settings.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    const services = getFirebaseServices();
    if (!services) {
      setError("Firebase could not be initialized. Check the frontend configuration.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signOut(services.auth);
    } catch {
      setError("Sign-out failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {user ? (
        <div className="flex items-center gap-3">
          <span className="max-w-48 truncate text-xs font-semibold uppercase tracking-[0.08em] text-[#686868]">
            {user.displayName ?? user.email ?? "Signed in"}
          </span>
          <button className="button-secondary" disabled={busy} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <button className="button-secondary" disabled={busy} onClick={handleSignIn}>
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>
      )}
      {error && (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
