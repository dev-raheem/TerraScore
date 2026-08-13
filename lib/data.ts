export type Category = { name: string; courses: number; progress: number; icon: string; color: string };

export const categories: Category[] = [
  { name: "Sales", courses: 14, progress: 62, icon: "💼", color: "#C49850" },
  { name: "CRM", courses: 9, progress: 80, icon: "🧭", color: "#043C40" },
  { name: "Registration", courses: 7, progress: 45, icon: "📝", color: "#0E7A85" },
  { name: "Banking", courses: 11, progress: 30, icon: "🏦", color: "#189267" },
  { name: "Installation", courses: 8, progress: 70, icon: "🛠️", color: "#E85D5A" },
  { name: "Service", courses: 12, progress: 88, icon: "🎧", color: "#0E6B73" },
  { name: "Finance", courses: 6, progress: 20, icon: "📊", color: "#C49850" },
  { name: "Leadership", courses: 10, progress: 55, icon: "🧑‍💼", color: "#189267" },
];

export function initials(n: string) {
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
