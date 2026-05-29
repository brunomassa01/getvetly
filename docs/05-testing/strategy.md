# Estratégia de Testes

## Filosofia

- **Pirâmide invertida não.** Pirâmide tradicional: muito unit, médio integration, pouco e2e.
- **Cobertura mínima**: 70% em `lib/`, 50% em componentes, 90% nos parsers e validadores Zod.
- **Toda nova feature precisa de pelo menos 1 teste de happy path antes do merge.**
- **Bug em produção vira teste primeiro, fix depois.** Não corrige sem reproduzir.

## Ferramentas

| Tipo | Ferramenta | Onde |
|---|---|---|
| Unit | **Vitest** | `lib/`, `utils/`, parsers, validators |
| Integration | **Vitest** + Supabase local | API routes, Server Actions com banco |
| E2E | **Playwright** | Fluxos completos com browser real |
| Visual regression | **Chromatic** (opcional v2) | Componentes do design system |
| Load | **k6** (manual, esporádico) | Pipeline de IA |
| Security | **OWASP ZAP** + **Snyk** | Scan periódico |

## Setup

### Unit + Integration (Vitest)

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      lines: 70,
      branches: 60,
    },
  },
});
```

### E2E (Playwright)

```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps
```

`playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    locale: 'pt-BR',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

## O que testar (por camada)

### Unit (lib/utils)

- Formatadores: moeda, data, percentual
- Parsers: XLSX, PDF, DOCX, CSV
- Validadores Zod (com fixtures válidos e inválidos)
- Cálculos de desconto, economia, totais
- Hash de arquivo (para cache)

### Integration (API + DB)

Use Supabase local (`supabase start`) com schema da migration.

- CRUD de cada entidade (criar, ler, atualizar, deletar com sucesso e erro)
- RLS: criar 2 workspaces, garantir que user de A não vê dados de B
- Webhooks Stripe: simular evento, verificar estado
- Pipeline IA: rodar contra fixture, garantir schema da resposta

### E2E (Playwright)

Cobrir os 5 fluxos críticos:

1. **Onboarding completo** — do signup à primeira análise
2. **Análise de proposta** — upload + análise + compartilhamento + aprovação
3. **Comparativo** — selecionar 3 propostas, gerar, ver
4. **Upgrade de plano** — bloqueio → Stripe → liberação
5. **Convidar membro** — admin convida, novo usuário aceita

```typescript
// e2e/onboarding.spec.ts
test('usuário novo completa onboarding e cria primeira análise', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name=nome]', 'Eduardo Teste');
  await page.fill('[name=email]', `teste-${Date.now()}@example.com`);
  await page.fill('[name=senha]', 'senha-segura-123');
  await page.check('[name=aceiteTermos]');
  await page.click('button:has-text("Criar conta")');

  // confirmar e-mail (via API mock em ambiente de teste)
  // ...

  await expect(page).toHaveURL(/onboarding/);
  // ... continua o fluxo
});
```

## Fixtures

Salvar em `test/fixtures/` versionado no git:

- `test/fixtures/propostas/midia-ooh-pequena.pdf`
- `test/fixtures/propostas/software-saas.docx`
- `test/fixtures/propostas/servicos-consultoria.xlsx`
- `test/fixtures/propostas/produtos-mob.xlsx`
- `test/fixtures/expected/midia-ooh-pequena.analise.json`

Cada fixture tem o arquivo de entrada e a resposta esperada (validada manualmente uma vez). Quando refizermos o parser ou prompt, rodar contra fixtures pra detectar regressão.

## Mock do que não testamos

| Dependência | Estratégia |
|---|---|
| Claude API | Mock retornando fixture JSON fixo |
| Mistral OCR | Mock retornando texto extraído fixo |
| Stripe | Stripe Mock (CLI oficial) ou nock |
| Resend | Mock que apenas registra envio |
| Inngest | Modo "local" do SDK, executa síncrono em test |

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test --coverage
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: coverage, path: coverage/ }
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env: { E2E_URL: ${{ secrets.E2E_PREVIEW_URL }} }
```

## Quando NÃO testar

- Configuração estática (next.config.js, tailwind.config.ts)
- Componentes puramente apresentacionais sem lógica
- Migrations (testar consequência delas via integration test)
- Estilos CSS (delega pra revisor humano)

## Cobertura por área (meta inicial)

| Área | Cobertura mínima |
|---|---|
| `lib/ai/*` | 90% |
| `lib/parsers/*` | 90% |
| `lib/supabase/*` | 80% |
| `lib/stripe/*` | 80% |
| API routes (`app/api/`) | 70% |
| Server Actions | 70% |
| Componentes `components/ui` | 30% (são shadcn, já testados) |
| Componentes `components/domain` | 60% |

## Como rodar

```bash
pnpm test              # unit + integration, watch
pnpm test --run        # roda 1 vez (CI)
pnpm test --coverage   # gera relatório
pnpm test:e2e          # Playwright contra localhost
pnpm test:e2e --headed # com browser visível
pnpm test:e2e --debug  # passo a passo
```
