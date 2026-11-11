## Context

Frontend (React/Vite) e backend (NestJS + Postgres/PostGIS + Redis + 5 workers BullMQ) estão completos e validados localmente via Docker Compose. O usuário decidiu, após pesquisa de preços real nesta sessão, não usar hosting gerenciado pago (Railway: ~$5 base + excedente provável; Fly.io: sem tier gratuito, mínimo ~$6,57/mês só para 3 máquinas pequenas; Fly Postgres: a partir de $38/mês). A alternativa escolhida: frontend na Vercel (genuinamente gratuito para este uso), backend rodando na própria máquina do usuário, exposto via túnel ngrok (plano gratuito).

Limitações reais do ngrok free já levantadas (página oficial de pricing, consultada nesta sessão): até 3 endpoints simultâneos, 1GB de transferência, 20 mil requisições HTTP/S por mês, limite de 4 mil requisições/min, **página de aviso (interstitial) exibida em endpoints HTTP/S no plano gratuito**, e inclusão de 1 "development domain" fixo associado à conta (não um domínio aleatório a cada reinício, desde que reservado no dashboard).

## Goals / Non-Goals

**Goals:**
- Frontend publicado na Vercel, consumindo a API real através do túnel, sem a página de aviso do ngrok quebrar as respostas esperadas pelo frontend.
- URL do backend estável entre reinícios do túnel (não muda a cada `ngrok http`).
- Processo de subir o backend completo (banco, filas, API, workers, túnel) simplificado a um único comando.
- Documentação clara dos passos manuais que só o usuário pode fazer (criar contas, conectar repositório).

**Non-Goals:**
- Qualquer hosting gerenciado pago (decisão já tomada).
- CI/CD automatizado — mesma decisão já tomada em `testes-homologacao` (testes continuam locais).
- HTTPS customizado além do que o ngrok já fornece automaticamente (já é HTTPS por padrão).
- Alta disponibilidade — a disponibilidade do backend depende inteiramente da máquina do usuário estar ligada; isso é aceito, não corrigido aqui.
- Mudança de arquitetura dos workers BullMQ (continuam como 5 processos separados).

## Decisions

### Header `ngrok-skip-browser-warning` em toda chamada do frontend
O plano gratuito do ngrok intercepta requisições HTTP/S de navegador com uma página de aviso HTML antes de encaminhar ao destino real, a menos que a requisição inclua o header `ngrok-skip-browser-warning` (qualquer valor não vazio). Sem isso, toda chamada `fetch()` do frontend receberia HTML em vez do JSON esperado, e o parsing (`response.json()`) falharia silenciosamente de forma confusa. A função `request()` central em `lib/api.ts` (já usada por todas as chamadas à API) SHALL incluir esse header em toda requisição, única mudança de código necessária no cliente HTTP.

### Domínio fixo do ngrok via configuração, não código
O domínio fixo gratuito do ngrok é reservado uma vez no dashboard da conta (passo manual, não automatizável) e referenciado ao iniciar o túnel (`ngrok http 3000 --domain=<dominio-reservado>`). O script de conveniência SHALL aceitar esse domínio via variável de ambiente, não hardcoded, para não acoplar o código a uma conta específica do ngrok.

### Script único para subir o backend completo
Um script (`scripts/start-local-backend.sh` ou equivalente, chamado via `npm run` na raiz do monorepo) SHALL subir, em sequência: Docker Compose (aguardando Postgres/Redis saudáveis via healthcheck já configurado), a API, os 5 workers BullMQ, e por último o túnel ngrok — evitando que o usuário precise orquestrar manualmente múltiplos terminais toda vez. Alternativa considerada: um único processo Node orquestrando tudo via `child_process` — rejeitada por adicionar complexidade desnecessária quando um script de shell simples (mesma linguagem já usada em `docker-compose.yml` e nos workers via `npm run worker:*`) resolve igualmente bem.

### CORS via env var já suportada, só documentação muda
`CORS_ORIGINS` já aceita lista separada por vírgula (`.split(',')` já implementado desde a fundação do projeto) — não precisa de mudança de código, só adicionar o domínio real da Vercel ao valor usado em produção (documentado nos `.env.example`, configurado pelo usuário no ambiente real).

### Documentação do passo a passo manual
Passos que só o usuário pode executar (criar conta ngrok, reservar domínio gratuito, criar projeto na Vercel conectado ao GitHub com Root Directory=`frontend`, configurar env vars de produção nos dois lados) SHALL ser documentados em texto claro (README ou `DEPLOY.md`), já que não são automatizáveis por código nesta sessão.

## Risks / Trade-offs

- **[Risco] Backend indisponível sempre que a máquina do usuário estiver desligada/sem internet** → Aceito explicitamente pelo usuário como natureza da escolha de hosting gratuito; o frontend já tem estado de erro tratado (`Não foi possível carregar os municípios` / mensagens de erro de API) para esse cenário, construído na change `frontend`.
- **[Risco] Limite de 20 mil requisições/mês do ngrok free pode ser atingido com tráfego real** → Aceito como limitação conhecida do MVP; documentado para o usuário, sem mitigação de código nesta change (ex.: cache agressivo client-side ficaria para uma iteração futura se o limite se mostrar um problema real).
- **[Trade-off] Sem CI validando o deploy antes de cada mudança** → consistente com a decisão já tomada de não ter CI/homologação; validação é manual, como todo o resto do projeto até aqui.

## Migration Plan

Nenhuma migration de dados. Mudança de infraestrutura de publicação; nenhum dado existente é afetado.
