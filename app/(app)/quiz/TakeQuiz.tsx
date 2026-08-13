"use client";

import { useActionState } from "react";
import { submitQuizAttempt, type ActionState } from "./actions";

export type QuizQuestion = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

const OPTION_KEYS = ["a", "b", "c", "d"] as const;

export default function TakeQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => submitQuizAttempt(formData),
    undefined
  );

  return (
    <form action={formAction} className="flex col gap12">
      <input type="hidden" name="question_ids" value={questions.map((q) => q.id).join(",")} />
      {questions.map((q, i) => (
        <div key={q.id} className="card-flat pad flex col gap8">
          <div className="small bold">
            {i + 1}. {q.question}
          </div>
          <div className="flex col gap6">
            {OPTION_KEYS.map((key) => (
              <label key={key} className="tiny flex gap8 center">
                <input type="radio" name={`q_${q.id}`} value={key} required />
                {q[`option_${key}` as const]}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex between center">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Submitting…" : "Submit quiz"}
        </button>
        {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
      </div>
    </form>
  );
}
