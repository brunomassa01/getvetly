import type { Workspace } from "@/lib/workspace/db";

/**
 * Faixa de marca do cliente (whitelabel) no topo dos relatórios.
 * Só aparece se a empresa configurou logo e/ou nome de exibição.
 */
export function WhitelabelHeader({
  workspace,
}: {
  workspace: Workspace | null;
}) {
  if (!workspace) return null;
  const temLogo = !!workspace.whitelabel_logo_url;
  const nome = workspace.whitelabel_empresa_nome || workspace.nome;
  if (!temLogo && !workspace.whitelabel_empresa_nome) return null;

  return (
    <div className="flex items-center gap-3 pb-4 mb-2 border-b border-[color:var(--border-subtle)]">
      {temLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/whitelabel/${workspace.id}`}
          alt={nome}
          className="h-9 w-auto"
        />
      )}
      <span className="text-sm text-texto-3">
        Preparado por <strong className="text-ink">{nome}</strong>
      </span>
    </div>
  );
}
