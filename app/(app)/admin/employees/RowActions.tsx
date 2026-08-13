"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Employee } from "@/lib/session";
import { removeEmployee } from "./actions";
import EditEmployeeModal from "./EditEmployeeModal";

export default function RowActions({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
      >
        ⋯
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 20,
            minWidth: 140,
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <Link
            href={`/admin/employees/${employee.id}`}
            className="btn btn-outline btn-sm"
            style={{ justifyContent: "flex-start" }}
            onClick={() => setOpen(false)}
          >
            Manage →
          </Link>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ justifyContent: "flex-start" }}
            onClick={() => {
              setEditing(true);
              setOpen(false);
            }}
          >
            Edit
          </button>
          <form
            action={async (formData) => {
              const result = await removeEmployee(formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              setOpen(false);
            }}
          >
            <input type="hidden" name="id" value={employee.id} />
            <button
              type="submit"
              className="btn btn-outline btn-sm"
              style={{ color: "var(--coral)", width: "100%", justifyContent: "flex-start" }}
            >
              Remove
            </button>
          </form>
          {error && <span className="tiny" style={{ color: "var(--coral)" }}>{error}</span>}
        </div>
      )}

      {editing && <EditEmployeeModal employee={employee} onClose={() => setEditing(false)} />}
    </div>
  );
}
