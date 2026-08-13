"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTask, deleteTask, reviewTask, updateTask, type ActionState } from "./actions";

type Task = {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  status: "assigned" | "in_progress" | "completed" | "reviewed";
  score: number | null;
  due_date: string | null;
};

const statusStyles: Record<Task["status"], string> = {
  assigned: "pill",
  in_progress: "pill pill-primary",
  completed: "pill pill-gold",
  reviewed: "pill pill-emerald",
};

const statusLabels: Record<Task["status"], string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Awaiting review",
  reviewed: "Reviewed",
};

function ReviewForm({ employeeId, task }: { employeeId: string; task: Task }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => reviewTask(formData),
    undefined
  );

  return (
    <form action={formAction} className="flex gap6 center">
      <input type="hidden" name="employee_id" value={employeeId} />
      <input type="hidden" name="task_id" value={task.id} />
      <input name="score" type="number" min={0} max={100} placeholder="Score" required className="field" style={{ width: 80 }} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? "Saving…" : "Review"}
      </button>
      {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
    </form>
  );
}

function DeleteTaskForm({ employeeId, taskId }: { employeeId: string; taskId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => deleteTask(formData),
    undefined
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="employee_id" value={employeeId} />
      <input type="hidden" name="task_id" value={taskId} />
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>✕</button>
      {state?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{state.error}</div>}
    </form>
  );
}

function TaskRow({ employeeId, task }: { employeeId: string; task: Task }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await updateTask(formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    undefined
  );

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <form action={formAction} className="flex gap8 wrap" style={{ padding: "6px 0" }}>
            <input type="hidden" name="employee_id" value={employeeId} />
            <input type="hidden" name="task_id" value={task.id} />
            <input name="title" defaultValue={task.title} required className="field" style={{ flex: 2, minWidth: 140 }} />
            <input name="description" defaultValue={task.description ?? ""} className="field" style={{ flex: 2, minWidth: 140 }} />
            <input name="weight" type="number" min={0} max={100} defaultValue={task.weight} required className="field" style={{ width: 100 }} />
            <input name="due_date" type="date" defaultValue={task.due_date ?? ""} className="field" style={{ width: 150 }} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
            {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="small">
        {task.title}
        {task.description && <div className="tiny muted">{task.description}</div>}
        {task.due_date && <div className="tiny muted">Due {new Date(task.due_date).toLocaleDateString()}</div>}
      </td>
      <td className="mono">{task.weight}%</td>
      <td>
        <span className={statusStyles[task.status]}>{statusLabels[task.status]}</span>
      </td>
      <td className="mono">
        {task.status === "completed" ? (
          <ReviewForm employeeId={employeeId} task={task} />
        ) : (
          task.score ?? "—"
        )}
      </td>
      <td>
        <div className="flex gap6">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <DeleteTaskForm employeeId={employeeId} taskId={task.id} />
        </div>
      </td>
    </tr>
  );
}

export default function TaskManager({ employeeId, tasks }: { employeeId: string; tasks: Task[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => addTask(formData),
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="card pad-lg">
      <div className="bold" style={{ marginBottom: 10 }}>Tasks</div>
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
          {tasks.map((t) => (
            <TaskRow key={t.id} employeeId={employeeId} task={t} />
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={5} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                No tasks assigned yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form ref={formRef} action={formAction} className="flex gap8 wrap" style={{ marginTop: 10 }}>
        <input type="hidden" name="employee_id" value={employeeId} />
        <input name="title" placeholder="Task title" required className="field" style={{ flex: 2, minWidth: 140 }} />
        <input name="description" placeholder="Description (optional)" className="field" style={{ flex: 2, minWidth: 140 }} />
        <input name="weight" type="number" min={0} max={100} placeholder="Weight %" required className="field" style={{ width: 100 }} />
        <input name="due_date" type="date" className="field" style={{ width: 150 }} />
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Assigning…" : "+ Assign"}
        </button>
      </form>
      {state?.error && (
        <div className="small" style={{ color: "var(--coral)", marginTop: 8 }}>
          {state.error}
        </div>
      )}
    </div>
  );
}
