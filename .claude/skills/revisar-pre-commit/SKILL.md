---
name: revisar-pre-commit
description: Faz code review automático das mudanças não-comitadas, checando padrões do projeto, segurança, cobertura de teste e qualidade antes de liberar o commit. Usa esta skill quando o Bruno disser "revisa antes de commitar", "fiz mudança, pode dar uma olhada?", "está pronto pra commit?", "checa o diff aí", "vê se tem algo errado antes de eu subir", "tá ok pra commitar?", ou qualquer pedido para validar código antes do git commit.
---

# Revisar Pré-Commit

## Quando esta skill dispara

Dispara quando o Bruno terminou uma sessão de codificação e quer uma checagem antes de rodar `git commit`. Funciona como um "linter humano" que aplica os padrões do `CLAUDE.md` mais regras de segurança e qualidade.

Frases-gatilho típicas:
- "Revisa antes de commitar"
- "Fiz mudança, pode dar uma olhada?"
- "Está pronto pra commit?"
- "Checa o diff aí"
- "Tá ok pra subir?"
- "Vê se tem algo errado antes de eu commitar"

## Fluxo passo a passo

### 1. Coletar o diff

```bash
git status
git diff --stat
git diff
```

Liste:
- Arquivos modificados (com linhas +/-)
- Arquivos novos
- Arquivos deletados
- Arquivos em staging vs unstaged

Se há mudanças massivas (>500 linhas alteradas em um único commit), **avise o Bruno** e sugira quebrar em commits menores.

### 2. Analisar mudanças

Para cada arquivo modificado, leia o diff e classifique:
- **Funcional**: lógica de negócio nova
- **Refactor**: muda forma sem mudar comportamento
- **Estilo**: formatação, renomes
- **Test**: novos testes ou ajustes
- **Config/Infra**: package.json, env, docker, ci

### 3. Checar contra padrões do CLAUDE.md

Aplique checklist em cada arquivo:

#### TypeScript

- [ ] Sem `any` explícito (use `unknown` + narrowing)
- [ ] Sem `@ts-ignore` / `@ts-expect-error` sem comentário explicando
- [ ] Sem `as` cast arriscado (ex: `as User` em dado não validado)
- [ ] Tipos exportados quando reutilizados (sem duplicar interface)
- [ ] Discriminated unions onde faz sentido em vez de booleans

#### Tamanho

- [ ] Nenhuma função com mais de 40 linhas
- [ ] Nenhum arquivo com mais de 300 linhas
- [ ] Nenhum componente React com mais de 200 linhas

#### Validação

- [ ] Toda Server Action tem schema Zod no input
- [ ] Toda API Route valida body com Zod
- [ ] Toda resposta da Claude API passa por Zod antes de salvar
- [ ] Webhook do Stripe valida assinatura antes de processar

#### Banco / RLS

- [ ] Nenhuma query usa service role sem necessidade clara (e comentário)
- [ ] Migrations seguem padrão (RLS + workspace_id) — usar skill `gerar-migracao-supabase`
- [ ] Nenhum SQL bruto interpolado com input do usuário (sempre parâmetro)

#### UI

- [ ] Usa componentes shadcn/ui em vez de HTML puro quando aplicável
- [ ] Cores via tokens Tailwind (`bg-primary`, não `bg-[#abc]`)
- [ ] Estados de loading/erro/vazio presentes em telas que buscam dados
- [ ] `aria-label` em botões com só ícone

### 4. Checar segurança

- [ ] **Nenhuma key/secret hardcoded** (regex: `sk_live_`, `sk_test_`, `eyJhbG`, `xoxb-`)
- [ ] **Nada de `process.env.X` sem fallback** em código de produção
- [ ] **Sem `console.log` esquecido** — em código de produção, só `logger.info/warn/error`
- [ ] **Sem `debugger`** ou `it.only` / `describe.only`
- [ ] **Sem TODO/FIXME crítico** novo sem issue associada
- [ ] **Sem dependências novas suspeitas** — checar `package.json` se há lib desconhecida
- [ ] **Sem `dangerouslySetInnerHTML`** sem sanitização
- [ ] **Sem rotas novas sem proteção** (middleware de auth)
- [ ] **Sem exposição de dados de outros workspaces** (RLS pode estar correto mas query usar service role)

### 5. Checar testes

- [ ] Toda função nova tem ao menos teste de happy path
- [ ] Toda mudança em Server Action tem teste atualizado
- [ ] Cobertura não regrediu (`npm run test -- --coverage` se necessário)
- [ ] Nenhum `it.skip` novo

Se faltam testes, **sugira usar a skill `escrever-teste`** antes do commit.

### 6. Reportar problemas

Formato do report:

```
REVISÃO PRÉ-COMMIT — 7 arquivos, 312 linhas alteradas

BLOQUEADORES (precisam corrigir antes do commit):
  - app/actions/proposals.ts:42 — uso de `any` em parsedJson
  - app/actions/proposals.ts:78 — função uploadAndAnalyze tem 67 linhas (limite 40)
  - .env.local commitado por engano

AVISOS (recomendado corrigir):
  - components/propostas/uploader.tsx:23 — falta estado de erro
  - lib/claude.ts:15 — sem teste para o novo retry handler

OK:
  - Migration 0014 segue padrão
  - Commit message proposta está no padrão

RECOMENDAÇÃO: corrigir os 3 bloqueadores antes do commit.
```

### 7. Rodar lint, test e build

```bash
npm run lint
npm run test -- --run
npm run build
```

Se algum falhar, **mostre o erro completo** e ajude a corrigir. Não libere o commit.

### 8. Sugerir mensagem de commit

Se tudo passou, proponha mensagem em PT-BR formato Conventional Commits:

```
feat(propostas): adiciona reanalise com prompt v08

- Server Action reanalyzeProposal em app/actions/proposals.ts
- Botao "Reanalisar" no detalhe da proposta
- Teste de happy path + caso de erro
- Resolve US-067
```

Tipos válidos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `db`, `style`, `ci`.

## Regras

### Bloqueador vs Aviso

- **Bloqueador** = viola regra explícita do CLAUDE.md, problema de segurança, ou quebra build/test/lint.
- **Aviso** = boa prática violada mas não crítica.

Bloqueador trava o commit. Aviso recomenda mas o Bruno decide.

### Falsos positivos

Se o aviso é claramente errado para o caso (ex: função de 50 linhas que é puro mapeamento), aceite a exceção mas peça comentário no código explicando.

### Quando o diff é grande demais

Se o diff tem >500 linhas ou >10 arquivos, sugira:
1. Quebrar em commits temáticos (cada commit = uma intenção)
2. Mover refactor pra commit separado de feature
3. Mover formatação pra commit "chore: formata"

### Performance da revisão

Não releia arquivos inteiros se o diff é pequeno — use o `git diff` como base. Só leia o arquivo todo se precisar de contexto (ex: ver se função excede 40 linhas).

## Exemplos práticos

### Exemplo 1 — bom diff

```diff
+ export async function aprovarAnalise(input: { id: string }) {
+   const { id } = z.object({ id: z.string().uuid() }).parse(input);
+   const supabase = createClient();
+   const { error } = await supabase
+     .from("analyses")
+     .update({ status: "approved", approved_at: new Date().toISOString() })
+     .eq("id", id);
+   if (error) throw new Error("APPROVE_FAILED");
+   return { ok: true };
+ }
```

Avaliação: OK. Zod validando input, RLS cuida do escopo, sem `any`, função pequena.

### Exemplo 2 — diff com bloqueador

```diff
+ export async function uploadProposal(input: any) {
+   const supabase = createClient();
+   const { data } = await supabase.from("proposals").insert(input as any);
+   console.log("uploaded", data);
+   return data;
+ }
```

Avaliação: 4 bloqueadores —
1. `input: any` -> tipar + Zod
2. `input as any` no insert -> validar antes
3. `console.log` -> remover ou trocar por logger
4. Sem checagem de erro do Supabase

### Exemplo 3 — secret commitado

```diff
+ const STRIPE_KEY = "sk_live_51HxPaY...";
```

Avaliação: BLOQUEADOR CRÍTICO. Pare imediatamente. Instrua:
1. Remover do código
2. `git reset` para tirar do staging
3. Rotacionar a chave no Stripe (já vazou se foi para repo público)
4. Adicionar ao `.env.local` (gitignored)

## O que NÃO fazer

- **Não libere commit com `npm run lint` ou `npm run test` falhando** — nunca.
- **Não ignore aviso de secret hardcoded** — sempre bloqueador, sempre.
- **Não revise só o diff sem contexto** — se uma função muda, releia ela inteira pra checar tamanho.
- **Não aprove mensagem de commit em inglês** — projeto é PT-BR.
- **Não esqueça de checar arquivos novos não-staged** — `git status` antes do diff.
- **Não invente regras** — siga o CLAUDE.md. Se uma regra precisa existir, sugira adicionar lá.
- **Não force o Bruno a corrigir aviso menor** — bloqueador trava, aviso só sugere.
- **Não rode commit no lugar do Bruno** — você revisa, ele commita.
- **Não pule a checagem de testes** — feature sem teste passa mas com aviso.
- **Não aceite "depois eu arrumo"** para bloqueador — ou corrige agora, ou não commita.
