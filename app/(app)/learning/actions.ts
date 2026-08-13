"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";

export type ActionState = { error?: string } | undefined;

const BUCKET = "learning-materials";
const CATEGORIES = ["video", "sop", "pdf", "template", "policy"] as const;

function isValidCategory(category: string) {
  return (CATEGORIES as readonly string[]).includes(category);
}

// Files never cross the Server Action boundary as multipart bytes — the
// client uploads directly to Supabase Storage using this signed URL, then
// calls saveMaterial() with just the resulting path (plain text fields).
export async function createUploadTarget(
  category: string,
  filename: string
): Promise<{ error: string } | { path: string; token: string }> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  if (!isValidCategory(category)) return { error: "Choose a valid category." };
  if (!filename) return { error: "Missing file name." };

  const path = `${category}/${Date.now()}-${filename}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not prepare upload." };

  return { path: data.path, token: data.token };
}

export async function saveMaterial(input: {
  category: string;
  title: string;
  description?: string;
  storagePath?: string;
  externalUrl?: string;
}): Promise<ActionState> {
  let hrId: string;
  try {
    hrId = await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const category = input.category;
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";
  const storagePath = input.storagePath?.trim() ?? "";
  const externalUrl = input.externalUrl?.trim() ?? "";

  if (!isValidCategory(category)) return { error: "Choose a valid category." };
  if (!title) return { error: "Title is required." };
  if (!!storagePath === !!externalUrl) return { error: "Provide either a file or a link, not both." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_learning_materials").insert({
    category,
    title,
    description: description || null,
    external_url: externalUrl || null,
    storage_path: storagePath || null,
    uploaded_by: hrId,
  });
  if (error) {
    if (storagePath) await admin.storage.from(BUCKET).remove([storagePath]);
    return { error: error.message };
  }

  revalidatePath("/learning");
}

export async function updateMaterial(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const materialId = String(formData.get("material_id") || "");
  const category = String(formData.get("category") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!materialId) return { error: "Missing material." };
  if (!isValidCategory(category)) return { error: "Choose a valid category." };
  if (!title) return { error: "Title is required." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("ts_learning_materials")
    .update({ category, title, description: description || null })
    .eq("id", materialId);
  if (error) return { error: error.message };

  revalidatePath("/learning");
}

export async function deleteMaterial(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const materialId = String(formData.get("material_id") || "");
  if (!materialId) return { error: "Missing material." };

  const admin = createAdminClient();
  const { data: material } = await admin
    .from("ts_learning_materials")
    .select("storage_path")
    .eq("id", materialId)
    .single();

  const { error } = await admin.from("ts_learning_materials").delete().eq("id", materialId);
  if (error) return { error: error.message };

  if (material?.storage_path) {
    await admin.storage.from(BUCKET).remove([material.storage_path]);
  }

  revalidatePath("/learning");
}
