## 1. Frontend: Contorno do Aviso do ngrok

- [x] 1.1 Adicionar o header `ngrok-skip-browser-warning: true` à função `request()` em `frontend/src/lib/api.ts`
- [x] 1.2 Confirmar que isso não quebra chamadas locais (contra `http://localhost:3000`, onde o header é simplesmente ignorado)

## 2. Documentação de Variáveis de Ambiente de Produção

- [x] 2.1 Atualizar `frontend/.env.example` com comentário explicando que `VITE_API_URL` em produção (configurado nas env vars do projeto Vercel) deve apontar para o domínio fixo do túnel ngrok
- [x] 2.2 Atualizar `backend/.env.example` com comentário explicando que `CORS_ORIGINS` em produção deve incluir o domínio da Vercel, além do localhost de desenvolvimento

## 3. Script de Inicialização Completa do Backend

- [x] 3.1 Criar script (`scripts/start-local-backend.sh` ou equivalente) que: sobe `docker compose up -d` e aguarda Postgres/Redis saudáveis (healthcheck já existente), builda o backend se necessário, inicia a API e os 5 workers BullMQ, e por último inicia o túnel ngrok com o domínio fixo (lido de uma variável de ambiente)
- [x] 3.2 Adicionar script de conveniência no `package.json` raiz do monorepo (ex.: `npm run start:local-backend`)
- [x] 3.3 Testar o script do zero (serviços parados) e confirmar que tudo sobe na ordem certa sem intervenção manual (até a etapa do túnel, que exige conta real do ngrok — ver resultados na seção 5)

## 4. Documentação do Passo a Passo Manual

- [x] 4.1 Escrever `DEPLOY.md` (ou seção no README) com os passos manuais: criar conta ngrok, reservar domínio fixo gratuito, obter authtoken e configurá-lo localmente; criar projeto na Vercel conectado ao repositório GitHub com Root Directory=`frontend`; configurar `VITE_API_URL` nas env vars de produção da Vercel; configurar `CORS_ORIGINS` no `.env` local do backend com o domínio da Vercel

## 5. Validação Real de Ponta a Ponta

- [ ] 5.1 Acompanhar o usuário configurando as contas externas (ngrok, Vercel) conforme a documentação do passo 4
- [ ] 5.2 Confirmar que o túnel expõe a API local corretamente (requisição real através da URL pública retorna JSON válido, não página de aviso)
- [ ] 5.3 Confirmar que o frontend publicado na Vercel carrega dados reais da API através do túnel (mapa, lista, filtros, detalhe)
- [ ] 5.4 Documentar os resultados observados, incluindo a URL pública final (sem expor nenhuma credencial) e quaisquer ajustes necessários não previstos no design
