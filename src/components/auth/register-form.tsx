"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { establishSession } from "@/lib/firebase/establish-session";
import { getAuthErrorMessage } from "@/lib/firebase/auth-errors";
import { FormField } from "./form-field";
import { GoogleSignInButton } from "./google-sign-in-button";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const idToken = await credential.user.getIdToken();
      await establishSession(idToken);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy-900">Create your account</h1>
      <p className="mt-1 text-sm text-navy-600">Start preparing your EU AI Act documentation.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-navy-100" />
        <span className="text-xs text-navy-400">or</span>
        <div className="h-px flex-1 bg-navy-100" />
      </div>

      <GoogleSignInButton
        label="Sign up with Google"
        onError={setError}
        onIdToken={async (idToken) => {
          await establishSession(idToken);
          router.push("/dashboard");
          router.refresh();
        }}
      />

      <p className="mt-6 text-center text-sm text-navy-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
