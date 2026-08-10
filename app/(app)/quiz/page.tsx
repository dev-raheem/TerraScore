import Ring from "@/components/Ring";

const quizLeaderboard: [string, number, string][] = [
  ["Ananya Iyer", 980, "AI"],
  ["Rahul Verma", 940, "RV"],
  ["Karan Malhotra", 910, "KM"],
  ["Divya Menon", 880, "DM"],
  ["Meera Joshi", 860, "MJ"],
];

export default function QuizPage() {
  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Quiz Dashboard</div>
          <div className="page-sub">Test what you&apos;ve learned, earn XP, unlock certificates</div>
        </div>
      </div>

      <div className="grid g2 enter enter-d1" style={{ marginBottom: 18 }}>
        <div className="card pad-lg" style={{ background: "linear-gradient(120deg,var(--primary-soft),transparent)" }}>
          <span className="pill pill-primary">🧠 Weekly quiz</span>
          <div className="bold" style={{ fontSize: 17, margin: "10px 0 4px" }}>CRM Fundamentals — Week 30</div>
          <div className="tiny muted" style={{ marginBottom: 14 }}>10 questions · 8 min · Closes in 18h</div>
          <button className="btn btn-primary btn-sm">Start quiz →</button>
        </div>
        <div className="card pad-lg" style={{ background: "linear-gradient(120deg,var(--gold-soft),transparent)" }}>
          <span className="pill pill-gold">🏆 Monthly quiz</span>
          <div className="bold" style={{ fontSize: 17, margin: "10px 0 4px" }}>Service Excellence — July</div>
          <div className="tiny muted" style={{ marginBottom: 14 }}>25 questions · 20 min · Certificate on pass</div>
          <button className="btn btn-outline btn-sm">View details</button>
        </div>
      </div>

      <div className="grid g12-8-4 enter enter-d2">
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>Quiz leaderboard — July</div>
          <table>
            <thead><tr><th>Rank</th><th>Employee</th><th>XP</th></tr></thead>
            <tbody>
              {quizLeaderboard.map(([name, xp, init], i) => (
                <tr className="row-hover" key={name}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="flex center gap10">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--primary)" }}>{init}</div>
                      {name}
                      {name === "Rahul Verma" ? <span className="pill pill-primary tiny" style={{ marginLeft: 6 }}>You</span> : null}
                    </div>
                  </td>
                  <td className="mono bold">{xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card pad-lg flex col center" style={{ textAlign: "center" }}>
          <Ring percent={78} size={120} strokeWidth={10} colors={["#C49850", "#F3C365"]} center="6" sub="Certificates earned" />
          <div className="tiny muted" style={{ marginTop: 10 }}>2 more to unlock the Platinum learner badge</div>
        </div>
      </div>
    </>
  );
}
