# Memory — Saas-propostas

## Regras Inegociáveis
- Todo arquivo do projeto deve ser salvo em `G:\Meu Drive\PROJETOS-CLAUDE\Saas-propostas\`
- Atualizar este MEMORY.md após cada deploy (versão, data, o que foi deployado)
- Zero gravação fora desta pasta

## O Projeto
**Nome**: getvetly  
**Domínio**: getvetly.com (comprado na Hostinger)  
**Versão atual**: 0.1.0 — landing page no ar em https://app.getvetly.com  
**Dono**: Bruno Romualdo Marinho — brunobrm@gmail.com

**O que é**: SaaS B2B para gestores de compras/supply chain analisarem propostas comerciais de fornecedores com IA, gerar relatórios padronizados, compartilhar link com diretoria para aprovação e manter histórico de fornecedores.

**Mercado-alvo**: PMEs e mid-market no Brasil. Concorrentes caros (Coupa, GEP) são para grandes empresas.

**Diferencial**: IA + leitura crítica honesta + whitelabel + preço PME.

## Stack
| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Next.js API Routes / Server Actions |
| Banco | PostgreSQL 16 self-hosted no VPS (R$0) — ver ADR-007 |
| Auth | Auth.js (NextAuth v5), sessões no Postgres — ver ADR-007 |
| Storage | Disco do VPS (MVP) → Cloudflare R2 ao escalar |
| Pagamento | Stripe |
| IA análise | Claude API (claude-sonnet-4-6) |
| OCR/Parsing | Mistral OCR API |
| E-mail | Resend |
| Hosting | Hostinger VPS KVM1 (R$52,99/mês) — ver ADR-006 |
| Analytics | PostHog |
| Erros | Sentry |

## Regra de Negócio — Margem Mínima
**Todo preço de venda deve cobrir os custos e gerar no mínimo 50% de lucro sobre o custo.**
Fórmula: `Preço ≥ Custo × 1,5` — vale para tiers, add-ons, Enterprise e pilotos.
Cálculo completo em `docs/01-product/unit-economics.md`.

## Pricing
- Starter: R$ 297/mês | Pro: R$ 897 | Business: R$ 2.490 | Enterprise: R$ 7.900+
- Custo real por cliente Starter (com Stripe): ~R$ 12,77/mês → margem ~2.150% ✓
- Pilotos com 50% off ainda respeitam a regra (margem ~1.063%)

## Infraestrutura — Servidor (configurado 2026-05-29)
- **VPS Hostinger KVM1** — IP `2.25.147.198` (Boston 2, Ubuntu 24.04 LTS)
- **Domínio**: `app.getvetly.com` → A record para o IP, DNS gerenciado na Hostinger
- **SSL**: Let's Encrypt ativo (renovação automática, expira 2026-08-27)
- **Stack do servidor**: Node 20.20.2, pnpm, PM2, Nginx (proxy reverso :3000), Certbot
- **Firewall**: ufw ativo (libera só SSH + Nginx 80/443)
- **Usuário de deploy**: `deploy` (sudo, sem senha, só chave SSH)
- **Chave SSH de deploy**: `/home/deploy/.ssh/getvetly_deploy` (privada → vai no GitHub Secret `SSH_PRIVATE_KEY`)
- **Pasta do app**: `/var/www/getvetly` (owner: deploy)
- **Sem Docker** (decisão adiada — ver ADR-006)

## Infraestrutura — Banco de dados (configurado 2026-05-29)
- **PostgreSQL 16** self-hosted no VPS — ver ADR-007
- **Banco**: `getvetly` | 14 tabelas criadas, RLS ativo em todas
- **Roles**: `getvetly_app` (respeita RLS) e `getvetly_service` (BYPASSRLS); tabelas owned by `postgres`
- **Credenciais (DATABASE_URL)**: `/root/getvetly-secrets/db-credentials.env` no servidor (chmod 600)
- **Adaptador anti-Supabase**: `db/bootstrap-selfhosted.sql` recria schema `auth`, `auth.users`, `auth.uid()`. Migrations 0001/0002 rodaram sem alteração.
- **app.current_user_id**: o Next.js deve rodar `select set_config('app.current_user_id','<id>',true)` por request para o RLS funcionar
- **Backup**: cron diário 3h (`/usr/local/bin/getvetly-backup.sh`), retém 7 dias em `/var/backups/getvetly`
- **Auth (a construir no código)**: Auth.js v5, tabelas `auth.users`/`auth.sessions` já existem

## Infraestrutura — App / Deploy (configurado 2026-05-29)
- **Repositório**: `git@github.com:brunomassa01/getvetly.git` (privado)
- **Next.js 14.2** scaffold no ar; design system Vetly embutido (Tailwind + globals + componente Logo)
- **Deploy Key** (VPS→GitHub, leitura): `/home/deploy/.ssh/github_deploy` (pública adicionada nos Deploy Keys do repo)
- **App no servidor**: clonado em `/var/www/getvetly`, rodando via PM2 (processo `getvetly`, porta 3000), Nginx faz proxy + SSL
- **CI/CD**: ✅ ATIVO — push na `main` → GitHub Actions roda lint/type-check/build → SSH no VPS → git pull + build + pm2 restart (`.github/workflows/deploy.yml`)
  - GitHub Secrets configurados: `SERVER_HOST`, `SSH_PRIVATE_KEY`
  - PM2 persiste no boot (systemd `pm2-deploy`)
  - ⚠️ Aviso futuro: actions em Node 20 serão forçadas a Node 24 a partir de 16/jun/2026 (não-bloqueante; atualizar versões das actions depois)

## ⚠️ Ambiente de desenvolvimento — Google Drive
- O projeto vive em `G:\Meu Drive\...` (Google Drive), que **não suporta symlinks** → `.npmrc` com `node-linker=hoisted` é obrigatório para o pnpm funcionar.
- **`pnpm build` NÃO funciona de forma confiável localmente** (Google Drive rejeita escritas do cache `.next` com EINVAL; e a busca de fontes do `next/font/google` depende de rede). 
- **Validação local**: rodar só `pnpm lint` e `pnpm type-check` (não dependem de rede/escrita pesada).
- **O build de produção real roda no VPS** (Linux, FS normal, rede estável) via a esteira de deploy. Lá funciona perfeitamente.

## Estado atual
- Documentação completa em `docs/`
- ✅ Servidor de produção configurado e com HTTPS
- ✅ Banco: PostgreSQL self-hosted no VPS, schema + RLS + backup
- ✅ App Next.js 14 + design system Vetly no ar em https://app.getvetly.com
- ✅ Auto-deploy ativo (push na main → produção)
- ✅ App conectado ao banco com helper de RLS (`lib/db/client.ts`: `getSqlApp`, `getSqlService`, `withUser`); validado em /api/health/db
- ✅ **Autenticação completa** (Auth.js v5): cadastro/login e-mail+senha, **login Google OAuth ATIVO**, recuperação de senha, painel protegido, middleware. Cadastro cria usuário + workspace + admin.
- ✅ Google OAuth ativo: credenciais no `.env` do VPS; projeto "GetVetly" no Google Cloud (modo teste — publicar antes de abrir ao público geral). Verificar em https://app.getvetly.com/api/auth/providers
- **Pendente p/ ativar**: conta Resend (e-mail de recuperação — hoje cai no log do servidor via `pm2 logs getvetly`)
- ✅ **CRUD de fornecedores** (US-030): /fornecedores (lista + busca debounce + filtro categoria), /novo, /[id] (editar + arquivar). Isolado por workspace via `withUser`. Padrão de telas estabelecido.
- ✅ **Vitest configurado** + passo de testes no CI (lint → type-check → testes → build). 8 testes (schemas de fornecedor e proposta).
- ✅ **Propostas — fluxo UPLOAD-FIRST** (feedback do Bruno, "subir e pronto estilo Claude"): /propostas/nova é só upload + título opcional → cria proposta → roda análise → relatório pronto. A IA preenche fornecedor/categoria/valores/escopo. **Fornecedor é cadastrado/vinculado automaticamente** (com contato) → constrói histórico. `criarPropostaComArquivos` + `aplicarAnaliseNaProposta` + `executarAnaliseProposta` (orquestrador reusado). Arquivos no disco do VPS.
- ✅ **Análise por IA** (US-012): botão "Analisar com IA" → extrai texto do PDF (unpdf, local) → Claude (`lib/ai/`) → relatório (resumo executivo, prós, pontos a questionar, valores, itens, métricas). `ANTHROPIC_API_KEY` no `.env` do VPS. Nginx com `proxy_read_timeout 300s`. análises gravadas via service (BYPASSRLS), prompt v1.0.0.
  - Formatos lidos: **PDF** (unpdf), **Excel todas as abas** (SheetJS `xlsx`), **Word** (mammoth). PPTX = placeholder (fotos → OCR futuro). PDF escaneado/imagem = Mistral OCR futuro. Análise SÍNCRONA; migrar p/ Inngest se ficar lenta.
  - **Dois modelos de arquivos**: (a) 1 fornecedor com vários arquivos de formatos diferentes → "Nova proposta" (sobe todos juntos, contexto único); (b) vários fornecedores → "Subir e comparar" (1 arquivo/fornecedor) ou "Comparar analisadas".
  - **Comparação (US-021)**: `/comparativos` com "Comparar analisadas" (seleção, mostra fornecedor/valor/data p/ identificar versão) e "Subir e comparar" (upload múltiplo → 1 proposta por arquivo → analisa todas → comparativo). Prompt trata propostas heterogêneas (marca "não informado", trata falta como risco).
  - **UX overlay**: tela "Analisando..." controlada por estado (`ativo`), persiste do clique até a navegação final (não some cedo).
- **Detalhe do modelo**: `claude-sonnet-4-6` NÃO suporta prefill de mensagem do assistente (erro 400 "does not support assistant message prefill"). Forçar JSON via system prompt + extração robusta (1º { ao último }), nunca por prefill.

## 📋 Backlog priorizado pelo Bruno (2026-05-29)
0. ✅ **Rediagramar relatórios (2026-05-30)** — FEITO: comparativo e análise com card de destaque (gradiente lime), matriz legível (vencedor com ✓, "não informado" suave, riscos em vermelho), cenários em cards. Prompt de comparação v1.1.0 gera `resumo` (headline) + recomendação escaneável. Design system Vetly aplicado direto (GSD-UI não roda sem `.planning/`; humanize é p/ texto estático — naturalidade resolvida via prompt).
1. ✅ **Whitelabel (2026-05-30)** — FEITO: em /configuracoes sobe logo (PNG/JPG/WEBP/SVG, até 2MB) → salvo em `STORAGE_DIR/whitelabel/<wsId>/` no VPS; servido pela rota pública `/api/whitelabel/[workspaceId]`. `whitelabel_logo_url` no banco. Cabeçalho `WhitelabelHeader` aparece nos relatórios (proposta + comparativo) quando logo/nome configurados. + nome exibido + cor primária.
2. ✅ **Exportar PDF (2026-05-30)** — FEITO via impressão do navegador (window.print + `@media print` + `print:hidden`). Botão em proposta e comparativo. Custo zero (sem Chromium). Envio por e-mail/link público = futuro (US-040).
3. ✅ **Apresentação executiva + exports (2026-05-30)** — FEITO: `/comparativos/[id]/apresentacao` (layout deck branded, capa + recomendação + matriz + cenários, quebras de página → PDF bonito). Export **PPT editável** via `pptxgenjs` (rota `/comparativos/[id]/pptx`, lib `lib/comparativos/pptx.ts`). Botões "Baixar PPT" e "Apresentação / PDF".
   - **Design system da empresa (opcional, 2026-05-30)**: em /configuracoes sobe `.md` → IA (`lib/ai/design-tokens.ts`) extrai cor de fundo + destaque → salvas em `whitelabel_cor_primaria/secundaria` (colunas já existiam, sem migração); `.md` guardado em disco (`lib/workspace/design.ts`). Apresentação (HTML+PPT) usa essas cores; SEM upload → fallback Vetly (ink+lime). Cores também editáveis manualmente na config.
4. ✅ **Comparação de propostas** (US-021) — FEITO: `/comparativos`, seleciona 2+ propostas prontas + critério → IA gera matriz + recomendação + cenários. Salvo em `comparativos`.
5. **Edição manual da proposta** — deixar o usuário completar campos que a IA não achou. Mensagem de "não encontrado" mais clara/acionável.
8. **Painel + Configurações (2026-05-30)** — ✅ painel redesenhado (Propostas em destaque, contadores, card "Configurar empresa"); ✅ `/configuracoes` (nome, CNPJ, segmento, porte + whitelabel nome/cor — falta upload de logo). `lib/workspace/`.
9. **Fornecedores — DEDUPLICAÇÃO (feedback Bruno 2026-05-30)**: auto-criação gera duplicatas do mesmo fornecedor por variação de nome (ex: "Eletromidia", "Eletromídia", "Eltormidia" = mesma empresa). Precisa: (a) editar fornecedor já existe (clicar no nome → /fornecedores/[id]); (b) **mesclar/deduplicar** fornecedores; melhorar o match do `encontrarOuCriarFornecedorPorNome` (fuzzy/normalização de acentos).
10. **Fornecedor — métricas (futuro, "não agora")**: marcar qual proposta foi APROVADA; calcular **índice de aprovação** por fornecedor e **aderência** do fornecedor à empresa. Depende de status de aprovação nas propostas (tabela `aprovacoes` já existe).

### Ideias de negócio / monetização (a avaliar — Bruno, 2026-05-29)
6. **Modelo de venda: assinatura vs. crédito** — assinatura por tier (recorrente) e/ou compra de créditos por análise. Recomendação inicial: assinatura como base (MRR previsível B2B) + pacotes de crédito como add-on/overflow e entrada p/ avulsos. Regra dos 50% de margem vale p/ ambos.
7. **Canal de parceiros/afiliados** — afiliados revendem (links/cupons de indicação, comissão %, painel do parceiro). Relacionado a whitelabel (consultorias). Fase pós-PMF; depende de Stripe + atribuição de origem.

### Fila de usabilidade (Bruno 2026-05-30) — em execução
- ✅ **Completar contato do fornecedor** (opcional, após análise, quando a IA não achou) — card em /propostas/[id].
- ✅ **Propostas: código + filtros** — coluna `Código` (curto, derivado do id via `codigoCurto`) + busca/status/categoria/ordenação.
- ✅ **Comparativos: descoberta** — colunas Fornecedores + Recomendada (IA, do payload) + busca por título/fornecedor.
- ✅ **Fornecedores: menu "3 pontinhos"** (`AcoesFornecedor`) — editar (link) / observações (modal) / arquivar / excluir (DELETE, RLS só admin, com confirmação).
- ✅ **Situação comercial da proposta (migration 0004 aplicada no VPS)** — ciclo `em_aberto → apresentada → aprovada | recusada` com datas (`apresentada_em`, `decidida_em`). Separado do `status` (pipeline de análise). Onde aparece: controle com botões na proposta (`SituacaoProposta`), selo + filtro na lista, e no **Dashboard**: índice "apresentou X, fechou Y, Z aguardam retorno" + taxa de aprovação + seção **"Aguardando retorno"** (apresentadas sem desfecho, com nº de dias + botões rápidos ✓/✕). Funções: `atualizarSituacaoProposta`, `resumoSituacao`, `listarAguardandoRetorno`. "vencedora" (IA recomenda no comparativo) ≠ "aprovada" (decisão do usuário).
- ✅ **Situação da COMPARAÇÃO (migration 0005 aplicada)** — cada comparação é independente (mesma proposta pode estar em várias). Colunas em `comparativos`: `situacao` (em_aberto/apresentada/decidida), `apresentado_em`, `decidido_em`, `proposta_escolhida_id` (FK). Funções: `apresentarComparativo` (cascata: propostas em_aberto→apresentada), `decidirComparativo` (escolhida→aprovada, demais DESTA comparação→recusada), `reabrirComparativo`. Detalhe tem controle (`SituacaoComparativo`: Apresentar → Escolher vencedora → Reabrir). Lista mostra **"Escolhida (você)"** ao lado de **"Recomendada (IA)"** + flag de situação. Cascata mantém o índice do painel/aprovação consistente. Dois fluxos convivem: apresentação de proposta única (individual) e em concorrência (comparação).
- ✅ **PDF da apresentação — FINALIZADO (2026-05-31)** — 2 correções: (1) saía "lavado" porque o navegador descarta cores de fundo → `print-color-adjust: exact` (universal no `@media print` do `globals.css`); agora capa escura, selos, faixa da tabela, círculos e **barras do gráfico** aparecem. (2) `@page { size: A4 portrait; margin: 1.4cm }`; capa com `print:min-h-[245mm]` + `print:break-after-page` → ocupa a página 1 sozinha sem quebrar. **LIÇÃO:** edge-to-edge real no print do navegador é instável — `@page :first { margin: 0 }` + altura ~página NÃO é confiável (a capa vazava pra pág. 2); ficou emoldurado (margem fina) e robusto. Edge-to-edge de verdade = só no PPT (server-side) ou gerando PDF com Chromium (evitado por custo). Bruno: "coisa linda, finalizado".
- ✅ **Análise em segundo plano (2026-05-31)** — `dispararAnaliseEmSegundoPlano` seta `processing` e roda `executarAnaliseProposta` SEM await (Node persistente do PM2 mantém a tarefa após o redirect). Criar/refazer redirecionam na hora; a página da proposta mostra card "Analisando…" + `PolerAnalise` (client, `router.refresh()` a cada 4s) que para sozinho quando vira `ready`/`failed`. (`compararNovosArquivosAction` segue síncrona — precisa do resultado.)
  - UX (feedback Bruno): loading em destaque NO TOPO + resto da página esmaecido (`opacity-50 pointer-events-none`) durante o processamento (antes o loading ficava embaixo e parecia erro). Detalhe de proposta/comparativo: botão único **"Gerar apresentação"** (sem "Baixar PPT" ali); a escolha PDF/PPT é na tela de apresentação.
- ✅ **Menu de perfil (2026-05-31)** — `components/layout/MenuPerfil.tsx`: avatar (inicial) no lugar do "Sair", dropdown com Conta / Financeiro / Gestão de Usuários / Configurações da Empresa / Ajuda / Sair. "Configurações" saiu da nav principal (foi pro dropdown). Páginas-placeholder `EmBreve` em /conta, /financeiro, /usuarios, /ajuda (/configuracoes já existe).
  - **Specs das seções (Bruno 2026-05-31), construir no momento certo:**
    - **Conta** ✅ FEITO (2026-05-31): `/conta` edita nome + telefone + foto; email read-only. Migration 0006 aplicada (`auth.users.telefone`). Foto vai pra `avatar_url` (disco `storage/avatars/{id}.ext` via `lib/auth/avatar.ts`), servida por `/api/avatar` (usuário logado; redireciona se for URL do Google). Avatar aparece no menu de perfil. `buscarPerfil`/`atualizarPerfil`/`salvarAvatarPerfil` em `lib/auth/usuarios.ts`.
    - **Financeiro** (com Stripe): o que o usuário pagou (faturas/histórico) + planos.
    - **Gestão de Usuários**: um usuário master + planos para mais de um usuário (multiusuário por workspace; `workspace_members` já existe).
    - **Ajuda** (no momento certo): FAQ + chat de suporte + chamados.
- ⚠️ **Infra recorrente**: deploy SSH falha intermitente com `dial tcp :22 i/o timeout` (flakiness de rede do VPS Hostinger). Resolver com `gh run rerun <id> --failed`. Melhoria futura: adicionar retry/`timeout` maior no passo SSH do workflow.

### Aprovação por e-mail / compartilhar (avaliado 2026-05-30)
- Mandar a análise por e-mail: complexidade MÉDIA; gargalo é infra (Resend não configurado: conta + verificação de domínio via DNS). Com Resend pronto, versão fácil = anexar o PPT (já gerado no servidor) + resumo. Versão "linda" = link compartilhável + aprovar online (liga com a situação "Apresentada"). Recomendação: juntar num pacote só — **Resend + compartilhar por link/e-mail + aprovar online** — próximo passo natural depois do Dashboard.

### Ideias futuras (Bruno 2026-05-30) — pós-MVP / roadmap
1. **Bot de atendimento + área de AJUDA (IA)** — pra economizar token, criar DOCUMENTAÇÃO de como o Get Vetly funciona; o bot consulta a doc (RAG) e, se não resolver, o usuário abre um chamado. (depende de doc pronta + decisão de custo)
2. **Painel de gestão da conta** — perfil do usuário (foto, cadastro), financeiro (faturas e pagamentos). Liga com Stripe.
3. **Versão dark** (tema escuro).
4. **Exportar CSV** de todos os fornecedores e propostas cadastradas.
5. **Tutorial passo a passo (onboarding)** no 1º acesso — guia em telas cadastrando uma proposta de amostra; depois fica na seção de Ajuda. Só no primeiro acesso.

## 🐞 Bug aberto (investigar ao retomar)
- ✅ RESOLVIDO (2026-05-30): **Client-side exception em /propostas/nova** — era upload grande tomando **413 do Nginx** (limite estava só no server block, não no `http` global → não cobria o 443) + o `PropostaForm` quebrava lendo `estado.erro` num estado vazio. Corrigido: `client_max_body_size 30M` no `http` global do Nginx + guarda `estado?.erro` + validação de tamanho no cliente. Ver entradas detalhadas no histórico.

- **Pendente futuro**: checkout Stripe (chaves já em mãos), conta Resend, publicar app Google, histórico/detalhe fornecedor (US-031), Mistral OCR (PDF escaneado)

## ⚠️ Segurança — segredos e pasta pessoal
- **Pasta `BRUNO/` = espaço pessoal do Bruno. NADA dela sobe para o Git.** Já está no `.gitignore`. Ele move para lá tudo que for pessoal/segredo (ex: chaves em `BRUNO/getvetly.txt`, e moveu a antiga pasta `marketing/` para `BRUNO/marketing/`).
- ✅ RESOLVIDO (deploy 34b5152): `marketing/vetly-campaign-plan-v1.md` saiu do Git (Bruno moveu a pasta para BRUNO/, git registrou a remoção). Preservado no disco.
- 2026-05-29: GitHub Push Protection bloqueou um commit que continha `BRUNO/getvetly.txt` (segredos não vazaram). Lição: evitar `git add .` cego; conferir `git status` antes de commitar. Segredos vão sempre via `.env` no servidor, nunca no repo.

## Como trabalhar
1. Bruno escolhe uma user story de `docs/01-product/user-stories.md`
2. Usar skill `implementar-feature`
3. Sempre mostrar plano antes de codar
4. Sempre escrever testes
5. Commit em português: `feat:`, `fix:`, `refactor:`, etc.

## Histórico de Deploys
- **2026-05-29 — v0.1.0 — primeiro deploy** 🎉
  - Landing page de preview da Vetly no ar em https://app.getvetly.com
  - Stack: Next.js 14.2 + design system Vetly (logo oficial, lime #C8FF02, Manrope)
  - Servidor: VPS Hostinger KVM1, PostgreSQL self-hosted, Nginx + SSL, PM2
  - Deploy manual (clone + build + pm2 no VPS). Auto-deploy via GitHub Actions pendente de Secrets.
- **2026-05-29 — auto-deploy ATIVADO** ✅
  - Pipeline GitHub Actions validado de ponta a ponta (lint → type-check → build → SSH → pm2 restart) em ~1m7s
  - A partir de agora: push na `main` = deploy automático em produção
- **2026-05-29 — fundação banco no ar** ✅
  - App conectado ao PostgreSQL self-hosted; `/api/health/db` retorna `{"ok":true,"banco":"conectado","workspaces":0}`
  - `lib/db/client.ts`: conexão lazy (não quebra build no CI) + `withUser` aplicando RLS por transação
  - Lição: nunca criar conexão de banco no top-level do módulo (quebra `next build` sem env) — sempre lazy
- **2026-05-29 — autenticação no ar** ✅
  - Auth.js v5: cadastro/login e-mail+senha, recuperação de senha, OAuth Google (condicional), painel protegido
  - Testado em produção: cadastro de "Bruno Massa" → redirecionou para /painel; `/api/health/db` agora `workspaces: 1`
  - VPS: adicionado `AUTH_TRUST_HOST=true` ao .env; migration 0003 (auth.password_reset_tokens) aplicada + grants
  - Detalhe: provedor Google só ativa se `AUTH_GOOGLE_ID/SECRET` existirem (não quebra login enquanto Google não está configurado)
- **2026-05-29 — login Google OAuth ATIVO** ✅
  - Credenciais criadas no Google Cloud (projeto "GetVetly"), redirect `https://app.getvetly.com/api/auth/callback/google`
  - `/api/auth/providers` confirma google + credentials; login Google testado OK
  - Lição operacional: NUNCA usar `read` dentro de bloco colado no terminal — ele consome as próximas linhas do script como input. Para segredos no servidor, editar via `nano` direto no `.env`.
- **2026-05-29 — CRUD de fornecedores no ar** ✅
  - US-030: lista com busca/filtro, cadastro, edição, arquivar. Tudo isolado por workspace (RLS via `withUser`).
  - Vitest entrou no projeto + passo de testes no CI. Padrão de tela (data layer → schema Zod → server actions → form client → páginas) estabelecido para reusar nas próximas features.
- **2026-05-29 — propostas (criação + upload) no ar** ✅
  - US-010/011: criar proposta com vínculo a fornecedor, valores e upload múltiplo de arquivos (disco do VPS).
  - `next.config` bodySizeLimit 25mb. Status `draft` (análise IA é a próxima fatia).
  - Incidente contido: Push Protection do GitHub barrou `BRUNO/getvetly.txt` (segredos) — removido do git, mantido no disco, pasta `BRUNO/` ignorada.
- **2026-05-29 — análise por IA no ar** ✅ (coração do produto)
  - US-012: PDF → texto (unpdf) → Claude (claude-sonnet-4-6) → relatório estruturado validado por Zod.
  - Deps: `@anthropic-ai/sdk`, `unpdf`. Chave Claude no `.env` do VPS, limite US$30. Prompt cacheado.
  - Nginx `proxy_read_timeout/send_timeout 300s` para a análise síncrona não estourar.
  - 12 testes no total. Aguardando 1º teste real do Bruno com PDF de proposta.
- **2026-05-29 — fluxo de proposta + extração multi-formato no ar** ✅
  - Upload-first (subir e pronto, como no Claude). Auto-cria/vincula fornecedor pelo nome extraído pela IA.
  - Extração: PDF (unpdf), Excel todas as abas (xlsx), DOCX (mammoth). PPTX = placeholder (OCR futuro).
  - Overlay "Analisando" persiste até a navegação (estado, não useFormStatus). Botão refazer análise.
  - Bug corrigido: relatório quebrava em `contato` undefined → parse-if-string no buscarAnalise + defensivo no componente. (monitorar: erro ainda aparece em log antigo)
- **2026-05-29 — comparação de propostas no ar** ✅
  - Comparar 2+ propostas prontas (de fornecedores diferentes), critérios livres, matriz + cenários + recomendação.
  - `lib/ai/comparar` v1.1.0 (campo `resumo`, texto escaneável, lida com propostas heterogêneas).
- **2026-05-29 — whitelabel: logo + cores + configuração da empresa** ✅
  - Tela de Configurações: dados da empresa, upload de logo, cor de fundo + cor de destaque.
  - Painel reordenado: Propostas primeiro, depois Fornecedores, depois Configurações.
- **2026-05-29 — design system opcional via upload** ✅
  - Upload de README/.md/.css/.json do design system → IA extrai 2 cores de marca (`lib/ai/design-tokens`).
  - Fallback Vetly (ink/lime) se a empresa não tiver design system. Extração assertiva + normalização de hex.
- **2026-05-30 — apresentação do comparativo rediagramada** ✅
  - Motivo: cores aplicavam mas "ficou sem graça". Redesenho: capa composta (faixa de destaque, logo, título, divisor, chips de proposta, faixa do vencedor), `TituloSecao` com barra de accent, recomendação com borda lateral, matriz com faixa de cabeçalho (cor de fundo) + célula vencedora em tom claro do destaque (não mais verde conflitante), cenários numerados.
  - PPT (`lib/comparativos/pptx.ts`): vencedor agora em `clarear(LIME, 0.82)` (tom claro do accent) e texto na cor de fundo — antes usava verde fixo `5C7A0E`/`LIME_FAINT`. Capa e títulos fluem as cores da empresa.
  - Export PDF = window.print (custo zero). Export PPT editável = pptxgenjs. Commit `e63e68b`, deploy CI OK (~success).
- **2026-05-30 — PPT do comparativo alinhado ao design da tela** ✅
  - Motivo: a tela ficou ótima mas o PPT continuava plano (só trocava cor). Portado todo o design para pptxgenjs.
  - Capa composta: faixa de destaque no topo, logo da empresa embutido (raster; SVG é pulado), título grande + divisor, subtítulo (empresa · data · N propostas), chips das propostas com contorno de accent, faixa do vencedor.
  - Conteúdo: helper `tituloSecao` com barra de accent (igual à tela), resumo com borda lateral de destaque, cenários viraram cards numerados em grade 2 colunas (círculo numerado + proposta vencedora + Se/porquê), matriz mantida com faixa de cabeçalho e célula vencedora em tom claro.
  - Rota `pptx/route.ts` agora lê o logo (`lerLogo` → data URL base64) e passa `criadoEm` via param `extras`. Lição pptxgenjs: para tirar borda de shape NÃO existe `line:{type:'none'}` — basta omitir `line` (TS rejeita a propriedade inválida). Commit `d7c4525`, deploy CI OK.
- **2026-05-30 — PPT vira apresentação COMPOSTA pela IA (não copy-paste)** ✅✅
  - Feedback duro do Bruno: "se for copy-paste não faz sentido; a IA tem que interpretar e GERAR a apresentação (capa, comparativos, tabelas, gráficos, design system)". Bugs do PPT anterior: logo esticado + texto da recomendação sobreposto.
  - Avaliei 2 skills que ele pediu (`npx skills add`): **nanobanana-ppt-skills** (gera IMAGENS via Gemini — pago, não editável → fura orçamento+editabilidade) e **ppt-visual** (só MANUAL de design, não cria arquivo). Conclusão: nenhuma serve de gerador, mas ppt-visual virou a *linguagem de design*. Skills instaladas em `.agents/` e ignoradas no git (tooling, não produto).
  - Arquitetura nova em 2 etapas: (1) `lib/comparativos/deck-plan.ts` → `montarDeck()` chama Claude (sonnet-4-6, prompt cacheado) que INTERPRETA o comparativo e devolve um "plano de slides" tipado (`deck-schema.ts`: capa, destaques/números, recomendacao, tabela, grafico, cenarios, proximos_passos). Tem `deckPadrao()` de fallback — exportação nunca quebra. (2) `pptx.ts` renderiza o deck em PPTX editável com layout MEDIDO por tipo (helper `alturaTexto` evita sobreposição), gráfico nativo (`addChart`), e logo com proporção real (`dimensoesImagem` lê px de PNG/JPEG/GIF — sem esticar).
  - Custo: usa a API Claude que já pagamos (sem chave nova, dentro do orçamento). A IA agora gera conteúdo NOVO (próximos passos, headline executiva, escolhe os números de destaque e os critérios que decidem). Commit pendente, deploy CI.
  - PRÓXIMO (proposta do Bruno, a avaliar): fluxo "Gerar apresentação" → HTML interativo (ilustração/animação) → usuário escolhe PDF (relatório retrato) ou PPT editável. Recomendação minha: HTML e PPT renderizam o MESMO deck-plan (consistência sem conversão HTML→PPT frágil).
- **2026-05-30 — feedback no botão "Baixar PPT" + roteiro aprovado** ✅
  - Bruno aprovou o conteúdo composto pela IA ("Agora sim"). Como a composição leva alguns segundos, a aba ficava em loading sem feedback (usuário clicava várias vezes).
  - `components/comparativos/BotaoBaixarPpt.tsx`: botão cliente que baixa via fetch+blob, mostra spinner + barra de progresso simulada (avança até 92%, completa no fim) e fica desabilitado durante a geração. Aplicado na página de detalhe e na de apresentação.
  - Infra: deploy via SSH falhou 1x com `dial tcp :22 i/o timeout` (blip de rede do VPS, não é código). `gh run rerun <id> --failed` resolveu. Commit `4a379c6`.
- **2026-05-30 — ETAPA "Apresentação do comparativo" CONCLUÍDA e validada** 🏁
  - Bruno testou trocar o design system para OUTRA empresa (cores distintas) e o sistema entendeu/aplicou: "COISA LINDA. Agora sim. Finalizado esta etapa."
  - Estado final: PPT editável + apresentação na tela + PDF (print), todos compostos pela IA (deck-plan) e com white-label (cores + logo) aplicado. Logo na proporção certa, sem texto sobreposto, com gráfico e próximos passos.
  - Fica em aberto (NÃO iniciado): fluxo "Gerar apresentação" com tela HTML interativa intermediária (proposta do Bruno) — só quando ele pedir.
- **2026-05-30 — sprint de 3 itens do backlog (Bruno: "siga o fluxo, mostre no fim do item 3")** ✅
  - **Item 1 — tela de apresentação = deck da IA.** A página `/comparativos/[id]/apresentacao` agora renderiza o MESMO deck composto pela IA (não o payload cru). Novo `ApresentacaoDeck.tsx` (HTML/print) desenha os 7 tipos de slide com white-label. Deck é persistido em disco (`deck-cache.ts`, `garantirDeck()`), então HTML + PDF + PPT usam o mesmo roteiro (consistência) e a IA só compõe uma vez. Commit `dba6d30`.
  - **Item 2 — export na análise individual.** Proposta agora tem `/propostas/[id]/apresentacao` + `/propostas/[id]/pptx`. Novo `lib/propostas/deck-plan.ts` (`montarDeckAnalise` + `garantirDeckProposta`, fallback). Renderizador do PPT e o HTML foram GENERALIZADOS: capa usa `eyebrow/subinfo/chips?/banda?` em vez de campos fixos de comparação. `BotaoBaixarPpt` agora recebe `url`. Commit `9daedbe`.
  - **Item 3 — fornecedores: mesclar duplicados + desempenho.** `lib/fornecedores/dedup.ts` detecta nomes parecidos (sem acento/caixa + distância de edição, limiar ceil(0.25·len) → pega "Eltormidia"~"Eletromidia"). `mesclarFornecedores()` re-aponta propostas pro principal, completa campos vazios e arquiva duplicados. Seção "Possíveis duplicados" na tela (usuário escolhe principal e confirma). Lista ganhou colunas economia gerada + desconto médio. Testes de dedup. Commit `63ca3a2`, deploy CI OK.
  - **Decisão de arquitetura (importante):** ZERO migrations nesta leva — migrations rodam no VPS com role privilegiada que não dá pra validar daqui sem risco de quebrar deploy. Decks → cache em disco (`storage/decks/`, gitignored). Por isso o **"marcar proposta aprovada" + índice de aprovação real ficou ADIADO** para a próxima migration (provavelmente junto do Stripe). O "desempenho" atual usa só dados existentes (economia/desconto), não aprovação.
- **2026-05-30 — fix: upload de proposta grande dava tela branca** ✅
  - Sintoma: `/propostas/nova` mostrava "Application error: client-side exception". Console revelou DOIS problemas encadeados: (1) **413 Request Entity Too Large** — o **Nginx do VPS** cortava upload em 1 MB (padrão), antes de chegar no app (next.config já tinha `serverActions.bodySizeLimit: 25mb`); (2) o `PropostaForm` lia `estado.erro` num estado indefinido (quando a action falha no servidor) → quebrava a tela toda.
  - Correção código (`PropostaForm.tsx`, commit `e8a05cb`): guarda `estado?.erro`, valida tamanho no cliente (máx 25 MB) com mensagem clara, e moveu o `setAnalisando` pro `onSubmit` (só depois de validar).
  - Correção infra (manual no VPS): `client_max_body_size 30M;`. **PEGADINHA IMPORTANTE:** colocar só no bloco `server` do site NÃO funcionou — o upload (POST) vai pelo HTTPS (porta 443) e aquele bloco específico não estava aplicando. Diagnóstico definitivo veio do DevTools → Network → request `nova` 413 → header `Server: nginx/1.24.0` (confirmou que era o Nginx, não Cloudflare nem o app). **SOLUÇÃO:** adicionar `client_max_body_size 30M;` no bloco GLOBAL `http {}` do `/etc/nginx/nginx.conf` (vale pra todos os server blocks) + `nginx -t && systemctl reload nginx`. Confirmado: 18 MB sobe e analisa.
  - **LIÇÃO (registrar):** uploads grandes precisam de (1) `serverActions.bodySizeLimit` no Next E (2) `client_max_body_size` no Nginx **no nível `http` global** (não só no server block). E `nginx -t` só testa sintaxe — tem que rodar `reload` pra valer.
  - Aviso de limite "Até 25 MB no total" agora visível na tela de upload (transparência). Commit `fe8411f`.

## Decisões de produto / monetização (para a fase do Stripe — NÃO construído ainda)
- **Limite de tamanho de arquivo = alavanca de plano.** Em vez de "defeito", vira diferencial: ex. plano básico 25 MB, premium 50 MB. Limites devem aparecer na PÁGINA DE PREÇOS (transparência no ato da compra) e na tela de upload (já feito). Bruno: "avisar no ato da compra/upload pra não dar sensação de ter sido enganado".
- **Custo FIXO vs VARIÁVEL:** o VPS é custo fixo (não escala por uso); o custo variável real é a IA (tokens Claude por análise). Os créditos precisam cobrir a IA + fatia amortizada do servidor.
- **Já temos a base de medição:** `analises.custo_usd` por análise + tabela `workspace_uso.custo_ia_usd`. Dá pra precificar crédito com dados reais e provar a margem (Preço ≥ Custo × 1,5).
- **Modelo sugerido:** 1 crédito = 1 análise (ou 1 comparação); preço = (custo IA médio + infra amortizada) × 1,5.
- **Auto-scaling do servidor: NÃO no VPS Hostinger** (KVM é plano fixo; upgrade KVM1→KVM2 é manual). Auto-scale real só migrando p/ Fly/Render/Railway (custa mais, fura orçamento atual). **Decisão:** em vez de auto-escalar, MONITORAR + ALERTAR via Resend (e-mail pro Bruno) quando: gasto de IA cruza X% do teto US$30; RAM/disco do VPS passa do seguro; cliente com uso anormal. Bruno decide subir o servidor — e os créditos já pagaram o uso (liquidez). Auto-scale fica para quando houver receita e migração de plataforma.
