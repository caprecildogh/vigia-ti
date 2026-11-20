# Planejamento Atualizado: Catálogo de Sistemas e Ativos de TI

**Projeto 6º período, Governança de TI | Grupo 5: Duplicidade de sistemas e desperdício de recursos**  
**Integrantes:** Celton Roberto, João Victor, Lindolfo Sampaio, Raryane Oliveira, Eduardo Henrique, Gabriel Cauã, Victor Lima  
**Professora:** Fúlvia  
**Status do Projeto:** Especificação e Protótipo Atualizados (MVP / Versão Final)

---

## 1. Descrição do Problema

### 1.1 Contexto
Em uma instituição de ensino, diferentes setores (secretaria, financeiro, coordenações acadêmicas, biblioteca, eventos, extensão e administração geral) mantêm planilhas e aplicações próprias de forma isolada. Cada setor adotou suas ferramentas de acordo com necessidades imediatas, sem passar por uma decisão central da área de Tecnologia da Informação (TI).

Esse cenário gerou duplicidade direta nos **três processos centrais** da instituição:
1. **Cadastro de Estudantes:** o *SGA Acadêmico* (Coordenações) convive com a *Planilha de Matrículas* (Secretaria), gerando divergência de telefones, endereços e pendências documentais.
2. **Controle de Eventos e Extensão:** o sistema oficial *Controle de Eventos* convive com a *Planilha de Extensão* (Google Sheets), duplicando inscrições e carga horária de alunos.
3. **Acompanhamento de Atividades Administrativas:** o *ERP Financeiro e Administrativo* convive com a aplicação/planilha paralela *Controle de Protocolos e Tarefas* (Administração Geral), exigindo redigitação de requerimentos, compras e solicitações internas.

### 1.2 Situação Atual
* **Inconsistência por Falta de Fonte Oficial:** os mesmos dados existem em vários lugares sem definição clara de qual ferramenta é a **Fonte Oficial (Base Principal)** e quais são **Cópias Paralelas**.
* **Retrabalho Operacional Mensurável em Horas:** colaboradores perdem horas semanais redigitando manualmente informações entre planilhas e sistemas oficiais (ex.: centenas de horas/ano desperdiçadas na Secretaria, Extensão e Administração).
* **Falta de Visão Consolidada:** ninguém possui um painel único mostrando todas as ferramentas existentes, seus responsáveis, custos totais (TCO) e contratos vinculados.
* **Desperdício Financeiro e Licenças Ociosas:** ferramentas redundantes geram gastos concorrentes, além de licenças pagas contratadas em excesso e não utilizadas pelos setores.
* **Proliferação de *Shadow IT*:** planilhas e ferramentas adotadas pelos setores sem homologação ou critérios mínimos de segurança pela TI.
* **Risco de Conformidade com a LGPD (Lei nº 13.709/2018):** dados pessoais (CPF, endereço) e dados sensíveis de estudantes (Art. 11 — laudos médicos e inclusão) ficam armazenados em planilhas locais sem autenticação individual, backup central ou trilha de auditoria.

### 1.3 Problema Central
> **Como obter uma visão integrada dos recursos tecnológicos da instituição, mensurar o retrabalho e os riscos de inconsistência/LGPD, e identificar oportunidades práticas de racionalização?**

### 1.4 Solução Proposta
Desenvolver um **Catálogo de Sistemas e Ativos de TI** — uma aplicação web corporativa de base única que concentra o inventário de sistemas, softwares e planilhas da instituição, registrando finalidade, setor responsável, custos (TCO e horas de retrabalho), usuários, contratos, integrações e papel dos dados.

A plataforma oferece:
1. **Sinalização de Fonte Oficial vs. Cópia Paralela:** identifica explicitamente onde o dado é oficial e onde há cópias paralelas inconsistentes.
2. **Calculadora de Retrabalho em Horas e Reais:** converte horas semanais gastas com redigitação manual em horas/ano desperdiçadas e custo anual estimado.
3. **Detecção de Sobreposições e Planos de Unificação:** cruza finalidade e dados compartilhados para sugerir unificações e acompanhar planos formais de migração/desligamento.
4. **Simulador de Economia:** soma o potencial de economia financeira anual (desligamento de cópias paralelas + redução de licenças ociosas) e as horas de trabalho devolvidas à equipe.
5. **Visão Inicial Personalizada por Perfil:** adapta o painel de destaque inicial para cada um dos quatro perfis envolvidos (*Gestor de TI*, *Administração*, *Setor financeiro* e *Responsável pelo sistema*).
6. **Avaliação de Risco LGPD e Mapa de Conexões (SVG):** avalia controles de segurança, dispersão de dados e exibe visualmente o ecossistema integrado separado dos *silos isolados*.

### 1.5 Objetivos

#### Objetivo Geral:
Criar uma base única, auditável e confiável de sistemas e ativos de TI para dar visibilidade institucional, eliminar inconsistências e retrabalho, mitigar riscos de LGPD e apoiar decisões de racionalização de recursos.

#### Objetivos Específicos:
* Cadastrar e padronizar informações de sistemas, softwares, equipamentos e planilhas departamentais.
* Classificar cada ferramenta quanto ao papel dos dados (**Fonte Oficial**, **Cópia Paralela** ou **Consulta Integrada**).
* Mensurar o Custo Total de Propriedade (**TCO**) somando licenças, suporte, infraestrutura e o custo do tempo de retrabalho manual (em horas/semana e R$/ano).
* Identificar sobreposições nos processos acadêmicos, de eventos e administrativos, gerando planos de unificação com prazos e responsáveis.
* Avaliar a conformidade com a LGPD (dados pessoais/sensíveis vs. controles de segurança) e combater o *Shadow IT* via fila de homologação pela TI.
* Entregar visões adaptadas aos 4 perfis envolvidos com interface acessível a diferentes faixas etárias e opção de impressão executiva.
* Manter trilha de auditoria completa de todas as alterações realizadas no catálogo.

---

## 1.6 Usuários Envolvidos e Visão Personalizada (RBAC)

| Perfil | Papel no Sistema | Destaque Inicial e Permissões |
| :--- | :--- | :--- |
| **Gestor de TI** | Administra o catálogo, homologa ferramentas (*Shadow IT*), analisa sobreposições e aprova planos de unificação. | Painel focado nos casos de duplicidade, horas de retrabalho e pendências de homologação; acesso total de edição, aprovação e exclusão. |
| **Administração (Diretoria)** | Consulta visão consolidada, economia projetada e indicadores para decisão estratégica. | Resumo executivo focado em economia anual (R$), horas poupadas e botão de impressão de relatório; acesso de consulta gerencial e auditoria. |
| **Setor Financeiro** | Consulta e atualiza custos, fornecedores, contratos e vigências. | Destaque automático para contratos vencidos/a vencer (90 dias) e desperdício com licenças ociosas; edita custos, horas de retrabalho e dados contratuais. |
| **Responsável pelo Sistema** | Declara e mantém atualizadas as ferramentas do seu setor. | Cartões exclusivos com *Suas Ferramentas Cadastradas* e alertas caso alguma seja uma Cópia Paralela com retrabalho; edita apenas ativos em seu nome (novos cadastros entram como *Pendente de validação*). |

---

## 2. Funcionalidades

### 2.1 Requisitos Funcionais (RF)

| Cód. | Funcionalidade | Descrição |
| :--- | :--- | :--- |
| **RF01** | **Cadastro de sistemas e ativos** | Registrar nome, tipo (Sistema, Planilha, Software, Equipamento), categoria funcional, versão/ambiente, finalidade, situação de uso e avaliação da TI. |
| **RF02** | **Setor e responsável** | Vincular cada ferramenta a um setor e a um funcionário responsável (*Asset Owner*). |
| **RF03** | **Custos, TCO e Retrabalho** | Registrar custos de licença, suporte, infraestrutura e **horas semanais de redigitação**, calculando automaticamente horas/ano perdidas, custo anual do retrabalho e TCO total. |
| **RF04** | **Contratos e fornecedores** | Registrar fornecedor, número, valor, início e vencimento do contrato, com alertas para vencidos e a vencer em 90 dias. |
| **RF05** | **Usuários e licenças ociosas** | Informar quantidade estimada de usuários, público-alvo e licenças contratadas versus utilizadas, apontando desperdício financeiro com ociosidade. |
| **RF06** | **Integrações e silos isolados** | Selecionar sistemas integrados automaticamente e exibir mapa visual separando o **ecossistema integrado** dos **silos isolados** (com horas de retrabalho). |
| **RF07** | **Situação de uso e ciclo de vida** | Classificar como *Ativo*, *Em migração*, *Subutilizado*, *Obsoleto* ou *Desativado*, associando recomendações da matriz **TIME**. |
| **RF08** | **Papel dos dados e risco LGPD** | Definir se a ferramenta é **Fonte Oficial**, **Cópia Paralela** ou **Consulta Integrada**; mapear tipos de dados (pessoais, financeiros, sensíveis - Art. 11) e controles de segurança (senha individual, backup, logs, contrato LGPD) para gerar índice automático de risco (Baixo, Médio, Alto, Crítico). |
| **RF09** | **Detecção de sobreposições e planos de unificação** | Sinalizar ferramentas redundantes, calcular economia financeira e de horas, e permitir criar/concluir **Planos de Unificação** formais. |
| **RF10** | **Busca, filtros e ordenação** | Consultar o catálogo por texto livre, setor, fonte do dado, situação e categoria, além de ordenar colunas por nome, setor, risco LGPD e TCO. |
| **RF11** | **Painel adaptativo e relatórios** | Exibir painel personalizado ao perfil logado, gráficos de TCO por setor, contratos, quadro de decisão TIME e suporte a impressão de relatório. |
| **RF12** | **Histórico de auditoria** | Registrar cronologicamente inclusões, edições, avaliações da TI, planos de unificação e exclusões (quem, quando e detalhes). |
| **RF13** | **Controle de acesso (RBAC)** | Login simulado por perfil com restrição de botões, campos editáveis e visibilidade de auditoria conforme o papel do usuário. |
| **RF14** | **Homologação e controle de Shadow IT** | Fila de avaliação para o Gestor de TI homologar ferramentas pendentes ou solicitar descontinuação de cópias não oficiais. |

### 2.2 Requisitos Não Funcionais (RNF)

* **Usabilidade e Interface Executiva:** layout em **barra lateral fixa escura e área de trabalho branca limpa** (zero poluição visual), com navegação enxuta em **5 seções principais**.
* **Acessibilidade Multi-geracional (WCAG 2.2 AA):** ajuste dinâmico do tamanho da fonte (**A**, **A+**, **A++**), alto contraste tipográfico, alternância de **Modo Claro/Escuro** e uso obrigatório de ícones/textos semânticos (`★`, `✓`, `⚠`, `⛔`) junto às cores.
* **Segurança e Conformidade:** não armazena dados reais de estudantes, apenas classifica os tipos de dados tratados e controles existentes em cada ferramenta.
* **Portabilidade e Demonstração:** aplicação web responsiva acessível por navegador, com persistência local e botão para **Restaurar Dados de Exemplo**.

---

## 3. Conceitos de Governança de TI Utilizados

| Conceito / Framework | Como se aplica no projeto |
| :--- | :--- |
| **Governança de TI (ISO/IEC 38500)** | Materializa responsabilidade (*owner* definido por ativo), aquisição controlada e avaliação formal pela TI contra o *Shadow IT*. |
| **COBIT 2019: EDM04 (Otimização de Recursos)** | Simulador de economia anual e cálculo de horas de retrabalho eliminadas ao consolidar planilhas paralelas e cortar licenças ociosas. |
| **COBIT 2019: APO03 (Arquitetura Corporativa)** | Mapa visual de conexões separando as Fontes Oficiais integradas dos silos isolados de redigitação manual. |
| **COBIT 2019: APO05 (Portfólio)** | Classificação das ferramentas na matriz **TIME** (*Manter e Investir*, *Migrar Dados*, *Unificar*, *Desligar*) e gestão de Planos de Unificação. |
| **COBIT 2019: APO06 (Orçamento e Custos)** | Apuração completa do **TCO**, incluindo o custo real do retrabalho humano semanal convertido em despesa anual. |
| **COBIT 2019: APO10 e APO09 (Fornecedores e Contratos)** | Controle de contratos, valores por fornecedor e alertas automáticos de vencimento em 90 dias. |
| **COBIT 2019: BAI09 (Ativos)** | Inventário centralizado e controle do ciclo de vida de sistemas, softwares e planilhas. |
| **ITIL 4 (Gerenciamento de Ativos e Configuração)** | Relacionamento entre ativos, fluxos de dados trocados e rastreabilidade de mudanças. |
| **LGPD (Lei nº 13.709/2018) e Gestão de Riscos** | Mapeamento de dispersão de dados pessoais e sensíveis (Art. 11), auditoria de controles mínimos de segurança e cálculo de risco por ferramenta. |
| **Consistência de Dados (Master Data / Fonte Oficial)** | Distinção explícita entre **Fonte Oficial do Dado** e **Cópia Paralela (Inconsistente)** para eliminar divergências cadastrais. |

---

## 4. Arquitetura e Organização do Sistema

A aplicação é organizada em **4 perfis de acesso**, **5 seções de navegação** em menu lateral fixo e **1 base única de dados**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                      4 PERFIS DE ACESSO (RBAC)                       │
│  [Gestor de TI]  [Administração]  [Setor Financeiro]  [Responsável]  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ Painel Inicial Adaptado ao Perfil
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│            APLICAÇÃO WEB — CATÁLOGO DE SISTEMAS E ATIVOS             │
│                                                                      │
│  1. Visão Geral                                                      │
│     └─ Destaque por perfil, KPIs de TCO, horas de retrabalho e risco │
│                                                                      │
│  2. Catálogo e Setores                                               │
│     └─ Lista filtrável, Fonte Oficial vs. Cópia Paralela e visão     │
│        agrupada por setor                                            │
│                                                                      │
│  3. Duplicidades e Economia                                          │
│     └─ Simulador financeiro/horas, os 3 casos duplicados, Planos de  │
│        Unificação, Matriz TIME e licenças ociosas                    │
│                                                                      │
│  4. Governança, LGPD e Mapa                                          │
│     └─ Mapa SVG (Conectados vs. Silos), dispersão de dados oficiais  │
│        vs. cópias, fila de homologação da TI e checklist LGPD        │
│                                                                      │
│  5. Contratos e Auditoria                                            │
│     └─ Vigências, exposição por fornecedor e histórico de mudanças   │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ Leitura e Gravação
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       BASE UNIFICADA DE DADOS                        │
│  • Sistemas e Planilhas  • Custos TCO e Retrabalho  • Contratos      │
│  • Papéis dos Dados      • Riscos e Controles LGPD  • Planos e Logs  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Cronograma de Entregas

| Entrega | Data | O que foi / será entregue |
| :--- | :--- | :--- |
| **Entrega 1: Planejamento** | Até 30/10/26 | Documento inicial: problema, funcionalidades, conceitos e diagrama. |
| **Entrega 2: MVP** | 13/11/26 | Protótipo funcional com cadastro, custos/retrabalho, contratos, busca, filtros e painel executivo por perfil. |
| **Entrega 3: Versão Final** | 23/11/26 | Sobreposições nos 3 casos da instituição, planos de unificação, mapa visual de conexões/silos, matriz LGPD, acessibilidade e documentação atualizada. |
| **Apresentação em Equipe** | 27/11/26 | Demonstração ao vivo dos 4 perfis de usuário e explicação dos conceitos de governança aplicados. |

---

## 6. Referências

* **ISACA.** *COBIT 2019 Framework: Governance and Management Objectives*. Schaumburg: ISACA, 2018.
* **ABNT.** *ABNT NBR ISO/IEC 38500: Governança corporativa de tecnologia da informação*. Rio de Janeiro: ABNT.
* **AXELOS.** *ITIL Foundation: ITIL 4 Edition*. Londres: TSO, 2019.
* **BRASIL.** *Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados Pessoais)*.
* **W3C.** *Web Content Accessibility Guidelines (WCAG) 2.2*. W3C Recommendation, 2023.
