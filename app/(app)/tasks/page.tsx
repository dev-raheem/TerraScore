import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import TaskActions from "./TaskActions";

export const metadata: Metadata = { title: "Tasks" };

const statusStyles: Record<string, string> = {
  assigned: "pill",
  in_progress: "pill pill-primary",
  completed: "pill pill-gold",
  reviewed: "pill pill-emerald",
};

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Awaiting review",
  reviewed: "Reviewed",
};

export default async function TasksPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("ts_tasks")
    .select("*")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  const taskList = tasks ?? [];

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">My Tasks</div>
          <div className="page-sub">Assigned by HR — only visible to you</div>
        </div>
      </div>

      <div className="card pad-lg enter enter-d1">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {taskList.map((t) => (
              <tr key={t.id}>
                <td className="small">
                  <div className="bold">{t.title}</div>
                  {t.description && <div className="tiny muted">{t.description}</div>}
                  {t.due_date && (
                    <div className="tiny muted">Due {new Date(t.due_date).toLocaleDateString()}</div>
                  )}
                </td>
                <td className="mono">{t.weight}%</td>
                <td>
                  <span className={statusStyles[t.status]}>{statusLabels[t.status]}</span>
                </td>
                <td className="mono">{t.score ?? "—"}</td>
                <td>{t.status === "assigned" || t.status === "in_progress" ? <TaskActions taskId={t.id} /> : null}</td>
              </tr>
            ))}
            {taskList.length === 0 && (
              <tr>
                <td colSpan={5} className="muted small" style={{ padding: 20, textAlign: "center" }}>
                  No tasks assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
