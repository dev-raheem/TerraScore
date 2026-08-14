"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";

export type SimpleActionState = { error?: string } | undefined;

function parseOfficeForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const radiusMeters = Number(formData.get("radius_meters") || 150);
  const address = String(formData.get("address") || "").trim() || null;
  const timezone = String(formData.get("timezone") || "Asia/Kolkata").trim();
  const status = String(formData.get("status") || "active");

  if (!name) return { error: "Office name is required." } as const;
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) return { error: "Invalid latitude." } as const;
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) return { error: "Invalid longitude." } as const;
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return { error: "Geofence radius must be a positive number of meters." } as const;
  if (status !== "active" && status !== "inactive") return { error: "Invalid status." } as const;

  return { name, latitude, longitude, radiusMeters, address, timezone, status } as const;
}

export async function createOffice(_prevState: SimpleActionState, formData: FormData): Promise<SimpleActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const parsed = parseOfficeForm(formData);
  if ("error" in parsed) return parsed;

  const admin = createAdminClient();
  const { error } = await admin.from("ts_offices").insert({
    name: parsed.name,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    radius_meters: parsed.radiusMeters,
    address: parsed.address,
    timezone: parsed.timezone,
    status: parsed.status,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/offices");
}

export async function updateOffice(_prevState: SimpleActionState, formData: FormData): Promise<SimpleActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing office." };

  const parsed = parseOfficeForm(formData);
  if ("error" in parsed) return parsed;

  const admin = createAdminClient();
  const { error } = await admin
    .from("ts_offices")
    .update({
      name: parsed.name,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      radius_meters: parsed.radiusMeters,
      address: parsed.address,
      timezone: parsed.timezone,
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/offices");
  revalidatePath("/admin/live-tracking");
}

export async function assignEmployeeOffice(_prevState: SimpleActionState, formData: FormData): Promise<SimpleActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  const officeId = String(formData.get("office_id") || "").trim() || null;
  if (!employeeId) return { error: "Missing employee." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_employees").update({ office_id: officeId }).eq("id", employeeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/admin/live-tracking");
}
