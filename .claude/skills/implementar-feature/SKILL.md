---
name: implementar-feature
description: Implementa uma user story completa do MVP do zero, do banco ao frontend, seguindo os padrões do projeto. Usa esta skill quando o Bruno disser "implementa a US-123", "vamos fazer essa user story", "monta a feature de upload de proposta", "bora codar a US-045", "implementa o fluxo de aprovação", "constrói a tela de comparação", ou qualquer pedido para construir uma funcionalidade nova baseada em user story documentada.
---

# Implementar Feature (User Story do MVP)

## Quando esta skill dispara

Dispara quando o Bruno pede para implementar uma funcionalidade do MVP, geralmente referenciando um código de user story (US-001, US-042, etc.) ou descrevendo uma feature que está documentada em `docs/01-product/user-stories.md`.

Frases-gatilho típicas:
- "Implementa a US-123"
- "Vamos fazer essa user story"
- "Monta a feature de X"
- "Bora codar a US-045"
- "Constrói a tela de comparação de propostas"
- "Implementa o fluxo de upload"

## Fluxo passo a passo

### 1. Ler a user story completa

Abra `docs/01-product/user-stories.md` e localize a US referenciada. Extraia:
- **Persona** (quem usa)
- **Necessidade** (o que precisa fazer)
- **Critérios de aceite** (lista de checkboxes)
- **Dependências** (outras US que precisam estar prontas)
- **Notas técnicas** (se houver)

Se a US não existe ou está vaga, PARE e pergunte ao Bruno antes de continuar.

### 2. Planejar em 4-6 passos

Quebre a implementação em passos pequenos e independentes. Template:

```
Plano para implementar US-XXX: <título>

1. [DB]      Criar/alterar tabela X (migration + RLS)
2. [API]     Server Action para Y em app/actions/y.ts
3. [UI]      Componente Z em components/z.tsx
4. [PAGE]    Página em app/(app)/rota/page.tsx
5. [TEST]    Teste de happy path em __tests__/y.test.ts
6. [DOCS]    Atualizar CHANGELOG e marcar US como concluída

Estimativa: ~X minutos
Arquivos novos: N
Arquivos alterados: M
```

### 3. Pedir confirmação ao Bruno

Mostre o plano e pergunte: **"Pode seguir com esse plano ou quer ajustar algo?"**

Aguarde resposta. Se o Bruno pedir mudanças, refaça o plano. Não comece a implementar sem confirmação explícita.

### 4. Implementar passo a passo

Execute UM passo por vez. Após cada passo:
- Mostre o arquivo criado/alterado
- Explique em 1-2 linhas o que foi feito
- Aguarde feedback implícito (se o Bruno não interromper, continue)

**Ordem recomendada:** DB -> tipos TypeScript -> Server Action/API -> Componente -> Página -> Teste.

### 5. Escrever teste de happy path

No mínimo um teste que cobre o caminho feliz. Use a skill `escrever-teste` se precisar de testes mais completos. O teste deve:
- Estar em `__tests__/` próximo ao código testado
- Cobrir o critério de aceite principal
- Rodar em isolamento (mockar Supabase/Claude API)

### 6. Rodar lint, test e build

```bash
npm run lint
npm run test
npm run build
```

Se algum falhar, **corrija antes de prosseguir**. Não tente commitar com erro.

### 7. Commit em português

Mensagem no formato Conventional Commits, em PT-BR:

```
feat(propostas): implementa upload de PDF com extracao de texto

- Adiciona tabela proposals com RLS por workspace_id
- Server Action uploadProposal valida tamanho e tipo
- Componente PropostaUploader com drag-and-drop
- Teste de happy path cobrindo upload + parsing
- Resolve US-042
```

### 8. Marcar US como concluída

Em `docs/01-product/user-stories.md`, mude o status da US para `[DONE]` e adicione data + commit hash.

## Regras

### Código

- **TypeScript estrito**: sem `any`, sem `@ts-ignore`. Use `unknown` + narrowing quando o tipo é genuinamente desconhecido.
- **Funções <40 linhas**: se passar, quebre em helpers.
- **Arquivos <300 linhas**: se passar, divida por responsabilidade.
- **Validação Zod em toda fronteira**: Server Actions, API Routes, parsing de resposta da IA — tudo passa por um schema Zod.
- **Server Components por padrão**: só use `"use client"` quando precisar de interatividade real.

### Banco

- **RLS obrigatório**: toda tabela nova tem políticas para SELECT, INSERT, UPDATE, DELETE separadas, filtrando por `workspace_id = auth.jwt() ->> 'workspace_id'`.
- **Colunas padrão**: `id uuid pk default gen_random_uuid()`, `workspace_id uuid not null`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`.
- **Use a skill `gerar-migracao-supabase`** para criar migrations.

### UI

- **shadcn/ui primeiro**: nunca reinvente Button, Input, Dialog, Toast. Importe de `components/ui/`.
- **Tailwind via tokens**: use `bg-primary`, `text-muted-foreground` etc. Evite cores hardcoded tipo `bg-[#FF0000]`.
- **Estados de loading/erro/vazio**: toda tela que busca dados tem os três estados.
- **Acessibilidade**: `aria-label` em botões só com ícone, foco visível, navegação por teclado.

### Audit log

Toda ação que modifica dados de negócio (criar proposta, aprovar análise, mudar plano) escreve em `audit_log`:

```ts
await supabase.from('audit_log').insert({
  workspace_id,
  user_id,
  action: 'proposal.created',
  resource_id: proposal.id,
  metadata: { filename, size_bytes },
});
```

### Server Actions

Padrão:

```ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Input = z.object({ /* ... */ });

export async function minhaAction(input: z.infer<typeof Input>) {
  const parsed = Input.parse(input);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  // ... lógica
  return { ok: true, data };
}
```

## Exemplos práticos

### Exemplo 1: US-042 Upload de proposta

**Story:** Como comprador, quero enviar um PDF de proposta para que o sistema extraia o texto e crie um registro analisável.

**Plano:**
1. [DB] Migration `0007_proposals.sql` — tabela `proposals` com `file_url`, `extracted_text`, `status`
2. [API] Server Action `uploadProposal` em `app/actions/proposals.ts`
3. [UI] `<PropostaUploader />` em `components/propostas/uploader.tsx`
4. [PAGE] `app/(app)/propostas/nova/page.tsx`
5. [TEST] `__tests__/uploadProposal.test.ts`
6. [DOCS] Marcar US-042 como concluída

### Exemplo 2: US-101 Lista de propostas analisadas

**Story:** Como comprador, quero ver todas as minhas propostas com status para acompanhar o que está pronto.

**Plano:**
1. [API] Server Component fetch direto via `supabase.from('proposals').select()`
2. [UI] `<PropostasTable />` com paginação
3. [PAGE] `app/(app)/propostas/page.tsx`
4. [UI] Estados vazio + loading skeleton
5. [TEST] Teste e2e cobrindo navegação e clique em proposta

## O que NÃO fazer

- **Não comece a implementar sem ler a US completa** — você vai esquecer um critério de aceite.
- **Não pule a confirmação do plano** — o Bruno pode preferir uma abordagem diferente.
- **Não implemente tudo de uma vez sem mostrar o progresso** — quebre em passos visíveis.
- **Não use `any` "só pra desbloquear"** — resolva o tipo correto.
- **Não esqueça RLS** — uma tabela sem RLS é vazamento de dados entre clientes.
- **Não commite sem rodar lint+test+build** — quebra o CI e atrasa.
- **Não escreva commit em inglês** — o projeto é em PT-BR, manter consistência.
- **Não marque a US como concluída antes do merge** — só depois que o código está na main.
- **Não invente endpoints/tabelas que não foram planejadas** — se precisar de algo novo, replanije.
- **Não use bibliotecas novas sem perguntar** — o stack é fixo (Next 14, TS, Tailwind, shadcn, Supabase, Stripe, Claude SDK).
