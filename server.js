const http = require("http");
const fs = require("fs");
const path = require("path");
const { hashPassword, verifyPassword, signToken, verifyToken } = require("./server/auth");
const {
  db,
  insertSystemRecord,
  seedCatalogAndPlans,
  mapSystemRow,
  addAudit,
  getPermissionsForRole,
  getAllPermissions
} = require("./server/db");

const PORT = Number(process.env.PORT) || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

const COST_CONTRACT_FIELDS = [
  "cLic",
  "cSup",
  "cInf",
  "horasRetrabalhoSem",
  "cOut",
  "fornecedor",
  "contrato",
  "cValor",
  "inicio",
  "venc"
];

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("Payload muito grande"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("JSON inválido"));
      }
    });
    req.on("error", reject);
  });
}

function authenticate(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  const payload = verifyToken(auth.slice(7).trim());
  if (!payload || !payload.uid) return null;

  const user = db
    .prepare("SELECT id, nome, email, setor, perfil, status, criado_em FROM users WHERE id = ?")
    .get(payload.uid);
  if (!user || user.status !== "ativo") return null;

  const perms = getPermissionsForRole(user.perfil);
  if (!perms) return null;

  return { user, perms };
}

function sanitizeSystemPayload(body) {
  return {
    nome: String(body.nome || "").trim(),
    tipo: String(body.tipo || "Sistema"),
    categoria: String(body.categoria || "").trim(),
    versao: String(body.versao || ""),
    setor: String(body.setor || "").trim(),
    responsavel: String(body.responsavel || "").trim(),
    situacao: String(body.situacao || "Ativo"),
    governanca: String(body.governanca || "Pendente de validação"),
    papelDados: String(body.papelDados || "Fonte Oficial (Base Principal)"),
    finalidade: String(body.finalidade || ""),
    cLic: +body.cLic || 0,
    cSup: +body.cSup || 0,
    cInf: +body.cInf || 0,
    horasRetrabalhoSem: +body.horasRetrabalhoSem || 0,
    cOut: +body.cOut || 0,
    dadosCategorias: Array.isArray(body.dadosCategorias) ? body.dadosCategorias : [],
    dadosTexto: String(body.dadosTexto || ""),
    controles: Array.isArray(body.controles) ? body.controles : [],
    licC: Math.max(0, parseInt(body.licC, 10) || 0),
    licU: Math.max(0, parseInt(body.licU, 10) || 0),
    usuariosEst: Math.max(0, parseInt(body.usuariosEst, 10) || 0),
    perfilUsuarios: String(body.perfilUsuarios || ""),
    integra: Array.isArray(body.integra) ? body.integra : [],
    troca: String(body.troca || ""),
    fornecedor: String(body.fornecedor || ""),
    contrato: String(body.contrato || ""),
    cValor: +body.cValor || 0,
    inicio: String(body.inicio || ""),
    venc: String(body.venc || "")
  };
}

function isOwner(user, sys) {
  return user.nome.trim().toLowerCase() === String(sys.responsavel || "").trim().toLowerCase();
}

function canEditSystem(session, sys) {
  const { user, perms } = session;
  if (perms.pode_editar_tecnico || perms.pode_editar_custos) return true;
  if (user.perfil === "Responsável pelo sistema" && isOwner(user, sys)) return true;
  return false;
}

function updateSystemRow(id, s) {
  db.prepare(`
    UPDATE systems SET
      nome = ?, tipo = ?, categoria = ?, versao = ?, setor = ?, responsavel = ?,
      situacao = ?, governanca = ?, papelDados = ?, finalidade = ?,
      cLic = ?, cSup = ?, cInf = ?, horasRetrabalhoSem = ?, cOut = ?,
      dadosCategorias = ?, dadosTexto = ?, controles = ?,
      licC = ?, licU = ?, usuariosEst = ?, perfilUsuarios = ?,
      integra = ?, troca = ?, fornecedor = ?, contrato = ?, cValor = ?, inicio = ?, venc = ?
    WHERE id = ?
  `).run(
    s.nome, s.tipo, s.categoria, s.versao, s.setor, s.responsavel,
    s.situacao, s.governanca, s.papelDados, s.finalidade,
    s.cLic, s.cSup, s.cInf, s.horasRetrabalhoSem, s.cOut,
    JSON.stringify(s.dadosCategorias), s.dadosTexto, JSON.stringify(s.controles),
    s.licC, s.licU, s.usuariosEst, s.perfilUsuarios,
    JSON.stringify(s.integra), s.troca, s.fornecedor, s.contrato, s.cValor, s.inicio, s.venc,
    id
  );
}

async function handleApi(req, res, pathname) {
  const method = req.method;

  // 1. AUTENTICAÇÃO E CADASTRO
  if (method === "POST" && pathname === "/api/auth/login") {
    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const senha = String(body.senha || "");
    if (!email || !senha) {
      return sendJson(res, 400, { error: "Informe e-mail e senha." });
    }
    const row = db.prepare("SELECT * FROM users WHERE lower(email) = ?").get(email);
    if (!row || !verifyPassword(senha, row.senha_hash)) {
      return sendJson(res, 401, { error: "E-mail ou senha inválidos." });
    }
    if (row.status === "pendente") {
      return sendJson(res, 403, { error: "Seu cadastro aguarda aprovação do Gestor de TI." });
    }
    if (row.status === "bloqueado") {
      return sendJson(res, 403, { error: "Sua conta foi suspensa pela administração. Procure a TI." });
    }
    const perms = getPermissionsForRole(row.perfil);
    const token = signToken({ uid: row.id });
    const user = {
      id: row.id,
      nome: row.nome,
      email: row.email,
      setor: row.setor,
      perfil: row.perfil,
      status: row.status
    };
    return sendJson(res, 200, { token, user, perms });
  }

  if (method === "POST" && pathname === "/api/auth/register") {
    const body = await readJsonBody(req);
    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const setor = String(body.setor || "").trim() || "Geral";
    const senha = String(body.senha || "");

    if (nome.length < 3) return sendJson(res, 400, { error: "Informe seu nome completo." });
    if (!email.includes("@") || email.length < 5) return sendJson(res, 400, { error: "Informe um e-mail institucional válido." });
    if (senha.length < 6) return sendJson(res, 400, { error: "A senha deve ter pelo menos 6 caracteres." });

    const exists = db.prepare("SELECT id FROM users WHERE lower(email) = ?").get(email);
    if (exists) {
      return sendJson(res, 409, { error: "Já existe uma conta cadastrada com este e-mail." });
    }

    const now = new Date().toISOString();
    const info = db
      .prepare(
        "INSERT INTO users (nome, email, setor, senha_hash, perfil, status, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(nome, email, setor, hashPassword(senha), "Responsável pelo sistema", "pendente", now);

    addAudit(`${nome} (Auto-cadastro)`, "Solicitou acesso", nome, `Setor: ${setor} · E-mail: ${email}`);
    return sendJson(res, 201, {
      id: Number(info.lastInsertRowid),
      message: "Solicitação enviada! Aguarde a aprovação do Gestor de TI para acessar."
    });
  }

  if (method === "POST" && pathname === "/api/auth/forgot-password") {
    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!email.includes("@")) {
      return sendJson(res, 400, { error: "Informe um e-mail institucional válido." });
    }
    const row = db.prepare("SELECT id, nome FROM users WHERE lower(email) = ?").get(email);
    if (row) {
      db.prepare("UPDATE users SET reset_solicitado = 1 WHERE id = ?").run(row.id);
      addAudit(`${row.nome} (Login)`, "Solicitou redefinição de senha", row.nome, email);
    }
    return sendJson(res, 200, {
      message: "Se este e-mail estiver cadastrado, o pedido foi enviado ao Gestor de TI para definir uma nova senha."
    });
  }

  // Todas as rotas abaixo exigem sessão válida
  const session = authenticate(req);
  if (!session) {
    return sendJson(res, 401, { error: "Sessão expirada ou não autenticada." });
  }
  const { user, perms } = session;
  const userLabel = `${user.nome} (${user.perfil})`;

  if (method === "GET" && pathname === "/api/auth/me") {
    return sendJson(res, 200, { user, perms });
  }

  // 2. BOOTSTRAP DO CATÁLOGO
  if (method === "GET" && pathname === "/api/bootstrap") {
    const systems = db.prepare("SELECT * FROM systems ORDER BY id ASC").all().map(mapSystemRow);
    const plans = db.prepare("SELECT * FROM consolidation_plans ORDER BY id DESC").all();
    const audit = perms.pode_ver_auditoria
      ? db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200").all()
      : [];
    const pendingUsersCount = perms.pode_gerenciar_usuarios
      ? db.prepare("SELECT COUNT(*) AS c FROM users WHERE status = 'pendente'").get().c
      : 0;
    return sendJson(res, 200, { user, perms, systems, plans, audit, pendingUsersCount });
  }

  // 3. SISTEMAS (CRUD + GOVERNANÇA)
  if (method === "POST" && pathname === "/api/systems") {
    if (!perms.pode_cadastrar) {
      return sendJson(res, 403, { error: "Seu perfil não tem permissão para cadastrar ferramentas." });
    }
    const body = await readJsonBody(req);
    const clean = sanitizeSystemPayload(body);
    if (!clean.nome || !clean.categoria || !clean.setor) {
      return sendJson(res, 400, { error: "Nome, categoria e setor são obrigatórios." });
    }
    if (!perms.pode_editar_tecnico) {
      clean.responsavel = user.nome;
      clean.governanca = "Pendente de validação";
    }
    const newId = Date.now();
    insertSystemRecord({ id: newId, ...clean });
    addAudit(userLabel, "Cadastrou ferramenta", clean.nome, `Setor: ${clean.setor} (${clean.papelDados})`);
    const created = mapSystemRow(db.prepare("SELECT * FROM systems WHERE id = ?").get(newId));
    return sendJson(res, 201, { system: created });
  }

  const sysMatch = pathname.match(/^\/api\/systems\/(\d+)$/);
  if (sysMatch) {
    const id = Number(sysMatch[1]);
    const existingRow = db.prepare("SELECT * FROM systems WHERE id = ?").get(id);
    if (!existingRow) return sendJson(res, 404, { error: "Ferramenta não encontrada." });
    const existing = mapSystemRow(existingRow);

    if (method === "PUT") {
      if (!canEditSystem(session, existing)) {
        return sendJson(res, 403, { error: "Sem permissão para editar esta ferramenta." });
      }
      const body = await readJsonBody(req);
      let updated;
      if (!perms.pode_editar_tecnico && perms.pode_editar_custos) {
        // Perfil financeiro: atualiza apenas custos e contrato
        updated = { ...existing };
        COST_CONTRACT_FIELDS.forEach((f) => {
          if (f in body) updated[f] = f.startsWith("c") || f === "horasRetrabalhoSem" ? +body[f] || 0 : String(body[f] || "");
        });
      } else {
        const clean = sanitizeSystemPayload(body);
        updated = { ...existing, ...clean };
        if (!perms.pode_editar_tecnico) {
          // Responsável: mantém responsável e status de governança intactos
          updated.responsavel = existing.responsavel;
          updated.governanca = existing.governanca;
        }
      }
      if (!updated.nome || !updated.categoria || !updated.setor) {
        return sendJson(res, 400, { error: "Nome, categoria e setor são obrigatórios." });
      }
      updateSystemRow(id, updated);
      const tco = (+updated.cLic || 0) + (+updated.cSup || 0) + (+updated.cInf || 0) + (+updated.cOut || 0);
      addAudit(
        userLabel,
        "Atualizou cadastro",
        updated.nome,
        `TCO: R$ ${tco.toFixed(2)}`
      );
      return sendJson(res, 200, { system: mapSystemRow(db.prepare("SELECT * FROM systems WHERE id = ?").get(id)) });
    }

    if (method === "DELETE") {
      if (!perms.pode_excluir) {
        return sendJson(res, 403, { error: "Seu perfil não tem permissão para excluir ferramentas." });
      }
      db.prepare("DELETE FROM systems WHERE id = ?").run(id);
      addAudit(userLabel, "Excluiu ferramenta", existing.nome);
      return sendJson(res, 200, { ok: true });
    }
  }

  const govMatch = pathname.match(/^\/api\/systems\/(\d+)\/governance$/);
  if (method === "PATCH" && govMatch) {
    if (!perms.pode_homologar) {
      return sendJson(res, 403, { error: "Seu perfil não tem permissão para avaliar/homologar ativos." });
    }
    const id = Number(govMatch[1]);
    const existing = mapSystemRow(db.prepare("SELECT * FROM systems WHERE id = ?").get(id));
    if (!existing) return sendJson(res, 404, { error: "Ferramenta não encontrada." });
    const body = await readJsonBody(req);
    const novoSt = String(body.governanca || "");
    if (!["Homologado", "Pendente de validação", "Shadow IT (Não homologado)", "Em descontinuação"].includes(novoSt)) {
      return sendJson(res, 400, { error: "Status de governança inválido." });
    }
    const ant = existing.governanca;
    existing.governanca = novoSt;
    if (novoSt === "Em descontinuação" && existing.situacao === "Ativo") {
      existing.situacao = "Em migração";
    }
    updateSystemRow(id, existing);
    addAudit(userLabel, "Avaliação da TI", existing.nome, `${ant} → ${novoSt}`);
    return sendJson(res, 200, { system: existing });
  }

  // 4. PLANOS DE UNIFICAÇÃO
  if (method === "POST" && pathname === "/api/plans") {
    if (!perms.pode_planos) {
      return sendJson(res, 403, { error: "Seu perfil não tem permissão para criar planos de unificação." });
    }
    const body = await readJsonBody(req);
    const orig = mapSystemRow(db.prepare("SELECT * FROM systems WHERE id = ?").get(Number(body.sistemaOrigemId)));
    const dest = mapSystemRow(db.prepare("SELECT * FROM systems WHERE id = ?").get(Number(body.sistemaDestinoId)));
    if (!orig || !dest) return sendJson(res, 404, { error: "Sistema de origem ou destino não encontrado." });

    orig.situacao = "Em migração";
    orig.governanca = "Em descontinuação";
    updateSystemRow(orig.id, orig);

    const econ = (+orig.cLic || 0) + (+orig.cSup || 0) + (+orig.cInf || 0) + (+orig.cOut || 0);
    const hrs = Math.round((+orig.horasRetrabalhoSem || 0) * 48);
    const plan = {
      id: Date.now(),
      sistemaOrigemId: orig.id,
      sistemaOrigemNome: orig.nome,
      sistemaDestinoId: dest.id,
      sistemaDestinoNome: dest.nome,
      status: "Em Migração",
      prazo: String(body.prazo || ""),
      responsavelAcao: String(body.responsavelAcao || ""),
      justificativa: String(body.justificativa || ""),
      economiaAnual: econ,
      horasPoupadasAno: hrs
    };
    db.prepare(`
      INSERT INTO consolidation_plans (
        id, sistemaOrigemId, sistemaOrigemNome, sistemaDestinoId, sistemaDestinoNome,
        status, prazo, responsavelAcao, justificativa, economiaAnual, horasPoupadasAno
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      plan.id, plan.sistemaOrigemId, plan.sistemaOrigemNome, plan.sistemaDestinoId, plan.sistemaDestinoNome,
      plan.status, plan.prazo, plan.responsavelAcao, plan.justificativa, plan.economiaAnual, plan.horasPoupadasAno
    );
    addAudit(userLabel, "Criou Plano de Unificação", `${orig.nome} → ${dest.nome}`, `${hrs}h/ano poupadas`);
    return sendJson(res, 201, { plan });
  }

  const planMatch = pathname.match(/^\/api\/plans\/(\d+)\/complete$/);
  if (method === "PATCH" && planMatch) {
    if (!perms.pode_planos) {
      return sendJson(res, 403, { error: "Seu perfil não tem permissão para concluir planos." });
    }
    const pid = Number(planMatch[1]);
    const plan = db.prepare("SELECT * FROM consolidation_plans WHERE id = ?").get(pid);
    if (!plan) return sendJson(res, 404, { error: "Plano não encontrado." });

    db.prepare("UPDATE consolidation_plans SET status = 'Concluído' WHERE id = ?").run(pid);
    const orig = mapSystemRow(db.prepare("SELECT * FROM systems WHERE id = ?").get(plan.sistemaOrigemId));
    if (orig) {
      orig.situacao = "Desativado";
      orig.governanca = "Em descontinuação";
      updateSystemRow(orig.id, orig);
    }
    addAudit(userLabel, "Concluiu Unificação", `${plan.sistemaOrigemNome} → ${plan.sistemaDestinoNome}`, "Cópia paralela desativada");
    return sendJson(res, 200, { ok: true });
  }

  // 5. RESTAURAR DADOS DE EXEMPLO DO CATÁLOGO
  if (method === "POST" && pathname === "/api/demo/reset") {
    if (!perms.pode_gerenciar_usuarios) {
      return sendJson(res, 403, { error: "Apenas o administrador (Gestor de TI) pode restaurar a base de exemplo." });
    }
    seedCatalogAndPlans();
    addAudit(userLabel, "Restaurou base de exemplo", "Catálogo Completo");
    return sendJson(res, 200, { ok: true });
  }

  // 6. PAINEL ADMINISTRATIVO: USUÁRIOS E PERMISSÕES (RBAC)
  if (pathname.startsWith("/api/admin/")) {
    if (!perms.pode_gerenciar_usuarios) {
      return sendJson(res, 403, { error: "Acesso restrito ao administrador de acessos." });
    }

    if (method === "GET" && pathname === "/api/admin/users") {
      const users = db
        .prepare("SELECT id, nome, email, setor, perfil, status, reset_solicitado, criado_em FROM users ORDER BY CASE status WHEN 'pendente' THEN 0 WHEN 'ativo' THEN 1 ELSE 2 END, reset_solicitado DESC, nome ASC")
        .all();
      return sendJson(res, 200, { users });
    }

    if (method === "POST" && pathname === "/api/admin/users") {
      const body = await readJsonBody(req);
      const nome = String(body.nome || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const setor = String(body.setor || "").trim() || "Geral";
      const perfil = String(body.perfil || "Responsável pelo sistema");
      const status = String(body.status || "ativo");
      const senha = String(body.senha || "");

      if (nome.length < 3) return sendJson(res, 400, { error: "Informe o nome completo." });
      if (!email.includes("@")) return sendJson(res, 400, { error: "Informe um e-mail válido." });
      if (!getPermissionsForRole(perfil)) return sendJson(res, 400, { error: "Perfil inválido." });
      if (!["ativo", "pendente", "bloqueado"].includes(status)) return sendJson(res, 400, { error: "Status inválido." });
      if (senha.length < 6) return sendJson(res, 400, { error: "A senha deve ter pelo menos 6 caracteres." });

      const exists = db.prepare("SELECT id FROM users WHERE lower(email) = ?").get(email);
      if (exists) return sendJson(res, 409, { error: "Já existe um usuário com este e-mail." });

      const now = new Date().toISOString();
      const info = db
        .prepare("INSERT INTO users (nome, email, setor, senha_hash, perfil, status, reset_solicitado, criado_em) VALUES (?, ?, ?, ?, ?, ?, 0, ?)")
        .run(nome, email, setor, hashPassword(senha), perfil, status, now);

      addAudit(userLabel, "Criou usuário", nome, `Setor: ${setor} · Perfil: ${perfil}`);
      return sendJson(res, 201, { id: Number(info.lastInsertRowid) });
    }

    const userMatch = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
    if (userMatch) {
      const targetId = Number(userMatch[1]);
      const target = db
        .prepare("SELECT id, nome, email, setor, perfil, status, reset_solicitado FROM users WHERE id = ?")
        .get(targetId);
      if (!target) return sendJson(res, 404, { error: "Usuário não encontrado." });

      if (method === "PATCH") {
        const body = await readJsonBody(req);
        const novoNome = body.nome !== undefined ? String(body.nome).trim() : target.nome;
        const novoEmail = body.email !== undefined ? String(body.email).trim().toLowerCase() : target.email;
        const novoPerfil = body.perfil ? String(body.perfil) : target.perfil;
        const novoStatus = body.status ? String(body.status) : target.status;
        const novoSetor = body.setor !== undefined ? String(body.setor).trim() || target.setor : target.setor;
        const novaSenha = body.novaSenha ? String(body.novaSenha) : "";

        if (novoNome.length < 3) return sendJson(res, 400, { error: "Nome deve ter ao menos 3 caracteres." });
        if (!novoEmail.includes("@")) return sendJson(res, 400, { error: "E-mail inválido." });
        const dup = db.prepare("SELECT id FROM users WHERE lower(email) = ? AND id != ?").get(novoEmail, targetId);
        if (dup) return sendJson(res, 409, { error: "Outro usuário já utiliza este e-mail." });
        if (!getPermissionsForRole(novoPerfil)) return sendJson(res, 400, { error: "Perfil inválido." });
        if (!["ativo", "pendente", "bloqueado"].includes(novoStatus)) return sendJson(res, 400, { error: "Status inválido." });
        if (novaSenha && novaSenha.length < 6) return sendJson(res, 400, { error: "A nova senha deve ter pelo menos 6 caracteres." });
        if (target.id === user.id && (novoStatus !== "ativo" || novoPerfil !== user.perfil)) {
          return sendJson(res, 400, { error: "Você não pode bloquear ou rebaixar o seu próprio usuário administrador." });
        }

        if (novaSenha) {
          db.prepare("UPDATE users SET nome = ?, email = ?, setor = ?, perfil = ?, status = ?, senha_hash = ?, reset_solicitado = 0 WHERE id = ?").run(
            novoNome, novoEmail, novoSetor, novoPerfil, novoStatus, hashPassword(novaSenha), targetId
          );
        } else {
          db.prepare("UPDATE users SET nome = ?, email = ?, setor = ?, perfil = ?, status = ? WHERE id = ?").run(
            novoNome, novoEmail, novoSetor, novoPerfil, novoStatus, targetId
          );
        }

        const detParts = [`Setor: ${novoSetor}`, `Perfil: ${novoPerfil}`, `Status: ${novoStatus}`];
        if (novaSenha) detParts.push("Senha redefinida pela TI");
        addAudit(userLabel, "Atualizou usuário", novoNome, detParts.join(" · "));
        return sendJson(res, 200, {
          user: { id: targetId, nome: novoNome, email: novoEmail, setor: novoSetor, perfil: novoPerfil, status: novoStatus }
        });
      }

      if (method === "DELETE") {
        if (target.id === user.id) {
          return sendJson(res, 400, { error: "Você não pode excluir seu próprio usuário." });
        }
        db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
        addAudit(userLabel, "Removeu usuário", target.nome, target.email);
        return sendJson(res, 200, { ok: true });
      }
    }

    if (method === "GET" && pathname === "/api/admin/permissions") {
      return sendJson(res, 200, { permissions: getAllPermissions() });
    }

    const permMatch = pathname.match(/^\/api\/admin\/permissions\/(.+)$/);
    if (method === "PUT" && permMatch) {
      const targetPerfil = decodeURIComponent(permMatch[1]);
      if (!getPermissionsForRole(targetPerfil)) {
        return sendJson(res, 404, { error: "Perfil não encontrado." });
      }
      const body = await readJsonBody(req);
      const flags = [
        "pode_cadastrar",
        "pode_editar_tecnico",
        "pode_editar_custos",
        "pode_excluir",
        "pode_homologar",
        "pode_planos",
        "pode_ver_auditoria",
        "pode_gerenciar_usuarios"
      ];
      // Garante que o perfil Gestor de TI nunca perca acesso ao painel de acessos
      const v = {};
      flags.forEach((f) => {
        v[f] = body[f] ? 1 : 0;
      });
      if (targetPerfil === "Gestor de TI") {
        v.pode_gerenciar_usuarios = 1;
      }

      db.prepare(`
        UPDATE role_permissions SET
          pode_cadastrar = ?, pode_editar_tecnico = ?, pode_editar_custos = ?,
          pode_excluir = ?, pode_homologar = ?, pode_planos = ?,
          pode_ver_auditoria = ?, pode_gerenciar_usuarios = ?
        WHERE perfil = ?
      `).run(
        v.pode_cadastrar, v.pode_editar_tecnico, v.pode_editar_custos,
        v.pode_excluir, v.pode_homologar, v.pode_planos,
        v.pode_ver_auditoria, v.pode_gerenciar_usuarios,
        targetPerfil
      );
      addAudit(userLabel, "Atualizou matriz de permissões", targetPerfil);
      return sendJson(res, 200, { permissions: getAllPermissions() });
    }
  }

  return sendJson(res, 404, { error: "Rota não encontrada." });
}

function serveStatic(req, res, pathname) {
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const fullPath = path.normalize(path.join(ROOT_DIR, rel));
  if (!fullPath.startsWith(ROOT_DIR) || rel.startsWith("server") || rel.startsWith("data")) {
    res.writeHead(403);
    return res.end("Acesso negado");
  }
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Arquivo não encontrado");
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  if (pathname.startsWith("/api/")) {
    try {
      await handleApi(req, res, pathname);
    } catch (err) {
      console.error("Erro na API:", err);
      sendJson(res, 500, { error: err.message || "Erro interno no servidor." });
    }
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`VIGIA-TI Back-end & Front-end rodando na porta ${PORT}`);
});
