---
name: escrever-teste
description: Gera testes automatizados (unit, integration ou e2e) para código existente do SaaS, usando Vitest ou Playwright conforme o caso. Usa esta skill quando o Bruno disser "escreve teste pra essa função", "preciso de coverage no módulo de propostas", "adiciona um e2e do fluxo de upload", "monta os testes dessa Server Action", "faz um teste pro webhook do Stripe", "cobre essa rota com testes", ou qualquer pedido para criar/melhorar testes.
---

# Escrever Teste

## Quando esta skill dispara

Dispara quando o Bruno pede testes para código já existente — seja para aumentar coverage, validar uma mudança recente, ou cobrir um fluxo crítico antes de produção.

Frases-gatilho típicas:
- "Escreve teste pra X"
- "Preciso de coverage em Y"
- "Adiciona e2e do fluxo de Z"
- "Faz um teste pro webhook do Stripe"
- "Monta os testes dessa Server Action"
- "Cobre essa função com unit test"

## Fluxo passo a passo

### 1. Ler o código alvo

Use `Read` no arquivo específico. Se ele importa outros módulos relevantes (helpers, schemas Zod, queries Supabase), leia esses também. Entenda:
- O que a função/módulo faz
- Quais são as entradas (tipos, validações)
- Quais são as saídas (sucesso, erros lançados)
- Quais são as dependências externas (Supabase, Stripe, Claude API, fs)

### 2. Identificar branches críticos

Liste mentalmente todos os caminhos de execução:
- **Happy path**: tudo certo, retorno esperado
- **Edge cases**: input vazio, valor no limite, lista com 1 item, lista com 1000
- **Error cases**: input inválido, dependência fora do ar, sem permissão (RLS)
- **Boundary**: usuário não autenticado, workspace diferente

### 3. Propor casos de teste

Antes de escrever, mostre ao Bruno a lista de casos:

```
Casos de teste propostos para uploadProposal:

[Happy]
- Upload de PDF válido cria registro em proposals
- Status inicial é 'pending'

[Edge]
- Arquivo de exatamente 10MB (limite) passa
- Nome com acentos é preservado

[Error]
- Arquivo > 10MB rejeitado com mensagem clara
- Tipo .exe rejeitado
- Usuário não autenticado retorna UNAUTHORIZED
- Workspace inexistente retorna FORBIDDEN
```

Aguarde aprovação ou ajustes antes de codar.

### 4. Escrever os testes

Escolha o tipo certo:

| Tipo | Quando usar | Ferramenta |
|------|-------------|------------|
| Unit | Função pura, lógica isolada, validação Zod | Vitest |
| Integration | Server Action, route handler, query no banco | Vitest + mock Supabase |
| E2E | Fluxo de usuário completo no navegador | Playwright |

### 5. Rodar e ajustar

```bash
npm run test                    # Vitest watch
npm run test -- --run           # uma vez
npm run test:e2e                # Playwright
```

Se falhar, **leia o erro com calma**, ajuste e rode de novo. Não passe ao próximo caso se o atual está vermelho.

## Regras

### Estrutura

- **Localização**: `__tests__/` ao lado do código testado, ou `tests/e2e/` para Playwright.
- **Nome do arquivo**: `<arquivo-original>.test.ts` ou `<feature>.e2e.ts`.
- **Padrão AAA**: Arrange, Act, Assert — bem separados por linha em branco.
- **Um `it()` por comportamento** — não amontoe múltiplas assertions sobre coisas diferentes.

### Mocks

**Supabase** (use `@/lib/supabase/__mocks__/server.ts`):

```ts
import { vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: { id: "prop-1" }, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { /* fixture */ }, error: null }),
    })),
  }),
}));
```

**Claude API**:

```ts
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: '{"score": 8.5, "veredito": "aprovar"}' }],
      }),
    },
  })),
}));
```

**Stripe webhook**:

```ts
import { buildWebhookRequest } from "@/tests/helpers/stripe";

const req = buildWebhookRequest({
  type: "checkout.session.completed",
  data: { object: { customer: "cus_123", metadata: { workspace_id: "ws-1" } } },
});
```

### Server Actions

Teste como função normal — chame e verifique retorno + side effects:

```ts
import { uploadProposal } from "@/app/actions/proposals";

it("cria registro em proposals quando PDF é válido", async () => {
  const result = await uploadProposal({
    file: fakePdf(),
    workspaceId: "ws-1",
  });

  expect(result.ok).toBe(true);
  expect(result.data.id).toMatch(/^prop-/);
});
```

### Geração de fixtures

Mantenha em `tests/fixtures/`:
- `propostas/proposta-valida.pdf` — PDF real pequeno (~10KB)
- `propostas/proposta-grande.pdf` — PDF >10MB para testar limite
- `propostas/proposta-imagem.pdf` — só imagem, sem texto extraível
- `respostas-claude/analise-completa.json` — payload válido
- `respostas-claude/analise-quebrada.json` — JSON malformado

Helper para PDFs sintéticos em teste:

```ts
import { PDFDocument } from "pdf-lib";

export async function fakePdf(text = "Proposta de teste R$ 10.000") {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  page.drawText(text, { x: 50, y: 700 });
  return Buffer.from(await doc.save());
}
```

### Playwright (E2E)

```ts
import { test, expect } from "@playwright/test";

test("comprador faz upload e vê análise", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@bruno.dev");
  await page.fill('[name="password"]', "senha-teste");
  await page.click('button[type="submit"]');

  await page.goto("/propostas/nova");
  await page.setInputFiles('input[type="file"]', "tests/fixtures/propostas/proposta-valida.pdf");
  await page.click('button:has-text("Enviar")');

  await expect(page.getByText("Análise gerada")).toBeVisible({ timeout: 30_000 });
});
```

## Exemplos práticos

### Exemplo 1: testar Server Action de upload

Arquivo alvo: `app/actions/proposals.ts` (função `uploadProposal`).
Tipo: integration test (mocka Supabase, roda a action de verdade).
Cobre: validação Zod, criação no banco, audit log, retorno.

### Exemplo 2: testar webhook do Stripe

Arquivo alvo: `app/api/webhooks/stripe/route.ts`.
Tipo: integration test (mocka Stripe SDK + Supabase).
Cobre: `checkout.session.completed` cria assinatura, `customer.subscription.deleted` cancela, assinatura inválida retorna 400.

### Exemplo 3: e2e do fluxo de comparação

Tipo: Playwright.
Cobre: login -> criar projeto -> upload de 3 propostas -> ver tabela comparativa -> exportar PDF.

## O que NÃO fazer

- **Não escreva testes que dependem de ordem** — cada `it()` é independente.
- **Não use `setTimeout` para esperar coisa assíncrona** — use `await` correto ou `waitFor` do Playwright.
- **Não mocke o que está testando** — se você testa `uploadProposal`, não mocke `uploadProposal`; mocke as dependências dela.
- **Não teste implementação interna** — teste comportamento observável (retorno, side effect visível).
- **Não use dados de produção** — fixture local, sempre.
- **Não esqueça de limpar mocks** — use `beforeEach(() => vi.clearAllMocks())`.
- **Não escreva snapshot test gigante** — frágil e ninguém lê o diff.
- **Não pule testes de erro** — o caminho infeliz é tão importante quanto o feliz.
- **Não rode e2e contra produção** — use ambiente de staging com banco isolado.
- **Não deixe `it.only` ou `it.skip` no commit** — quebra coverage.
