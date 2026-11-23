## 1. Levantamento de conteúdo

- [ ] 1.1 Levantar e validar, na fonte oficial, as URLs atuais dos portais de: Certidão Negativa de Débitos Federais (Receita Federal/PGFN), Certidão de Regularidade do FGTS (Caixa), Certidão Negativa de Débitos Trabalhistas (TST), e Certidão Negativa Estadual do Paraná (Secretaria da Fazenda do PR)
- [ ] 1.2 Redigir o texto de orientação para certidões municipais (como localizar o portal da própria prefeitura)

## 2. Frontend

- [ ] 2.1 Criar constante de dados dos atalhos (nome, descrição curta, categoria, URL) em `frontend/src/lib/`
- [ ] 2.2 Criar rota/página "Central de Certidões" exibindo os atalhos agrupados por categoria
- [ ] 2.3 Adicionar link para a Central de Certidões na navegação principal
- [ ] 2.4 Garantir que todo atalho abre em nova aba (`target="_blank"`, com `rel="noopener noreferrer"`)
- [ ] 2.5 Na página de detalhe do edital, adicionar link contextual da seção de `RequiredDocument` de categoria `TAX` para a seção correspondente da central

## 3. Validação manual

- [ ] 3.1 Clicar em cada atalho e confirmar que leva ao portal oficial correto
- [ ] 3.2 Confirmar que a central é responsiva (mobile), consistente com o restante do frontend
- [ ] 3.3 Confirmar que o link contextual a partir da página do edital leva à seção certa da central
