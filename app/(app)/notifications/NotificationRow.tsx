"use client";

import { useActionState } from "react";
import { deleteNotification, markNotificationRead, type ActionState } from "./actions";

export type NotificationRowData = {
  id: string;
  title: string;
  message: string | null;
  audience: "all" | "employee";
  targetName: string | null;
  createdAt: string;
  isRead: boolean;
};

export default function NotificationRow({ notification, isHr }: { notification: NotificationRowData; isHr: boolean }) {
  const [readState, readAction, readPending] = useActionState<ActionState, FormData>(
    (_prev, formData) => markNotificationRead(formData),
    undefined
  );
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(
    (_prev, formData) => deleteNotification(formData),
    undefined
  );

  return (
    <div className="flex gap14 center" style={{ padding: "14px 4px", borderTop: "1px solid var(--border)" }}>
      <div className="icon-box" style={{ background: "var(--primary-soft)", fontSize: 17 }}>🔔</div>
      <div style={{ flex: 1 }}>
        <div className="small bold">{notification.title}</div>
        {notification.message && <div className="tiny muted">{notification.message}</div>}
        <div className="tiny muted" style={{ marginTop: 2 }}>
          {new Date(notification.createdAt).toLocaleString()} ·{" "}
          {notification.audience === "all" ? "Everyone" : `To ${notification.targetName ?? "an employee"}`}
        </div>
        {readState?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{readState.error}</div>}
        {deleteState?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{deleteState.error}</div>}
      </div>
      {!notification.isRead && (
        <form action={readAction}>
          <input type="hidden" name="notification_id" value={notification.id} />
          <button type="submit" className="btn btn-outline btn-sm" disabled={readPending}>
            {readPending ? "…" : "Mark read"}
          </button>
        </form>
      )}
      {notification.isRead && (
        <span className="tiny muted" style={{ minWidth: 60, textAlign: "right" }}>Read</span>
      )}
      {isHr && (
        <form action={deleteAction}>
          <input type="hidden" name="notification_id" value={notification.id} />
          <button type="submit" className="btn btn-outline btn-sm">✕</button>
        </form>
      )}
    </div>
  );
}
