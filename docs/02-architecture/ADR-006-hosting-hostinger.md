# ADR-006: Hosting — Hostinger VPS KVM1 (substitui Vercel do ADR-001)

**Status**: Aceito
**Data**: 2026-05-29
**Decisor**: Bruno Romualdo Marinho
**Substitui**: Parte de hospedagem do ADR-001 (Vercel continua como alternativa de fallback documentada)

## Contexto

ADR-001 adotou Vercel para hospedagem do Next.js. Após revisão de custos com restrição de $50/mês total de infraestrutura, optamos por Hostinger VPS KVM1 como servidor de produção. Vantagens: sem vendor lock-in, custo fixo previsível, controle total sobre o ambiente.

Bruno já possui conta Stripe ativa.

## Decisão

**Servidor**: Hostinger VPS KVM1 — $4.49/mês  
**Stack do servidor**: Ubuntu 24.04 LTS + Node.js 20 LTS + PM2 + Nginx + Certbot (SSL)  
**CI/CD**: GitHub Actions → SSH deploy automático ao merge na `main`

## Orçamento total (MVP até 50 workspaces)

| Serviço | Plano | Custo/mês | Observação |
|---|---|---|---|
| **Servidor** | Hostinger VPS KVM1 | $4.49 | 1 vCPU, 4GB RAM, 50GB SSD, 4TB bandwidth |
| **Banco + Auth + Storage** | Supabase Free | $0 | 500MB DB, 1GB Storage, 50K MAU |
| **Claude API** | Pay-per-use | ~$10–15 | ~500K–1M tokens/mês no MVP |
| **Mistral OCR** | Pay-per-use | ~$2–5 | Variável por volume de PDFs |
| **Pagamentos** | Stripe | $0 | Só % por transação (2.99% + R$0,39) |
| **Repositório** | GitHub Free | $0 | Repo privado gratuito |
| **DNS + CDN** | Cloudflare Free | $0 | DDoS, SSL, analytics |
| **E-mail transacional** | Resend Free | $0 | 3K e-mails/mês |
| **Error tracking** | Sentry Free | $0 | 5K erros/mês |
| **Analytics** | PostHog Free | $0 | 1M eventos/mês |
| **Jobs assíncronos** | Inngest Free | $0 | 50K eventos/mês |
| **TOTAL FIXO** | | **$4.49/mês** | |
| **TOTAL COM API** | | **~$17–25/mês** | Estimativa conservadora |

**Margem de segurança**: $25–30/mês abaixo do limite de $50. ✓

## Setup do servidor (Hostinger KVM1)

### Passo a passo de configuração inicial

```bash
# 1. Conectar via SSH
ssh root@IP_DO_SERVIDOR

# 2. Atualizar sistema
apt update && apt upgrade -y

# 3. Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Instalar pnpm
npm install -g pnpm

# 5. Instalar PM2 (gerenciador de processos)
npm install -g pm2

# 6. Instalar Nginx
apt install -y nginx

# 7. Instalar Certbot (SSL gratuito via Let's Encrypt)
apt install -y certbot python3-certbot-nginx

# 8. Criar usuário não-root para deploy
adduser deploy
usermod -aG sudo deploy
```

### Configuração Nginx (proxy reverso para Next.js)

```nginx
# /etc/nginx/sites-available/app
server {
    server_name app.getvetly.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar SSL
certbot --nginx -d app.getvetly.com
```

### PM2 — manter Next.js rodando

```bash
# Rodar app
pm2 start "pnpm start" --name getvetly
pm2 save
pm2 startup  # auto-restart no boot
```

## CI/CD com GitHub Actions

Criar `.github/workflows/deploy.yml` no projeto:

```yaml
name: Deploy para Produção

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          # vars de build passadas como GitHub Secrets
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/getvetly
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm build
            pm2 restart getvetly
```

## Docker — decisão adiada

Docker **não** é usado no setup inicial. Razão: KVM1 tem 4GB RAM e o overhead do Docker daemon (~1.5GB) reduz recursos disponíveis para o Next.js. PM2 + Nginx é mais leve e suficiente para um único app.

**Quando reconsiderar Docker:** ao contratar KVM2 (8GB RAM), ou quando houver necessidade de rodar múltiplos serviços isolados no mesmo VPS.

## Quando revisar

- Se o projeto ultrapassar 500 workspaces ativos — avaliar upgrade para KVM2 ($5.99/mês)
- Se precisar de preview deploys por PR — adicionar Vercel para staging apenas (free tier)
- Se tráfego de upload de PDFs sobrecarregar o servidor — considerar offload para Supabase Storage direto

## Alternativa de fallback documentada

Se Hostinger apresentar problemas graves, Vercel Free → Pro é o plano B. ADR-001 mantém o histórico de raciocínio desta decisão.
