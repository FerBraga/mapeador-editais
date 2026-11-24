## Purpose

Página de referência com atalhos estáticos organizados para os portais oficiais de emissão de certidões/documentos comumente exigidos em editais, acessível pela navegação principal e contextualmente a partir de documentos exigidos de categoria fiscal.

## Requirements

### Requirement: Central de atalhos para certidões oficiais
O sistema SHALL exibir uma página com atalhos organizados por tipo de exigência documental comum em editais (federal, FGTS, trabalhista, estadual), cada atalho levando ao portal oficial correspondente em uma nova aba.

#### Scenario: Usuário acessa a central de certidões
- **WHEN** um usuário navega até a Central de Certidões
- **THEN** o sistema exibe os atalhos organizados por categoria, cada um com nome claro do documento/órgão e link para o portal oficial

#### Scenario: Atalho abre em nova aba
- **WHEN** um usuário clica em um atalho da central
- **THEN** o portal oficial correspondente abre em uma nova aba, sem navegar para fora da aplicação na aba atual

### Requirement: Orientação para certidões municipais
Para exigências de nível municipal, o sistema SHALL orientar o usuário a buscar diretamente o portal da prefeitura do seu município, em vez de listar um link por município.

#### Scenario: Seção municipal exibe orientação, não lista de links
- **WHEN** um usuário visualiza a seção de certidões municipais na central
- **THEN** o sistema exibe uma orientação textual de como localizar o portal da própria prefeitura, sem apresentar uma lista de 399 links municipais

### Requirement: Atalho contextual a partir da página do edital
Quando um documento exigido (`RequiredDocument`) de categoria correspondente a um tipo de certidão coberto pela central (ex.: `TAX`) é exibido na página de detalhe de um edital, o sistema SHALL oferecer um link direto para a seção correspondente da Central de Certidões.

#### Scenario: Documento fiscal exigido linka para a seção fiscal da central
- **WHEN** a página de detalhe de um edital exibe um `RequiredDocument` de categoria `TAX`
- **THEN** o sistema exibe, junto a esse item, um link para a seção de certidões fiscais da Central de Certidões
