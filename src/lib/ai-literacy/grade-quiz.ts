import type { TrainingModule } from "./modules";
import { PASS_THRESHOLD } from "./modules";

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  correctOptionId: string;
  explanation: string;
  selectedExplanation: string | null;
}

export interface GradeResult {
  score: number;
  passed: boolean;
  results: QuestionResult[];
}

/**
 * Pure grading — no I/O, so it's usable both from the API route and from
 * verification scripts without needing a live Firestore/auth session. The
 * client never sees which option is correct until this runs server-side.
 */
export function gradeQuiz(trainingModule: TrainingModule, answers: Record<string, string>): GradeResult {
  let correctCount = 0;
  const results: QuestionResult[] = trainingModule.quiz.map((question) => {
    const selectedId = answers[question.id];
    const selectedOption = question.options.find((o) => o.id === selectedId);
    const correctOption = question.options.find((o) => o.correct)!;
    const isCorrect = !!selectedOption?.correct;
    if (isCorrect) correctCount += 1;
    return {
      questionId: question.id,
      correct: isCorrect,
      correctOptionId: correctOption.id,
      explanation: correctOption.explanation,
      selectedExplanation: selectedOption?.explanation ?? null,
    };
  });

  const score = Math.round((correctCount / trainingModule.quiz.length) * 100);
  return { score, passed: score >= PASS_THRESHOLD, results };
}
