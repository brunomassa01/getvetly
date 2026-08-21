-- 0010: análises grátis extras por workspace.
-- O admin interno concede um bônus de análises de teste para clientes
-- estratégicos: o limite grátis passa a ser ANALISES_GRATIS + este extra.
-- Não precisa de grant novo: os grants de workspaces são por tabela e já
-- cobrem colunas novas.

alter table workspaces
  add column if not exists analises_gratis_extra integer not null default 0
    check (analises_gratis_extra >= 0);

comment on column workspaces.analises_gratis_extra is
  'Bônus de análises grátis concedido pelo admin interno (teste estendido).';
