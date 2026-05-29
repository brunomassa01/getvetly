# User Stories do MVP

Cada user story é a unidade mínima de trabalho. Implemente uma de cada vez, com testes, e marque concluída aqui. Use o skill `implementar-feature` no Claude Code para guiar a execução.

**Convenções:**
- ID: `US-NNN` numeração sequencial
- Status: `[ ]` pendente / `[~]` em progresso / `[x]` concluída
- Prioridade: P0 (bloqueia MVP) / P1 (importante) / P2 (nice to have)
- Estimativa: S (1-2h) / M (meio dia) / L (1-2 dias) / XL (3+ dias)

---

## Épico 1: Autenticação e onboarding

### US-001 — Signup com e-mail e senha [P0] [M]
**Como** novo usuário,
**Quero** criar uma conta com e-mail e senha,
**Para que** eu possa começar a usar o produto.

**Critérios de aceite:**
- [ ] Página `/signup` com campos: nome, e-mail, senha (mín. 8 chars), aceite de termos
- [ ] Validação client-side com mensagens em PT-BR
- [ ] Validação server-side com Zod
- [ ] E-mail de verificação enviado via Resend
- [ ] Após confirmar e-mail, usuário entra direto no onboarding
- [ ] Teste e2e cobre o fluxo completo
- [ ] Erro de e-mail duplicado tem mensagem clara

`[ ]` Status

---

### US-002 — Login com e-mail/senha + magic link [P0] [M]
**Como** usuário existente,
**Quero** fazer login com e-mail e senha OU receber link mágico por e-mail,
**Para que** eu acesse minha conta sem dor.

**Critérios:**
- [ ] Página `/login` com tabs (senha / magic link)
- [ ] Senha errada mostra mensagem clara sem revelar se e-mail existe
- [ ] Magic link expira em 1 hora
- [ ] Após login, redireciona para `/dashboard` ou para `next` query param se houver
- [ ] Sessão dura 30 dias por padrão
- [ ] Logout em qualquer dispositivo invalida sessão

`[ ]` Status

---

### US-003 — Onboarding em 4 passos [P0] [L]
**Como** novo usuário,
**Quero** ser guiado nos 4 primeiros passos críticos,
**Para que** eu tire valor já na primeira sessão.

**Passos:**
1. Dados da empresa (nome, CNPJ opcional, segmento, tamanho)
2. Job principal (comparar fornecedores / analisar profundo / ambos)
3. Configurar whitelabel (logo, cor primária, nome)
4. Analisar primeira proposta (upload guiado + animação durante processamento)

**Critérios:**
- [ ] Tela cheia, progresso visível (1/4, 2/4...)
- [ ] Pode pular qualquer passo exceto o 1
- [ ] Estado salvo entre etapas (refresh não perde dados)
- [ ] Tela final celebra com primeira análise pronta
- [ ] Telemetria: track de cada passo (Posthog)

`[ ]` Status

---

### US-004 — Recuperar senha [P0] [S]
**Como** usuário que esqueceu a senha,
**Quero** redefinir via link no e-mail,
**Para que** eu volte a acessar minha conta.

**Critérios:**
- [ ] Página `/recuperar-senha` com campo de e-mail
- [ ] E-mail enviado mesmo se conta não existe (anti-enumeration)
- [ ] Link expira em 1 hora
- [ ] Nova senha precisa ter mín. 8 chars

`[ ]` Status

---

### US-005 — Convidar membro para o workspace [P1] [M]
**Como** admin de um workspace,
**Quero** convidar colegas por e-mail,
**Para que** o time todo use a ferramenta.

**Critérios:**
- [ ] Página `/configuracoes/equipe`
- [ ] Botão "Convidar membro" abre modal com e-mail + role (admin/membro)
- [ ] Convidado recebe e-mail com link de 7 dias
- [ ] Se já tem conta, é adicionado direto ao workspace
- [ ] Se não tem, faz signup já vinculado
- [ ] Limite por tier (Starter: 1 / Pro: 5 / Business: 20 / Enterprise: ilimitado)

`[ ]` Status

---

## Épico 2: Análise de proposta

### US-010 — Upload de arquivos da proposta [P0] [L]
**Como** comprador,
**Quero** arrastar e soltar até 10 arquivos da proposta,
**Para que** o sistema processe sem eu precisar abrir cada um.

**Critérios:**
- [ ] Página `/propostas/nova`
- [ ] Drag-and-drop com preview de cada arquivo (nome, tamanho, ícone)
- [ ] Aceita: PDF, DOCX, XLSX, XLS, CSV, PNG, JPG, JPEG (até 50 MB cada)
- [ ] Total: 10 arquivos ou 100 MB, o que vier primeiro
- [ ] Validação visual antes de enviar (badge vermelho se inválido)
- [ ] Upload assíncrono com progress bar
- [ ] Arquivo armazenado em Supabase Storage no bucket `propostas-raw/<workspace_id>/<proposta_id>/`
- [ ] URL não-pública (acesso só via signed URL no momento do download)

`[ ]` Status

---

### US-011 — Formulário rápido após upload [P0] [M]
**Como** comprador,
**Quero** preencher 4 campos rápidos antes da análise começar,
**Para que** o relatório saia direcionado.

**Campos:**
1. Nome do fornecedor (autocompleta de fornecedores já cadastrados)
2. Categoria (mídia, software, serviços, produtos, brindes, outro)
3. Escopo em 1 linha (ex.: "Campanha CLT em São Paulo, 28 dias")
4. Quem vai aprovar (e-mail opcional — pré-preenche link compartilhável depois)

**Critérios:**
- [ ] Formulário aparece após confirmação do upload
- [ ] Autocomplete de fornecedor busca dentro do workspace
- [ ] Categoria via select com 6 opções fixas + "outro"
- [ ] Salvar = dispara pipeline de análise (US-012)

`[ ]` Status

---

### US-012 — Pipeline de análise da IA [P0] [XL]
**Como** sistema,
**Quero** processar os arquivos da proposta e gerar análise estruturada,
**Para que** o usuário receba relatório útil em até 3 minutos.

**Fluxo técnico (ver `docs/03-backend/ai-pipeline.md`):**
1. Worker assíncrono pega proposta com status `processing`
2. Para cada arquivo: OCR/parsing via Mistral OCR (PDF, imagem) ou bibliotecas Node (XLSX, DOCX)
3. Junta todo o texto extraído num único contexto
4. Chama Claude API com prompt estruturado (ver `docs/03-backend/ai-pipeline.md`)
5. Resposta JSON é validada com Zod (schema rígido)
6. Salva análise estruturada em `analises` (tabela)
7. Atualiza status da proposta para `ready`
8. Notifica usuário (in-app + opcional e-mail)

**Critérios:**
- [ ] Tempo médio < 3 min (90% das propostas)
- [ ] Falha tem retry (até 3x com backoff)
- [ ] Falha definitiva: notifica usuário com mensagem clara + opção de reprocessar
- [ ] Custo médio < R$ 0,50/análise (medir em prod)

`[ ]` Status

---

### US-013 — Página de detalhe da análise [P0] [L]
**Como** comprador,
**Quero** ver o relatório completo da análise,
**Para que** eu entenda a proposta e decida.

**Seções (espelham `analisador-propostas/skills/analisar-proposta/references/secoes-obrigatorias.md`):**
1. Hero com valor final + tabela cheia riscada
2. Resumo executivo (4 cards)
3. Detalhamento por bloco
4. Tabela completa de itens
5. Métricas (se aplicável)
6. Investimento em destaque
7. Specs técnicas + condições comerciais
8. Análise crítica (pros / pontos para questionar)
9. Footer

**Critérios:**
- [ ] Rota `/propostas/[id]`
- [ ] Aplica whitelabel do workspace
- [ ] Botões: "Compartilhar", "Editar análise", "Adicionar nota", "Exportar PDF"
- [ ] Sticky CTA mobile: "Aprovar / Recusar" se for visualizador externo via link
- [ ] Performance: TTFB < 500ms, LCP < 2s

`[ ]` Status

---

### US-014 — Editar análise gerada pela IA [P1] [M]
**Como** comprador experiente,
**Quero** editar pontos a favor ou questionamentos que a IA gerou,
**Para que** o relatório final reflita minha visão.

**Critérios:**
- [ ] Cada bloco editável tem botão "Editar"
- [ ] Editor inline simples (textarea com markdown básico)
- [ ] Salva em revisão com autor e timestamp
- [ ] Histórico de edições visível (audit log)

`[ ]` Status

---

### US-015 — Exportar análise em PDF [P0] [M]
**Como** comprador,
**Quero** baixar a análise em PDF de alta qualidade,
**Para que** eu imprima ou anexe em e-mail.

**Critérios:**
- [ ] Botão "Exportar PDF" na página de análise
- [ ] Geração server-side via Playwright (print to PDF do HTML existente)
- [ ] PDF respeita whitelabel
- [ ] Cabeçalho e rodapé em cada página
- [ ] Quebra de página inteligente (não cortar tabela no meio)

`[ ]` Status

---

## Épico 3: Comparativo de propostas

### US-020 — Selecionar propostas para comparar [P0] [M]
**Como** comprador,
**Quero** marcar 2-5 propostas da mesma categoria,
**Para que** eu gere comparativo lado a lado.

**Critérios:**
- [ ] Página `/propostas` tem checkbox em cada linha
- [ ] Quando 2+ marcadas, aparece barra fixa no rodapé "Comparar X propostas"
- [ ] Botão leva a `/comparativos/novo?ids=...`
- [ ] Valida categoria: avisa se categorias diferentes mas permite seguir

`[ ]` Status

---

### US-021 — Gerar relatório comparativo [P0] [L]
**Como** comprador,
**Quero** ver matriz de critérios com vencedor por linha,
**Para que** eu escolha o fornecedor certo com critério.

**Critérios:**
- [ ] Matriz com colunas: Critério, Fornecedor A, B, C..., Vencedor
- [ ] Vencedor destacado em verde por linha
- [ ] Recomendação final em parágrafo no topo
- [ ] Cenário "se prazo for crítico, escolha X; se preço for único, escolha Y"
- [ ] Whitelabel aplicado
- [ ] Salva em `/comparativos/[id]`

`[ ]` Status

---

## Épico 4: Histórico de fornecedores

### US-030 — Listagem de fornecedores [P0] [M]
**Como** comprador,
**Quero** ver todos os fornecedores que já cotaram comigo,
**Para que** eu encontre rápido para consultar histórico.

**Critérios:**
- [ ] Rota `/fornecedores`
- [ ] Tabela com: nome, CNPJ, # de cotações, último valor médio, última cotação
- [ ] Busca por nome (debounce 300ms)
- [ ] Filtro por categoria
- [ ] Click leva ao detalhe

`[ ]` Status

---

### US-031 — Página de detalhe do fornecedor [P0] [L]
**Como** comprador,
**Quero** ver timeline completo de cotações + análise,
**Para que** eu decida com base em histórico.

**Critérios:**
- [ ] Rota `/fornecedores/[id]`
- [ ] Cards: total cotado (R$), # de cotações, % de aprovação, NPS dado a este fornecedor
- [ ] Timeline vertical com cada cotação (data, valor, status, link para análise)
- [ ] Gráfico de evolução de preço (Chart.js ou Recharts)
- [ ] Detecção automática de reajuste anômalo (>10% MoM destacado em laranja)

`[ ]` Status

---

## Épico 5: Link compartilhável e aprovação

### US-040 — Gerar link compartilhável [P0] [M]
**Como** comprador,
**Quero** gerar URL única para enviar à diretoria,
**Para que** eles revisem sem precisar de login.

**Critérios:**
- [ ] Botão "Compartilhar" na análise abre modal
- [ ] Opções: prazo de expiração (7/15/30 dias), permitir aprovar (sim/não), notificar quem (e-mail opcional)
- [ ] Gera link tipo `app.dominio.com/r/abc123xyz`
- [ ] Copia para clipboard
- [ ] Lista de links ativos visível na análise (revogar a qualquer momento)

`[ ]` Status

---

### US-041 — Página pública de revisão [P0] [L]
**Como** revisor externo (sem login),
**Quero** abrir o link, ler a análise, anotar e aprovar/recusar,
**Para que** eu decida em minutos no celular.

**Critérios:**
- [ ] Rota `/r/[token]` (sem auth)
- [ ] Layout mobile-first
- [ ] Anotações inline (selecionar texto, comentar)
- [ ] Botões finais: "Aprovar", "Aprovar com ressalvas", "Recusar"
- [ ] Se aprovar com ressalvas ou recusar, exige justificativa (textarea)
- [ ] Confirmação salva em `aprovacoes` com IP, user-agent, timestamp
- [ ] Notifica comprador via e-mail + in-app

`[ ]` Status

---

### US-042 — Visualização da decisão para o comprador [P0] [M]
**Como** comprador,
**Quero** ver quando o revisor decidiu e o que comentou,
**Para que** eu siga com fechamento ou ajuste.

**Critérios:**
- [ ] Bloco "Aprovação" aparece na análise quando há decisão
- [ ] Mostra: quem decidiu, quando, status, comentários
- [ ] Se "aprovar com ressalvas" ou "recusar": notificação destacada
- [ ] Histórico de revisões se mais de uma pessoa aprovou

`[ ]` Status

---

## Épico 6: Whitelabel

### US-050 — Configurar whitelabel do workspace [P0] [M]
**Como** admin,
**Quero** customizar logo, cor primária e nome da empresa,
**Para que** os relatórios saiam com a marca da minha empresa.

**Critérios:**
- [ ] Rota `/configuracoes/whitelabel`
- [ ] Upload de logo (PNG/SVG, máx 200 KB)
- [ ] Color picker para cor primária (com presets)
- [ ] Campo "nome da empresa" (default = nome do workspace)
- [ ] Preview ao vivo do cabeçalho de uma análise
- [ ] Aplicado automaticamente em todas as análises e PDFs

`[ ]` Status

---

## Épico 7: Pagamento e billing

### US-060 — Pagina de planos e tiers [P0] [M]
**Como** visitante/usuário trial,
**Quero** comparar tiers e fazer upgrade,
**Para que** eu escolha o que cabe.

**Critérios:**
- [ ] Rota `/planos`
- [ ] 4 cards: Starter, Pro, Business, Enterprise
- [ ] Tier destacado: "Mais escolhido: Pro"
- [ ] Tier Enterprise: "Falar com vendas" (form de contato)
- [ ] Toggle mensal/anual (anual = 2 meses grátis)
- [ ] CTAs levam ao Stripe Checkout

`[ ]` Status

---

### US-061 — Checkout via Stripe [P0] [L]
**Como** usuário,
**Quero** finalizar assinatura com cartão de crédito ou PIX,
**Para que** eu vire cliente pagante.

**Critérios:**
- [ ] Stripe Checkout em modo subscription
- [ ] Aceita cartão (Visa, Master, Amex, Hipercard, Elo) + PIX
- [ ] Trial de 7 dias automático (sem cobrança imediata)
- [ ] Webhook do Stripe atualiza tier do workspace
- [ ] E-mail de boas-vindas com nota fiscal

`[ ]` Status

---

### US-062 — Gerenciar assinatura [P0] [M]
**Como** admin,
**Quero** ver minha assinatura atual, mudar plano, atualizar cartão, cancelar,
**Para que** eu controle meu billing.

**Critérios:**
- [ ] Rota `/configuracoes/assinatura`
- [ ] Mostra tier atual, próxima cobrança, método de pagamento
- [ ] Botão "Mudar plano" via Stripe Customer Portal
- [ ] Botão "Cancelar" com confirmação dupla (cancelamento no fim do ciclo)
- [ ] Histórico de faturas com link de download

`[ ]` Status

---

## Épico 8: Configurações e administração

### US-070 — Página de dados da empresa [P1] [S]
- Razão social, CNPJ, endereço, contato fiscal

### US-071 — Página de notificações por e-mail [P1] [S]
- Toggles para: nova análise pronta, comparativo gerado, link aprovado, link recusado, billing

### US-072 — Logs de auditoria [P2] [M]
- Lista cronológica de ações (quem, quando, o quê) — exporta CSV

---

## Como progredir

1. Implementar em ordem do MVP: épicos 1, 2, 7 primeiro (auth, análise, billing) — sem isso não tem produto vendável
2. Depois épicos 3 (comparativo) e 5 (compartilhar/aprovar) — diferenciais competitivos
3. Por último épicos 4 (histórico), 6 (whitelabel) e 8 (admin) — refinamento

**Sugestão de sprints de 1 semana cada:**

| Sprint | Stories | Foco |
|---|---|---|
| 1 | US-001, US-002, US-003, US-004 | Auth funcionando |
| 2 | US-010, US-011 | Upload + form |
| 3 | US-012 | Pipeline de IA |
| 4 | US-013, US-014, US-015 | Visualização e edição |
| 5 | US-060, US-061, US-062 | Billing |
| 6 | US-040, US-041, US-042 | Compartilhar e aprovar |
| 7 | US-020, US-021 | Comparativo |
| 8 | US-030, US-031, US-050 | Fornecedor + whitelabel |
| 9 | US-005, US-070-072 | Admin |
| 10 | — | Hardening, testes, beta com 3 amigos |
