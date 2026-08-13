import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Ring from "@/components/Ring";
import { getCurrentEmployee } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/data";
import TakeQuiz, { type QuizQuestion } from "./TakeQuiz";
import QuizAdmin, { type QuizQuestionRow } from "./QuizAdmin";
import ResetAttemptButton from "./ResetAttemptButton";

export const metadata: Metadata = { title: "Quiz" };

const QUESTIONS_PER_ATTEMPT = 10;

export default async function QuizPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const isHr = employee.role === "hr";
  const supabase = await createClient();

  const [{ data: attempt }, { data: leaderboardRows }] = await Promise.all([
    isHr
      ? Promise.resolve({ data: null })
      : supabase
          .from("ts_quiz_attempts")
          .select("score, correct_count, total_questions")
          .eq("employee_id", employee.id)
          .maybeSingle(),
    // Everyone's quiz score, same sensitivity as the main leaderboard — RLS
    // now only allows HR (or the row owner) to read this, so only fetch it
    // for HR; a regular employee just sees their own ring below.
    isHr
      ? supabase
          .from("ts_quiz_leaderboard")
          .select("*")
          .order("score", { ascending: false })
          .order("completed_at", { ascending: true })
      : Promise.resolve({ data: null }),
  ]);

  const leaderboard = leaderboardRows ?? [];

  let adminQuestions: QuizQuestionRow[] = [];
  let quizQuestions: QuizQuestion[] = [];

  if (isHr) {
    const { data } = await supabase
      .from("ts_quiz_questions")
      .select("*")
      .order("created_at", { ascending: false });
    adminQuestions = data ?? [];
  } else if (!attempt) {
    const { data } = await supabase
      .from("ts_quiz_questions")
      .select("id, question, option_a, option_b, option_c, option_d")
      .eq("is_active", true);
    const active = data ?? [];
    for (let i = active.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [active[i], active[j]] = [active[j], active[i]];
    }
    quizQuestions = active.slice(0, Math.min(QUESTIONS_PER_ATTEMPT, active.length));
  }

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Quiz Dashboard</div>
          <div className="page-sub">Test your TerraRex Energy solar knowledge, earn a score</div>
        </div>
      </div>

      {!isHr && (
        <div className="grid enter enter-d1" style={{ marginBottom: 18 }}>
          <div className="card pad-lg" style={{ background: "linear-gradient(120deg,var(--primary-soft),transparent)" }}>
            <span className="pill pill-primary">☀️ Solar panel quiz</span>
            <div className="bold" style={{ fontSize: 17, margin: "10px 0 4px" }}>
              TerraRex Energy — Solar Panel Fundamentals
            </div>
            {attempt ? (
              <div className="tiny muted" style={{ marginBottom: 4 }}>
                You scored {attempt.correct_count}/{attempt.total_questions} ({attempt.score}%). One attempt allowed — thanks for playing!
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="tiny muted" style={{ marginBottom: 4 }}>
                No quiz questions have been added yet — check back soon.
              </div>
            ) : (
              <>
                <div className="tiny muted" style={{ marginBottom: 14 }}>
                  {quizQuestions.length} questions · one attempt only
                </div>
                <TakeQuiz questions={quizQuestions} />
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid g12-8-4 enter enter-d2">
        {isHr && (
          <div className="card pad-lg">
            <div className="bold" style={{ marginBottom: 12 }}>Quiz leaderboard</div>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Employee</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr className="row-hover" key={row.employee_id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="flex center gap10">
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--primary)" }}>
                          {initials(row.full_name)}
                        </div>
                        {row.full_name}
                        {row.employee_id === employee.id ? (
                          <span className="pill pill-primary tiny" style={{ marginLeft: 6 }}>You</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="mono bold">{row.score}%</td>
                    <td>
                      <ResetAttemptButton employeeId={row.employee_id} />
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                      No attempts yet — be the first!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!isHr && (
          <div className="card pad-lg flex col center" style={{ textAlign: "center" }}>
            <Ring
              percent={attempt?.score ?? 0}
              size={120}
              strokeWidth={10}
              colors={["#C49850", "#F3C365"]}
              center={attempt ? `${attempt.score}%` : "—"}
              sub="Your quiz score"
            />
            {!attempt && (
              <div className="tiny muted" style={{ marginTop: 10 }}>
                Take the quiz to see your score here.
              </div>
            )}
          </div>
        )}
      </div>

      {isHr && <QuizAdmin questions={adminQuestions} />}
    </>
  );
}
