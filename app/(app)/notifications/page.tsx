import { notifications } from "@/lib/data";

export default function NotificationsPage() {
  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">You&apos;re all caught up on the last 7 days</div>
        </div>
        <button className="btn btn-outline btn-sm">Mark all as read</button>
      </div>
      <div className="card pad-lg enter enter-d1">
        {notifications.map((n) => (
          <div key={n.title} className="flex gap14 center" style={{ padding: "14px 4px", borderTop: "1px solid var(--border)" }}>
            <div className="icon-box" style={{ background: `var(--${n.type}-soft)`, fontSize: 17 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="small bold">{n.title}</div>
              <div className="tiny muted">{n.time}</div>
            </div>
            <span className="pill pill-primary tiny" style={{ width: 8, height: 8, padding: 0, borderRadius: "50%", background: "var(--primary)" }} />
          </div>
        ))}
      </div>
    </>
  );
}
