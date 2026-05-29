-- =====================================================
-- Migration 0001: Schema inicial
-- =====================================================
-- Cria tabelas principais do produto.
-- RLS é configurado em 0002_rls_policies.sql
-- Rodar via Supabase CLI: supabase db push
-- =====================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- WORKSPACES (1 por empresa)
-- =====================================================
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  segmento text,                                    -- ex: 'industria', 'servicos', 'varejo'
  tamanho text,                                     -- ex: 'pequena', 'media', 'grande'
  tier text not null default 'starter',             -- starter|pro|business|enterprise
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  trial_ends_at timestamptz,
  -- whitelabel
  whitelabel_logo_url text,
  whitelabel_cor_primaria text default '#0A0A0A',
  whitelabel_cor_secundaria text default '#C8FF02',
  whitelabel_empresa_nome text,
  -- onboarding
  onboarding_completo boolean not null default false,
  job_principal text,                               -- 'comparar' | 'analisar' | 'ambos'
  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspaces_stripe_customer on workspaces(stripe_customer_id);

-- =====================================================
-- USUÁRIOS DO WORKSPACE
-- Liga workspaces ↔ auth.users (Supabase Auth)
-- =====================================================
create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',              -- 'admin' | 'member'
  nome text,
  email text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create index idx_workspace_members_user on workspace_members(user_id);
create index idx_workspace_members_workspace on workspace_members(workspace_id);

-- =====================================================
-- CONVITES PENDENTES
-- =====================================================
create table workspace_convites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  convidado_por uuid references auth.users(id),
  expira_em timestamptz not null default (now() + interval '7 days'),
  aceito_em timestamptz,
  created_at timestamptz not null default now()
);

create index idx_convites_token on workspace_convites(token);
create index idx_convites_email on workspace_convites(email);

-- =====================================================
-- FORNECEDORES
-- Cadastro central por workspace
-- =====================================================
create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  nome text not null,
  cnpj text,
  email text,
  telefone text,
  endereco text,
  segmento text,                                    -- categoria principal
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_fornecedores_workspace on fornecedores(workspace_id);
create index idx_fornecedores_nome on fornecedores using gin (to_tsvector('portuguese', nome));

-- =====================================================
-- PROPOSTAS
-- =====================================================
create type proposta_status as enum (
  'draft',           -- recém-criada, aguardando upload
  'uploading',       -- arquivos sendo enviados
  'processing',      -- IA processando
  'ready',           -- análise pronta
  'failed',          -- falha no processamento
  'archived'         -- arquivada manualmente
);

create type proposta_categoria as enum (
  'midia',
  'software',
  'servicos',
  'produtos',
  'brindes',
  'outro'
);

create table propostas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  fornecedor_id uuid references fornecedores(id) on delete set null,
  criado_por uuid not null references auth.users(id),
  -- identificação
  titulo text not null,                             -- "Campanha CLT - Eletromidia"
  categoria proposta_categoria not null,
  escopo text,                                      -- "São Paulo, 28 dias"
  aprovador_email text,                             -- pré-preenche link compartilhável
  -- valores
  valor_tabela numeric(14,2),
  valor_negociado numeric(14,2),
  desconto_pct numeric(5,2),
  economia numeric(14,2),
  moeda text default 'BRL',
  -- período da proposta
  periodo_inicio date,
  periodo_fim date,
  validade date,
  -- pipeline
  status proposta_status not null default 'draft',
  status_message text,                              -- mensagem de erro se failed
  processamento_iniciado_em timestamptz,
  processamento_concluido_em timestamptz,
  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_propostas_workspace on propostas(workspace_id);
create index idx_propostas_fornecedor on propostas(fornecedor_id);
create index idx_propostas_status on propostas(status);
create index idx_propostas_criado_por on propostas(criado_por);

-- =====================================================
-- ARQUIVOS DA PROPOSTA
-- =====================================================
create table proposta_arquivos (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references propostas(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  nome_original text not null,
  nome_storage text not null,                       -- path no Supabase Storage
  mime_type text not null,
  tamanho_bytes bigint not null,
  -- conteúdo extraído
  texto_extraido text,
  metadata jsonb,                                   -- { paginas, abas, palavras_chave }
  parsing_status text default 'pending',            -- pending|done|failed
  parsing_erro text,
  parsing_concluido_em timestamptz,
  created_at timestamptz not null default now()
);

create index idx_arquivos_proposta on proposta_arquivos(proposta_id);
create index idx_arquivos_workspace on proposta_arquivos(workspace_id);

-- =====================================================
-- ANÁLISES (output da IA)
-- =====================================================
create table analises (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references propostas(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  versao integer not null default 1,                -- incrementa se reanálise
  -- conteúdo estruturado (JSON validado por Zod no app)
  payload jsonb not null,
  -- meta da IA
  modelo_usado text,                                -- 'claude-sonnet-4-6'
  prompt_versao text,                               -- 'v1.2.0'
  tokens_input integer,
  tokens_output integer,
  custo_usd numeric(10,4),
  latencia_ms integer,
  -- timestamps
  created_at timestamptz not null default now()
);

create index idx_analises_proposta on analises(proposta_id);
create index idx_analises_workspace on analises(workspace_id);
create unique index idx_analises_proposta_versao on analises(proposta_id, versao);

-- =====================================================
-- COMPARATIVOS (entre 2-5 propostas)
-- =====================================================
create table comparativos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  criado_por uuid not null references auth.users(id),
  titulo text not null,
  proposta_ids uuid[] not null,                     -- referência a propostas
  payload jsonb not null,                           -- output estruturado
  recomendacao text,                                -- texto narrativo
  vencedor_proposta_id uuid references propostas(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_comparativos_workspace on comparativos(workspace_id);

-- =====================================================
-- LINKS COMPARTILHÁVEIS
-- =====================================================
create table compartilhamentos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  -- pode apontar para análise ou comparativo
  proposta_id uuid references propostas(id) on delete cascade,
  comparativo_id uuid references comparativos(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'base64url'),
  criado_por uuid not null references auth.users(id),
  permite_aprovar boolean not null default true,
  expira_em timestamptz not null default (now() + interval '15 days'),
  revogado_em timestamptz,
  -- destinatário sugerido
  destinatario_email text,
  destinatario_nome text,
  -- métricas
  visualizacoes integer not null default 0,
  primeira_visualizacao_em timestamptz,
  ultima_visualizacao_em timestamptz,
  created_at timestamptz not null default now(),
  constraint chk_compartilhamento_alvo check (
    (proposta_id is not null and comparativo_id is null) or
    (proposta_id is null and comparativo_id is not null)
  )
);

create index idx_compartilhamentos_token on compartilhamentos(token);
create index idx_compartilhamentos_workspace on compartilhamentos(workspace_id);

-- =====================================================
-- APROVAÇÕES (input do revisor externo)
-- =====================================================
create type aprovacao_decisao as enum (
  'aprovado',
  'aprovado_com_ressalvas',
  'recusado'
);

create table aprovacoes (
  id uuid primary key default gen_random_uuid(),
  compartilhamento_id uuid not null references compartilhamentos(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  -- quem decidiu (pessoa externa, sem auth.users)
  revisor_nome text not null,
  revisor_email text,
  -- decisão
  decisao aprovacao_decisao not null,
  justificativa text,
  -- audit
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_aprovacoes_compartilhamento on aprovacoes(compartilhamento_id);
create index idx_aprovacoes_workspace on aprovacoes(workspace_id);

-- =====================================================
-- ANOTAÇÕES INLINE (no relatório compartilhado)
-- =====================================================
create table anotacoes (
  id uuid primary key default gen_random_uuid(),
  compartilhamento_id uuid not null references compartilhamentos(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  secao text not null,                              -- ex: 'analise.pros[2]'
  texto_selecionado text,
  comentario text not null,
  autor_nome text not null,
  autor_email text,
  resolvido boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_anotacoes_compartilhamento on anotacoes(compartilhamento_id);

-- =====================================================
-- EDIÇÕES MANUAIS DA ANÁLISE (audit log)
-- =====================================================
create table analise_edicoes (
  id uuid primary key default gen_random_uuid(),
  analise_id uuid not null references analises(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  editado_por uuid not null references auth.users(id),
  campo text not null,                              -- ex: 'pros[2]'
  valor_antigo text,
  valor_novo text,
  created_at timestamptz not null default now()
);

create index idx_edicoes_analise on analise_edicoes(analise_id);

-- =====================================================
-- USO/BILLING (telemetria)
-- =====================================================
create table workspace_uso (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fim date not null,
  analises_realizadas integer not null default 0,
  comparativos_realizados integer not null default 0,
  storage_bytes bigint not null default 0,
  custo_ia_usd numeric(10,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, periodo_inicio)
);

create index idx_uso_workspace_periodo on workspace_uso(workspace_id, periodo_inicio);

-- =====================================================
-- AUDIT LOG (toda ação importante)
-- =====================================================
create table audit_log (
  id bigserial primary key,
  workspace_id uuid references workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  acao text not null,                               -- 'proposta.criada', 'compartilhamento.gerado', etc
  recurso_tipo text not null,                       -- 'proposta', 'compartilhamento'
  recurso_id uuid,
  metadata jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_workspace on audit_log(workspace_id, created_at desc);
create index idx_audit_recurso on audit_log(recurso_tipo, recurso_id);

-- =====================================================
-- TRIGGER: atualizar updated_at automaticamente
-- =====================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_workspaces_updated before update on workspaces
  for each row execute function set_updated_at();
create trigger trg_fornecedores_updated before update on fornecedores
  for each row execute function set_updated_at();
create trigger trg_propostas_updated before update on propostas
  for each row execute function set_updated_at();
create trigger trg_comparativos_updated before update on comparativos
  for each row execute function set_updated_at();
create trigger trg_uso_updated before update on workspace_uso
  for each row execute function set_updated_at();

-- =====================================================
-- HELPER: pega workspace_id do usuário logado
-- Usado nas RLS policies
-- =====================================================
create or replace function auth.workspace_ids_do_usuario()
returns setof uuid as $$
  select workspace_id
  from workspace_members
  where user_id = auth.uid() and ativo = true;
$$ language sql stable security definer;

-- =====================================================
-- FIM da migration 0001
-- =====================================================
