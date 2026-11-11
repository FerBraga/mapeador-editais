## Why

Todo o produto está construído e validado localmente (backend completo, frontend responsivo), mas ninguém além de quem roda o projeto localmente consegue acessá-lo. Esta change coloca o produto no ar, dentro da restrição explícita do usuário de não usar hosting gerenciado pago: frontend na Vercel, backend rodando na própria máquina do usuário via Docker Compose, exposto por um túnel ngrok gratuito.

## What Changes

- Frontend (`lib/api.ts`): adiciona o header `ngrok-skip-browser-warning: true` em toda chamada à API, contornando a página de aviso que o plano gratuito do ngrok exibe em requisições HTTP/S (que, sem isso, quebraria todo `fetch()` esperando JSON).
- Documenta nos `.env.example` (frontend e backend) os valores de produção esperados: `VITE_API_URL` apontando para o domínio fixo do túnel ngrok, `CORS_ORIGINS` incluindo o domínio da Vercel.
- Cria um script de conveniência que sobe, em sequência, o Docker Compose (Postgres+Redis), a API, os 5 workers BullMQ e o túnel ngrok — para o usuário não precisar abrir manualmente múltiplos terminais toda vez que for colocar o backend no ar.
- Documenta (README ou `DEPLOY.md`) o passo a passo manual nas contas externas (ngrok, Vercel) que não é automatizável por código.
- Valida de ponta a ponta: frontend publicado na Vercel buscando dados reais da API local através do túnel.

## Capabilities

### New Capabilities
- `local-backend-deployment`: publicação do frontend na Vercel consumindo um backend rodando localmente e exposto publicamente via túnel, incluindo o tratamento necessário para contornar as limitações do plano gratuito de túnel usado.

### Modified Capabilities
(nenhuma — mudanças de configuração/infraestrutura de publicação, sem alterar requisitos de produto já especificados)

## Impact

- `frontend/src/lib/api.ts` (header de requisição).
- `frontend/.env.example`, `backend/.env.example` (documentação de valores de produção).
- Novo script de conveniência (raiz do monorepo ou `scripts/`).
- Nova documentação de deploy.
- **Fora de escopo, deliberadamente**: qualquer hosting gerenciado pago; CI/CD automatizado (mesma decisão já tomada em `testes-homologacao`); HTTPS customizado além do que o ngrok já fornece; mudança de arquitetura dos workers.
- **Limitação aceita pelo usuário**: o backend só fica disponível enquanto a máquina do usuário estiver ligada rodando o Docker Compose e o túnel — não é uma falha a corrigir nesta change, é a natureza da escolha de hosting gratuito.
