/** Client-side helper: exchanges a fresh Firebase ID token for the httpOnly session cookie. */
export async function establishSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    throw new Error("Unable to create session");
  }
}
