# getvetly — SaaS de Análise de Propostas para Procurement

Pacote completo de documentação técnica, especificações de produto e skills para construir o SaaS no Claude Code. Versão **preview 0.1.0** — domínio: **getvetly.com**.

## Quem deve ler este pacote

Você, Bruno. E o Claude Code. A documentação está em camadas:

- **Camada 1 (você)**: produto, modelo de negócio, decisões estratégicas
- **Camada 2 (Claude Code + você)**: arquitetura, stack, fluxos
- **Camada 3 (Claude Code)**: schema, código, testes

## Por onde começar

Leia nesta ordem:

1. **`CLAUDE.md`** — instruções específicas para o Claude Code (leia se for usar Claude Code; ignore se for ler manualmente)
2. **`docs/00-START-HERE.md`** — roteiro de leitura completo
3. **`docs/01-product/PRD.md`** — o que estamos construindo e por quê
4. **`docs/02-architecture/system-overview.md`** — visão geral do sistema
5. Depois siga o roteiro do START-HERE

## Como abrir no Claude Code

```bash
# 1. Descompacte o zip em uma pasta
unzip saas-procurement.zip -d saas-procurement
cd saas-procurement

# 2. Abra a pasta no Claude Code
claude code .

# 3. No primeiro prompt, peça:
"Leia CLAUDE.md e docs/00-START-HERE.md, depois me confirme que entendeu o produto."
```

O Claude Code vai automaticamente:
- Carregar as instruções do `CLAUDE.md`
- Ativar as skills em `.claude/skills/`
- Conhecer a arquitetura e seguir os padrões documentados

## Estrutura do pacote

```
saas-procurement/
├── README.md                    ← você está aqui
├── CLAUDE.md                    ← instruções pro Claude Code
├── docs/                        ← documentação técnica e de produto
│   ├── 00-START-HERE.md
│   ├── 01-product/              ← PRD, personas, pricing, roadmap
│   ├── 02-architecture/         ← ADRs, system overview
│   ├── 03-backend/              ← schema, API, AI pipeline
│   ├── 04-frontend/             ← design system, fluxos
│   ├── 05-testing/              ← estratégia de testes
│   ├── 06-compliance/           ← LGPD, security
│   └── 07-operations/           ← deploy, monitoring
├── .claude/skills/              ← 5 skills pro Claude Code acelerar dev
├── db/                          ← migrations e seeds SQL prontos
├── design/                      ← logo, tokens, paleta
└── scripts/                     ← setup do ambiente
```

## Resumo do que está sendo construído

**Produto**: SaaS B2B para procurement / supply chain analisar propostas comerciais de fornecedores com IA, gerar relatórios padronizados, compartilhar link com diretoria para aprovação, manter histórico de fornecedores.

**Mercado**: gestores de compras, supply chain, financeiro em PMEs e mid-market no Brasil. Mercado anual estimado em R$ 4-8 bilhões em software de procurement (Linkana, Mercanto, Coupa, GEP, Promo).

**Diferencial**: análise por IA + leitura crítica honesta + whitelabel acessível + preço PME. Concorrentes são caros e voltados para grande empresa.

**Modelo de cobrança**: assinatura mensal por tier (Starter R$297 → Enterprise sob consulta).

**Stack**: Next.js 14 + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres + Auth + Storage) + Hostinger VPS + Stripe + Claude API.

**Custo de operação MVP (até 50 clientes)**: ~R$ 17–25/mês de infraestrutura (ver ADR-006).

**Prazo realista MVP**: 6-10 semanas com você no Claude Code, foco em validar com 5 clientes piloto.

## Próximos passos imediatos

1. Leia `CLAUDE.md` e `docs/00-START-HERE.md`
2. Crie contas: GitHub, Vercel, Supabase, Stripe (modo test), Anthropic API
3. Siga `scripts/setup.md` para preparar ambiente
4. Use o skill `implementar-feature` no Claude Code para começar pela primeira user story

## Suporte

Esta documentação é viva. Quando algo não fizer sentido ou estiver desatualizado, ajuste e siga. Decisões antigas estão registradas como ADRs (Architecture Decision Records) em `docs/02-architecture/` — quando mudar de ideia, escreva um novo ADR superando o anterior, não apague o histórico.

---

**Autor**: Bruno Romualdo Marinho · brunobrm@gmail.com
**Licença**: Proprietária
**Versão**: 0.1.0 preview
