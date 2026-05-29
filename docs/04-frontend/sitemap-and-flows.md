# Sitemap e Fluxos Críticos

Todas as rotas do app + os 5 fluxos que mais importam.

## Sitemap completo

### Marketing (público, sem auth)

```
/                              ← Landing page (home)
/precos                        ← Tabela de planos
/recursos                      ← Features detalhadas
/sobre                         ← Quem somos
/blog                          ← Blog (opcional v2)
/blog/[slug]                   ← Post individual
/lgpd                          ← Política de privacidade
/termos                        ← Termos de uso
/contato                       ← Form de contato (Enterprise)
```

### Auth

```
/signup                        ← Cadastro
/signup/confirmar              ← Aguardando confirmação de e-mail
/login                         ← Login (senha ou magic link)
/recuperar-senha               ← Solicita reset
/reset-senha?token=xxx         ← Define nova senha
/convite?token=xxx             ← Aceita convite de workspace
```

### App (autenticado, dentro de layout dashboard)

```
/dashboard                     ← Visão geral (cards de uso, propostas recentes)
/onboarding                    ← 4 passos pós-signup

/propostas                     ← Lista de propostas
/propostas/nova                ← Upload de nova proposta
/propostas/[id]                ← Detalhe da análise
/propostas/[id]/editar         ← Edição manual da análise (modal/sheet)

/comparativos                  ← Lista de comparativos
/comparativos/novo?ids=[]      ← Gerar novo
/comparativos/[id]             ← Detalhe

/fornecedores                  ← Lista de fornecedores
/fornecedores/[id]             ← Timeline + métricas do fornecedor
/fornecedores/novo             ← Cadastro manual

/configuracoes                 ← Hub de config
/configuracoes/empresa         ← Dados da empresa
/configuracoes/whitelabel      ← Logo, cor, nome
/configuracoes/equipe          ← Membros + convites
/configuracoes/notificacoes    ← Toggles de e-mail
/configuracoes/seguranca       ← Senha, 2FA (v2), sessões ativas

/configuracoes/assinatura      ← Plano atual + faturas + cartão
/configuracoes/uso             ← Uso do mês (análises, storage)

/configuracoes/integracoes     ← Slack, Microsoft Teams (v2)
/configuracoes/api             ← API keys (v3, Enterprise)
```

### Público (revisor externo, sem auth)

```
/r/[token]                     ← Página de revisão (análise ou comparativo)
/r/[token]/aprovado            ← Confirmação após aprovar
```

### Admin interno (apenas equipe da empresa que opera o SaaS)

```
/_admin/saude                  ← Status de cada dependência
/_admin/workspaces             ← Lista todos workspaces
/_admin/workspaces/[id]        ← Detalhe de um workspace específico
/_admin/uso                    ← Uso global de IA, custos
/_admin/audit                  ← Audit log global
```

Protegido por env var `INTERNAL_ADMIN_EMAILS` (lista de e-mails da equipe).

---

## Fluxo 1 — Onboarding (primeiro acesso, US-001 a US-003)

**Persona**: Eduardo (comprador novo no produto)
**Objetivo**: do signup à primeira análise pronta em <10 minutos

```
[Landing page]
    │ clica "Começar grátis"
    ▼
[/signup]
    │ preenche nome, e-mail, senha, aceita termos
    │ clica "Criar conta"
    ▼
[E-mail enviado · /signup/confirmar]
    │ abre e-mail, clica link
    ▼
[/onboarding · passo 1/4: Empresa]
    │ nome empresa, CNPJ opcional, segmento, tamanho
    ▼
[/onboarding · passo 2/4: Job principal]
    │ "O que você mais precisa?"
    │ ○ Comparar fornecedores
    │ ● Analisar profundo
    │ ○ Os dois
    ▼
[/onboarding · passo 3/4: Whitelabel (opcional, pode pular)]
    │ upload de logo, cor, nome da empresa
    │ preview ao vivo do cabeçalho
    ▼
[/onboarding · passo 4/4: Primeira análise]
    │ "Joga aqui sua próxima proposta — leva 3 minutos"
    │ drop zone gigante
    │ ou "Pular e ir pro dashboard"
    ▼
[Upload + processamento]
    │ tela de progresso animada
    │ "Extraindo texto..." → "Analisando..." → "Quase lá..."
    ▼
[/propostas/[id]]
    │ confete leve (celebração)
    │ tooltip: "Compartilhe com sua diretoria em 1 clique"
    │ usuário ativo!
```

**Tempo médio meta**: 7 minutos.
**Taxa de conversão meta**: 70% dos signups completam onboarding.

---

## Fluxo 2 — Análise de proposta (uso recorrente, US-010 a US-013)

**Persona**: Eduardo (já usuário)
**Objetivo**: do "recebi proposta no e-mail" ao "diretoria aprovou" em <30 minutos

```
[Inbox do Eduardo]
    │ recebe e-mail de fornecedor com PDFs anexados
    │ baixa anexos
    ▼
[App · /propostas/nova]
    │ arrasta os 3 arquivos
    │ vê preview, confirma
    ▼
[Form rápido]
    │ Fornecedor: "Eletromidia" (autocompleta)
    │ Categoria: "Mídia OOH"
    │ Escopo: "Campanha CLT SP - 28 dias"
    │ Aprovador: "renata@empresa.com"
    │ clica "Analisar"
    ▼
[Processamento (background)]
    │ Eduardo pode navegar pra outra tela
    │ notificação in-app + e-mail quando ficar pronto
    ▼
[Volta à /propostas/[id]]
    │ vê análise pronta
    │ lê resumo executivo
    │ lê pontos a favor
    │ lê pontos para questionar
    ▼
[Clica "Compartilhar"]
    │ modal
    │ Expira em: ● 15 dias  ○ 7  ○ 30
    │ Permite aprovar? ● Sim
    │ Notificar: renata@empresa.com ✓
    │ copia link · clica "Enviar e-mail"
    ▼
[Renata recebe e-mail]
    │ "Eduardo compartilhou uma análise com você"
    │ clica link no celular
    ▼
[/r/[token]]
    │ lê resumo no celular
    │ revisa os pontos
    │ clica "Aprovar"
    │ assina nome e e-mail
    ▼
[Eduardo recebe notificação]
    │ "Renata aprovou em 4 minutos"
    │ status da proposta: APROVADO
    │ fecha negociação com fornecedor
```

**Tempo médio meta**: 25 minutos (5 setup + 3 IA + 7 leitura + 5 aprovação + 5 back).
**Taxa de aprovação via link meta**: 60%.

---

## Fluxo 3 — Comparativo de 3 cotações (US-020, US-021)

**Persona**: Marcia (gerente de compras)
**Objetivo**: do "tenho 3 propostas, qual escolho" ao "decidi e justifiquei" em <45 minutos

```
[Marcia já tem 3 propostas analisadas individualmente]
    │ acessa /propostas
    ▼
[Lista de propostas]
    │ filtra por categoria "Serviços profissionais"
    │ marca checkbox em 3 propostas
    │ aparece barra fixa: "Comparar 3 propostas"
    │ clica
    ▼
[/comparativos/novo?ids=...]
    │ confirma escopo: "as 3 cobrem o mesmo trabalho?"
    │ peso: "preço é o critério principal? prazo? qualidade?"
    │ clica "Gerar comparativo"
    ▼
[Processamento]
    │ ~90 segundos
    ▼
[/comparativos/[id]]
    │ matriz com critérios em linhas, fornecedores em colunas
    │ vencedor por linha destacado em verde
    │ recomendação final em parágrafo
    │ "se prazo for crítico, escolha X; se preço único, escolha Y"
    ▼
[Marcia compartilha com Renata e CFO]
    │ link compartilhável
    ▼
[Decisão tomada, comparativo salvo no histórico]
```

---

## Fluxo 4 — Consultar histórico de fornecedor (US-030, US-031)

**Persona**: Eduardo
**Objetivo**: "esse fornecedor tá pedindo reajuste de 15%, isso é normal?"

```
[Negociação por telefone com fornecedor]
    │ Eduardo abre app no celular
    ▼
[/fornecedores]
    │ busca "Acme Brindes"
    ▼
[/fornecedores/[id]]
    │ vê timeline com 5 cotações dos últimos 18 meses
    │ gráfico de preço: subiu 8% em 12 meses (linear)
    │ alerta laranja: "Última cotação está 22% acima da anterior!"
    │ clica em uma cotação antiga
    ▼
[Análise antiga]
    │ relê pontos a favor / questionar
    │ vê o que foi negociado antes
    ▼
[Volta pro telefone com argumentos concretos]
    │ "Vocês subiram 22%, posso esperar uma justificativa?"
```

---

## Fluxo 5 — Upgrade de plano (US-060, US-061)

**Persona**: Marcia (atingiu limite do Starter)
**Objetivo**: do "esbarrei no limite" ao "upgrade feito" em <5 minutos

```
[Marcia tenta criar 6ª análise do mês no plano Starter (limite: 5)]
    ▼
[Modal de bloqueio amigável]
    │ "Você usou suas 5 análises do mês. Hora de subir!"
    │ comparativo lado a lado: Starter vs Pro (recomendado)
    │ destaque: "Pro inclui 50 análises/mês + 5 membros + comparativos ilimitados"
    │ clica "Fazer upgrade"
    ▼
[Stripe Checkout]
    │ preenche cartão ou escolhe PIX
    │ confirma
    ▼
[Volta pro app]
    │ confete leve
    │ "Pronto! Você está no Pro. Sua análise está rodando."
    ▼
[Análise dispara automaticamente]
    │ continua o fluxo normal
```

---

## Navegação principal

### Header (em todas as páginas do app)

```
[Logo]    Propostas   Comparativos   Fornecedores              [🔔]  [Avatar ▾]
```

Avatar dropdown:
- Configurações
- Mudar workspace (se tiver mais de um)
- Tema (claro/escuro)
- Ajuda
- Sair

### Sidebar (versão futura, v2)

Para usuários power, sidebar fixa à esquerda com mais opções (filtros salvos, ações rápidas).

### Mobile nav

Bottom nav com 4 ícones: Propostas / Comparativos / Fornecedores / Config.

---

## Atalhos de teclado

| Tecla | Ação |
|---|---|
| `cmd+k` / `ctrl+k` | Abre command palette |
| `cmd+n` | Nova proposta |
| `cmd+,` | Configurações |
| `cmd+/` | Mostra atalhos |
| `g + p` | Vai pra propostas |
| `g + c` | Vai pra comparativos |
| `g + f` | Vai pra fornecedores |
| `esc` | Fecha modal/sheet |

Implementar com `cmdk` (lib React).
