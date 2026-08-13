"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadTarget, deleteMaterial, saveMaterial, updateMaterial, type ActionState } from "./actions";

export type CategoryDef = { key: string; label: string; icon: string };

export type Material = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  url: string;
};

function MaterialRow({ material, isHr, categories }: { material: Material; isHr: boolean; categories: CategoryDef[] }) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(
    (_prev, formData) => deleteMaterial(formData),
    undefined
  );
  const [editState, editAction, editPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await updateMaterial(formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    undefined
  );

  if (editing) {
    return (
      <form
        action={editAction}
        className="flex col gap8"
        style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input type="hidden" name="material_id" value={material.id} />
        <div className="flex gap8 wrap">
          <select name="category" defaultValue={material.category} required className="field" style={{ minWidth: 140 }}>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <input name="title" defaultValue={material.title} required className="field" style={{ flex: 2, minWidth: 140 }} />
          <input name="description" defaultValue={material.description ?? ""} placeholder="Description (optional)" className="field" style={{ flex: 2, minWidth: 140 }} />
        </div>
        <div className="flex gap8 center">
          <button type="submit" className="btn btn-primary btn-sm" disabled={editPending}>
            {editPending ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
            Cancel
          </button>
          {editState?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{editState.error}</span>}
        </div>
      </form>
    );
  }

  return (
    <div className="flex between center gap12" style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
      <div>
        <a href={material.url} target="_blank" rel="noreferrer" className="small bold" style={{ color: "var(--primary)" }}>
          {material.title}
        </a>
        {material.description && <div className="tiny muted">{material.description}</div>}
        {deleteState?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{deleteState.error}</div>}
      </div>
      {isHr && (
        <div className="flex gap6" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="material_id" value={material.id} />
            <button type="submit" className="btn btn-outline btn-sm">✕</button>
          </form>
        </div>
      )}
    </div>
  );
}

function ResourceCard({
  category,
  categories,
  materials,
  isHr,
  expanded,
  onToggle,
}: {
  category: CategoryDef;
  categories: CategoryDef[];
  materials: Material[];
  isHr: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card pad flex col gap10" style={{ cursor: "pointer" }} onClick={onToggle}>
      <div className="icon-box" style={{ background: "var(--primary-soft)", fontSize: 18, margin: "0 auto" }}>
        {category.icon}
      </div>
      <div className="bold" style={{ textAlign: "center" }}>{category.label}</div>
      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
          {materials.length === 0 && <div className="tiny muted">No materials yet.</div>}
          {materials.map((m) => (
            <MaterialRow key={m.id} material={m} isHr={isHr} categories={categories} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadForm({ onSaved }: { onSaved: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const category = String((form.elements.namedItem("category") as HTMLSelectElement).value);
    const title = String((form.elements.namedItem("title") as HTMLInputElement).value);
    const description = String((form.elements.namedItem("description") as HTMLInputElement).value);

    setPending(true);
    setError(undefined);
    try {
      if (mode === "file") {
        const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
        if (!file) {
          setError("Choose a file.");
          return;
        }
        const target = await createUploadTarget(category, file.name);
        if ("error" in target) {
          setError(target.error);
          return;
        }
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("learning-materials")
          .uploadToSignedUrl(target.path, target.token, file);
        if (uploadError) {
          setError(uploadError.message);
          return;
        }
        const result = await saveMaterial({ category, title, description, storagePath: target.path });
        if (result?.error) {
          setError(result.error);
          return;
        }
      } else {
        const externalUrl = String((form.elements.namedItem("external_url") as HTMLInputElement).value);
        const result = await saveMaterial({ category, title, description, externalUrl });
        if (result?.error) {
          setError(result.error);
          return;
        }
      }
      formRef.current?.reset();
      router.refresh();
      onSaved();
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex col gap8" style={{ marginTop: 12 }}>
      <div className="flex gap8 wrap">
        <select name="category" required className="field" style={{ minWidth: 140 }}>
          <option value="">Category…</option>
          <option value="video">Videos</option>
          <option value="sop">SOP Library</option>
          <option value="pdf">PDFs</option>
          <option value="template">Templates</option>
          <option value="policy">Company Policies</option>
        </select>
        <input name="title" placeholder="Title" required className="field" style={{ flex: 2, minWidth: 140 }} />
        <input name="description" placeholder="Description (optional)" className="field" style={{ flex: 2, minWidth: 140 }} />
      </div>
      <div className="flex gap8 wrap center">
        <label className="tiny flex gap6 center">
          <input type="radio" name="mode" checked={mode === "file"} onChange={() => setMode("file")} /> Upload file
        </label>
        <label className="tiny flex gap6 center">
          <input type="radio" name="mode" checked={mode === "link"} onChange={() => setMode("link")} /> Paste link
        </label>
        <span className="tiny muted">Large videos: use a link (YouTube / Drive / Loom) instead of uploading.</span>
      </div>
      {mode === "file" ? (
        <input key="file" name="file" type="file" required className="field" />
      ) : (
        <input key="link" name="external_url" type="url" placeholder="https://…" required className="field" />
      )}
      <div className="flex between center">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Uploading…" : "Save material"}
        </button>
        {error && <span className="tiny" style={{ color: "var(--coral)" }}>{error}</span>}
      </div>
    </form>
  );
}

export default function Resources({
  categories,
  materialsByCategory,
  isHr,
}: {
  categories: CategoryDef[];
  materialsByCategory: Record<string, Material[]>;
  isHr: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <div className="bold" style={{ marginBottom: 12 }}>Resources</div>
      <div className="grid g5 enter" style={{ marginBottom: 18 }}>
        {categories.map((c) => (
          <ResourceCard
            key={c.key}
            category={c}
            categories={categories}
            materials={materialsByCategory[c.key] ?? []}
            isHr={isHr}
            expanded={expanded === c.key}
            onToggle={() => setExpanded(expanded === c.key ? null : c.key)}
          />
        ))}
      </div>

      <div className="card pad flex col enter">
        <div className="flex between center">
          <div className="small muted">Have training material to share?</div>
          {isHr && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setUploadOpen((v) => !v)}>
              📤 Upload material (Admin)
            </button>
          )}
        </div>
        {isHr && uploadOpen && <UploadForm onSaved={() => setUploadOpen(false)} />}
      </div>
    </>
  );
}
