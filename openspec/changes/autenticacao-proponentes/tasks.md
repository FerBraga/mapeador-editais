## 1. Banco de dados

- [x] 1.1 Adicionar `enum Role { PROPONENTE }` e campo `role Role @default(PROPONENTE)` ao model `User` em `backend/prisma/schema.prisma`
- [x] 1.2 Gerar e aplicar a migration Prisma
- [x] 1.3 Adicionar `JWT_SECRET` (obrigatório) e `JWT_EXPIRES_IN` (default `7d`) a `backend/src/shared/config/env.schema.ts`, e ao `.env.example` do backend (o `.env.example` da raiz só tem config de infraestrutura/Docker Compose, não config de app — segue o padrão já existente de `AI_PROVIDER`/`GOOGLE_AI_API_KEY` etc.)

## 2. Backend — módulo auth

- [x] 2.1 Adicionar dependências: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt` (+ tipos `@types/passport-jwt`, `@types/bcrypt`)
- [x] 2.2 Implementar `UsersService`: criar usuário (com hash bcrypt da senha), buscar por e-mail, buscar por id
- [x] 2.3 Implementar `AuthService`: `register(nome, email, senha)` e `login(email, senha)`, validando credenciais e emitindo JWT (payload mínimo: `sub` = userId, `role`)
- [x] 2.4 Implementar `JwtStrategy` (passport-jwt) validando assinatura e expiração, populando `request.user` com `{ id, role }`
- [x] 2.5 Implementar `JwtAuthGuard` reutilizável para proteger rotas futuras (ex.: endpoints do wizard de escrita) — adicionado também `GET /auth/me` já protegido por ele, servindo de rota de teste e de endpoint real para o frontend restaurar sessão
- [x] 2.6 Implementar `AuthController`: `POST /auth/register`, `POST /auth/login`, com DTOs validados via Zod (padrão já usado no projeto, ex. `ZodValidationPipe`)
- [x] 2.7 Tratar erros: e-mail duplicado no registro (409), credenciais inválidas no login (401 com mensagem genérica)

## 3. Testes de backend

- [x] 3.1 Testes unitários de `AuthService` (registro com sucesso, e-mail duplicado, login com sucesso, credenciais inválidas)
- [x] 3.2 Teste unitário de `JwtStrategy` (mapeamento do payload para `{ id, role }`) — validação de assinatura/expiração/token ausente é delegada ao `passport-jwt` (verificada em runtime, não no construtor); coberta na validação manual (5.1/5.2), não como teste unitário isolado

## 4. Frontend — sessão e telas

- [x] 4.1 Criar `AuthContext`/`useAuth` (hook) em `frontend/src/hooks/` ou `frontend/src/lib/`, com `user`, `token`, `login()`, `register()`, `logout()`, persistindo o token em `localStorage` (`frontend/src/lib/auth-context.tsx`)
- [x] 4.2 Adicionar chamadas `POST /auth/register` e `POST /auth/login` em `frontend/src/lib/api.ts`
- [x] 4.3 Criar rota/tela de cadastro (`frontend/src/routes/RegisterPage.tsx`, rota `/cadastro`)
- [x] 4.4 Criar rota/tela de login (`frontend/src/routes/LoginPage.tsx`, rota `/entrar`)
- [x] 4.5 Anexar o token automaticamente como header `Authorization: Bearer` nas chamadas autenticadas do cliente HTTP (`request()` em `api.ts` aceita `token`; usado hoje por `fetchMe`, pronto para os endpoints do wizard)
- [x] 4.6 Exibir estado de sessão (ex.: nome do usuário / botão de logout) em algum ponto visível da UI existente (ex.: `App.tsx` ou header do mapa) — adicionado ao header do `MapPage`

## 5. Validação manual

- [x] 5.1 Testar fluxo completo localmente: cadastro → login → acessar uma rota protegida de teste → logout → confirmar que a rota protegida volta a rejeitar — testado via curl contra o backend local: registro (201), registro duplicado (409), login correto, login com senha errada (401), `GET /auth/me` com token válido, sem token (401) e com token inválido (401); build do frontend (`tsc -b && vite build`) passa sem erros
- [x] 5.2 Confirmar que token expirado é rejeitado (ex.: reduzir `JWT_EXPIRES_IN` temporariamente para testar) — testado com um JWT assinado com o mesmo `JWT_SECRET` e `exp` no passado: `GET /auth/me` retornou 401
- [x] 5.3 Confirmar que o fluxo funciona end-to-end com o setup atual de deploy (frontend Vercel + backend via ngrok), sem problemas de CORS — validado o mecanismo de CORS localmente (preflight `OPTIONS` confirma `Access-Control-Allow-Origin` presente só para uma origem na allowlist, ausente para uma fora dela — o mesmo código que vai valer para o domínio da Vercel assim que estiver em `CORS_ORIGINS`). **Não testei contra o túnel ngrok real nem o deploy da Vercel** — isso depende do seu ambiente (ngrok local, domínio da Vercel) e só você consegue validar de ponta a ponta; recomendo rodar `npm run start:local-backend` e testar cadastro/login pelo site publicado antes de considerar essa change 100% fechada
