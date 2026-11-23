## Why

O descritivo de produto do MVP prevê um "Copiloto de Escrita" — assistente de IA que guia o proponente, passo a passo, na redação do projeto para um edital. Para que o rascunho desse projeto fique salvo e recuperável entre sessões e dispositivos (em vez de preso ao `localStorage` do navegador), é preciso saber quem é o usuário. Hoje os módulos `auth` e `users` existem apenas como stubs desde a fundação do projeto (`AuthService` vazio, model `User` sem campo de papel) e não há nenhuma tela de login/cadastro no frontend. Esta change constrói a autenticação mínima de proponentes que o wizard de escrita (próxima change) vai depender para associar rascunhos a uma conta.

## What Changes

- Implementa cadastro (`POST /auth/register`) e login (`POST /auth/login`) por e-mail/senha para o perfil Proponente, com hash de senha (já existe o campo `passwordHash` no model `User`, mas nunca foi usado).
- Emite um JWT assinado no login/cadastro; o frontend guarda o token e o envia em `Authorization: Bearer` nas chamadas autenticadas.
- Implementa guard/middleware no backend para proteger rotas autenticadas (preparação para os endpoints do wizard, que ainda não existem).
- Adiciona telas de cadastro e login no frontend (React), com estado de sessão simples (token + dados básicos do usuário) acessível pelo resto da aplicação.
- Fora de escopo, por decisão explícita do usuário: verificação de e-mail, fluxo de "esqueci minha senha", cadastro/perfil de empresas patrocinadoras, painel administrativo e qualquer sistema de papéis/permissões além de "proponente autenticado" — tudo isso fica para depois da validação do MVP.

## Capabilities

### New Capabilities
- `proponent-auth`: cadastro e login de proponentes por e-mail/senha, emissão e validação de JWT, proteção de rotas autenticadas no backend, e telas de cadastro/login no frontend com persistência de sessão.

### Modified Capabilities
(nenhuma — não existe spec documentada para `auth`/`users` hoje; são módulos stub sem capacidade registrada em `openspec/specs/`)

## Impact

- Preenche os módulos stub `backend/src/modules/auth/` e `backend/src/modules/users/`.
- Migration no `backend/prisma/schema.prisma`: adiciona campo de papel/role ao model `User` (mesmo com um único valor possível hoje, `PROPONENTE`, para não precisar de migration destrutiva quando outros perfis forem adicionados no futuro).
- Nova dependência de pacote no backend para JWT (ex.: `@nestjs/jwt` + `passport-jwt`, ou equivalente).
- Novas rotas/telas no frontend (`frontend/src/routes/`) e um mecanismo de estado de sessão (contexto React ou store simples) hoje inexistente.
- Pré-requisito direto da próxima change (wizard de escrita): sem isso, rascunhos de projeto não têm dono.
