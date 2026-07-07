const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

/** Firebase's raw error codes never reach the UI — always route through this. */
export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return DEFAULT_MESSAGE;
}

/**
 * Resolves an error for display, whichever layer it came from: a Firebase
 * Auth error (has a `.code`, mapped above) or one of our own API routes
 * (a plain Error whose message is already written for end users, e.g.
 * "This invite was sent to x@y.com..." from /api/invites/[token]/accept).
 */
export function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && !("code" in error)) {
    return error.message;
  }
  return getAuthErrorMessage(error);
}
