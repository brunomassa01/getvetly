"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ehEmailInterno } from "@/lib/auth/interno";
import { definirAnalisesGratisExtra } from "@/lib/admin/db";

const extraSchema = z.object({
  workspaceId: z.string().uuid("Empresa inválida."),
  extra: z.coerce.number().int().min(0).max(999),
});

/**
 * Concede análises grátis extras a uma empresa (teste estendido para
 * clientes estratégicos). Restrito ao admin interno.
 */
export async function definirAnalisesExtrasAction(
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!ehEmailInterno(session?.user?.email)) {
    throw new Error("Acesso restrito ao administrador interno.");
  }

  const parsed = extraSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    extra: formData.get("extra"),
  });
  if (!parsed.success) throw new Error("Valor inválido para análises extras.");

  await definirAnalisesGratisExtra(parsed.data.workspaceId, parsed.data.extra);
  revalidatePath("/admin");
}
