import Link from "next/link";
import BarMini from "@/components/BarMini";
import { categories } from "@/lib/data";

const trainingCalendar: [string, string][] = [
  ["Aug 3", "Guest lecture: Negotiation tactics with Meena Advani"],
  ["Aug 8", "Workshop: CRM data hygiene best practices"],
  ["Aug 14", "SOP refresher: Installation safety checklist"],
];

const featured: [string, string][] = [
  ["Featured", "Handling escalations with empathy"],
  ["New", "Q3 CRM pipeline update walkthrough"],
  ["New", "Finance basics for non-finance roles"],
];

export default function LearningPage() {
  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Learning & Development</div>
          <div className="page-sub">Grow your skills, earn certificates, climb the quiz leaderboard</div>
        </div>
        <Link href="/quiz" className="btn btn-primary btn-sm">Go to quizzes →</Link>
      </div>

      <div className="card pad-lg enter enter-d1" style={{ marginBottom: 18, background: "linear-gradient(120deg,var(--primary-soft),transparent)" }}>
        <div className="flex between wrap" style={{ gap: 20 }}>
          <div>
            <span className="pill pill-primary">▶ Continue learning</span>
            <div className="bold" style={{ fontSize: 18, marginTop: 10 }}>Advanced Objection Handling — Service Track</div>
            <div className="tiny muted" style={{ margin: "6px 0 12px" }}>Module 4 of 6 · 12 min left</div>
            <BarMini pct={64} />
          </div>
          <button className="btn btn-primary">Resume course</button>
        </div>
      </div>

      <div className="bold" style={{ marginBottom: 12 }}>Browse by category</div>
      <div className="grid g4 enter enter-d2" style={{ marginBottom: 22 }}>
        {categories.map((c) => (
          <div key={c.name} className="card pad flex col gap10">
            <div className="flex between center">
              <div className="icon-box" style={{ background: `${c.color}22`, fontSize: 18 }}>{c.icon}</div>
              <span className="tiny muted">{c.courses} modules</span>
            </div>
            <div className="bold">{c.name}</div>
            <BarMini pct={c.progress} color={c.color} />
            <div className="tiny muted">{c.progress}% complete</div>
          </div>
        ))}
      </div>

      <div className="grid g2 enter enter-d3" style={{ marginBottom: 18 }}>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>📅 Training calendar</div>
          {trainingCalendar.map(([d, t]) => (
            <div key={t} className="flex gap12" style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
              <div className="pill pill-sky tiny mono" style={{ minWidth: 56, justifyContent: "center" }}>{d}</div>
              <div className="small">{t}</div>
            </div>
          ))}
        </div>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>⭐ Featured & recently added</div>
          {featured.map(([tag, t]) => (
            <div key={t} className="flex between gap12" style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
              <div className="small">{t}</div>
              <span className={`pill ${tag === "Featured" ? "pill-gold" : "pill-emerald"} tiny`}>{tag}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card pad flex between center enter enter-d4">
        <div className="small muted">Have training material to share?</div>
        <button className="btn btn-outline btn-sm">📤 Upload material (Admin)</button>
      </div>
    </>
  );
}
