## 1. Levantamento de conteúdo

- [x] 1.1 Levantar e validar, na fonte oficial, as URLs atuais dos portais de: Certidão Negativa de Débitos Federais (Receita Federal/PGFN), Certidão de Regularidade do FGTS (Caixa), Certidão Negativa de Débitos Trabalhistas (TST), e Certidão Negativa Estadual do Paraná (Secretaria da Fazenda do PR) — pesquisado via web search, não inventado; URLs confirmadas: `gov.br/pt-br/servicos/emitir-certidao-de-regularidade-fiscal-perante-a-fazenda-nacional`, `consulta-crf.caixa.gov.br`, `tst.jus.br/certidao`, `fazenda.pr.gov.br/servicos/.../Emitir-Certidao-Negativa-Receita-Estadual-kZrX5gol`
- [x] 1.2 Redigir o texto de orientação para certidões municipais (como localizar o portal da própria prefeitura)

## 2. Frontend

- [x] 2.1 Criar constante de dados dos atalhos (nome, descrição curta, categoria, URL) em `frontend/src/lib/` — `frontend/src/lib/certificates.ts`
- [x] 2.2 Criar rota/página "Central de Certidões" exibindo os atalhos agrupados por categoria — `CertificatesHubPage` em `/certidoes`, atrás de `RequireAuth` como o resto do app
- [x] 2.3 Adicionar link para a Central de Certidões na navegação principal — header do `MapPage`
- [x] 2.4 Garantir que todo atalho abre em nova aba (`target="_blank"`, com `rel="noopener noreferrer"`)
- [x] 2.5 Na página de detalhe do edital, adicionar link contextual da seção de `RequiredDocument` de categoria `TAX` para a seção correspondente da central — link pra `/certidoes#fiscal` (agrupa Federal + Estadual, que são as certidões efetivamente fiscais; FGTS e Trabalhista ficam em seções separadas na central)

## 3. Validação manual

- [x] 3.1 Clicar em cada atalho e confirmar que leva ao portal oficial correto — sem navegador disponível aqui, validei via `curl` que as 4 URLs respondem HTTP 200 (Receita Federal/PGFN, SEFA-PR, Caixa/CRF, TST/CNDT); recomendo você clicar manualmente também pra confirmar visualmente que caem na página certa dentro de cada portal
- [x] 3.2 Confirmar que a central é responsiva (mobile), consistente com o restante do frontend — layout usa os mesmos paddings/`max-w-2xl`/cards responsivos já usados no wizard; não verificado visualmente em navegador real
- [x] 3.3 Confirmar que o link contextual a partir da página do edital leva à seção certa da central — `href="/certidoes#fiscal"` aponta pro `id="fiscal"` da seção correta; confirmado por leitura do código, não testável sem navegador
