# API Reference

Endpoints do produto. Implementados como Next.js Route Handlers (`app/api/.../route.ts`) ou Server Actions quando possível.

## Convenções gerais

- **Autenticação**: cookie de sessão Supabase Auth (lido via `createServerClient`)
- **Resposta de erro padrão**: `{ "error": { "code": "string", "message": "string", "details": object? } }` com status HTTP apropriado
- **Validação**: toda entrada validada com Zod antes de chegar no banco
- **Rate limiting**: Upstash Ratelimit, 60 req/min por usuário, 1000 req/min por workspace
- **CORS**: bloqueado por padrão; rotas públicas (`/api/r/*`) liberadas

## Rotas

### Auth (Supabase Auth gerencia)

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/signup` | Server Action — cria user + workspace inicial |
| POST | `/api/auth/login` | Server Action — login com e-mail/senha |
| POST | `/api/auth/magic-link` | Server Action — envia magic link |
| POST | `/api/auth/logout` | Server Action — encerra sessão |
| POST | `/api/auth/recuperar` | Envia e-mail de reset |
| POST | `/api/auth/reset` | Confirma reset com token + nova senha |

### Workspace

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/workspace` | — | dados do workspace atual |
| PATCH | `/api/workspace` | `{ nome, cnpj, segmento, tamanho }` | atualizado |
| GET | `/api/workspace/members` | — | lista de membros |
| POST | `/api/workspace/convites` | `{ email, role }` | convite enviado |
| GET | `/api/workspace/convites` | — | lista de convites pendentes |
| DELETE | `/api/workspace/convites/:id` | — | revoga convite |
| GET | `/api/workspace/uso` | `?periodo=YYYY-MM` | uso do período |

### Whitelabel

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/workspace/whitelabel` | — | config atual |
| PUT | `/api/workspace/whitelabel` | `{ empresa_nome, cor_primaria, cor_secundaria, logo_url }` | atualizado |
| POST | `/api/workspace/whitelabel/logo` | FormData(logo) | URL pública (signed) |

### Fornecedores

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/fornecedores` | `?q=&segmento=` | lista paginada |
| GET | `/api/fornecedores/:id` | — | detalhe + propostas relacionadas |
| POST | `/api/fornecedores` | `{ nome, cnpj?, segmento?, ... }` | criado |
| PATCH | `/api/fornecedores/:id` | parcial | atualizado |
| DELETE | `/api/fornecedores/:id` | — | soft delete (`ativo = false`) |

### Propostas

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/propostas` | `?status=&fornecedor_id=&q=` | lista paginada |
| GET | `/api/propostas/:id` | — | proposta + análise |
| POST | `/api/propostas` | `{ titulo, categoria, escopo, fornecedor_id, aprovador_email? }` | proposta criada (status `draft`) |
| PATCH | `/api/propostas/:id` | parcial | atualizada |
| DELETE | `/api/propostas/:id` | — | hard delete (cascade) |
| POST | `/api/propostas/:id/processar` | — | dispara worker IA |
| POST | `/api/propostas/:id/reprocessar` | — | refaz análise |
| POST | `/api/propostas/:id/arquivar` | — | status `archived` |
| GET | `/api/propostas/:id/pdf` | — | gera PDF e retorna URL signed |

### Upload de arquivos

| Método | Rota | Body | Resposta |
|---|---|---|---|
| POST | `/api/propostas/:id/arquivos` | FormData(file) | metadata + URL signed temporária |
| GET | `/api/propostas/:id/arquivos` | — | lista de arquivos |
| DELETE | `/api/propostas/:id/arquivos/:fid` | — | remove arquivo |

**Limites:**
- 10 arquivos por proposta
- 50 MB por arquivo
- 100 MB total por proposta
- Formatos: PDF, DOCX, XLSX, XLS, CSV, PNG, JPG, JPEG

### Análises (edição manual)

| Método | Rota | Body | Resposta |
|---|---|---|---|
| PATCH | `/api/analises/:id` | `{ campo, valor_novo }` | salva e cria audit |
| GET | `/api/analises/:id/historico` | — | lista de edições |

### Comparativos

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/comparativos` | — | lista |
| GET | `/api/comparativos/:id` | — | detalhe |
| POST | `/api/comparativos` | `{ titulo, proposta_ids: [uuid] }` | dispara geração |
| DELETE | `/api/comparativos/:id` | — | remove |

### Compartilhamentos

| Método | Rota | Body | Resposta |
|---|---|---|---|
| POST | `/api/compartilhamentos` | `{ proposta_id?, comparativo_id?, expira_dias, permite_aprovar, destinatario? }` | link gerado |
| GET | `/api/compartilhamentos` | `?proposta_id=` | lista |
| DELETE | `/api/compartilhamentos/:id` | — | revoga |
| GET | `/api/compartilhamentos/:id/aprovacoes` | — | lista de decisões |

### Rota pública (revisor sem login)

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/r/:token` | — | dados da análise (se válida e não expirada) |
| POST | `/api/r/:token/visualizar` | — | registra view |
| POST | `/api/r/:token/aprovar` | `{ revisor_nome, revisor_email?, decisao, justificativa? }` | salva aprovação |
| POST | `/api/r/:token/anotar` | `{ secao, texto_selecionado, comentario, autor_nome, autor_email? }` | salva anotação |

**Observação**: estas rotas usam SERVICE_ROLE no servidor + validam token rigorosamente. RLS não aplica.

### Billing

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/billing/portal` | — | URL do Stripe Customer Portal |
| POST | `/api/billing/checkout` | `{ tier, ciclo: 'mensal' \| 'anual' }` | URL do Stripe Checkout |
| GET | `/api/billing/faturas` | — | lista de invoices |
| POST | `/api/webhooks/stripe` | (assinado) | sincroniza eventos |

### Auditoria e admin

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/api/admin/audit-log` | `?recurso=&periodo=` | log (só admin) |
| GET | `/api/admin/saude` | — | health check + métricas |

## Padrão de resposta de sucesso

```json
{
  "data": { ... },
  "meta": {
    "total": 42,
    "pagina": 1,
    "por_pagina": 20,
    "tem_proxima": true
  }
}
```

## Padrão de resposta de erro

```json
{
  "error": {
    "code": "PROPOSTA_NAO_ENCONTRADA",
    "message": "A proposta solicitada não foi encontrada ou você não tem acesso.",
    "details": { "id": "abc-123" }
  }
}
```

**Códigos de erro padronizados:**

| Code | Status HTTP | Quando |
|---|---|---|
| `NAO_AUTENTICADO` | 401 | Sem sessão |
| `SEM_PERMISSAO` | 403 | Tem sessão mas não pode acessar recurso |
| `RECURSO_NAO_ENCONTRADO` | 404 | ID inválido ou não pertence ao workspace |
| `VALIDACAO_FALHOU` | 422 | Zod rejeitou input (details tem campo + erro) |
| `LIMITE_TIER_EXCEDIDO` | 402 | Passou limite do plano |
| `RATE_LIMIT` | 429 | Muitas requisições |
| `ERRO_INTERNO` | 500 | Bug nosso (Sentry capturou) |

## Server Actions vs Route Handlers

| Use Server Action quando | Use Route Handler quando |
|---|---|
| Form submission no app | Webhook externo (Stripe, email) |
| Mutation do usuário logado | Rota pública (revisor externo) |
| Não precisa de URL nomeada | API consumida por externos |
| Quer cache automático do Next | Precisa controle fino de cache |

## Testes

Toda rota tem teste:
- **Unit** do parser de input (Zod)
- **Integration** do happy path + 2 error paths
- **E2E** Playwright das rotas críticas (auth, upload, análise, billing)

Veja `docs/05-testing/strategy.md` para detalhes.
