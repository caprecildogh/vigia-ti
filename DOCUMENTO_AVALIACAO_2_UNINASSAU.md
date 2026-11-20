**FACULDADE UNINASSAU OLINDA**

<br>

**VIGIA-TI: CATÁLOGO INTEGRADO DE SISTEMAS E ATIVOS DE TI**

<br>

Celton Roberto  
Eduardo Henrique  
Gabriel Cauã  
João Victor  
Lindolfo Sampaio  
Raryane Oliveira  
Victor Lima  

<br>

Olinda  
2026

---

Celton Roberto  
Eduardo Henrique  
Gabriel Cauã  
João Victor  
Lindolfo Sampaio  
Raryane Oliveira  
Victor Lima  

<br>

**VIGIA-TI: CATÁLOGO INTEGRADO DE SISTEMAS E ATIVOS DE TI**

<br>

> Atividade apresentada correspondente à  
> Segunda Avaliação do semestre 2026.2 da  
> disciplina Governança em TI.  
> Prof.ª Fúlvia Lima

<br>

Olinda  
2026

---

## SUMÁRIO

INTRODUÇÃO………………………………………………………………………………..  
IDENTIFICAÇÃO DO PROJETO..................................................................................  
TEMA E OBJETIVO EDUCACIONAL...........................................................................  
CONCEITO E CARACTERÍSTICAS DO SISTEMA........................................................  
MECÂNICA E REGRAS DO JOGO...............................................................................  
ARQUITETURA E TECNOLOGIAS UTILIZADAS.........................................................  
GESTÃO DO PROJETO................................................................................................  
TESTES E AVALIAÇÃO.................................................................................................  
RESULTADOS ALCANÇADOS......................................................................................  
CONCLUSÃO................................................................................................................  
REFERÊNCIAS BIBLIOGRÁFICAS...............................................................................  
ANEXOS/APÊNDICES..................................................................................................  

---

## INTRODUÇÃO

No cotidiano das instituições de ensino, o crescimento descentralizado das rotinas acadêmicas e administrativas frequentemente leva diferentes setores — como secretaria, financeiro, coordenações de curso, biblioteca, eventos, extensão e administração geral — a adotarem planilhas eletrônicas e aplicações próprias sem alinhamento prévio com a área de Tecnologia da Informação (TI). Como consequência dessa falta de governança central, atividades essenciais como o **cadastro de estudantes**, o **controle de eventos** e o **acompanhamento de atividades administrativas** passam a ser operadas em ferramentas isoladas e redundantes.

Esse cenário gera impactos diretos na eficiência operacional, nos custos e na segurança institucional. Os mesmos dados cadastrais de alunos existem em múltiplos locais sem uma **Fonte Oficial** definida, tornando-se inconsistentes entre si. Colaboradores perdem centenas de horas anuais em **retrabalho**, redigitando manualmente informações entre planilhas paralelas e sistemas corporativos. Paralelamente, a alta gestão e a TI carecem de uma visão consolidada sobre quais ferramentas estão em uso, quem são seus responsáveis, qual é o Custo Total de Propriedade (TCO) envolvido, quais contratos estão próximos do vencimento e quantas licenças pagas permanecem ociosas. Agravando o problema, o armazenamento de dados pessoais e sensíveis de estudantes em planilhas locais sem controle de acesso ou auditoria — prática característica de *Shadow IT* — expõe a instituição a sérios riscos de não conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).

Diante do problema central — *"Como obter uma visão integrada dos recursos tecnológicos da instituição e identificar oportunidades de racionalização?"* —, este trabalho apresenta o desenvolvimento de um catálogo web centralizado de sistemas e ativos de TI, fundamentado nas boas práticas de Governança de TI (**COBIT 2019**, **ISO/IEC 38500** e **ITIL 4**) e conformidade com a **LGPD**. A plataforma reúne em uma base única o inventário de sistemas, softwares e planilhas institucionais, distinguindo explicitamente as **Fontes Oficiais** das **Cópias Paralelas**, mensurando o retrabalho em horas semanais e impacto financeiro, detectando sobreposições nos processos acadêmicos, de eventos e administrativos, mapeando conexões e silos isolados e apoiando os quatro perfis envolvidos (Gestor de TI, Administração, Setor Financeiro e Responsáveis pelos Sistemas) com uma interface acessível a diferentes faixas etárias.

---

## IDENTIFICAÇÃO DO PROJETO

* **Nome do Projeto:** VIGIA-TI (*Visão Integrada de Gestão, Inventário e Ativos de TI*)
* **Disciplina:** Governança em TI — Faculdade UNINASSAU Olinda (2026.2)
* **Professora Orientadora:** Prof.ª Fúlvia Lima
* **Contexto de Aplicação:** Instituição de ensino com múltiplos setores operacionais (Secretaria, Coordenações, Eventos, Extensão, Financeiro, Administração Geral e Biblioteca).
* **Problema Abordado:** Duplicidade de sistemas, inconsistência cadastral, retrabalho manual, ausência de controle central de custos/contratos, proliferação de *Shadow IT* e riscos à LGPD.
* **Público-Alvo e Perfis de Acesso (RBAC):**
  1. **Gestor de TI:** administra o catálogo, homologa ferramentas (*Shadow IT*), analisa sobreposições e aprova planos de unificação.
  2. **Administração (Diretoria):** acompanha indicadores consolidados, economia projetada, horas de retrabalho evitáveis e matriz de decisão de portfólio.
  3. **Setor Financeiro:** gerencia custos anuais (TCO), fornecedores, vigências contratuais e desperdício com licenças ociosas.
  4. **Responsável pelo Sistema:** declara as ferramentas do seu departamento e mantém atualizadas as informações dos ativos sob sua responsabilidade.
* **Principais Funcionalidades Implementadas no Protótipo:**
  * Painel inicial adaptado automaticamente ao perfil de usuário autenticado e navegação enxuta em cinco seções (*Visão Geral*, *Catálogo e Setores*, *Duplicidades e Economia*, *Governança, LGPD e Mapa* e *Contratos e Auditoria*);
  * Sinalização explícita de **Fonte Oficial (Base Principal)**, **Cópia Paralela (Gera Inconsistência)** e **Consulta Integrada**;
  * Calculadora automática de **TCO** e conversão de horas semanais de redigitação em horas anuais e custo operacional desperdiçado;
  * Motor de detecção de sobreposições nos casos de cadastro de estudantes, eventos e atividades administrativas, com simulador de economia e gestão de planos de unificação;
  * Diagnóstico de risco **LGPD** (dados pessoais, financeiros e sensíveis – Art. 11 versus controles de segurança), mapa de dispersão de dados e fila de homologação da TI;
  * Mapa visual em SVG separando o ecossistema integrado dos silos isolados, controle de contratos com alertas de 90 dias, trilha de auditoria completa e recursos de acessibilidade multi-geracional (ajuste de fonte `A / A+ / A++`, alto contraste, modo claro/escuro e ícones semânticos).
* **Frameworks e Normas de Referência:** ISO/IEC 38500, COBIT 2019 (EDM04, APO03, APO05, APO06, APO09/APO10, BAI09), ITIL 4, Modelo TIME de Racionalização de Portfólio, WCAG 2.2 e LGPD (Lei nº 13.709/2018).

---

### 2.1 NOME DO PROJETO

**VIGIA-TI — Visão Integrada de Gestão, Inventário e Ativos de TI**

#### Origem e Justificativa do Nome do Projeto

O nome **VIGIA-TI** surge diretamente da combinação entre o problema central do desafio proposto e o papel estratégico da Governança de Tecnologia da Informação nas organizações:

1. **Origem (Acrônimo):** A sigla representa **V**isão **I**ntegrada de **G**estão, **I**nventário e **A**tivos de **TI**, sintetizando em uma única expressão o objetivo principal do catálogo: consolidar em um ponto central todo o parque de sistemas, softwares e planilhas utilizadas pela instituição de ensino.
2. **Justificativa pelo Conceito de Governança ("Vigiar"):** Em consonância com a norma **ISO/IEC 38500** e os domínios do **COBIT 2019** (especialmente *EDM04 – Otimização de Recursos* e *APO05 – Gestão de Portfólio*), governar TI exige monitoramento contínuo. O termo *"Vigia"* simboliza a capacidade da plataforma de acompanhar e alertar preventivamente os gestores sobre:
   * **Desperdício financeiro e retrabalho:** identificando ferramentas duplicadas e horas semanais perdidas com redigitação manual;
   * **Vencimento de contratos e licenças ociosas:** evitando renovações automáticas prejudiciais ou gastos com licenças não utilizadas;
   * **Shadow IT e Riscos LGPD:** sinalizando planilhas paralelas criadas sem homologação da TI que armazenam dados pessoais e sensíveis de estudantes sem os controles adequados de segurança.
3. **Justificativa pela Clareza e Acessibilidade:** Trata-se de um nome curto, em língua portuguesa, de fácil pronúncia e assimilação imediata por colaboradores de diferentes faixas etárias e perfis — tanto técnicos (Gestão de TI) quanto não técnicos (Secretaria, Financeiro e Diretoria) —, reforçando a proposta de transparência e simplicidade da plataforma.

---

### 2.1.1 A Equipe (funções e responsabilidades)
