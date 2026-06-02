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

## 💸 Custos do projeto (contabilizar)
- **VPS Hostinger KVM1**: R$ 52,99/mês (fixo)
- **E-mail @getvetly.com** — 3 contas (`bruno@`, `financeiro@`, `contato@`): **R$ 35,97/mês** (mensal, confirmado Bruno 2026-06-01). `contato@getvetly.com` usado na landing.
- **➡️ Total fixo mensal até agora: ~R$ 88,96/mês** (VPS + e-mail) + variável (Claude por análise).
- **Domínio getvetly.com**: Hostinger (valor anual — registrar quando souber)
- **IA Claude (variável)**: custo por token/análise (`analises.custo_usd`), teto US$30 — é o custo variável que entra no cálculo de cota/crédito
- **Resend**: free tier por enquanto
- (**Stripe**: taxa por transação quando começar a cobrar)

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
- **Validação local**: rodar só `pnpm lint` e `pnpm type-check` (não dependem de rede/escrita pesada). `pnpm test` (Vitest) também roda local, mas é LENTO no Drive (import demora ~min).
- ⚠️ **Neste PC o `pnpm` não está no PATH do shell não-interativo** (só `node`/`npm`/`npx`/`corepack`). Workaround pra rodar as validações: `npx --no-install tsc --noEmit`, `npx --no-install vitest run`, `npx --no-install next lint` (usa o que já está em `node_modules`, sem baixar). No outro PC do Bruno pode estar diferente.
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
- ✅ **Resend ATIVO (2026-06-01)**: conta criada, domínio `getvetly.com` **verificado** (Domain verified no painel do Resend), `RESEND_API_KEY` no `.env` do VPS (aplicada com `pm2 restart getvetly --update-env` como usuário `deploy`). O e-mail de recuperação de senha agora **ENVIA de verdade** (remetente padrão `nao-responda@getvetly.com`; lib `lib/email/enviar.ts` já existia com fallback p/ log). Testado: e-mail chegou na caixa com logo + cor lime. PM2 roda sob o usuário `deploy` (não root) — `pm2 list` como root vem vazio.
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
    - **Gestão de Usuários** ✅ FEITO (2026-06-02): `/usuarios` (admin) — convidar por e-mail (Resend → `/convite/[token]` cria conta entrando no workspace existente, sem empresa nova), listar equipe, remover, revogar convites. **Limite de assentos por plano** (`ASSENTOS_POR_PLANO` em `lib/stripe/config.ts`: Starter 2 / Pro 5 / Business 15 / Enterprise ∞; trial 1) com `limiteAssentos(status, plano, vitalicio)`. **Vitalício** = e-mail interno (`INTERNAL_ADMIN_EMAILS`, agora helper `lib/auth/interno.ts`) → assentos ilimitados + sem paywall (cobre Bruno + e-mail de demo de vendas). **Papéis**: admin gerencia (empresa/usuários/financeiro/administrativo), member só opera (propostas/comparativos/fornecedores) — gating em `/usuarios` `/financeiro` `/configuracoes` (redirect), no menu de perfil e no índice gerencial do painel. Camada em `lib/workspace/membros.ts`. ZERO migration (`workspace_members`/`workspace_convites` já existiam; token do convite gerado no Node). v1: convida e-mail SEM conta; e-mail com conta → "já tem conta, faça login". Commit `ee3dce6`.
    - **Ajuda** (no momento certo): FAQ + chat de suporte + chamados.
- ⚠️ **Infra recorrente**: deploy SSH falha intermitente com `dial tcp :22 i/o timeout` (flakiness de rede do VPS Hostinger). Resolver com `gh run rerun <id> --failed`. Melhoria futura: adicionar retry/`timeout` maior no passo SSH do workflow.

### Aprovação por e-mail / compartilhar (avaliado 2026-05-30)
- Mandar a análise por e-mail: complexidade MÉDIA; gargalo é infra (Resend não configurado: conta + verificação de domínio via DNS). Com Resend pronto, versão fácil = anexar o PPT (já gerado no servidor) + resumo. Versão "linda" = link compartilhável + aprovar online (liga com a situação "Apresentada"). Recomendação: juntar num pacote só — **Resend + compartilhar por link/e-mail + aprovar online** — próximo passo natural depois do Dashboard.

### ✅ CONCLUÍDO — Compartilhar + aprovar online (Item A, 2026-06-01, testado em prod)
**Objetivo**: link compartilhável da proposta/comparativo para a diretoria **aprovar/recusar SEM login**, + envio por e-mail. Infra **Resend já ATIVA** (ver "Estado atual").
- **Banco**: NADA a criar — tabelas `compartilhamentos`, `aprovacoes`, `anotacoes` **já existem desde a migration 0001** (token base64url auto, `expira_em` 15 dias, `permite_aprovar`, `revogado_em`, métricas de visualização; enum `aprovacao_decisao` = `aprovado`/`aprovado_com_ressalvas`/`recusado`). O próprio schema já previa a rota pública `/r/[token]` (service role, valida token). Middleware (`auth.config.ts`) já libera `/r/`.
- ✅ **Commit 1 — feito, AINDA NÃO commitado/deployado** (gerar link + página pública + aprovar online):
  - `lib/compartilhamentos/schema.ts` (Zod `aprovacaoSchema`) + `schema.test.ts` (4 testes; corrigido o transform de `justificativa` vazia → undefined).
  - `lib/compartilhamentos/db.ts`: `criarOuReusarCompartilhamento` (RLS, reusa link ativo), `buscarCompartilhamentoPorToken` (SERVICE: valida validade/revogação, conta visualização, monta deck+whitelabel reusando `garantirDeck`/`garantirDeckProposta`), `registrarAprovacao` (grava em `aprovacoes` + atualiza situação).
  - `lib/workspace/db.ts`: + `buscarWorkspacePorId` (service, p/ aplicar whitelabel sem login).
  - `app/(dashboard)/compartilhar/actions.ts`: `criarLinkCompartilhamentoAction(tipo, refId)` → `/r/<token>`.
  - `components/compartilhamentos/BotaoCompartilhar.tsx`: card "Compartilhar para aprovação" (gera + copia link; URL montada no client via `window.location.origin`).
  - `app/r/[token]/{page,actions,FormAprovacao}.tsx`: página PÚBLICA (fora do `(dashboard)`, usa só o layout raiz) renderiza `ApresentacaoDeck` + form Aprovar/Recusar (nome obrigatório, e-mail/comentário opcionais).
  - **Regra de situação ao aprovar online**: proposta → `aprovado`(+ressalvas)=**aprovada**, `recusado`=**recusada**; comparativo → marca **apresentada** (a escolha da vencedora segue manual no app). Link vale 15 dias.
  - ✅ Commitado (`e74a3b6`), deployado e **TESTADO em prod** (após hotfix do token, ver abaixo).
- ✅ **Commit 2 — FEITO** (`21a6e2f`): botão "Enviar por e-mail" → dispara `enviarEmail` (`emailCompartilhamento`) com mensagem opcional + marca "apresentada" (só se em aberto). URL via `NEXT_PUBLIC_APP_URL`. Testado em prod (e-mail chega).

### Lote "pode fazer tudo" (2026-06-02) — pós Stripe Live
- ✅ **Exportar CSV** — rotas `/fornecedores/export` e `/propostas/export` (helper `lib/csv.ts`: separador `;` + BOM UTF-8 p/ Excel pt-BR). Botões "Exportar CSV" nas listas. (Rota estática `export` tem precedência sobre `[id]` dinâmico — sem conflito.)
- ✅ **Ajuda / FAQ** — `/ajuda` virou FAQ real (accordion `<details>` nativo, 9 perguntas) + "Falar com o suporte" (mailto contato@). Bot/IA + chamados = futuro.
- ✅ **Onboarding 1º acesso** — `components/painel/OnboardingNovo.tsx`: card "Como funciona" (4 passos) no painel, aparece só quando a conta está vazia (0 propostas/comparativos/fornecedores) e some sozinho. (Tutorial interativo + proposta de amostra = futuro.)
- ✅ **Painel admin interno** — `/admin` (gated por `ehEmailInterno` → redirect se não for interno): MRR (soma planos ativos × `PRECO_MENSAL_BRL`), assinantes ativos por plano, empresas/usuários/análises/custo IA acumulado, empresas recentes. `lib/admin/db.ts` (queries de serviço, todos os workspaces). Atalho "Admin (interno)" no menu de perfil só p/ interno.
- ⏸️ **Dark mode — DIFERIDO (decisão honesta)**: as cores são hardcoded no `tailwind.config` e `ink`/`paper` são usados tanto SEMÂNTICO quanto LITERAL (ex.: `bg-ink` na capa/faixa do vencedor que SÃO escuras de propósito). Um flip global de variável inverteria essas superfícies → regressão visual no app inteiro (que agora é vendável). Fazer certo exige refator dos tokens (separar surface/text que vira vs brand/superfícies-escuras literais) + toggle + persistência + manter print claro + **review visual** — não dá pra validar só com type-check/lint. Fica como passe dedicado.
- ✅ **getvetly.com raiz → app.getvetly.com (2026-06-02)**: resolvido via **redirecionamento de domínio da Hostinger** (Redirecione seu domínio → Redirecionar para `https://app.getvetly.com` → 301). NÃO precisou de DNS-pro-VPS nem certbot (o `certbot certonly --nginx` falhou justamente porque `getvetly.com` apontava pro parking da Hostinger `2.57.91.91`, não pro VPS — abandonado em favor do redirect da Hostinger, que cuida de redirect + HTTPS). LIÇÃO: pra só redirecionar a raiz, o "domain forwarding" do registrador é mais simples que A record + Nginx + cert.
- ⏸️ **Mistral OCR** (PDF escaneado): precisa de chave Mistral + custo por página — decisão/chave do Bruno. **i18n EN/ES** e **Hotmart afiliados**: pós-PMF (Bruno marcou "mais à frente"). **Dark mode**: passe dedicado (ver acima).

### Ideias futuras (Bruno 2026-05-30) — pós-MVP / roadmap
1. **Bot de atendimento + área de AJUDA (IA)** — pra economizar token, criar DOCUMENTAÇÃO de como o Get Vetly funciona; o bot consulta a doc (RAG) e, se não resolver, o usuário abre um chamado. (depende de doc pronta + decisão de custo)
2. **Painel de gestão da conta** — perfil do usuário (foto, cadastro), financeiro (faturas e pagamentos). Liga com Stripe.
3. **Versão dark** (tema escuro).
4. **Exportar CSV** de todos os fornecedores e propostas cadastradas.
5. **Tutorial passo a passo (onboarding)** no 1º acesso — guia em telas cadastrando uma proposta de amostra; depois fica na seção de Ajuda. Só no primeiro acesso.

### Roadmap de lançamento / comercial (Bruno 2026-06-01)
Itens de go-to-market (fora do produto em si), a fazer no momento certo:
1. **Documentação técnica completa** — doc de como o GetVetly funciona ponta a ponta. Também alimenta o bot de Ajuda/RAG (ver "Ideias futuras" #1).
2. **Página de vendas** — landing de conversão (pricing + benefícios). Planos já definidos: Starter R$297 / Pro R$897 / Business R$2.490 / Enterprise R$7.900+ (regra de margem ≥ custo×1,5).
3. **Home (LP institucional)** — página inicial/marca do GetVetly (hoje a `/` é a landing de preview da Vetly).
4. **Pagamento do SITE = Stripe (CONFIRMADO por Bruno, 2026-06-01)** — o checkout self-service do app é Stripe (Bruno só precisa de ajuda pra configurar). **Modelo de cobrança a definir** (assinatura com usuários × créditos) — ver pergunta aberta abaixo + análise de unit-economics.
5. **Hotmart — criar afiliados (canal à parte)** — usar a Hotmart para programa de afiliados (revenda/indicação por links/cupons, comissão %). Liga com a ideia #7 "Canal de parceiros/afiliados" e com o whitelabel (consultorias). NÃO substitui o Stripe do site — é um canal de venda/afiliação separado. Fase pós-PMF.
6. **i18n — inglês + espanhol (vender fora do Brasil)** — Bruno quer vender internacionalmente; o app precisa de pelo menos EN + ES. **Entra MAIS À FRENTE** (não agora). Implica: estrutura de tradução (ex: next-intl ou dicionário próprio — avaliar em ADR), traduzir UI + e-mails, e os PROMPTS da IA gerarem relatório no idioma do usuário. Stripe já lida com multimoeda quando chegar a hora.
7. **Painel administrativo do GetVetly (interno, só pro Bruno)** — back-office do dono pra acompanhar **vendas/MRR, dashboards, conteúdos, site, blog** etc. Separado do app do cliente (área `/admin` protegida só pro Bruno, ou app à parte). **Entra quando o produto estiver finalizado para venda** (depende de Stripe pros dados de venda + métricas de uso já existentes em `workspace_uso`).

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

- **2026-06-01 — compartilhar + aprovar online + enviar por e-mail** ✅ (commits `e74a3b6`, `21a6e2f`)
  - **Resend ATIVADO** (domínio `getvetly.com` verificado, `RESEND_API_KEY` no VPS) — recuperação de senha agora ENVIA de verdade. Testado: e-mail chegou.
  - **Commit 1**: link público `/r/[token]` (sem login) mostra o relatório com whitelabel + form Aprovar/Recusar; card "Compartilhar para aprovação" na proposta e no comparativo. Reusa tabelas `compartilhamentos`/`aprovacoes` (já existiam no schema 0001) → **ZERO migration**. Aprovar online atualiza a situação (proposta → aprovada/recusada; comparativo → apresentada).
  - **Commit 2**: botão "Enviar por e-mail" (Resend, `emailCompartilhamento`) com mensagem opcional; marca como "apresentada" (só se estava em aberto). URL via `NEXT_PUBLIC_APP_URL`.
  - Validado local: **type-check + lint + 6 testes** verdes. ✅ **TESTADO EM PROD (Bruno, 2026-06-01)**: gerar link → abrir em aba anônima → aprovar funcionou; envio por e-mail OK. (Precisou do hotfix do token abaixo.) Obs: `gh` não está instalado neste PC, então não dá pra acompanhar o CI daqui — confirmar pela aba Actions ou testando o site. SSH flaky (`dial tcp :22 i/o timeout`) → "Re-run failed jobs".
  - 🐞 **HOTFIX (2026-06-01)**: 1º teste em prod deu `unrecognized encoding: "base64url"` ao gerar/enviar link. Causa: o DEFAULT da coluna `compartilhamentos.token` (migration 0001) é `encode(gen_random_bytes(24),'base64url')`, mas o **Postgres NÃO suporta `base64url`** no `encode()` (só `base64`/`hex`/`escape`) — o erro só estoura no INSERT, não no `create table`. Correção: token gerado no **Node** (`randomBytes(24).toString('base64url')`) e inserido explícito; o default quebrado nunca é usado. **LIÇÃO**: `encode(...,'base64url')` no Postgres é armadilha — gerar tokens no app. (Cleanup opcional futuro: migration pra corrigir/remover o default.)

- **2026-06-01 — landing / página de vendas publicada** ✅ (commit `121e522`)
  - Nova home em `/` (substitui a preview "Em construção"): hero → como funciona (3 passos) → diferenciais (6 cards, inclui aprovação por link) → planos (4) → FAQ → CTA. Design Vetly. Componentes em `components/landing/`. CTA "Começar grátis" → `/cadastro` (teste grátis sem cartão).
  - Serve em **`app.getvetly.com`** (`getvetly.com` raiz ainda não configurado). E-mails @getvetly.com criados (contato@ usado na landing).
  - ⚠️ CI disparado pelo push; confirmar na aba Actions/no site (gh não instalado neste PC). SSH flaky → "Re-run failed jobs".

- **2026-06-02 — Stripe (assinatura + paywall) no ar** ✅ (migration 0007 aplicada no VPS)
  - **Teste grátis = 3 análises** por workspace → depois exige assinatura (paywall nas ações de análise). Planos via **Stripe Checkout hosted**, **webhook** ativa, **portal** pra gerenciar/cancelar. **Admin interno** (`INTERNAL_ADMIN_EMAILS`) não passa pela cobrança.
  - Integração **via REST/fetch + node:crypto (sem SDK)**. Arquivos: `lib/stripe/{config,client,assinatura}.ts`, `/financeiro` (page+actions), `/api/webhooks/stripe`, gating em `propostas/actions.ts` + `comparativos/actions.ts`. **Paywall amigável (2026-06-02)**: `components/Paywall.tsx` — `/propostas/nova` e `/comparativos/subir` checam acesso e mostram card "Ver planos e assinar" (em vez de erro vermelho) quando o grátis acaba; aviso "X de 3 restantes" durante o trial.
  - ✅ **Bruno fez (2026-06-02)**: webhook criado (`STRIPE_WEBHOOK_SECRET` no `.env`) + Customer Portal ativo + **TESTADO em prod**: paywall → assinar com `4242` → status virou **Ativo** via webhook. Fluxo de cobrança validado em **modo TEST**.
  - ✅ **STRIPE EM LIVE — VALIDADO (2026-06-02)**: Bruno ativou a conta, recriou os 4 produtos/preços em Live, trocou `sk_live_` + 4 `price_` Live + `whsec_` Live no `.env` do VPS (+ `pm2 restart --update-env` como `deploy`), recriou o webhook (`site-getvetly`, Ativo, 3 eventos, URL `/api/webhooks/stripe`) e ativou o portal. **Testou assinatura real (cartão real) → status virou "Ativo" via webhook → "tudo certo"**. ZERO mudança de código (tudo via `.env`). Obs: a UI nova do Stripe (event destinations) NÃO tem "enviar evento de teste" e cartões de teste não rodam em Live — validação só com cobrança real + estorno. **getvetly PRONTO PARA VENDER.**
  - CI disparado; confirmar Actions/site (gh não instalado neste PC).

## Decisões de produto / monetização (para a fase do Stripe — NÃO construído ainda)
- ✅ **MODELO DE COBRANÇA DECIDIDO (Bruno, 2026-06-01): assinatura + crédito de excedente.** Planos (Starter/Pro/Business/Enterprise) com **COTA de análises/mês + USUÁRIOS incluídos** por tier; passou da cota → **pacote de créditos** avulso (ou upgrade). Pagamento do site = **Stripe** (multimoeda quando for internacional). Calibrar as cotas com `analises.custo_usd` + `workspace_uso.custo_ia_usd`, respeitando **Preço ≥ Custo×1,5**. Base já no banco: `workspace_members`/`workspace_convites` (assentos) + medição de custo. **Falta construir**: tabelas de assinatura + integração Stripe (checkout/webhook/portal do cliente) + enforcement de cota. Esboço a calibrar: Starter ~20 análises/mês (1-2 users) · Pro ~80 (até 5) · Business ~250 (até 15) · Enterprise sob medida. **Por quê** (registro): assinatura dá MRR previsível B2B e não cria fricção de uso; cota protege a margem de IA; crédito de excedente vira upsell. Crédito puro foi descartado (mata o hábito + sem MRR).
- 🚧 **Stripe — config em andamento (2026-06-01)**: Bruno criou os 4 produtos no Stripe. **Product IDs**: Starter `prod_Ucy8s90IJb48ZB` · Pro `prod_Ucy9wxBKHD3mN9` · Business `prod_Ucy9PrSte6Mm62` · Enterprise `prod_UcyEcu6IreHiqN`. **Price IDs (recebidos 2026-06-01)**: Starter `price_1TdiCa6oxuxw2cdCCSbUZTy0` · Pro `price_1TdiD06oxuxw2cdCO00oQf1X` · Business `price_1TdiDH6oxuxw2cdCD5IlajO7` · Enterprise `price_1TdiHq6oxuxw2cdCRl9BG63E`. ⚠️ **AINDA FALTA (pedido ao Bruno)**: as **API keys** (`sk_`/`pk_`) + `whsec_` do webhook → no `.env` do VPS (nunca no repo; IDs de produto/preço não são segredo, ficam aqui); **Modo: TEST (confirmado Bruno 2026-06-01)** — usar `sk_test_`/`pk_test_`; flipar pra Live no lançamento. Rota webhook planejada: `/api/webhooks/stripe`.
- 🚧 **Stripe — build (2026-06-02)**: decidido **teste grátis = 3 análises** (`ANALISES_GRATIS=3`, conta linhas em `analises` por workspace). **Decisão técnica**: integrar via **REST/fetch + node:crypto** (igual ao Resend), **SEM adicionar o SDK `stripe`** — evita dependência nova e o problema de instalar no Google Drive; Hosted Checkout (redirect) não precisa da publishable key. **Migration 0007** criada (`db/migrations/0007_assinaturas.sql`: colunas em `workspaces` → `stripe_customer_id`, `stripe_subscription_id`, `plano`, `assinatura_status` default `'trial'`, `assinatura_expira_em`) — **Bruno roda no VPS** após o deploy. `lib/stripe/config.ts` criado (mapa plano→`STRIPE_PRICE_<PLANO>_MENSAL`). LP enriquecida (subir várias → comparar → apresentação pronta → link de aprovação). **Convenção de env (do `.env.example`)**: `STRIPE_PRICE_STARTER_MENSAL`/`_PRO_`/`_BUSINESS_`/`_ENTERPRISE_MENSAL` (adicionei a do Enterprise). ✅ **CONSTRUÍDO (2026-06-02)**: `lib/stripe/client.ts` (checkout/portal/verificar webhook via REST+crypto), `lib/stripe/assinatura.ts` (`buscarAssinatura`, `verificarAcessoAnalise` com **bypass de admin interno** via `INTERNAL_ADMIN_EMAILS` — senão o Bruno se trancaria por ter muitas análises —, `ativarAssinatura`/`atualizarAssinaturaPorCustomer` p/ webhook), action de checkout/portal (`/financeiro/actions.ts`), tela `/financeiro` (status + planos + assinar/gerenciar), webhook `/api/webhooks/stripe` (checkout.session.completed + customer.subscription.updated/deleted), e **gating** nas 3 entradas de análise (`criarEAnalisarPropostaAction`, `analisarPropostaAction`, `compararNovosArquivosAction`). Trial = conta linhas em `analises` por workspace. **Env no VPS (Bruno já pôs sk_test + price IDs + migration 0007 aplicada)**. **FALTA só Bruno**: (1) criar webhook no Stripe → `STRIPE_WEBHOOK_SECRET` no `.env`; (2) ativar Customer Portal no Stripe; (3) testar com cartão `4242...`. Início de uso decidido: **teste grátis SEM cartão** (N análises grátis no cadastro → paywall pra continuar).
- 🚧 **Landing / página de vendas (2026-06-01)**: construída em `/` (substitui a antiga preview "Em construção"). Seções: hero → como funciona (3 passos) → diferenciais (6 cards, inclui aprovação por link) → planos (4) → FAQ → CTA. Componentes em `components/landing/` (ComoFunciona, Diferenciais, Planos, FAQ) + `app/page.tsx`. CTA principal "Começar grátis" → `/cadastro`. Preços exibidos 297/897/2490/Enterprise; cotas indicativas (~20/~80/~250) com disclaimer. type-check+lint OK. **Aguardando review do Bruno + deploy.**
  - ⚠️ **DOMÍNIO**: `getvetly.com` (raiz) **NÃO está configurado** — só `app.getvetly.com` aponta pro VPS (Bruno avisou 2026-06-01). Então a landing será servida em **`app.getvetly.com/`** por enquanto (mesmo app serve marketing + produto — normal no início). **TODO infra (futuro)**: apontar `getvetly.com` no DNS → VPS (ou redirect → app), quando for separar o site de marketing do app. Obs: a landing usa `mailto:contato@getvetly.com` — ✅ esse e-mail FOI criado (2026-06-01), link válido.
- **Limite de tamanho de arquivo = alavanca de plano.** Em vez de "defeito", vira diferencial: ex. plano básico 25 MB, premium 50 MB. Limites devem aparecer na PÁGINA DE PREÇOS (transparência no ato da compra) e na tela de upload (já feito). Bruno: "avisar no ato da compra/upload pra não dar sensação de ter sido enganado".
- **Custo FIXO vs VARIÁVEL:** o VPS é custo fixo (não escala por uso); o custo variável real é a IA (tokens Claude por análise). Os créditos precisam cobrir a IA + fatia amortizada do servidor.
- **Já temos a base de medição:** `analises.custo_usd` por análise + tabela `workspace_uso.custo_ia_usd`. Dá pra precificar crédito com dados reais e provar a margem (Preço ≥ Custo × 1,5).
- **Modelo sugerido:** 1 crédito = 1 análise (ou 1 comparação); preço = (custo IA médio + infra amortizada) × 1,5.
- **Auto-scaling do servidor: NÃO no VPS Hostinger** (KVM é plano fixo; upgrade KVM1→KVM2 é manual). Auto-scale real só migrando p/ Fly/Render/Railway (custa mais, fura orçamento atual). **Decisão:** em vez de auto-escalar, MONITORAR + ALERTAR via Resend (e-mail pro Bruno) quando: gasto de IA cruza X% do teto US$30; RAM/disco do VPS passa do seguro; cliente com uso anormal. Bruno decide subir o servidor — e os créditos já pagaram o uso (liquidez). Auto-scale fica para quando houver receita e migração de plataforma.
