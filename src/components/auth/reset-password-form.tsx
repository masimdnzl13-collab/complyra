"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { FormField } from "./form-field";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
    } catch {
      // Intentionally swallowed: the same confirmation is shown either way
      // so this form can't be used to probe whether an email has an account.
    }
    setIsSubmitting(false);
    setIsSent(true);
  }

  if (isSent) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Check your email</h1>
        <p className="mt-2 text-sm text-navy-600">
          If an account exists for {email}, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy-900">Reset your password</h1>
      <p className="mt-1 text-sm text-navy-600">We&apos;ll email you a link to reset it.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-600">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
