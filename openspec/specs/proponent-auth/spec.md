## Purpose

Cadastro e login de proponentes por e-mail/senha, emissão e validação de JWT, proteção de rotas autenticadas no backend, e telas de cadastro/login no frontend com persistência de sessão — pré-requisito do copiloto de escrita e porta de entrada do app (o mapa e o detalhe de edital exigem sessão).

## Requirements

### Requirement: Cadastro de proponente
O sistema SHALL permitir que um visitante crie uma conta de proponente informando nome, e-mail e senha. A senha SHALL ser armazenada apenas como hash (nunca em texto puro). O e-mail SHALL ser único no sistema.

#### Scenario: Cadastro bem-sucedido
- **WHEN** um visitante envia nome, e-mail não cadastrado e senha válida para `POST /auth/register`
- **THEN** o sistema cria o usuário com papel `PROPONENTE`, armazena a senha como hash, e retorna um token JWT válido junto com os dados básicos do usuário

#### Scenario: Cadastro com e-mail já existente
- **WHEN** um visitante envia um e-mail que já está cadastrado para `POST /auth/register`
- **THEN** o sistema rejeita a requisição com um erro claro indicando que o e-mail já está em uso, sem revelar outros dados da conta existente

#### Scenario: Cadastro com dados inválidos
- **WHEN** um visitante envia `POST /auth/register` sem e-mail, sem senha, com e-mail em formato inválido, ou com senha abaixo do tamanho mínimo exigido
- **THEN** o sistema rejeita a requisição com erro de validação, sem criar nenhum usuário

### Requirement: Login de proponente
O sistema SHALL permitir que um proponente cadastrado autentique-se com e-mail e senha, recebendo um token JWT em caso de sucesso.

#### Scenario: Login bem-sucedido
- **WHEN** um proponente envia e-mail e senha corretos para `POST /auth/login`
- **THEN** o sistema retorna um token JWT válido e os dados básicos do usuário

#### Scenario: Login com credenciais inválidas
- **WHEN** um proponente envia e-mail não cadastrado, ou e-mail cadastrado com senha incorreta, para `POST /auth/login`
- **THEN** o sistema rejeita a requisição com uma mensagem genérica de credenciais inválidas, sem indicar se o e-mail existe ou não

### Requirement: Proteção de rotas autenticadas
O sistema SHALL expor um mecanismo (guard) para proteger rotas que exigem um proponente autenticado, validando o token JWT enviado no header `Authorization: Bearer <token>`.

#### Scenario: Acesso a rota protegida com token válido
- **WHEN** uma requisição a uma rota protegida inclui um token JWT válido e não expirado no header `Authorization`
- **THEN** o sistema permite a requisição e disponibiliza os dados do usuário autenticado (ao menos `id` e `role`) ao handler da rota

#### Scenario: Acesso a rota protegida sem token
- **WHEN** uma requisição a uma rota protegida não inclui o header `Authorization`
- **THEN** o sistema rejeita a requisição com erro 401

#### Scenario: Acesso a rota protegida com token expirado ou inválido
- **WHEN** uma requisição a uma rota protegida inclui um token JWT expirado, malformado, ou com assinatura inválida
- **THEN** o sistema rejeita a requisição com erro 401

### Requirement: Acesso ao mapa exige sessão autenticada
O sistema SHALL exigir uma sessão de proponente autenticado para acessar o mapa de descoberta de editais e o detalhe de uma oportunidade. Um visitante sem sessão válida SHALL ver uma tela de boas-vindas, com atalhos para login e cadastro, em vez do conteúdo protegido.

#### Scenario: Visitante sem sessão é recebido pela tela de boas-vindas
- **WHEN** um visitante sem token válido acessa a rota do mapa ou de um edital
- **THEN** o sistema exibe a tela de boas-vindas (com botões "Entrar" e "Cadastre-se"), sem renderizar o mapa nem o detalhe do edital

#### Scenario: Proponente autenticado acessa o conteúdo normalmente
- **WHEN** um proponente com sessão válida acessa a rota do mapa ou de um edital
- **THEN** o sistema renderiza o conteúdo normalmente, sem exibir a tela de boas-vindas

### Requirement: Sessão no frontend
O frontend SHALL manter o estado de autenticação do proponente (token e dados básicos do usuário) disponível para toda a aplicação após login ou cadastro, persistindo-o entre recarregamentos de página, e SHALL permitir logout explícito.

#### Scenario: Sessão persiste após recarregar a página
- **WHEN** um proponente autenticado recarrega a página do navegador
- **THEN** o frontend continua reconhecendo o usuário como autenticado, sem exigir login novamente, enquanto o token armazenado ainda for válido

#### Scenario: Logout
- **WHEN** um proponente autenticado aciona a ação de logout
- **THEN** o frontend descarta o token armazenado e passa a tratar o usuário como não autenticado
