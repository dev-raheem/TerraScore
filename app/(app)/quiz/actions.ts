"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";
import { getCurrentEmployee } from "@/lib/session";
import { syncEmployeeAggregates } from "@/lib/performance";

export type ActionState = { error?: string } | undefined;

const OPTIONS = ["a", "b", "c", "d"] as const;

function revalidateQuiz() {
  revalidatePath("/quiz");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/eom");
  revalidatePath("/performance");
  revalidatePath("/profile");
  revalidatePath("/badges");
}

export async function addQuestion(formData: FormData): Promise<ActionState> {
  let hrId: string;
  try {
    hrId = await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const question = String(formData.get("question") || "").trim();
  const optionA = String(formData.get("option_a") || "").trim();
  const optionB = String(formData.get("option_b") || "").trim();
  const optionC = String(formData.get("option_c") || "").trim();
  const optionD = String(formData.get("option_d") || "").trim();
  const correctOption = String(formData.get("correct_option") || "");

  if (!question || !optionA || !optionB || !optionC || !optionD) {
    return { error: "Fill in the question and all four options." };
  }
  if (!(OPTIONS as readonly string[]).includes(correctOption)) {
    return { error: "Choose which option is correct." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ts_quiz_questions").insert({
    question,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_option: correctOption,
    created_by: hrId,
  });
  if (error) return { error: error.message };

  revalidateQuiz();
}

export async function updateQuestion(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const questionId = String(formData.get("question_id") || "");
  const question = String(formData.get("question") || "").trim();
  const optionA = String(formData.get("option_a") || "").trim();
  const optionB = String(formData.get("option_b") || "").trim();
  const optionC = String(formData.get("option_c") || "").trim();
  const optionD = String(formData.get("option_d") || "").trim();
  const correctOption = String(formData.get("correct_option") || "");

  if (!questionId) return { error: "Missing question." };
  if (!question || !optionA || !optionB || !optionC || !optionD) {
    return { error: "Fill in the question and all four options." };
  }
  if (!(OPTIONS as readonly string[]).includes(correctOption)) {
    return { error: "Choose which option is correct." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ts_quiz_questions")
    .update({
      question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
    })
    .eq("id", questionId);
  if (error) return { error: error.message };

  revalidateQuiz();
}

export async function deleteQuestion(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const questionId = String(formData.get("question_id") || "");
  if (!questionId) return { error: "Missing question." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_quiz_questions").delete().eq("id", questionId);
  if (error) return { error: error.message };

  revalidateQuiz();
}

export async function toggleQuestionActive(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const questionId = String(formData.get("question_id") || "");
  const isActive = formData.get("is_active") === "1";
  if (!questionId) return { error: "Missing question." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_quiz_questions").update({ is_active: !isActive }).eq("id", questionId);
  if (error) return { error: error.message };

  revalidateQuiz();
}

export async function resetQuizAttempt(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { error: "Missing employee." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_quiz_attempts").delete().eq("employee_id", employeeId);
  if (error) return { error: error.message };

  await admin.from("ts_quiz_leaderboard").delete().eq("employee_id", employeeId);
  await syncEmployeeAggregates(admin, employeeId);
  revalidateQuiz();
}

export async function submitQuizAttempt(formData: FormData): Promise<ActionState> {
  const employee = await getCurrentEmployee();
  if (!employee || employee.role === "hr") {
    return { error: "Not authorized." };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("ts_quiz_attempts")
    .select("id")
    .eq("employee_id", employee.id)
    .maybeSingle();
  if (existing) return { error: "You've already completed this quiz." };

  const questionIds = String(formData.get("question_ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (questionIds.length === 0) return { error: "No questions submitted." };

  const { data: questions } = await admin
    .from("ts_quiz_questions")
    .select("id, correct_option")
    .in("id", questionIds);

  const totalQuestions = questions?.length ?? 0;
  if (totalQuestions === 0) return { error: "Quiz questions could not be loaded." };

  const correctCount = questions!.reduce((count, q) => {
    const answer = String(formData.get(`q_${q.id}`) || "");
    return answer === q.correct_option ? count + 1 : count;
  }, 0);
  const score = Math.round((correctCount / totalQuestions) * 100);

  const { error: insertError } = await admin.from("ts_quiz_attempts").insert({
    employee_id: employee.id,
    score,
    correct_count: correctCount,
    total_questions: totalQuestions,
  });
  if (insertError) {
    if (insertError.code === "23505") return { error: "You've already completed this quiz." };
    return { error: insertError.message };
  }

  await admin.from("ts_quiz_leaderboard").upsert({
    employee_id: employee.id,
    full_name: employee.full_name,
    department: employee.department,
    score,
    correct_count: correctCount,
    total_questions: totalQuestions,
    completed_at: new Date().toISOString(),
  });

  await syncEmployeeAggregates(admin, employee.id);
  revalidateQuiz();
}
