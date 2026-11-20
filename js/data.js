// Dados iniciais (Seed) e constantes do Catálogo de Sistemas e Ativos de TI

const STORAGE_KEYS = {
  DATA: "cat_gov_ti_v4_dados",
  HIST: "cat_gov_ti_v4_hist",
  PLANS: "cat_gov_ti_v4_planos",
  USER: "cat_gov_ti_v4_user",
  THEME: "cat_gov_ti_v4_theme"
};

const PERFIS = {
  GESTOR_TI: "Gestor de TI",
  ADMINISTRACAO: "Administração",
  FINANCEIRO: "Setor financeiro",
  RESPONSAVEL: "Responsável pelo sistema"
};

// Custo médio estimado da hora de trabalho administrativo para cálculo automático de retrabalho (48 semanas úteis/ano)
const CUSTO_HORA_PADRAO = 32;
const SEMANAS_ANO = 48;

// Categorias padronizadas de dados para análise de conformidade LGPD e Fonte Oficial
const LGPD_CATEGORIAS = [
  { id: "cadastro_estudantes", label: "Cadastro de estudantes (Nome, CPF, Contato)", peso: 2, tipo: "Pessoal", fontePadrao: "SGA Acadêmico" },
  { id: "academico", label: "Dados acadêmicos (Notas, Frequência, Histórico)", peso: 2, tipo: "Pessoal", fontePadrao: "SGA Acadêmico" },
  { id: "financeiro", label: "Dados financeiros (Mensalidades, Contas, Bolsas)", peso: 3, tipo: "Pessoal / Financeiro", fontePadrao: "ERP Financeiro" },
  { id: "sensiveis", label: "Dados sensíveis - Art. 11 (Saúde, Laudos, Socioeconômico)", peso: 4, tipo: "Sensível (Art. 11)", fontePadrao: "SGA Acadêmico" },
  { id: "eventos", label: "Inscrições e certificados de eventos", peso: 1, tipo: "Pessoal", fontePadrao: "Controle de Eventos" },
  { id: "administrativo", label: "Atividades administrativas (Protocolos, Requisições, Compras)", peso: 1, tipo: "Operacional", fontePadrao: "Portal Administrativo (SGA/ERP)" },
  { id: "acervo", label: "Acervo bibliográfico e empréstimos", peso: 1, tipo: "Operacional", fontePadrao: "Gestor de Acervo" }
];

// Controles mínimos de segurança/privacidade que mitigam risco LGPD
const CONTROLES_SEGURANCA = [
  { id: "login_individual", label: "Senha individual por funcionário" },
  { id: "backup_central", label: "Backup automático feito pela TI" },
  { id: "logs_auditoria", label: "Histórico de quem acessou ou alterou (Logs)" },
  { id: "contrato_dpa", label: "Contrato formal com cláusula LGPD" }
];

const PAPEIS_DADOS = [
  "Fonte Oficial (Base Principal)",
  "Cópia Paralela (Gera Inconsistência)",
  "Consulta Integrada"
];

const STATUS_GOVERNANCA = [
  "Homologado",
  "Pendente de validação",
  "Shadow IT (Não homologado)",
  "Em descontinuação"
];

const SITUACOES_USO = [
  "Ativo",
  "Em migração",
  "Subutilizado",
  "Obsoleto",
  "Desativado"
];

// Decisão recomendada na matriz TIME (Gartner / COBIT APO05)
const DECISAO_TIME = {
  "Ativo": { acao: "Manter e Investir", cor: "tag-ok", desc: "Sistema oficial alinhado à instituição" },
  "Em migração": { acao: "Migrar Dados", cor: "tag-warn", desc: "Em transição para sistema oficial" },
  "Subutilizado": { acao: "Unificar (Consolidar)", cor: "tag-warn", desc: "Baixo uso ou função duplicada" },
  "Obsoleto": { acao: "Desligar (Aposentar)", cor: "tag-err", desc: "Gera retrabalho e inconsistência" },
  "Desativado": { acao: "Desativado", cor: "tag-neutral", desc: "Apenas registro histórico" }
};

function offsetDate(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getSeedData() {
  return [
    // CASO 1 DO ENUNCIADO: CADASTRAR ESTUDANTES (SGA Oficial vs. Planilha Paralela da Secretaria)
    {
      id: 1,
      nome: "SGA Acadêmico",
      tipo: "Sistema",
      categoria: "Cadastro de estudantes",
      versao: "4.2 (Nuvem)",
      setor: "Coordenações",
      responsavel: "Paulo Neri",
      situacao: "Ativo",
      governanca: "Homologado",
      papelDados: "Fonte Oficial (Base Principal)",
      finalidade: "Sistema oficial de gestão acadêmica: matrículas, cadastro de estudantes, turmas, notas e frequência.",
      cLic: 36000,
      cSup: 9000,
      cInf: 7200,
      horasRetrabalhoSem: 0,
      cOut: 0,
      dadosCategorias: ["cadastro_estudantes", "academico", "sensiveis"],
      dadosTexto: "Cadastro completo do aluno, CPF, notas, frequência e laudos de inclusão",
      controles: ["login_individual", "backup_central", "logs_auditoria", "contrato_dpa"],
      licC: 120,
      licU: 96,
      usuariosEst: 96,
      perfilUsuarios: "Coordenadores, Professores e Secretaria",
      integra: ["ERP Financeiro e Administrativo", "Controle de Eventos"],
      troca: "Sincronização automática de matrículas ativas e situação financeira",
      fornecedor: "EduSoft Sistemas",
      contrato: "CT-2024/018",
      cValor: 52200,
      inicio: offsetDate(-300),
      venc: offsetDate(65)
    },
    {
      id: 2,
      nome: "Planilha de Matrículas",
      tipo: "Planilha",
      categoria: "Cadastro de estudantes",
      versao: "Excel na Rede / Drive",
      setor: "Secretaria",
      responsavel: "Marta Lima",
      situacao: "Subutilizado",
      governanca: "Shadow IT (Não homologado)",
      papelDados: "Cópia Paralela (Gera Inconsistência)",
      finalidade: "Controle manual paralelo de alunos matriculados, telefones e documentos pendentes na secretaria.",
      cLic: 0,
      cSup: 0,
      cInf: 0,
      horasRetrabalhoSem: 4, // 4h/semana = 192h/ano de redigitação!
      cOut: 4 * SEMANAS_ANO * CUSTO_HORA_PADRAO, // R$ 6.144/ano
      dadosCategorias: ["cadastro_estudantes", "sensiveis"],
      dadosTexto: "Nome, CPF, RG, telefone (frequentemente diverge do SGA) e laudos médicos",
      controles: [],
      licC: 0,
      licU: 0,
      usuariosEst: 5,
      perfilUsuarios: "Atendentes da Secretaria",
      integra: [],
      troca: "Redigitação manual a partir de fichas de matrícula",
      fornecedor: "Uso Interno",
      contrato: "",
      cValor: 0,
      inicio: "",
      venc: ""
    },

    // CASO 2 DO ENUNCIADO: CONTROLAR EVENTOS (Sistema de Eventos vs. Planilha de Extensão)
    {
      id: 3,
      nome: "Controle de Eventos",
      tipo: "Sistema",
      categoria: "Eventos",
      versao: "1.8",
      setor: "Eventos",
      responsavel: "Ana Souza",
      situacao: "Ativo",
      governanca: "Homologado",
      papelDados: "Fonte Oficial (Base Principal)",
      finalidade: "Inscrições em palestras e semanas acadêmicas, lista de presença e emissão de certificados.",
      cLic: 8400,
      cSup: 2400,
      cInf: 0,
      horasRetrabalhoSem: 0,
      cOut: 0,
      dadosCategorias: ["cadastro_estudantes", "eventos"],
      dadosTexto: "Nome, CPF, e-mail e carga horária de certificados",
      controles: ["login_individual", "backup_central", "contrato_dpa"],
      licC: 30,
      licU: 12,
      usuariosEst: 15,
      perfilUsuarios: "Equipe de Eventos e Monitores",
      integra: ["SGA Acadêmico"],
      troca: "Importa alunos matriculados e envia horas complementares",
      fornecedor: "EventosPro",
      contrato: "CT-2025/007",
      cValor: 10800,
      inicio: offsetDate(-120),
      venc: offsetDate(245)
    },
    {
      id: 4,
      nome: "Planilha de Extensão",
      tipo: "Planilha",
      categoria: "Eventos",
      versao: "Google Sheets",
      setor: "Extensão",
      responsavel: "Rui Alves",
      situacao: "Obsoleto",
      governanca: "Shadow IT (Não homologado)",
      papelDados: "Cópia Paralela (Gera Inconsistência)",
      finalidade: "Planilha própria para inscrever alunos em eventos e projetos de extensão universitária.",
      cLic: 0,
      cSup: 0,
      cInf: 0,
      horasRetrabalhoSem: 2.5, // 2.5h/semana = 120h/ano
      cOut: 2.5 * SEMANAS_ANO * CUSTO_HORA_PADRAO, // R$ 3.840/ano
      dadosCategorias: ["cadastro_estudantes", "eventos"],
      dadosTexto: "Nome, CPF, telefone e matrícula digitados manualmente pelos bolsistas",
      controles: ["login_individual"],
      licC: 0,
      licU: 0,
      usuariosEst: 4,
      perfilUsuarios: "Bolsistas e Coordenação de Extensão",
      integra: [],
      troca: "Sem integração (dados copiados manualmente)",
      fornecedor: "Uso Interno",
      contrato: "",
      cValor: 0,
      inicio: "",
      venc: ""
    },

    // CASO 3 DO ENUNCIADO: ACOMPANHAR ATIVIDADES ADMINISTRATIVAS (ERP Oficial vs. Aplicação/Planilha Administrativa)
    {
      id: 5,
      nome: "ERP Financeiro e Administrativo",
      tipo: "Sistema",
      categoria: "Atividades administrativas",
      versao: "12.0",
      setor: "Financeiro",
      responsavel: "Carla Dias",
      situacao: "Ativo",
      governanca: "Homologado",
      papelDados: "Fonte Oficial (Base Principal)",
      finalidade: "Faturamento de mensalidades, bolsas, compras, solicitações administrativas e conciliação bancária.",
      cLic: 54000,
      cSup: 12000,
      cInf: 9600,
      horasRetrabalhoSem: 0,
      cOut: 0,
      dadosCategorias: ["cadastro_estudantes", "financeiro", "administrativo"],
      dadosTexto: "CPF de pagantes, boletos, contratos, requisições de compras e processos internos",
      controles: ["login_individual", "backup_central", "logs_auditoria", "contrato_dpa"],
      licC: 20,
      licU: 14,
      usuariosEst: 14,
      perfilUsuarios: "Analistas Financeiros e Administração",
      integra: ["SGA Acadêmico"],
      troca: "Situação de adimplência e vínculo de estudantes",
      fornecedor: "FinTech ERP",
      contrato: "CT-2023/041",
      cValor: 75600,
      inicio: offsetDate(-700),
      venc: offsetDate(-5)
    },
    {
      id: 6,
      nome: "Controle de Protocolos e Tarefas",
      tipo: "Planilha",
      categoria: "Atividades administrativas",
      versao: "Access / Planilha Local",
      setor: "Administração Geral",
      responsavel: "Marta Lima",
      situacao: "Subutilizado",
      governanca: "Shadow IT (Não homologado)",
      papelDados: "Cópia Paralela (Gera Inconsistência)",
      finalidade: "Acompanhamento paralelo de atividades administrativas, pedidos de material, manutenção e requerimentos.",
      cLic: 0,
      cSup: 0,
      cInf: 0,
      horasRetrabalhoSem: 3, // 3h/semana = 144h/ano
      cOut: 3 * SEMANAS_ANO * CUSTO_HORA_PADRAO, // R$ 4.608/ano
      dadosCategorias: ["cadastro_estudantes", "administrativo", "financeiro"],
      dadosTexto: "Requerimentos de alunos, solicitações de reembolso e andamento de tarefas dos setores",
      controles: [],
      licC: 0,
      licU: 0,
      usuariosEst: 7,
      perfilUsuarios: "Auxiliares Administrativos e Secretaria",
      integra: [],
      troca: "Redigitação manual de solicitações que depois vão para o ERP",
      fornecedor: "Uso Interno",
      contrato: "",
      cValor: 0,
      inicio: "",
      venc: ""
    },

    // SISTEMA COMPLEMENTAR: BIBLIOTECA
    {
      id: 7,
      nome: "Gestor de Acervo",
      tipo: "Software",
      categoria: "Biblioteca",
      versao: "3.1",
      setor: "Biblioteca",
      responsavel: "Lia Matos",
      situacao: "Em migração",
      governanca: "Pendente de validação",
      papelDados: "Consulta Integrada",
      finalidade: "Catalogação de livros, controle de empréstimos, reservas e multas da biblioteca.",
      cLic: 4800,
      cSup: 1200,
      cInf: 0,
      horasRetrabalhoSem: 1, // 1h/semana = 48h/ano conferindo cadastros
      cOut: 1 * SEMANAS_ANO * CUSTO_HORA_PADRAO, // R$ 1.536/ano
      dadosCategorias: ["cadastro_estudantes", "acervo"],
      dadosTexto: "Nome, matrícula e histórico de empréstimos de livros",
      controles: ["login_individual", "backup_central"],
      licC: 10,
      licU: 6,
      usuariosEst: 6,
      perfilUsuarios: "Bibliotecários e Auxiliares",
      integra: ["SGA Acadêmico"],
      troca: "Consulta de vínculo ativo de estudantes leitores",
      fornecedor: "BiblioSoft",
      contrato: "CT-2022/029",
      cValor: 6000,
      inicio: offsetDate(-900),
      venc: offsetDate(30)
    }
  ];
}

function getSeedPlans() {
  return [
    {
      id: 101,
      sistemaOrigemId: 2,
      sistemaOrigemNome: "Planilha de Matrículas",
      sistemaDestinoId: 1,
      sistemaDestinoNome: "SGA Acadêmico",
      status: "Em Planejamento",
      prazo: offsetDate(45),
      responsavelAcao: "Paulo Neri e Marta Lima",
      justificativa: "Eliminar 192 horas/ano de redigitação na Secretaria, acabar com divergência de telefones/endereços e proteger laudos médicos (LGPD).",
      economiaAnual: 6144,
      horasPoupadasAno: 192
    }
  ];
}
