import Link from "next/link";
import { initials } from "@/lib/data";

type SpotlightPerson = {
  full_name: string;
  department: string | null;
  badge_icon?: string | null;
  badge_title?: string | null;
};

// Shared shell for the dashboard's "who's leading right now" card — HR sees
// it labeled as the current top scorer (with score), employees see it as
// the Employee of the Month teaser (no score, per the EomTeaser type).
export default function SpotlightBanner({
  label,
  person,
  score,
}: {
  label: string;
  person: SpotlightPerson;
  score?: number;
}) {
  return (
    <Link
      href="/eom"
      className="card pad-lg"
      style={{
        background: "linear-gradient(135deg,#021F21,#043C40 55%,#0E6B73)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          background: "rgba(255,255,255,.12)",
          borderRadius: "50%",
          top: -80,
          right: -60,
        }}
      />
      <span className="pill" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
        🏆 {label}
      </span>
      <div className="flex center gap16" style={{ marginTop: 20 }}>
        <div
          className="avatar"
          style={{ width: 74, height: 74, fontSize: 26, background: "rgba(255,255,255,.22)", border: "2px solid rgba(255,255,255,.4)" }}
        >
          {initials(person.full_name)}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{person.full_name}</div>
          <div style={{ opacity: 0.85, fontSize: 13.5 }}>{person.department ?? "—"}</div>
          {(typeof score === "number" || person.badge_title) && (
            <div className="flex gap8" style={{ marginTop: 8 }}>
              {typeof score === "number" && (
                <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>
                  Score {score}
                </span>
              )}
              {person.badge_title && (
                <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>
                  {person.badge_icon} {person.badge_title}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="btn btn-sm" style={{ background: "rgba(255,255,255,.18)", color: "#fff", marginTop: 16, width: "fit-content" }}>
        View full story →
      </div>
    </Link>
  );
}
