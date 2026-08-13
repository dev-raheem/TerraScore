"use client";

import { useMemo, useState } from "react";
import type { Employee } from "@/lib/session";
import RowActions from "./RowActions";

type StatusFilter = "all" | "pending" | "first_login" | "active";

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (status !== "all") {
        const rowStatus = e.status === "pending" ? "pending" : e.must_change_password ? "first_login" : "active";
        if (rowStatus !== status) return false;
      }
      if (!q) return true;
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.employee_code ?? "").toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q) ||
        (e.designation ?? "").toLowerCase().includes(q)
      );
    });
  }, [employees, search, status]);

  return (
    <div className="card pad-lg enter enter-d1" style={{ overflowX: "auto" }}>
      <div className="flex gap8 wrap" style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, code, department…"
          className="field"
          style={{ flex: 1, minWidth: 220 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="field" style={{ minWidth: 160 }}>
          <option value="all">All statuses</option>
          <option value="pending">Awaiting approval</option>
          <option value="first_login">Pending first login</option>
          <option value="active">Active</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Employee code</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Role</th>
            <th>Status</th>
            <th>Score</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => (
            <tr key={e.id} className="row-hover">
              <td className="bold">{e.full_name}</td>
              <td className="mono small">{e.employee_code ?? "—"}</td>
              <td className="small">{e.email}</td>
              <td className="small">{e.department ?? "—"}</td>
              <td className="small">{e.designation ?? "—"}</td>
              <td>
                <span className={`pill ${e.role === "hr" ? "pill-gold" : "pill-primary"}`}>{e.role}</span>
              </td>
              <td>
                {e.status === "pending" ? (
                  <span className="pill pill-gold">Awaiting approval</span>
                ) : e.must_change_password ? (
                  <span className="pill pill-coral">Pending first login</span>
                ) : (
                  <span className="pill pill-emerald">Active</span>
                )}
              </td>
              <td className="mono bold">{e.overall_score}</td>
              <td style={{ textAlign: "right" }}>
                <RowActions employee={e} />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="muted small" style={{ padding: 20, textAlign: "center" }}>
                {employees.length === 0 ? "No employees yet." : "No employees match your search."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
