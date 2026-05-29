# Design System

Tokens, componentes e padrões visuais do app. Implementação via Tailwind CSS + shadcn/ui.

## Filosofia de design

- **Editorial, não dashboard.** Inspiração: Linear, Stripe, Vercel, não SAP/Salesforce.
- **Densidade alta com calma.** Muita informação por tela, sem parecer cluttered.
- **Tipografia faz o trabalho.** Hierarquia clara, serif para títulos grandes, sans para corpo.
- **Cor como ferramenta funcional**, não decorativa. Verde = positivo, laranja = atenção, vermelho = crítico.
- **Acessibilidade WCAG 2.1 AA** mínimo (contraste, foco visível, navegação por teclado).

## Tokens de design

Arquivo de referência: `design/design-tokens.json`.

### Cores (paleta neutra editorial)

```css
/* Light theme (default) */
--background: 250 250 247;          /* off-white */
--foreground: 10 20 48;             /* tinta */
--muted: 247 244 238;               /* offwhite-2 */
--muted-foreground: 91 98 117;      /* cinza-texto */
--border: 11 20 48 / 0.10;
--ring: var(--primary);

/* Primary — vem do whitelabel do workspace */
--primary: 10 10 10;                /* fallback preto, sobrescrito pelo client */
--primary-foreground: 250 250 247;

/* Accent — vem do whitelabel */
--accent: 200 255 2;                /* fallback verde-limão */
--accent-foreground: 10 10 10;

/* Semantic */
--success: 14 124 83;               /* verde corporativo */
--warning: 161 75 0;                /* laranja */
--danger: 194 41 0;                 /* vermelho */
--info: 19 98 137;                  /* azul info */

/* Dark theme */
.dark {
  --background: 10 14 24;
  --foreground: 240 240 240;
  --muted: 18 24 36;
  --muted-foreground: 138 144 158;
  --border: 255 255 255 / 0.10;
  --primary: 200 255 2;
  --primary-foreground: 10 10 10;
}
```

### Tipografia

- **Display/Headings**: `Fraunces` (serif, variável). Pesos 400-700.
- **UI/Body**: `Inter` (sans, variável). Pesos 300-700.
- **Mono**: `JetBrains Mono` (números tabulares, código).

Escala:

| Token | Tamanho | Line height | Uso |
|---|---|---|---|
| `text-display` | 56px | 1.04 | Hero da página, raro |
| `text-h1` | 40px | 1.1 | Título de página |
| `text-h2` | 32px | 1.15 | Seção |
| `text-h3` | 24px | 1.2 | Sub-seção |
| `text-h4` | 18px | 1.3 | Cards e blocos |
| `text-body` | 15px | 1.55 | Corpo padrão |
| `text-sm` | 13px | 1.5 | Auxiliar |
| `text-xs` | 11px | 1.4 | Labels, eyebrows |

### Espaçamento (escala base 4)

`0`, `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px), `16` (64px), `20` (80px).

### Border radius

- `rounded-sm` = 4px (badges)
- `rounded-md` = 8px (inputs, buttons)
- `rounded-lg` = 14px (cards)
- `rounded-xl` = 20px (containers grandes)
- `rounded-full` = pill (chips, avatars)

### Sombras

- `shadow-sm` — sutil, em cards inativos
- `shadow-md` — hover de cards interativos
- `shadow-lg` — modais, popovers, drag preview

### Animação

- Duração padrão: `150ms` (interação) ou `250ms` (mudança de tela)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind `ease-in-out`)
- Hover scale: `1.02` máximo
- Fade-in subtle: `opacity 0 → 1, translateY 8px → 0` em `250ms`

## Componentes (shadcn/ui customizado)

### Instalação

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label card dialog dropdown-menu sheet tabs toast tooltip avatar badge select switch checkbox
```

### Componentes do domínio (não-shadcn)

| Componente | Onde | Para quê |
|---|---|---|
| `<PropostaCard />` | `components/domain/proposta-card.tsx` | Card de proposta na listagem |
| `<FornecedorAvatar />` | `components/domain/fornecedor-avatar.tsx` | Inicial circular + cor por nome |
| `<StatusBadge />` | `components/domain/status-badge.tsx` | Badge colorido por status |
| `<ValorDisplay />` | `components/domain/valor-display.tsx` | Formatador R$ + cheio/negociado |
| `<DropZone />` | `components/domain/drop-zone.tsx` | Upload drag-and-drop |
| `<AnaliseRender />` | `components/domain/analise-render.tsx` | Renderiza JSON da IA |
| `<MetricaCard />` | `components/domain/metrica-card.tsx` | Card de métrica com ícone |
| `<WhitelabelProvider />` | `components/domain/whitelabel-provider.tsx` | Context que aplica cores |

### Padrões de uso

#### Buttons

```tsx
// Primary action
<Button>Analisar proposta</Button>

// Secondary
<Button variant="outline">Cancelar</Button>

// Destructive
<Button variant="destructive">Excluir</Button>

// Loading state
<Button disabled>
  <Spinner className="mr-2 h-4 w-4 animate-spin" />
  Processando...
</Button>
```

#### Formulários

- **Sempre** com `<Label>` + `<Input>` + `<FormMessage>` (erro)
- **Sempre** com Zod schema + react-hook-form
- **Sempre** mensagem de erro em PT-BR

```tsx
<Form {...form}>
  <FormField name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>E-mail</FormLabel>
      <FormControl><Input {...field} type="email" placeholder="seu@email.com" /></FormControl>
      <FormMessage />
    </FormItem>
  )} />
  <Button type="submit">Entrar</Button>
</Form>
```

#### Empty states

Toda lista vazia tem ilustração + mensagem útil + CTA:

```tsx
<EmptyState
  icon={<FileQuestion />}
  title="Você ainda não analisou nenhuma proposta"
  description="Comece agora — leva menos de 3 minutos"
  action={<Button asChild><Link href="/propostas/nova">Nova análise</Link></Button>}
/>
```

#### Loading states

- Skeleton para conteúdo previsível (cards, tabelas)
- Spinner para ações curtas (<2s)
- Tela de progresso com etapas para pipeline IA (>10s) — mostra "Extraindo texto...", "Analisando...", "Quase lá..."

#### Mensagens de erro

- Toast para erros não-bloqueantes
- Dialog para erros que exigem ação
- Inline para erros de validação

## Acessibilidade

- Todo input tem label associada
- Todo botão tem `aria-label` se só tiver ícone
- Contraste mínimo 4.5:1 (texto normal), 3:1 (texto grande)
- Foco visível em TODOS os elementos interativos
- Navegação por Tab segue ordem lógica
- Skip-to-content no topo de toda página
- `lang="pt-BR"` no `<html>`
- Modais usam Radix Dialog (focus trap automático, escape fecha)

## Responsividade

Mobile-first. Breakpoints:

- `sm` 640px — telefone landscape
- `md` 768px — tablet
- `lg` 1024px — desktop pequeno
- `xl` 1280px — desktop normal
- `2xl` 1536px — desktop grande

**Página de relatório compartilhado (`/r/[token]`)**: mobile-first sério. Diretor abre no celular.

## Whitelabel: como o sistema reage

Cada workspace tem `whitelabel.cor_primaria` e `cor_secundaria` no banco. Quando o usuário entra:

1. Server Component lê whitelabel do workspace
2. Renderiza `<WhitelabelProvider />` no layout que injeta CSS vars:

```tsx
export function WhitelabelProvider({ workspace, children }) {
  const style = {
    '--primary': hexToRgb(workspace.whitelabel_cor_primaria),
    '--accent': hexToRgb(workspace.whitelabel_cor_secundaria),
  } as React.CSSProperties;

  return <div style={style}>{children}</div>;
}
```

Todos os componentes usam `var(--primary)`, `var(--accent)`, automaticamente respeitando o whitelabel.

**Logo**: `<WhitelabelLogo />` lê `workspace.whitelabel_logo_url`. Fallback = monograma com inicial em fundo `--primary`.

## Dark mode

Implementado via `next-themes`. Toggle no header. Persiste em cookie. Whitelabel funciona em ambos.

## Performance metas

- **LCP** (Largest Contentful Paint): < 2.0s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **Tamanho bundle inicial**: < 150 KB gzipped (Next.js já otimiza Server Components)

Medido em produção via Vercel Analytics + Posthog.
