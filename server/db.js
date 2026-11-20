const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");
const { hashPassword } = require("./auth");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "vigiati.db");
const db = new DatabaseSync(DB_PATH);

const CUSTO_HORA_PADRAO = 32;
const SEMANAS_ANO = 48;

function offsetDate(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_PERMISSIONS = [
  {
    perfil: "Gestor de TI",
    pode_cadastrar: 1,
    pode_editar_tecnico: 1,
    pode_editar_custos: 1,
    pode_excluir: 1,
    pode_homologar: 1,
    pode_planos: 1,
    pode_ver_auditoria: 1,
    pode_gerenciar_usuarios: 1
  },
  {
    perfil: "Administração",
    pode_cadastrar: 0,
    pode_editar_tecnico: 0,
    pode_editar_custos: 0,
    pode_excluir: 0,
    pode_homologar: 0,
    pode_planos: 0,
    pode_ver_auditoria: 1,
    pode_gerenciar_usuarios: 0
  },
  {
    perfil: "Setor financeiro",
    pode_cadastrar: 0,
    pode_editar_tecnico: 0,
    pode_editar_custos: 1,
    pode_excluir: 0,
    pode_homologar: 0,
    pode_planos: 0,
    pode_ver_auditoria: 0,
    pode_gerenciar_usuarios: 0
  },
  {
    perfil: "Responsável pelo sistema",
    pode_cadastrar: 1,
    pode_editar_tecnico: 0, // Edita apenas sistemas em seu nome
    pode_editar_custos: 0,
    pode_excluir: 0,
    pode_homologar: 0,
    pode_planos: 0,
    pode_ver_auditoria: 0,
    pode_gerenciar_usuarios: 0
  }
];

function getInitialSystems() {
  return [
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
      horasRetrabalhoSem: 4,
      cOut: 4 * SEMANAS_ANO * CUSTO_HORA_PADRAO,
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
      horasRetrabalhoSem: 2.5,
      cOut: 2.5 * SEMANAS_ANO * CUSTO_HORA_PADRAO,
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
      horasRetrabalhoSem: 3,
      cOut: 3 * SEMANAS_ANO * CUSTO_HORA_PADRAO,
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
      horasRetrabalhoSem: 1,
      cOut: 1 * SEMANAS_ANO * CUSTO_HORA_PADRAO,
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

function initDb() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS role_permissions (
      perfil TEXT PRIMARY KEY,
      pode_cadastrar INTEGER NOT NULL DEFAULT 0,
      pode_editar_tecnico INTEGER NOT NULL DEFAULT 0,
      pode_editar_custos INTEGER NOT NULL DEFAULT 0,
      pode_excluir INTEGER NOT NULL DEFAULT 0,
      pode_homologar INTEGER NOT NULL DEFAULT 0,
      pode_planos INTEGER NOT NULL DEFAULT 0,
      pode_ver_auditoria INTEGER NOT NULL DEFAULT 0,
      pode_gerenciar_usuarios INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      setor TEXT NOT NULL DEFAULT 'Geral',
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      reset_solicitado INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS systems (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      categoria TEXT NOT NULL,
      versao TEXT DEFAULT '',
      setor TEXT NOT NULL,
      responsavel TEXT NOT NULL,
      situacao TEXT NOT NULL,
      governanca TEXT NOT NULL,
      papelDados TEXT NOT NULL,
      finalidade TEXT DEFAULT '',
      cLic REAL DEFAULT 0,
      cSup REAL DEFAULT 0,
      cInf REAL DEFAULT 0,
      horasRetrabalhoSem REAL DEFAULT 0,
      cOut REAL DEFAULT 0,
      dadosCategorias TEXT DEFAULT '[]',
      dadosTexto TEXT DEFAULT '',
      controles TEXT DEFAULT '[]',
      licC INTEGER DEFAULT 0,
      licU INTEGER DEFAULT 0,
      usuariosEst INTEGER DEFAULT 0,
      perfilUsuarios TEXT DEFAULT '',
      integra TEXT DEFAULT '[]',
      troca TEXT DEFAULT '',
      fornecedor TEXT DEFAULT '',
      contrato TEXT DEFAULT '',
      cValor REAL DEFAULT 0,
      inicio TEXT DEFAULT '',
      venc TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS consolidation_plans (
      id INTEGER PRIMARY KEY,
      sistemaOrigemId INTEGER NOT NULL,
      sistemaOrigemNome TEXT NOT NULL,
      sistemaDestinoId INTEGER NOT NULL,
      sistemaDestinoNome TEXT NOT NULL,
      status TEXT NOT NULL,
      prazo TEXT NOT NULL,
      responsavelAcao TEXT NOT NULL,
      justificativa TEXT NOT NULL,
      economiaAnual REAL DEFAULT 0,
      horasPoupadasAno INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      t TEXT NOT NULL,
      u TEXT NOT NULL,
      acao TEXT NOT NULL,
      nome TEXT NOT NULL,
      det TEXT DEFAULT ''
    );
  `);

  // Migração segura caso o banco já exista sem a coluna reset_solicitado
  const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!userCols.includes("reset_solicitado")) {
    db.exec("ALTER TABLE users ADD COLUMN reset_solicitado INTEGER NOT NULL DEFAULT 0");
  }

  // Seed matriz de permissões
  const permCount = db.prepare("SELECT COUNT(*) AS c FROM role_permissions").get().c;
  if (permCount === 0) {
    const insPerm = db.prepare(`
      INSERT INTO role_permissions (
        perfil, pode_cadastrar, pode_editar_tecnico, pode_editar_custos,
        pode_excluir, pode_homologar, pode_planos, pode_ver_auditoria, pode_gerenciar_usuarios
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of DEFAULT_PERMISSIONS) {
      insPerm.run(
        p.perfil,
        p.pode_cadastrar,
        p.pode_editar_tecnico,
        p.pode_editar_custos,
        p.pode_excluir,
        p.pode_homologar,
        p.pode_planos,
        p.pode_ver_auditoria,
        p.pode_gerenciar_usuarios
      );
    }
  }

  // Seed usuários iniciais
  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  if (userCount === 0) {
    const insUser = db.prepare(`
      INSERT INTO users (nome, email, setor, senha_hash, perfil, status, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const defaultHash = hashPassword("123456");
    insUser.run("Victor Lima", "victor@vigiati.edu.br", "Tecnologia da Informação", defaultHash, "Gestor de TI", "ativo", now);
    insUser.run("Diretoria Acadêmica", "diretoria@vigiati.edu.br", "Administração", defaultHash, "Administração", "ativo", now);
    insUser.run("Carla Dias", "carla@vigiati.edu.br", "Financeiro", defaultHash, "Setor financeiro", "ativo", now);
    insUser.run("Marta Lima", "marta@vigiati.edu.br", "Secretaria", defaultHash, "Responsável pelo sistema", "ativo", now);
    insUser.run("Paulo Neri", "paulo@vigiati.edu.br", "Coordenações", defaultHash, "Responsável pelo sistema", "ativo", now);
    insUser.run("Lúcia Mendes", "lucia@vigiati.edu.br", "Biblioteca", defaultHash, "Responsável pelo sistema", "pendente", now);
  }

  // Seed sistemas e planos
  const sysCount = db.prepare("SELECT COUNT(*) AS c FROM systems").get().c;
  if (sysCount === 0) {
    seedCatalogAndPlans();
  }
}

function insertSystemRecord(s) {
  db.prepare(`
    INSERT INTO systems (
      id, nome, tipo, categoria, versao, setor, responsavel, situacao, governanca,
      papelDados, finalidade, cLic, cSup, cInf, horasRetrabalhoSem, cOut,
      dadosCategorias, dadosTexto, controles, licC, licU, usuariosEst, perfilUsuarios,
      integra, troca, fornecedor, contrato, cValor, inicio, venc
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    s.id,
    s.nome,
    s.tipo,
    s.categoria,
    s.versao || "",
    s.setor,
    s.responsavel,
    s.situacao,
    s.governanca,
    s.papelDados || "Fonte Oficial (Base Principal)",
    s.finalidade || "",
    +s.cLic || 0,
    +s.cSup || 0,
    +s.cInf || 0,
    +s.horasRetrabalhoSem || 0,
    +s.cOut || 0,
    JSON.stringify(Array.isArray(s.dadosCategorias) ? s.dadosCategorias : []),
    s.dadosTexto || "",
    JSON.stringify(Array.isArray(s.controles) ? s.controles : []),
    +s.licC || 0,
    +s.licU || 0,
    +s.usuariosEst || 0,
    s.perfilUsuarios || "",
    JSON.stringify(Array.isArray(s.integra) ? s.integra : []),
    s.troca || "",
    s.fornecedor || "",
    s.contrato || "",
    +s.cValor || 0,
    s.inicio || "",
    s.venc || ""
  );
}

function seedCatalogAndPlans() {
  db.exec("DELETE FROM systems; DELETE FROM consolidation_plans;");
  for (const s of getInitialSystems()) {
    insertSystemRecord(s);
  }
  db.prepare(`
    INSERT INTO consolidation_plans (
      id, sistemaOrigemId, sistemaOrigemNome, sistemaDestinoId, sistemaDestinoNome,
      status, prazo, responsavelAcao, justificativa, economiaAnual, horasPoupadasAno
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    101,
    2,
    "Planilha de Matrículas",
    1,
    "SGA Acadêmico",
    "Em Planejamento",
    offsetDate(45),
    "Paulo Neri e Marta Lima",
    "Eliminar 192 horas/ano de redigitação na Secretaria, acabar com divergência de telefones/endereços e proteger laudos médicos (LGPD).",
    6144,
    192
  );
}

function mapSystemRow(r) {
  if (!r) return null;
  return {
    ...r,
    dadosCategorias: JSON.parse(r.dadosCategorias || "[]"),
    controles: JSON.parse(r.controles || "[]"),
    integra: JSON.parse(r.integra || "[]")
  };
}

function addAudit(userLabel, acao, nome, det = "") {
  db.prepare("INSERT INTO audit_logs (t, u, acao, nome, det) VALUES (?, ?, ?, ?, ?)").run(
    new Date().toISOString(),
    userLabel,
    acao,
    nome,
    det
  );
}

function getPermissionsForRole(perfil) {
  const row = db.prepare("SELECT * FROM role_permissions WHERE perfil = ?").get(perfil);
  if (!row) return null;
  return {
    perfil: row.perfil,
    pode_cadastrar: !!row.pode_cadastrar,
    pode_editar_tecnico: !!row.pode_editar_tecnico,
    pode_editar_custos: !!row.pode_editar_custos,
    pode_excluir: !!row.pode_excluir,
    pode_homologar: !!row.pode_homologar,
    pode_planos: !!row.pode_planos,
    pode_ver_auditoria: !!row.pode_ver_auditoria,
    pode_gerenciar_usuarios: !!row.pode_gerenciar_usuarios
  };
}

function getAllPermissions() {
  return db.prepare("SELECT * FROM role_permissions").all().map((row) => ({
    perfil: row.perfil,
    pode_cadastrar: !!row.pode_cadastrar,
    pode_editar_tecnico: !!row.pode_editar_tecnico,
    pode_editar_custos: !!row.pode_editar_custos,
    pode_excluir: !!row.pode_excluir,
    pode_homologar: !!row.pode_homologar,
    pode_planos: !!row.pode_planos,
    pode_ver_auditoria: !!row.pode_ver_auditoria,
    pode_gerenciar_usuarios: !!row.pode_gerenciar_usuarios
  }));
}

initDb();

module.exports = {
  db,
  insertSystemRecord,
  seedCatalogAndPlans,
  mapSystemRow,
  addAudit,
  getPermissionsForRole,
  getAllPermissions
};
