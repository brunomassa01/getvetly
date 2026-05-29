-- =====================================================
-- Migration 0002: Row-Level Security (RLS)
-- =====================================================
-- Toda tabela com dados de cliente tem RLS habilitado.
-- Regra geral: usuário só vê dados de workspaces onde é membro ativo.
-- Exceções documentadas inline.
-- =====================================================

-- =====================================================
-- WORKSPACES
-- Usuário vê apenas workspaces onde é membro
-- =====================================================
alter table workspaces enable row level security;

create policy "Workspaces: select se é membro"
on workspaces for select
using (id in (select auth.workspace_ids_do_usuario()));

create policy "Workspaces: insert pelo próprio usuário no signup"
on workspaces for insert
with check (true);  -- controlado pelo app, primeiro workspace é criado no signup

create policy "Workspaces: update se é admin"
on workspaces for update
using (
  id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- delete: só via service role (não permitido via UI)

-- =====================================================
-- WORKSPACE_MEMBERS
-- =====================================================
alter table workspace_members enable row level security;

create policy "Members: select se está no mesmo workspace"
on workspace_members for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Members: insert se é admin do workspace"
on workspace_members for insert
with check (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

create policy "Members: update se é admin"
on workspace_members for update
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- delete: só admin
create policy "Members: delete se é admin"
on workspace_members for delete
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- =====================================================
-- WORKSPACE_CONVITES
-- =====================================================
alter table workspace_convites enable row level security;

create policy "Convites: select se é admin do workspace"
on workspace_convites for select
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

create policy "Convites: insert se é admin"
on workspace_convites for insert
with check (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- =====================================================
-- FORNECEDORES
-- =====================================================
alter table fornecedores enable row level security;

create policy "Fornecedores: select se é membro do workspace"
on fornecedores for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Fornecedores: insert se é membro"
on fornecedores for insert
with check (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Fornecedores: update se é membro"
on fornecedores for update
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Fornecedores: delete se é admin"
on fornecedores for delete
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- =====================================================
-- PROPOSTAS
-- =====================================================
alter table propostas enable row level security;

create policy "Propostas: select se é membro"
on propostas for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Propostas: insert se é membro"
on propostas for insert
with check (
  workspace_id in (select auth.workspace_ids_do_usuario())
  and criado_por = auth.uid()
);

create policy "Propostas: update se é o criador OU admin"
on propostas for update
using (
  criado_por = auth.uid()
  or workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

create policy "Propostas: delete se é admin"
on propostas for delete
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- =====================================================
-- PROPOSTA_ARQUIVOS
-- =====================================================
alter table proposta_arquivos enable row level security;

create policy "Arquivos: select se é membro do workspace"
on proposta_arquivos for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Arquivos: insert se é membro"
on proposta_arquivos for insert
with check (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Arquivos: delete se é admin"
on proposta_arquivos for delete
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- =====================================================
-- ANÁLISES
-- =====================================================
alter table analises enable row level security;

create policy "Analises: select se é membro"
on analises for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

-- insert/update só via service role (worker do pipeline IA)
-- não criar policy permissiva — sempre usar SUPABASE_SERVICE_ROLE_KEY no worker

-- =====================================================
-- COMPARATIVOS
-- =====================================================
alter table comparativos enable row level security;

create policy "Comparativos: select se é membro"
on comparativos for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Comparativos: insert se é membro"
on comparativos for insert
with check (
  workspace_id in (select auth.workspace_ids_do_usuario())
  and criado_por = auth.uid()
);

create policy "Comparativos: update se é o criador OU admin"
on comparativos for update
using (
  criado_por = auth.uid()
  or workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- =====================================================
-- COMPARTILHAMENTOS
-- =====================================================
alter table compartilhamentos enable row level security;

create policy "Compartilhamentos: select se é membro"
on compartilhamentos for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Compartilhamentos: insert se é membro"
on compartilhamentos for insert
with check (
  workspace_id in (select auth.workspace_ids_do_usuario())
  and criado_por = auth.uid()
);

create policy "Compartilhamentos: update se é membro"
on compartilhamentos for update
using (workspace_id in (select auth.workspace_ids_do_usuario()));

-- IMPORTANTE: rota pública /r/[token] usa service role + valida token + expira_em + revogado_em
-- não criar policy permissiva por token

-- =====================================================
-- APROVAÇÕES
-- =====================================================
alter table aprovacoes enable row level security;

create policy "Aprovacoes: select se é membro"
on aprovacoes for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

-- insert via service role (vem da rota pública /r/[token])

-- =====================================================
-- ANOTAÇÕES
-- =====================================================
alter table anotacoes enable row level security;

create policy "Anotacoes: select se é membro"
on anotacoes for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

-- insert via service role (vem da rota pública /r/[token])

-- =====================================================
-- ANÁLISE_EDIÇÕES (audit)
-- =====================================================
alter table analise_edicoes enable row level security;

create policy "Edicoes: select se é membro"
on analise_edicoes for select
using (workspace_id in (select auth.workspace_ids_do_usuario()));

create policy "Edicoes: insert se é membro"
on analise_edicoes for insert
with check (
  workspace_id in (select auth.workspace_ids_do_usuario())
  and editado_por = auth.uid()
);

-- =====================================================
-- WORKSPACE_USO
-- =====================================================
alter table workspace_uso enable row level security;

create policy "Uso: select se é admin"
on workspace_uso for select
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- insert/update via service role (worker de telemetria)

-- =====================================================
-- AUDIT_LOG
-- =====================================================
alter table audit_log enable row level security;

create policy "Audit: select se é admin"
on audit_log for select
using (
  workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'admin' and ativo = true
  )
);

-- insert via service role (todo middleware)

-- =====================================================
-- FIM da migration 0002
-- =====================================================
