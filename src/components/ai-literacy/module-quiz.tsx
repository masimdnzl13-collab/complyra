"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { TrainingModule } from "@/lib/ai-literacy/modules";
import { PASS_THRESHOLD, MAX_ATTEMPTS } from "@/lib/ai-literacy/modules";

interface QuizResult {
  score: number;
  passed: boolean;
  attempts: number;
  blockedForExpertReview: boolean;
  results: { questionId: string; correct: boolean; correctOptionId: string; explanation: string }[];
  trainingCompleted: boolean;
}

interface ModuleQuizProps {
  module: TrainingModule;
  nextModuleId: string | null;
  initialAttempts: number;
  initialBlocked: boolean;
  initialPassed: boolean;
}

export function ModuleQuiz({ module, nextModuleId, initialAttempts, initialBlocked, initialPassed }: ModuleQuizProps) {
  const router = useRouter();
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [blocked, setBlocked] = useState(initialBlocked);

  const allAnswered = module.quiz.every((q) => answers[q.id]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/ai-literacy/quiz-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: module.id, answers }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const data: QuizResult = await response.json();
      setResult(data);
      setAttempts(data.attempts);
      setBlocked(data.blockedForExpertReview);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  if (initialPassed && !result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <ModuleContent module={module} />
        <div className="mt-8 rounded-xl border-2 border-success bg-success/5 p-6 text-center">
          <p className="font-semibold text-success">You already passed this module&apos;s quiz.</p>
          {nextModuleId ? (
            <Link href={`/ai-literacy/modules/${nextModuleId}`} className="mt-4 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600">
              Next module
            </Link>
          ) : (
            <Link href="/ai-literacy" className="mt-4 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600">
              Back to overview
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <ModuleContent module={module} />

      {!showQuiz && !result && (
        <button
          type="button"
          onClick={() => setShowQuiz(true)}
          className="mt-8 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
        >
          Take the quiz
        </button>
      )}

      {blocked && (
        <div className="mt-8 rounded-xl border-2 border-danger bg-danger/5 p-6 text-center">
          <p className="font-semibold text-navy-900">Expert review required</p>
          <p className="mt-2 text-sm text-navy-700">
            You&apos;ve used all {MAX_ATTEMPTS} attempts for this module without reaching {PASS_THRESHOLD}%. Contact
            your compliance lead to review this module with you before continuing.
          </p>
        </div>
      )}

      {showQuiz && !result && !blocked && (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-navy-500">
            Attempt {attempts + 1} of {MAX_ATTEMPTS} · {PASS_THRESHOLD}% required to pass
          </p>
          {module.quiz.map((question, i) => (
            <div key={question.id} className="rounded-xl border border-navy-100 bg-surface p-6">
              <p className="text-sm font-semibold text-navy-900">
                {i + 1}. {question.question}
              </p>
              <div className="mt-3 space-y-2">
                {question.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-2.5 text-sm ${
                      answers[question.id] === opt.id ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      className="mt-0.5 accent-accent"
                      checked={answers[question.id] === opt.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: opt.id }))}
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="button"
            disabled={!allAnswered || isSubmitting}
            onClick={handleSubmit}
            className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
          >
            {isSubmitting ? "Grading…" : "Submit quiz"}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          <div
            className={`rounded-xl border-2 p-6 text-center ${
              result.passed ? "border-success bg-success/5" : "border-danger bg-danger/5"
            }`}
          >
            <p className={`text-2xl font-bold ${result.passed ? "text-success" : "text-danger"}`}>{result.score}%</p>
            <p className="mt-1 text-sm font-medium text-navy-900">
              {result.passed ? "Passed" : `Not yet — ${PASS_THRESHOLD}% required`}
            </p>
          </div>

          <div className="space-y-3">
            {module.quiz.map((question, i) => {
              const questionResult = result.results.find((r) => r.questionId === question.id)!;
              return (
                <div key={question.id} className="rounded-xl border border-navy-100 bg-surface p-5">
                  <p className="text-sm font-semibold text-navy-900">
                    {i + 1}. {question.question}
                  </p>
                  <p className={`mt-2 text-sm font-medium ${questionResult.correct ? "text-success" : "text-danger"}`}>
                    {questionResult.correct ? "Correct" : "Incorrect"}
                  </p>
                  <p className="mt-1 text-sm text-navy-600">{questionResult.explanation}</p>
                </div>
              );
            })}
          </div>

          {result.passed ? (
            nextModuleId ? (
              <Link
                href={`/ai-literacy/modules/${nextModuleId}`}
                className="block w-full rounded-md bg-accent px-4 py-2 text-center text-sm font-medium text-white hover:bg-accent-600"
              >
                Next module
              </Link>
            ) : (
              <Link
                href="/ai-literacy"
                className="block w-full rounded-md bg-accent px-4 py-2 text-center text-sm font-medium text-white hover:bg-accent-600"
              >
                {result.trainingCompleted ? "All modules complete — view certificate" : "Back to overview"}
              </Link>
            )
          ) : result.blockedForExpertReview ? null : (
            <button
              type="button"
              onClick={retry}
              className="w-full rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
            >
              Try again ({MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} left)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleContent({ module }: { module: TrainingModule }) {
  return (
    <div>
      <p className="text-sm font-medium text-navy-500">{module.estimatedMinutes} min</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">{module.title}</h1>
      {module.videoUrl && (
        <a href={module.videoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent hover:text-accent-600">
          Watch a short video on this topic (external) →
        </a>
      )}
      <div className="prose prose-sm mt-6 max-w-none text-navy-700 prose-headings:text-navy-900 prose-strong:text-navy-900">
        <ReactMarkdown>{module.markdownContent}</ReactMarkdown>
      </div>
    </div>
  );
}
