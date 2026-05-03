"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isGlobalAuthenticated } from "@/lib/auth";
import {
  createOperatingUnit,
  setOperatingUnitAccessCode,
  setOperatingUnitRoleCode,
  updateOperatingUnit,
} from "@/lib/operating-unit-store";

function textFrom(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireAdminMutation(): Promise<void> {
  const authenticated = await isGlobalAuthenticated();
  if (!authenticated) {
    redirect("/?auth=required");
  }
}

export async function createOperatingUnitAction(formData: FormData): Promise<void> {
  await requireAdminMutation();

  const accessPassword = textFrom(formData, "accessPassword").trim();
  const angelPassword = textFrom(formData, "angelPassword").trim();
  const adminPassword = textFrom(formData, "adminPassword").trim();
  if (!accessPassword) {
    redirect("/admin/operating-units/new?unit=access-code-required");
  }
  if (!angelPassword) {
    redirect("/admin/operating-units/new?unit=angel-code-required");
  }
  if (!adminPassword) {
    redirect("/admin/operating-units/new?unit=admin-code-required");
  }

  await createOperatingUnit({
    slug: textFrom(formData, "slug"),
    name: textFrom(formData, "name"),
    description: textFrom(formData, "description"),
    accessPassword,
    angelPassword,
    adminPassword,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/operating-units");
  redirect("/admin/operating-units?unit=created");
}

export async function updateOperatingUnitAction(formData: FormData): Promise<void> {
  await requireAdminMutation();

  const slug = textFrom(formData, "slug");
  await updateOperatingUnit({
    slug,
    name: textFrom(formData, "name"),
    description: textFrom(formData, "description"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/operating-units");
  revalidatePath(`/admin/operating-units/${encodeURIComponent(slug)}/edit`);
  redirect("/admin/operating-units?unit=updated");
}

export async function updateOperatingUnitAccessCodeAction(
  formData: FormData
): Promise<void> {
  const slug = textFrom(formData, "slug");
  const editPath = `/admin/operating-units/${encodeURIComponent(slug)}/edit`;

  await requireAdminMutation();

  const password = textFrom(formData, "accessPassword").trim();
  if (!password) {
    redirect(`${editPath}?unit=access-code-required`);
  }

  await setOperatingUnitAccessCode({
    slug,
    password,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/operating-units");
  revalidatePath(editPath);
  redirect(`${editPath}?unit=access-code-updated`);
}

export async function updateOperatingUnitAngelCodeAction(
  formData: FormData
): Promise<void> {
  const slug = textFrom(formData, "slug");
  const editPath = `/admin/operating-units/${encodeURIComponent(slug)}/edit`;

  await requireAdminMutation();

  const password = textFrom(formData, "angelPassword").trim();
  if (!password) {
    redirect(`${editPath}?unit=angel-code-required`);
  }

  await setOperatingUnitRoleCode({
    slug,
    role: "angel",
    password,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/operating-units");
  revalidatePath(editPath);
  redirect(`${editPath}?unit=angel-code-updated`);
}

export async function updateOperatingUnitAdminCodeAction(
  formData: FormData
): Promise<void> {
  const slug = textFrom(formData, "slug");
  const editPath = `/admin/operating-units/${encodeURIComponent(slug)}/edit`;

  await requireAdminMutation();

  const password = textFrom(formData, "adminPassword").trim();
  if (!password) {
    redirect(`${editPath}?unit=admin-code-required`);
  }

  await setOperatingUnitRoleCode({
    slug,
    role: "admin",
    password,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/operating-units");
  revalidatePath(editPath);
  redirect(`${editPath}?unit=admin-code-updated`);
}
