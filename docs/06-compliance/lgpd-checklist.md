# LGPD: Checklist e Implementação

Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Este documento NÃO substitui consultoria jurídica — Bruno precisa contratar advogado especializado antes de receber primeiro cliente pagante.

## Por que LGPD importa neste produto

Você vai armazenar:

- Dados pessoais dos usuários (nome, e-mail, CPF/CNPJ)
- Propostas comerciais (informação confidencial dos fornecedores)
- Histórico de cotações (informação estratégica das empresas-cliente)
- Comunicações entre comprador e revisor
- Anotações e decisões de aprovação

Vazamento ou uso indevido vira:
- Multa de até 2% do faturamento (limite R$ 50M por infração)
- Ação civil pública
- Quebra de confiança do mercado (não recupera)

## Papéis na LGPD

- **Titular**: pessoa física dona dos dados (ex: usuário do produto)
- **Controlador**: quem decide como tratar (você, dono do produto, em relação aos seus usuários)
- **Operador**: quem trata em nome do controlador (suas dependências: Supabase, Anthropic, Stripe)
- **Encarregado (DPO)**: pessoa responsável pela conformidade (você pode terceirizar nos primeiros 2 anos)

**No seu produto**:
- Em relação aos usuários (compradores que assinam): você é controlador
- Em relação ao revisor externo (diretor que aprova via link): você é controlador também
- Em relação a propostas de fornecedores: você é OPERADOR (seu cliente é o controlador)

Isso muda contrato e responsabilidades. Detalhe abaixo.

## Checklist técnico (faça enquanto codar)

### Coleta e armazenamento

- [ ] Cookie banner com consentimento (essenciais vs analytics)
- [ ] Política de Privacidade pública em `/lgpd` linkada em todo footer
- [ ] Termos de Uso públicos em `/termos`
- [ ] Aceite explícito de termos no signup (checkbox obrigatório, timestamp registrado)
- [ ] Idade mínima 18 anos (B2B) — declarada no termo
- [ ] Coleta apenas dado necessário (princípio da minimização)
- [ ] Senha hasheada com bcrypt/argon2 (Supabase Auth já faz)
- [ ] Dados sensíveis (CPF, dados bancários) NÃO são coletados nem armazenados

### Em trânsito

- [ ] HTTPS obrigatório em TODAS as rotas (Vercel força automaticamente)
- [ ] HSTS configurado (header `Strict-Transport-Security`)
- [ ] CSP estrita (header `Content-Security-Policy`)
- [ ] Sem dados pessoais em URLs (sempre em body POST)

### Em repouso

- [ ] Encryption-at-rest do banco (Supabase faz automaticamente)
- [ ] Encryption-at-rest do Storage (Supabase faz automaticamente)
- [ ] Backup automatizado diário (Supabase faz; checar retenção)
- [ ] Logs sem dados sensíveis (não logar senhas, tokens, conteúdo de proposta crua)

### Direitos do titular

LGPD garante 9 direitos. Cada um precisa de UX clara no produto:

| Direito | Implementação |
|---|---|
| Confirmação da existência do tratamento | Página `/configuracoes/lgpd/dados` |
| Acesso aos dados | Botão "Baixar meus dados" (gera ZIP em 7 dias úteis) |
| Correção de dados | Página de perfil editável |
| Anonimização, bloqueio ou eliminação | Botão "Excluir minha conta" → soft delete em 7 dias |
| Portabilidade | Mesma exportação em formato estruturado (JSON) |
| Eliminação após consentimento | Mesmo botão de exclusão |
| Informação sobre compartilhamento | Lista de operadores na Política de Privacidade |
| Informação sobre não consentir | Texto explicando consequências em cada ponto de coleta |
| Revogação de consentimento | Toggle no `/configuracoes/notificacoes` para cada finalidade |

### Vazamento de dados (plano de incidente)

- [ ] Detecção: alertas Sentry + Supabase logs + monitor de acesso anômalo
- [ ] Notificação à ANPD em até 72h se houver risco a titulares
- [ ] Notificação aos titulares afetados em até 72h
- [ ] Template de comunicação pré-aprovado pelo advogado

## Checklist contratual (precisa de advogado)

### Documentos obrigatórios

- [ ] Política de Privacidade — escrita por advogado especializado, revisada anualmente
- [ ] Termos de Uso — idem
- [ ] DPA (Data Processing Agreement) com cada operador:
  - Supabase (templates oficiais)
  - Anthropic (templates oficiais)
  - Mistral
  - Stripe
  - Resend
  - Vercel
  - Sentry
  - Posthog
- [ ] Contrato com clientes contendo cláusulas LGPD
  - Definição de papéis (você é operador, cliente é controlador das propostas dele)
  - Obrigação de não vazar
  - Direito do cliente exportar e excluir dados
  - Notificação de incidente em até 24h
- [ ] Termo de confidencialidade interno (se contratar gente)

### Encarregado de Proteção de Dados (DPO)

LGPD exige que toda empresa indique um Encarregado. Opções:

1. **Você assume** (primeiros 2 anos, low risk) — registra você no site na seção "Contato do Encarregado" com e-mail dpo@dominio
2. **DPO terceirizado** (mais profissional) — empresas como Mattos Filho, Pinheiro Neto, ou específicas tipo OneTrust BR; custa R$ 500-3.000/mês
3. **DPO interno** quando crescer

Tem que estar publicado no site.

## Hospedagem no Brasil

- Supabase tem região **São Paulo** (sa-east-1). Configurar projeto nesta região.
- Vercel rotea via Edge — não há requisito legal de servidor estar no BR, mas dados em repouso devem estar (banco em SP atende).
- Anthropic processa nos EUA — declarar no Política de Privacidade que há transferência internacional, sob garantias contratuais (DPA do operador).
- Mesma coisa para Stripe, Mistral, Resend, Sentry — todos têm DPA padrão que cobre transferência internacional.

## Direito de oposição: o caso da IA

LGPD art. 20: titular tem direito de revisão de decisões automatizadas.

**Como tratar**: o produto **NUNCA** decide aprovar/reprovar fornecedor sozinho. A IA gera análise; humano decide. Documentar isso na Política e nos Termos.

Se algum dia construir aprovação automática (não está no roadmap), terá que oferecer revisão humana sob pedido.

## Cookies

Lista mínima:

| Cookie | Finalidade | Tipo |
|---|---|---|
| `sb-access-token` | Sessão Supabase Auth | Essencial |
| `sb-refresh-token` | Renovação de sessão | Essencial |
| `next-theme` | Tema claro/escuro | Funcional |
| `posthog-id` | Analytics | Analytics |
| `_ga`, `_gid` | Google Analytics (opcional) | Analytics |

Banner pergunta sobre os de Analytics. Essenciais e funcionais não precisam de consentimento (mas devem estar listados na Política).

## E-mail marketing

Resend é só transacional. Se for usar Resend pra newsletter ou outbound, precisa de:

- Opt-in explícito (double opt-in se possível)
- Unsubscribe em todo e-mail (link claro)
- Log de quando, como e por quem foi aceito
- CAN-SPAM compliance (mais relevante pra EUA mas boa prática)

## Auditoria periódica

Trimestral, registrada em `docs/06-compliance/auditorias/AAAA-MM.md`:

- [ ] Revisar quem tem acesso ao banco (service role keys, equipe)
- [ ] Revisar logs de acesso anômalo
- [ ] Revisar lista de operadores (alguém novo? alguém saiu?)
- [ ] Revisar direitos dos titulares (alguém pediu exclusão? cumprimos no prazo?)
- [ ] Revisar incidentes (se houve, foi reportado?)
- [ ] Atualizar Política de Privacidade se algo mudou

## Templates rápidos

Modelos iniciais (substituir por versões do advogado):

- `docs/06-compliance/templates/politica-privacidade.md`
- `docs/06-compliance/templates/termos-uso.md`
- `docs/06-compliance/templates/dpa-cliente.md`

Esses são esqueletos pra acelerar a redação com advogado, não substituem revisão jurídica.

## Custo total estimado de compliance no primeiro ano

| Item | Custo |
|---|---|
| Advogado especializado LGPD (parecer + revisão de docs) | R$ 3.000-8.000 one-time |
| DPO terceirizado (opcional) | R$ 6.000-36.000/ano |
| Hospedagem em região BR (Supabase Pro) | R$ 1.200/ano (incluso no custo de infra) |
| Selo de confiança (opcional) | R$ 1.000-3.000/ano |
| Seguro cibernético (opcional) | R$ 3.000-10.000/ano |

**Mínimo recomendado primeiro ano: R$ 5.000-10.000.** Não economize aqui.
