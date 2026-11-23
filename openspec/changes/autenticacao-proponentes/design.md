## Context

O backend (NestJS + Prisma/Postgres) já tem módulos `auth` e `users` desde a fundação do projeto, mas ambos são stubs vazios (`AuthService` sem métodos, `UsersService`/`UsersController` não implementados). O model `User` no Prisma já existe com `id`, `name`, `email` (único), `passwordHash`, `createdAt`, `updatedAt` — o campo de senha já previa hash, mas nunca foi usado. Não há nenhum guard, estratégia de autenticação ou middleware de autorização em nenhum módulo do backend hoje.

O frontend (React + Vite) não tem nenhuma noção de sessão: todas as rotas atuais (`MapPage`, `OpportunityDetailPage`) são públicas e sem estado de usuário.

O deploy atual roda com frontend na Vercel e backend local exposto via túnel ngrok em domínio fixo — domínios diferentes, então qualquer mecanismo de sessão precisa funcionar cross-origin sem depender de cookies de terceiros.

## Goals / Non-Goals

**Goals:**
- Cadastro e login de proponentes por e-mail/senha, com senha armazenada como hash (não em texto puro).
- Emissão de um JWT no login/cadastro, validado em rotas protegidas via guard do NestJS.
- Frontend com telas de cadastro/login e um jeito simples de saber "estou logado como X" no resto da aplicação.
- Preparar o terreno para a próxima change (wizard de escrita) associar rascunhos a um `userId`.

**Non-Goals:**
- Verificação de e-mail, recuperação de senha, OAuth/login social — adiados para depois da validação do MVP (decisão explícita do usuário).
- Qualquer outro perfil (empresa patrocinadora, administrador) ou sistema de permissões granular — o MVP só tem um papel ativo (`PROPONENTE`).
- Refresh token / rotação de token — o JWT expira e o usuário loga de novo; não há necessidade de manter sessão "para sempre" num MVP.

## Decisions

**JWT stateless, sem sessão no backend.** Dado o deploy cross-origin (Vercel + ngrok), cookies de sessão exigiriam `SameSite=None; Secure` e configuração de CORS mais delicada para funcionar entre os dois domínios, e ainda assim ngrok no plano gratuito já é uma fonte de instabilidade (túnel cai quando a máquina do usuário desliga). Um JWT guardado no `localStorage` do frontend e enviado via header `Authorization: Bearer` evita esse acoplamento: o backend não guarda estado de sessão, só valida a assinatura do token a cada request. Alternativa considerada: sessão com cookie + Redis (que já está no stack, usado pelo BullMQ) — descartada por complexidade extra sem benefício real no estágio atual do produto.

**Expiração curta e fixa (ex.: 7 dias), sem refresh token.** Simplicidade: sem mecanismo de refresh, o usuário loga de novo quando expira. Para um MVP com uso esperado "entro, escrevo o projeto, saio", isso é aceitável. Se a expiração se mostrar um problema real de UX durante a validação, um refresh token pode ser adicionado depois sem quebrar o que já existe.

**Papel do usuário como enum no banco, não bitmask/tabela de permissões.** Adiciona `role Role @default(PROPONENTE)` ao model `User`, com `enum Role { PROPONENTE }` (um único valor possível hoje). Isso evita uma migration destrutiva de "adicionar coluna de papel" quando, no futuro, outros perfis (empresa, admin) forem implementados — já ficam com o campo certo, só adicionando valores ao enum.

**Hash de senha com bcrypt.** Biblioteca madura, já é o padrão de facto no ecossistema Node/NestJS, sem necessidade de avaliar alternativas (argon2 traria complexidade de build nativo sem ganho relevante neste contexto).

**Guard de autenticação via `passport-jwt` + `@nestjs/jwt`.** Segue o padrão oficial do NestJS (que o projeto já usa como framework), evitando implementar verificação de token na mão. `JWT_SECRET` entra como nova variável obrigatória em `backend/src/shared/config/env.schema.ts`, seguindo o padrão Zod já estabelecido no projeto (como `GOOGLE_AI_API_KEY`, `DATABASE_URL`).

**Frontend: contexto React simples para sessão, sem biblioteca de state management nova.** O projeto não usa Redux/Zustand hoje (só hooks locais como `use-opportunities`, `use-categories`). Um `AuthContext` com `user`/`token`/`login`/`logout`, persistindo o token em `localStorage`, é suficiente e consistente com o estilo já usado (`frontend/src/hooks/`).

## Risks / Trade-offs

- [JWT em `localStorage` é vulnerável a XSS (qualquer script injetado pode ler o token)] → Mitigação: é o trade-off aceito para evitar a complexidade de cookies cross-origin no setup atual; se o produto crescer além do MVP local+ngrok, vale reavaliar para cookie `httpOnly` com domínio próprio.
- [Sem refresh token, usuário pode ser deslogado no meio da escrita de um projeto longo no wizard] → Mitigação: expiração de 7 dias é generosa o suficiente para uma sessão de uso; o wizard (próxima change) deve salvar progresso incrementalmente no backend, não só no fim, para minimizar perda de trabalho se o token expirar.
- [Sem verificação de e-mail, qualquer e-mail (inclusive de terceiros) pode ser usado no cadastro] → Mitigação: aceito para o MVP; não há nenhuma ação sensível (pagamento, dado de terceiro exposto) que dependa de prova de posse do e-mail neste estágio.

## Migration Plan

1. Migration Prisma: adiciona `role Role @default(PROPONENTE)` ao model `User` (não-destrutiva, tem default).
2. Deploy do backend com as novas rotas (`/auth/register`, `/auth/login`) e guard — não quebra nenhuma rota existente, pois é aditivo.
3. Deploy do frontend com telas novas de cadastro/login — rotas atuais (mapa, detalhe de edital) continuam públicas e inalteradas.
4. Rollback: reverter a migration é seguro (coluna nova com default, sem dados a perder) e as rotas novas podem ser desativadas sem afetar nada existente.
