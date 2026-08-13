"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addQuestion, deleteQuestion, toggleQuestionActive, updateQuestion, type ActionState } from "./actions";

export type QuizQuestionRow = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "a" | "b" | "c" | "d";
  is_active: boolean;
};

function EditQuestionForm({ q, onDone }: { q: QuizQuestionRow; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => updateQuestion(formData),
    undefined
  );

  useEffect(() => {
    if (state && !state.error) onDone();
  }, [state, onDone]);

  return (
    <tr>
      <td colSpan={4}>
        <form action={formAction} className="flex col gap8" style={{ padding: "8px 0" }}>
          <input type="hidden" name="question_id" value={q.id} />
          <input name="question" defaultValue={q.question} placeholder="Question" required className="field" />
          <div className="grid g2" style={{ gap: 8 }}>
            {(["a", "b", "c", "d"] as const).map((key) => (
              <div key={key} className="flex gap6 center">
                <input type="radio" name="correct_option" value={key} defaultChecked={q.correct_option === key} required />
                <input name={`option_${key}`} defaultValue={q[`option_${key}`]} placeholder={`Option ${key.toUpperCase()}`} required className="field" style={{ flex: 1 }} />
              </div>
            ))}
          </div>
          <div className="flex gap8 center">
            <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={onDone}>
              Cancel
            </button>
            {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
          </div>
        </form>
      </td>
    </tr>
  );
}

function QuestionRow({ q }: { q: QuizQuestionRow }) {
  const [editing, setEditing] = useState(false);
  const [toggleState, toggleAction] = useActionState<ActionState, FormData>(
    (_prev, formData) => toggleQuestionActive(formData),
    undefined
  );
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(
    (_prev, formData) => deleteQuestion(formData),
    undefined
  );

  if (editing) return <EditQuestionForm q={q} onDone={() => setEditing(false)} />;

  return (
    <tr>
      <td className="small">{q.question}</td>
      <td className="mono bold">{q.correct_option.toUpperCase()}</td>
      <td>
        <form action={toggleAction}>
          <input type="hidden" name="question_id" value={q.id} />
          <input type="hidden" name="is_active" value={q.is_active ? "1" : "0"} />
          <button type="submit" className={q.is_active ? "pill pill-emerald" : "pill"} style={{ border: "none", cursor: "pointer" }}>
            {q.is_active ? "Active" : "Inactive"}
          </button>
        </form>
        {toggleState?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{toggleState.error}</div>}
      </td>
      <td>
        <div className="flex gap6">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="question_id" value={q.id} />
            <button type="submit" className="btn btn-outline btn-sm">✕</button>
          </form>
        </div>
        {deleteState?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{deleteState.error}</div>}
      </td>
    </tr>
  );
}

function AddQuestionForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => addQuestion(formData),
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex col gap8" style={{ marginTop: 12 }}>
      <input name="question" placeholder="Question" required className="field" />
      <div className="grid g2" style={{ gap: 8 }}>
        {(["a", "b", "c", "d"] as const).map((key) => (
          <div key={key} className="flex gap6 center">
            <input type="radio" name="correct_option" value={key} required />
            <input name={`option_${key}`} placeholder={`Option ${key.toUpperCase()}`} required className="field" style={{ flex: 1 }} />
          </div>
        ))}
      </div>
      <div className="flex between center">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Adding…" : "+ Add question"}
        </button>
        {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
      </div>
      <div className="tiny muted">Select the radio next to the correct option.</div>
    </form>
  );
}

export default function QuizAdmin({ questions }: { questions: QuizQuestionRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card pad-lg enter" style={{ marginTop: 18 }}>
      <div className="flex between center">
        <div className="bold">Manage quiz questions (Admin)</div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Manage"}
        </button>
      </div>
      {open && (
        <>
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Question</th>
                <th>Correct</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <QuestionRow key={q.id} q={q} />
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                    No questions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <AddQuestionForm />
        </>
      )}
    </div>
  );
}
