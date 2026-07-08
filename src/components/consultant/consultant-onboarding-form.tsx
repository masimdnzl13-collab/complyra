"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { resolveErrorMessage } from "@/lib/firebase/auth-errors";
import { FormField } from "@/components/auth/form-field";

interface ConsultantOnboardingFormProps {
  token: string;
  email: string;
  hasExistingAccount: boolean;
}

export function ConsultantOnboardingForm({ token, email, hasExistingAccount }: ConsultantOnboardingFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const credential = hasExistingAccount
        ? await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
        : await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const idToken = await credential.user.getIdToken();

      const response = await fetch(`/api/consultant-invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      router.push("/consultant/onboarding");
      router.refresh();
    } catch (err) {
      setError(resolveErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy-900">Join the consultant network</h1>
      <p className="mt-1 text-sm text-navy-600">
        {hasExistingAccount ? "Sign in to continue setting up your profile." : "Create your account to get started."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Email</span>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-md border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-600"
          />
        </label>
        <FormField
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete={hasExistingAccount ? "current-password" : "new-password"}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? "Continuing…" : "Continue to profile setup"}
        </button>
      </form>
    </div>
  );
}
