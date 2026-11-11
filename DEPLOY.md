# Deploy

Frontend publicado na Vercel. Backend (API NestJS + Postgres/PostGIS + Redis + workers BullMQ) roda localmente, na sua máquina, via Docker Compose, exposto publicamente por um túnel ngrok (plano gratuito).

Isso significa: o backend só fica acessível enquanto sua máquina estiver ligada rodando o stack. É uma limitação aceita, não um bug.

## 1. ngrok (expõe o backend local)

1. Crie uma conta gratuita em [ngrok.com](https://ngrok.com).
2. Instale a CLI do ngrok na sua máquina (veja [ngrok.com/download](https://ngrok.com/download) para seu sistema operacional).
3. Pegue seu authtoken no [dashboard do ngrok](https://dashboard.ngrok.com/get-started/your-authtoken) e configure localmente:
   ```bash
   ngrok config add-authtoken <seu-authtoken>
   ```
4. Reserve seu domínio fixo gratuito em **Universal Gateway → Domains** no dashboard do ngrok (algo como `seu-nome.ngrok-free.app`). Esse domínio não muda entre reinícios do túnel — é o que torna a URL do backend estável.
5. Adicione esse domínio ao `.env` da raiz do monorepo (copie de `.env.example` se ainda não tiver):
   ```
   NGROK_DOMAIN=seu-nome.ngrok-free.app
   ```

Como o domínio já é conhecido antes mesmo de rodar o túnel pela primeira vez, você já sabe a URL pública final do backend (`https://seu-nome.ngrok-free.app/api/v1`) para usar no passo da Vercel a seguir.

## 2. Vercel (publica o frontend)

1. Crie uma conta na [Vercel](https://vercel.com) (pode entrar com a conta do GitHub).
2. Importe o repositório do projeto (`Add New → Project`, selecione o repositório no GitHub).
3. Nas configurações do projeto, defina **Root Directory** = `frontend`. A Vercel detecta Vite automaticamente (build command e output directory não precisam de ajuste manual).
4. Em **Settings → Environment Variables**, adicione:
   ```
   VITE_API_URL=https://seu-nome.ngrok-free.app/api/v1
   ```
   (o mesmo domínio reservado no passo 1, com `/api/v1` no final).
5. Faça o deploy. A Vercel vai te dar uma URL pública, algo como `https://seu-projeto.vercel.app`.

## 3. Backend local (`CORS_ORIGINS`)

Com a URL da Vercel em mãos, edite `backend/.env` (não o `.env.example`) e adicione o domínio da Vercel à lista de origens permitidas:

```
CORS_ORIGINS=http://localhost:5173,https://seu-projeto.vercel.app
```

## 4. Subindo o backend

Da raiz do monorepo:

```bash
npm run start:local-backend
```

Isso sobe, em ordem: Postgres e Redis (Docker Compose, aguardando ficarem saudáveis), build do backend, a API, os 5 workers (scraper, document, ai-analysis, geolocation, notification), e por último o túnel ngrok no domínio reservado.

`Ctrl+C` encerra o túnel, a API e os workers (o Postgres e o Redis continuam rodando em segundo plano via Docker; pare-os com `docker compose down` se quiser).

Enquanto esse comando estiver rodando, o frontend publicado na Vercel consegue acessar a API real.
