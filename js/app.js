// Lógica principal do Catálogo de Sistemas, Governança de TI, Retrabalho e LGPD

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let dados = [];
let hist = [];
let planos = [];
let adminUsers = [];
let adminPerms = [];
let pendingUsersCount = 0;
let userFilter = "todos";
let U = null;
let authToken = sessionStorage.getItem("vigia_ti_token") || "";
let editId = null;
let delId = null;
let sortField = "nome";
let sortAsc = true;
const simUnchecked = new Set();

function showToast(msg, tipo = "ok") {
  const container = $("#toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${tipo === "warn" ? "toast-warn" : ""}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.2s";
    setTimeout(() => el.remove(), 220);
  }, 3200);
}

async function apiFetch(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && url !== "/api/auth/login") {
      authToken = "";
      U = null;
      sessionStorage.removeItem("vigia_ti_token");
      renderAll();
    }
    throw new Error(data.error || `Erro HTTP ${res.status}`);
  }
  return data;
}

function initPreferences() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonLabel(savedTheme);

  const savedFont = localStorage.getItem("cat_gov_ti_font") || "normal";
  setFontSize(savedFont);
}

async function bootstrapApp() {
  if (!authToken) {
    U = null;
    dados = [];
    planos = [];
    hist = [];
    renderAll();
    return;
  }
  try {
    const res = await apiFetch("/api/bootstrap");
    U = { ...res.user, perms: res.perms };
    dados = res.systems || [];
    planos = res.plans || [];
    hist = res.audit || [];
    pendingUsersCount = res.pendingUsersCount || 0;

    if (canManageUsers()) {
      await loadAdminData();
    }
    renderAll();
  } catch (err) {
    showToast(err.message, "warn");
  }
}

async function loadAdminData() {
  if (!canManageUsers()) return;
  const [uRes, pRes] = await Promise.all([
    apiFetch("/api/admin/users"),
    apiFetch("/api/admin/permissions")
  ]);
  adminUsers = uRes.users || [];
  adminPerms = pRes.permissions || [];
  pendingUsersCount = adminUsers.filter((u) => u.status === "pendente").length;
}

const PH_ICONS = {
  grid: "squares-four",
  layers: "stack",
  dollar: "currency-circle-dollar",
  shield: "shield-check",
  shieldAlert: "shield-warning",
  fileText: "file-text",
  check: "check-circle",
  warn: "warning",
  err: "x-circle",
  errOct: "warning-octagon",
  clock: "clock",
  copy: "copy",
  star: "star",
  refresh: "arrows-clockwise",
  sun: "sun",
  moon: "moon",
  circle: "circle",
  chart: "chart-line-up",
  sheet: "file-xls",
  system: "desktop",
  device: "hard-drives",
  dots: "dots-three-vertical",
  edit: "pencil-simple",
  trash: "trash",
  usersGear: "user-circle-gear"
};

// Ícone Phosphor (Duotone) — a cor herda do texto (currentColor)
function ico(name, size = 14) {
  return `<i class="ph-duotone ph-${PH_ICONS[name] || "circle"} ico" style="font-size:${size}px" aria-hidden="true"></i>`;
}

// Status dot (círculo de 6px com brilho leve da mesma cor do texto)
function dot() {
  return '<i class="dot" aria-hidden="true"></i>';
}

function tipoIco(tipo) {
  const n = tipo === "Planilha" ? "sheet" : tipo === "Equipamento" ? "device" : "system";
  return `<span class="tipo-ico" title="${esc(tipo)}">${ico(n, 16)}</span>`;
}

function kpiIcon(cl) {
  return String(cl).includes("err") ? "errOct" : String(cl).includes("warn") ? "warn" : String(cl).includes("ok") ? "check" : "chart";
}
function updateThemeButtonLabel(theme) {
  const btn = $("#btnTheme");
  if (btn) {
    btn.innerHTML = theme === "dark" ? `${ico("sun", 15)} Modo Claro` : `${ico("moon", 15)} Modo Escuro`;
  }
}

function setFontSize(size) {
  document.documentElement.setAttribute("data-font", size);
  localStorage.setItem("cat_gov_ti_font", size);
  $$("[data-fsize]").forEach((b) => {
    b.classList.toggle("active", b.dataset.fsize === size);
  });
}

// Utilitários de formatação e cálculos
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (v) => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const tco = (s) => (+s.cLic || 0) + (+s.cSup || 0) + (+s.cInf || 0) + (+s.cOut || 0);
const horasAno = (s) => Math.round((+s.horasRetrabalhoSem || 0) * SEMANAS_ANO);
const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
const diasVenc = (s) => (s.venc ? Math.round((new Date(s.venc + "T00:00:00") - hoje) / 864e5) : null);
const fdata = (v) => (v ? v.split("-").reverse().join("/") : "—");
const uniq = (k) => [...new Set(dados.map((x) => x[k]).filter(Boolean))].sort();

function iconSituacao() {
  return dot();
}

function iconGov() {
  return dot();
}

function renderBadgePapel(papel) {
  if (!papel || papel.startsWith("Fonte Oficial")) {
    return `<span class="tag p-fonte-oficial" title="Base principal e confiável deste dado na instituição">${dot()} Fonte Oficial</span>`;
  }
  if (papel.startsWith("Cópia Paralela")) {
    return `<span class="tag p-copia-paralela" title="Dados redigitados separadamente que ficam desatualizados e divergem da base oficial">${dot()} Cópia Paralela</span>`;
  }
  return `<span class="tag tag-neutral">${dot()} Consulta Integrada</span>`;
}
// Controle de Acesso Baseado em Perfil (RBAC dinâmico vindo do Back-end)
const isOwner = (s) => U && U.nome.trim().toLowerCase() === String(s.responsavel).trim().toLowerCase();
const p = () => (U && U.perms) || {};
const canEdit = (s) =>
  !!U && (!!p().pode_editar_tecnico || !!p().pode_editar_custos || (U.perfil === PERFIS.RESPONSAVEL && isOwner(s)));
const canDel = () => !!U && !!p().pode_excluir;
const canNew = () => !!U && !!p().pode_cadastrar;
const canGov = () => !!U && !!p().pode_homologar;
const canPlans = () => !!U && !!p().pode_planos;
const canViewHist = () => !!U && !!p().pode_ver_auditoria;
const canManageUsers = () => !!U && !!p().pode_gerenciar_usuarios;

// ============================================================================
// MOTOR DE CONFORMIDADE E RISCO LGPD
// ============================================================================
function avaliarRiscoLGPD(s) {
  if (s.situacao === "Desativado") {
    return { nivel: "Baixo", icone: dot(), cor: "tag-neutral", pontos: 0, motivos: ["Ativo desativado"] };
  }

  const cats = Array.isArray(s.dadosCategorias) ? s.dadosCategorias : [];
  const controles = Array.isArray(s.controles) ? s.controles : [];
  const motivos = [];
  let pontos = 0;

  if (cats.includes("sensiveis")) {
    pontos += 45;
    motivos.push("Guarda dados sensíveis de estudantes (Saúde/Laudos)");
  }
  if (cats.includes("financeiro")) {
    pontos += 25;
    motivos.push("Guarda dados financeiros/bancários");
  }
  if (cats.includes("cadastro_estudantes") || cats.includes("academico") || cats.includes("eventos")) {
    pontos += 20;
    motivos.push("Guarda dados pessoais (Nome, CPF, Contato)");
  }

  if (pontos === 0) {
    return { nivel: "Baixo", icone: dot(), cor: "tag-ok", pontos: 5, motivos: ["Apenas dados operacionais"] };
  }

  if (s.tipo === "Planilha") {
    pontos += 30;
    motivos.push("Planilha solta sem bloqueio contra cópias");
  }
  if (s.papelDados && s.papelDados.startsWith("Cópia Paralela")) {
    pontos += 15;
    motivos.push("Cópia paralela que diverge do cadastro oficial");
  }
  if (s.governanca === "Shadow IT (Não homologado)") {
    pontos += 20;
    motivos.push("Criada sem aval da área de TI");
  }

  if (!controles.includes("login_individual")) {
    pontos += 15;
    motivos.push("Sem senha individual por funcionário");
  } else {
    pontos -= 8;
  }

  if (!controles.includes("logs_auditoria")) {
    pontos += 12;
    motivos.push("Sem registro de quem acessou os dados");
  } else {
    pontos -= 10;
  }

  if (controles.includes("backup_central")) pontos -= 7;
  if (controles.includes("contrato_dpa")) pontos -= 10;

  pontos = Math.max(5, Math.min(100, pontos));

  if (pontos >= 70) return { nivel: "Crítico", icone: dot(), cor: "tag-err", pontos, motivos };
  if (pontos >= 45) return { nivel: "Alto", icone: dot(), cor: "tag-warn", pontos, motivos };
  if (pontos >= 25) return { nivel: "Médio", icone: dot(), cor: "tag-neutral", pontos, motivos };
  return { nivel: "Baixo", icone: dot(), cor: "tag-ok", pontos, motivos };
}

function getLabelsDados(s) {
  const cats = Array.isArray(s.dadosCategorias) ? s.dadosCategorias : [];
  return cats.map((id) => {
    const found = LGPD_CATEGORIAS.find((c) => c.id === id);
    return found ? found.label.split(" (")[0] : id;
  });
}

// ============================================================================
// MOTOR DE DETECÇÃO DE SOBREPOSIÇÕES (OS 3 CASOS DO ENUNCIADO)
// ============================================================================
const RK_SIT = { "Ativo": 0, "Em migração": 1, "Subutilizado": 2, "Obsoleto": 3 };
const RK_GOV = { "Homologado": 0, "Pendente de validação": 1, "Shadow IT (Não homologado)": 2, "Em descontinuação": 3 };

function detectarSobreposicoes() {
  const ativos = dados.filter((s) => s.situacao !== "Desativado");
  const pares = [];

  for (let i = 0; i < ativos.length; i++) {
    for (let j = i + 1; j < ativos.length; j++) {
      const x = ativos[i];
      const y = ativos[j];
      const motivos = [];

      const mesmaCat = x.categoria.trim().toLowerCase() === y.categoria.trim().toLowerCase();
      if (mesmaCat) {
        motivos.push(`Mesma finalidade: ${x.categoria}`);
      }

      const cx = Array.isArray(x.dadosCategorias) ? x.dadosCategorias : [];
      const cy = Array.isArray(y.dadosCategorias) ? y.dadosCategorias : [];
      const comuns = cx.filter((id) => cy.includes(id));

      const integradosEntreSi =
        (Array.isArray(x.integra) && x.integra.includes(y.nome)) ||
        (Array.isArray(y.integra) && y.integra.includes(x.nome));

      // Duplicidade real: mesma categoria funcional OU uma das duas é Cópia Paralela dos mesmos dados sem integração
      const temCopiaParalela =
        (x.papelDados && x.papelDados.startsWith("Cópia Paralela")) ||
        (y.papelDados && y.papelDados.startsWith("Cópia Paralela"));

      if (mesmaCat || (comuns.length >= 2 && !integradosEntreSi && temCopiaParalela)) {
        if (comuns.length > 0) {
          const nomesComuns = comuns.map((id) => {
            const obj = LGPD_CATEGORIAS.find((c) => c.id === id);
            return obj ? obj.label.split(" (")[0] : id;
          });
          motivos.push(`Dados duplicados: ${nomesComuns.join(", ")}`);
        }

        const scoreX =
          (x.papelDados?.startsWith("Fonte Oficial") ? 0 : 20) +
          (RK_GOV[x.governanca] ?? 1) * 10 +
          (RK_SIT[x.situacao] ?? 1) * 5;
        const scoreY =
          (y.papelDados?.startsWith("Fonte Oficial") ? 0 : 20) +
          (RK_GOV[y.governanca] ?? 1) * 10 +
          (RK_SIT[y.situacao] ?? 1) * 5;

        const [manter, consolidar] = scoreX <= scoreY ? [x, y] : [y, x];
        const planoExistente = planos.find(
          (p) =>
            (p.sistemaOrigemId === consolidar.id && p.sistemaDestinoId === manter.id) ||
            (p.sistemaOrigemId === manter.id && p.sistemaDestinoId === consolidar.id)
        );

        pares.push({
          k: manter,
          z: consolidar,
          motivos,
          plano: planoExistente || null
        });
      }
    }
  }
  return pares;
}

// ============================================================================
// BLOCO PERSONALIZADO POR PERFIL DE USUÁRIO LOGADO (TÓPICO 3)
// ============================================================================
function renderRoleSpotlight() {
  const el = $("#roleSpotlight");
  if (!el || !U) return;

  const ativos = dados.filter((s) => s.situacao !== "Desativado");
  const pares = detectarSobreposicoes();
  const candidatos = new Map();
  pares.forEach((o) => candidatos.set(o.z.id, o.z));
  const ecoSobrep = [...candidatos.values()].reduce((a, s) => a + tco(s), 0);
  const horasPoupadas = [...candidatos.values()].reduce((a, s) => a + horasAno(s), 0);
  const ecoLic = ativos
    .filter((s) => s.licC > (s.licU || 0))
    .reduce((a, s) => a + ((+s.cLic || 0) * (s.licC - (s.licU || 0))) / s.licC, 0);
  const ecoTotal = ecoSobrep + ecoLic;

  if (U.perfil === PERFIS.ADMINISTRACAO) {
    el.innerHTML = `
      <div class="role-spotlight-header">
        <div>
          <span class="tag tag-ok">Administração</span>
          <h3 style="margin-top:6px">Resumo Executivo</h3>
        </div>
        <button type="button" class="p" onclick="location.hash='#sobreposicoes'">Simular Economia (${brl(ecoTotal)}/ano)</button>
      </div>
      <p style="margin:0;color:var(--tx-sec);font-size:0.92rem">
        <b>${candidatos.size} planilhas paralelas</b> geram <b>${horasPoupadas}h/ano de retrabalho</b>. A unificação com sistemas oficiais e o corte de licenças paradas economizam até <b>${brl(ecoTotal)}/ano</b>.
      </p>
    `;
  } else if (U.perfil === PERFIS.FINANCEIRO) {
    const vencidos = ativos.filter((s) => diasVenc(s) !== null && diasVenc(s) <= 90);
    el.innerHTML = `
      <div class="role-spotlight-header">
        <div>
          <span class="tag tag-warn">Setor Financeiro</span>
          <h3 style="margin-top:6px">Contratos e Licenças</h3>
        </div>
        <button type="button" class="p" onclick="location.hash='#contratos'">Ver Contratos (${vencidos.length} alertas)</button>
      </div>
      <p style="margin:0;color:var(--tx-sec);font-size:0.92rem">
        <b>${vencidos.length} contrato(s)</b> vencidos ou perto do vencimento e <b>${brl(ecoLic)}/ano</b> em licenças sem uso. Clique em <b>Editar</b> para atualizar valores e datas.
      </p>
    `;
  } else if (U.perfil === PERFIS.RESPONSAVEL) {
    const meus = dados.filter((s) => isOwner(s));
    const minhasCopias = meus.filter((s) => s.papelDados && s.papelDados.startsWith("Cópia Paralela"));
    el.innerHTML = `
      <div class="role-spotlight-header">
        <div>
          <span class="tag">Responsável · ${esc(U.nome)}</span>
          <h3 style="margin-top:6px">Suas Ferramentas (${meus.length})</h3>
        </div>
        <button type="button" class="p" onclick="$('#novo').click()">+ Cadastrar Ferramenta</button>
      </div>
      ${
        meus.length
          ? `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
              ${meus
                .map(
                  (s) => `
                <div style="background:var(--sf);border:1px solid var(--bd);border-radius:8px;padding:12px 14px;flex:1 1 250px">
                  <b>${esc(s.nome)}</b> <span style="color:var(--mu)">· ${esc(s.setor)}</span>
                  <div style="margin:6px 0">${renderBadgePapel(s.papelDados)}</div>
                  <small style="color:var(--tx-sec)">${horasAno(s) > 0 ? `${s.horasRetrabalhoSem}h/sem de redigitação` : "Sem retrabalho manual"}</small>
                  <div style="margin-top:10px;display:flex;gap:6px">
                    <button class="sm" data-d="${s.id}">Ficha</button>
                    <button class="sm p" data-e="${s.id}">Editar</button>
                  </div>
                </div>`
                )
                .join("")}
            </div>`
          : `<p style="margin:0;color:var(--tx-sec)">Nenhuma ferramenta cadastrada em nome de <b>${esc(U.nome)}</b>.</p>`
      }
      ${
        minhasCopias.length
          ? `<small style="display:block;margin-top:10px;color:var(--er);font-weight:600">Você possui ${minhasCopias.length} cópia(s) paralela(s) com retrabalho. Avalie a unificação com a TI.</small>`
          : ""
      }
    `;
  } else {
    // Gestor de TI
    const filaGov = ativos.filter((s) => s.governanca !== "Homologado").length;
    el.innerHTML = `
      <div class="role-spotlight-header">
        <div>
          <span class="tag">Gestor de TI</span>
          <h3 style="margin-top:6px">Prioridades de Governança</h3>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" onclick="location.hash='#governanca'">Avaliar Pendências (${filaGov})</button>
          <button type="button" class="p" onclick="location.hash='#sobreposicoes'">Unificações (${pares.length})</button>
        </div>
      </div>
      <p style="margin:0;color:var(--tx-sec);font-size:0.92rem">
        <b>${pares.length} duplicidades ativas</b> somam <b>${horasPoupadas}h/ano de retrabalho</b>, além de <b>${filaGov} ferramenta(s) sem homologação da TI</b>.
      </p>
    `;
  }
}

// ============================================================================
// RENDERIZAÇÃO DE BARRAS E PAINEL PRINCIPAL
// ============================================================================
function renderBarras(el, map, fmt) {
  if (!el) return;
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const mx = Math.max(...entries.map((x) => x[1]), 1);
  el.innerHTML = entries.length
    ? entries
        .map(
          ([k, v]) =>
            `<div class="bar"><div class="bar-head"><span>${esc(k)}</span><em>${fmt(v)}</em></div><div class="bar-track"><i style="width:${(v / mx) * 100}%"></i></div></div>`
        )
        .join("")
    : '<div class="empty">Sem dados registrados</div>';
}

function atualizarFiltros() {
  const m = [
    ["#fSetor", "setor", "Todos os setores"],
    ["#fCat", "categoria", "Todas as categorias"],
    ["#fGov", "governanca", "Avaliação da TI (Todos)"]
  ];
  m.forEach(([id, k, t]) => {
    const el = $(id);
    if (!el) return;
    const v = el.value;
    el.innerHTML = `<option value="">${t}</option>` + uniq(k).map((x) => `<option>${esc(x)}</option>`).join("");
    el.value = v;
  });

  const s = $("#fSit");
  if (s) {
    const v = s.value;
    s.innerHTML = '<option value="">Todas as situações</option>' + SITUACOES_USO.map((x) => `<option>${x}</option>`).join("");
    s.value = v;
  }

  $("#cats").innerHTML = uniq("categoria").map((x) => `<option value="${esc(x)}">`).join("");
  $("#setores").innerHTML = uniq("setor").map((x) => `<option value="${esc(x)}">`).join("");
  $("#forns").innerHTML = uniq("fornecedor").map((x) => `<option value="${esc(x)}">`).join("");
}

function renderPainel() {
  renderRoleSpotlight();

  const ativos = dados.filter((s) => s.situacao !== "Desativado");
  const totalTCO = ativos.reduce((a, s) => a + tco(s), 0);
  const retrabalhoReais = ativos.reduce((a, s) => a + (+s.cOut || 0), 0);
  const totalHorasRetrab = ativos.reduce((a, s) => a + horasAno(s), 0);
  const copiasParalelas = ativos.filter((s) => s.papelDados && s.papelDados.startsWith("Cópia Paralela")).length;
  const paresSobrep = detectarSobreposicoes();
  const riscoCriticoAlto = ativos.filter((s) => ["Crítico", "Alto"].includes(avaliarRiscoLGPD(s).nivel)).length;

  $("#kpis").innerHTML = [
    [ativos.length, "Ferramentas ativas", "", "layers"],
    [brl(totalTCO), "Custo anual total", "", "dollar"],
    [`${totalHorasRetrab}h / ano`, `Retrabalho (${brl(retrabalhoReais)})`, totalHorasRetrab ? "kpi-warn" : "kpi-ok", "clock"],
    [copiasParalelas, "Cópias paralelas", copiasParalelas ? "kpi-err" : "kpi-ok", "copy"],
    [paresSobrep.length, "Duplicidades detectadas", paresSobrep.length ? "kpi-warn" : "kpi-ok", "warn"],
    [riscoCriticoAlto, "Alertas LGPD Alto/Crítico", riscoCriticoAlto ? "kpi-err" : "kpi-ok", "shieldAlert"]
  ]
    .map(
      ([val, label, cl, ic]) =>
        `<div class="kpi ${cl}">
          <div class="kpi-top">
            <span class="kpi-label">${label}</span>
            <span class="kpi-ico">${ico(ic, 18)}</span>
          </div>
          <b>${val}</b>
        </div>`
    )
    .join("");

  const ps = {};
  ativos.forEach((s) => (ps[s.setor] = (ps[s.setor] || 0) + tco(s)));
  renderBarras($("#porSetor"), ps, brl);

  const pp = {};
  ativos.forEach((s) => {
    const k = s.papelDados || "Fonte Oficial (Base Principal)";
    pp[k] = (pp[k] || 0) + 1;
  });
  renderBarras($("#porPapel"), pp, (v) => `${v} ferramenta(s)`);

  const venc = ativos
    .filter((s) => {
      const n = diasVenc(s);
      return n !== null && n <= 90;
    })
    .sort((a, b) => diasVenc(a) - diasVenc(b));

  $("#venc").innerHTML = venc.length
    ? venc
        .map((s) => {
          const n = diasVenc(s);
          return `<div class="alert-row">
            <div>
              <button class="lk" data-d="${s.id}">${esc(s.nome)}</button>
              <small>Fornecedor: ${esc(s.fornecedor || "Não informado")} · Valor: ${brl(s.cValor)}</small>
            </div>
            <span class="tag ${n < 0 ? "tag-err" : "tag-warn"}">${n < 0 ? `${dot()} Vencido há ${-n} dias` : `${dot()} Vence em ${n} dias`}</span>
          </div>`;
        })
        .join("")
    : '<div class="empty">Todos os contratos estão vigentes e em dia</div>';

  const alertasLGPD = ativos
    .map((s) => ({ s, r: avaliarRiscoLGPD(s) }))
    .filter((x) => ["Crítico", "Alto"].includes(x.r.nivel))
    .sort((a, b) => b.r.pontos - a.r.pontos);

  $("#resumoLgpdPainel").innerHTML = alertasLGPD.length
    ? alertasLGPD
        .map(
          ({ s, r }) =>
            `<div class="alert-row">
              <div>
                <button class="lk" data-d="${s.id}">${esc(s.nome)}</button> <small style="display:inline">(${esc(s.setor)} · ${esc(s.tipo)})</small>
                <small>${esc(r.motivos.slice(0, 2).join(" · "))}</small>
              </div>
              <span class="tag ${r.cor}">${r.icone} Risco ${r.nivel}</span>
            </div>`
        )
        .join("")
    : '<div class="empty">Nenhum sistema com risco alto ou crítico</div>';
}

// ============================================================================
// SEÇÃO 2: TABELA DE SISTEMAS E VISÃO POR SETOR
// ============================================================================
function getSistemasFiltrados() {
  const q = ($("#q")?.value || "").trim().toLowerCase();
  const f = {
    setor: $("#fSetor")?.value || "",
    situacao: $("#fSit")?.value || "",
    categoria: $("#fCat")?.value || "",
    papelDados: $("#fPapel")?.value || "",
    governanca: $("#fGov")?.value || ""
  };
  const fRisco = $("#fRisco")?.value || "";

  const r = dados.filter((s) => {
    const matchBusca =
      !q ||
      [s.nome, s.finalidade, s.responsavel, s.fornecedor, s.categoria, s.dadosTexto, ...(getLabelsDados(s))]
        .join(" ")
        .toLowerCase()
        .includes(q);
    const matchCampos = Object.entries(f).every(([k, v]) => !v || s[k] === v);
    const matchRisco = !fRisco || avaliarRiscoLGPD(s).nivel === fRisco;
    return matchBusca && matchCampos && matchRisco;
  });

  r.sort((a, b) => {
    let va, vb;
    if (sortField === "tco") {
      va = tco(a);
      vb = tco(b);
    } else if (sortField === "risco") {
      va = avaliarRiscoLGPD(a).pontos;
      vb = avaliarRiscoLGPD(b).pontos;
    } else if (sortField === "setor") {
      va = a.setor.toLowerCase();
      vb = b.setor.toLowerCase();
    } else {
      va = a.nome.toLowerCase();
      vb = b.nome.toLowerCase();
    }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });
  return r;
}

function renderTabelaSistemas() {
  closeRowMenu();
  const r = getSistemasFiltrados();

  $("#lista").innerHTML = r.length
    ? r
        .map((s) => {
          const lgpd = avaliarRiscoLGPD(s);
          const hAno = horasAno(s);
          return `<tr>
            <td>
              <button class="lk" data-d="${s.id}">${tipoIco(s.tipo)}<span>${esc(s.nome)}</span></button>
              <small>${esc(s.tipo)} · ${esc(s.categoria)}</small>
            </td>
            <td>
              <b>${esc(s.setor)}</b>
              <small>${esc(s.responsavel)}</small>
            </td>
            <td>
              ${renderBadgePapel(s.papelDados)}
              <small style="margin-top:5px">
                <span class="tag s-${slug(s.situacao)}">${iconSituacao(s.situacao)} ${esc(s.situacao)}</span>
              </small>
            </td>
            <td>
              <span class="tag ${lgpd.cor}">${lgpd.icone} ${lgpd.nivel}</span>
            </td>
            <td class="num">
              <b style="font-size:0.98rem">${brl(tco(s))}</b>
              ${
                hAno > 0
                  ? `<small class="venc-w">${s.horasRetrabalhoSem}h/sem de retrabalho</small>`
                  : `<small>por ano</small>`
              }
            </td>
            <td class="num">
              <div class="action-group">
                <button class="sm ghost" data-d="${s.id}">Ficha</button>
                ${canEdit(s) || canDel() ? `<button class="ghost icon-btn" data-menu="${s.id}" aria-label="Mais ações" aria-haspopup="menu">${ico("dots", 18)}</button>` : ""}
              </div>
            </td>
          </tr>`;
        })
        .join("")
    : '<tr><td colspan="6" class="empty">Nenhuma ferramenta encontrada para os filtros selecionados.</td></tr>';
}

function exportarCSV() {
  const lista = getSistemasFiltrados();
  if (!lista.length) {
    showToast("Nenhum sistema na tabela para exportar.", "warn");
    return;
  }
  const cols = [
    "Nome", "Tipo", "Categoria", "Setor", "Responsavel", "Papel dos Dados",
    "Situacao", "Avaliacao TI", "Risco LGPD", "Horas Retrabalho/Ano",
    "TCO Anual (R$)", "Fornecedor", "Contrato", "Vencimento"
  ];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = lista.map((s) => {
    const r = avaliarRiscoLGPD(s);
    return [
      s.nome, s.tipo, s.categoria, s.setor, s.responsavel, s.papelDados || "",
      s.situacao, s.governanca, `${r.nivel} (${r.pontos})`, horasAno(s),
      tco(s).toFixed(2).replace(".", ","), s.fornecedor || "", s.contrato || "", fdata(s.venc)
    ].map(cell).join(";");
  });
  const csv = "\uFEFF" + [cols.map(cell).join(";"), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vigia-ti-catalogo-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(`Planilha exportada com ${lista.length} ferramenta(s)`);
}

// ============================================================================
// SEÇÃO 3: DUPLICIDADES, HORAS DE RETRABALHO E ECONOMIA
// ============================================================================
function renderSobreposicoes() {
  const ativos = dados.filter((s) => s.situacao !== "Desativado");
  const custoAtualTotal = ativos.reduce((a, s) => a + tco(s), 0);

  const pares = detectarSobreposicoes();
  const candidatosMap = new Map();
  pares.forEach((o) => candidatosMap.set(o.z.id, o.z));

  const ociosas = ativos
    .filter((s) => s.licC > (s.licU || 0))
    .map((s) => {
      const qtd = s.licC - (s.licU || 0);
      const valor = (+s.cLic || 0) * (qtd / s.licC);
      return { s, qtd, valor };
    });

  // Itens simuláveis no modo "E se?"
  const itensSim = [
    ...[...candidatosMap.values()].map((s) => ({
      key: `sys-${s.id}`,
      titulo: `Desativar cópia paralela: ${s.nome} (${s.setor})`,
      detalhe: `Economiza ${brl(tco(s))}/ano e devolve ${horasAno(s)}h/ano de trabalho à equipe`,
      valor: tco(s),
      horas: horasAno(s)
    })),
    ...ociosas.map(({ s, qtd, valor }) => ({
      key: `lic-${s.id}`,
      titulo: `Cortar ${qtd} licença(s) ociosa(s) em ${s.nome}`,
      detalhe: `Reduz renovação anual com ${esc(s.fornecedor || "fornecedor")} em ${brl(valor)}/ano`,
      valor,
      horas: 0
    }))
  ];

  const selecionados = itensSim.filter((it) => !simUnchecked.has(it.key));
  const economiaTotal = selecionados.reduce((a, it) => a + it.valor, 0);
  const horasPoupadas = selecionados.reduce((a, it) => a + it.horas, 0);
  const custoOtimizado = Math.max(0, custoAtualTotal - economiaTotal);
  const pctOtimizado = custoAtualTotal > 0 ? Math.round((custoOtimizado / custoAtualTotal) * 100) : 100;
  const pctEconomia = custoAtualTotal > 0 ? Math.round((economiaTotal / custoAtualTotal) * 100) : 0;

  $("#simuladorEco").innerHTML = `
    <div class="kpis" style="margin-bottom:0">
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">Gasto atual da instituição (Antes)</span><span class="kpi-ico">${ico("chart", 18)}</span></div><b>${brl(custoAtualTotal)} / ano</b></div>
      <div class="kpi kpi-ok"><div class="kpi-top"><span class="kpi-label">Custo projetado após ações (Depois · -${pctEconomia}%)</span><span class="kpi-ico">${ico("check", 18)}</span></div><b>${brl(custoOtimizado)} / ano</b></div>
      <div class="kpi kpi-ok"><div class="kpi-top"><span class="kpi-label">Economia anual simulada (${selecionados.length} de ${itensSim.length} ações)</span><span class="kpi-ico">${ico("check", 18)}</span></div><b>${brl(economiaTotal)} / ano</b></div>
      <div class="kpi kpi-warn"><div class="kpi-top"><span class="kpi-label">Tempo de trabalho devolvido à equipe</span><span class="kpi-ico">${ico("warn", 18)}</span></div><b>${horasPoupadas} horas / ano</b></div>
    </div>

    <div class="sim-compare">
      <div class="bar">
        <span>Gasto Atual</span>
        <div class="bar-track"><i style="width:100%;background:var(--er)"></i></div>
        <em>${brl(custoAtualTotal)}</em>
      </div>
      <div class="bar">
        <span>Com Unificações</span>
        <div class="bar-track"><i style="width:${pctOtimizado}%;background:var(--ok)"></i></div>
        <em>${brl(custoOtimizado)}</em>
      </div>
      ${
        itensSim.length
          ? `<div style="margin-top:12px">
              <b style="font-size:0.88rem;color:var(--tx)">Simulador "E se?" — Marque as ações que a Diretoria deseja aplicar:</b>
              ${itensSim
                .map(
                  (it) => `
                <label class="sim-item">
                  <input type="checkbox" data-sim-key="${esc(it.key)}" ${!simUnchecked.has(it.key) ? "checked" : ""}>
                  <div>
                    <b style="font-size:0.9rem">${esc(it.titulo)}</b>
                    <small style="margin-top:2px">${it.detalhe}</small>
                  </div>
                </label>`
                )
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;

  $("#ovl").innerHTML = pares.length
    ? pares
        .map((o) => {
          const rZ = avaliarRiscoLGPD(o.z);
          const hZ = horasAno(o.z);
          return `<div class="ov">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
              <div style="flex:1 1 480px">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                  <span class="tag p-fonte-oficial">${dot()} Manter Oficial: ${esc(o.k.nome)} (${esc(o.k.setor)})</span>
                  <span style="color:var(--mu);font-weight:700">← Absorver ←</span>
                  <span class="tag p-copia-paralela">${dot()} Desativar Cópia: ${esc(o.z.nome)} (${esc(o.z.setor)})</span>
                </div>
                <small><b>Problema identificado:</b> ${esc(o.motivos.join(" · "))}</small>
                <small><b>Impacto da unificação:</b> Elimina <b>${hZ} horas/ano de retrabalho</b> (${o.z.horasRetrabalhoSem || 0}h/sem), poupa <b>${brl(tco(o.z))}/ano</b> e remove Risco LGPD ${rZ.nivel}.</small>
              </div>
              <div>
                ${
                  o.plano
                    ? `<span class="tag tag-ok">${dot()} Plano de Unificação: ${esc(o.plano.status)}</span>`
                    : canPlans()
                    ? `<button class="p" data-novo-plano-orig="${o.z.id}" data-novo-plano-dest="${o.k.id}">Criar Plano de Unificação</button>`
                    : `<span class="tag tag-warn">${dot()} Aguardando decisão da TI</span>`
                }
              </div>
            </div>
          </div>`;
        })
        .join("")
    : '<div class="empty">Nenhuma duplicidade ativa no momento.</div>';

  $("#listaPlanos").innerHTML = planos.length
    ? planos
        .map(
          (p) => `
        <div class="plan-card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <div>
              <b>Migrar de: ${esc(p.sistemaOrigemNome)} → Para Fonte Oficial: ${esc(p.sistemaDestinoNome)}</b>
              <span class="tag ${p.status === "Concluído" ? "tag-ok" : "tag-warn"}" style="margin-left:6px">${dot()} ${esc(p.status)}</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <span style="font-size:0.86rem">Prazo: <b>${fdata(p.prazo)}</b> · Economia: <b>${brl(p.economiaAnual)}/ano</b></span>
              ${
                canPlans() && p.status !== "Concluído"
                  ? `<button class="sm p" data-avancar-plano="${p.id}">Concluir Unificação</button>`
                  : ""
              }
            </div>
          </div>
          <small style="color:var(--tx-sec);display:block;margin-top:6px"><b>Responsáveis:</b> ${esc(p.responsavelAcao)} · <b>Justificativa:</b> ${esc(p.justificativa)}</small>
        </div>`
        )
        .join("")
    : '<div class="empty">Nenhum plano de unificação registrado.</div>';
}

// ============================================================================
// SEÇÃO 4: GOVERNANÇA, FONTE OFICIAL DO DADO, LGPD E MAPA DE CONEXÕES
// ============================================================================
function renderGovernancaLGPD() {
  const ativos = dados.filter((s) => s.situacao !== "Desativado");

  // 1. Dispersão de Dados: Quem é a Fonte Oficial vs. Onde há Cópias Inconsistentes
  const mapaDisp = LGPD_CATEGORIAS.map((cat) => {
    const sistemasCat = ativos.filter((s) => Array.isArray(s.dadosCategorias) && s.dadosCategorias.includes(cat.id));
    const fontesOficiais = sistemasCat.filter((s) => s.papelDados && s.papelDados.startsWith("Fonte Oficial"));
    const copias = sistemasCat.filter((s) => s.papelDados && s.papelDados.startsWith("Cópia Paralela"));
    return { cat, sistemasCat, fontesOficiais, copias };
  }).filter((x) => x.sistemasCat.length > 0);

  $("#lgpdDispersao").innerHTML = mapaDisp.length
    ? mapaDisp
        .map(
          ({ cat, sistemasCat, fontesOficiais, copias }) =>
            `<div class="ov">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                <div>
                  <b style="font-size:0.96rem">${esc(cat.label)}</b>
                  <span class="tag tag-neutral">${esc(cat.tipo)}</span>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <span class="tag p-fonte-oficial">${dot()} Fonte Oficial: ${fontesOficiais.map((s) => esc(s.nome)).join(", ") || esc(cat.fontePadrao)}</span>
                  ${
                    copias.length
                      ? `<span class="tag p-copia-paralela">${dot()} ${copias.length} Cópia(s) Paralela(s) Inconsistente(s)</span>`
                      : `<span class="tag tag-ok">${dot()} Sem cópias paralelas</span>`
                  }
                </div>
              </div>
              <small>Todos os locais onde este dado aparece (${sistemasCat.length}): ${sistemasCat
              .map((s) => `<b>${esc(s.nome)}</b> (${esc(s.setor)} - ${s.papelDados?.startsWith("Cópia") ? "Cópia" : "Oficial/Integrado"})`)
              .join(" · ")}</small>
            </div>`
        )
        .join("")
    : '<div class="empty">Nenhum dado mapeado</div>';

  // 2. Fila de avaliação da TI
  const fila = ativos.filter((s) => s.governanca !== "Homologado");
  $("#govFila").innerHTML = fila.length
    ? fila
        .map((s) => {
          const lgpd = avaliarRiscoLGPD(s);
          return `<div class="ov" style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
            <div>
              <button class="lk" data-d="${s.id}">${esc(s.nome)}</button>
              ${renderBadgePapel(s.papelDados)}
              <span class="tag g-${slug(s.governanca)}">${iconGov(s.governanca)} ${esc(s.governanca)}</span>
              <span class="tag ${lgpd.cor}">${lgpd.icone} LGPD: ${lgpd.nivel}</span>
              <small>Setor: <b>${esc(s.setor)}</b> · Resp.: <b>${esc(s.responsavel)}</b> · Retrabalho: ${horasAno(s)}h/ano (${brl(tco(s))}/ano)</small>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${
                canGov()
                  ? `<button class="sm p" data-gov-id="${s.id}" data-gov-st="Homologado">Homologar</button>
                     <button class="sm" data-gov-id="${s.id}" data-gov-st="Em descontinuação">Solicitar Desligamento</button>`
                  : `<span class="tag tag-neutral">Apenas Gestor de TI pode homologar</span>`
              }
            </div>
          </div>`;
        })
        .join("")
    : '<div class="empty">Todas as ferramentas ativas já foram avaliadas pela TI.</div>';

  // 3. Checklist de segurança
  $("#lgpdMatriz").innerHTML = ativos
    .map((s) => ({ s, r: avaliarRiscoLGPD(s) }))
    .sort((a, b) => b.r.pontos - a.r.pontos)
    .map(({ s, r }) => {
      const cAtivos = Array.isArray(s.controles) ? s.controles : [];
      const badgesControles = CONTROLES_SEGURANCA.map((c) => {
        const ok = cAtivos.includes(c.id);
        return `<span class="tag ${ok ? "tag-ok" : "tag-neutral"}" style="margin-right:6px;margin-top:6px">${dot()} ${ok ? "" : "Falta: "}${esc(c.label)}</span>`;
      }).join("");
      return `<div class="ov">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <button class="lk" data-d="${s.id}">${esc(s.nome)}</button>
            <small style="display:inline;margin-left:8px;font-weight:600">${esc(s.tipo)} · ${esc(s.setor)}</small>
          </div>
          <span class="tag ${r.cor}">${r.icone} Risco ${r.nivel} (${r.pontos}/100)</span>
        </div>
        <small>Diagnóstico: ${esc(r.motivos.join(" · "))}</small>
        <div style="margin-top:4px">${badgesControles}</div>
      </div>`;
    })
    .join("");
}

function renderIntegracoes() {
  const ativos = dados.filter((s) => s.situacao !== "Desativado");
  const comInteg = ativos.filter((s) => Array.isArray(s.integra) && s.integra.length > 0);

  $("#integ").innerHTML = comInteg.length
    ? comInteg
        .map(
          (s) =>
            `<div class="ov"><b><button class="lk" data-d="${s.id}">${esc(s.nome)}</button></b> sincroniza dados com: <b>${esc(s.integra.join(", "))}</b><small>Fluxo: ${esc(s.troca || "Sincronização automática")}</small></div>`
        )
        .join("")
    : '<div class="empty">Nenhuma integração automática registrada</div>';

  const nomesIntegrados = new Set();
  comInteg.forEach((s) => {
    nomesIntegrados.add(s.nome);
    s.integra.forEach((alvo) => nomesIntegrados.add(alvo));
  });

  const nosIntegrados = [...nomesIntegrados];
  const silos = ativos.filter((s) => !nomesIntegrados.has(s.nome));
  const findByName = (name) => dados.find((s) => s.nome === name);

  const svgH = Math.max(320, 75 + silos.length * 56, 75 + Math.ceil(nosIntegrados.length / 2) * 55);
  const cy = svgH / 2 + 10;

  const pos = {};
  nosIntegrados.forEach((n, i) => {
    const ang = (2 * Math.PI * i) / Math.max(nosIntegrados.length, 1) - Math.PI / 2;
    pos[n] = [210 + 140 * Math.cos(ang), cy + Math.min(100, svgH * 0.3) * Math.sin(ang)];
  });

  const arestas = [];
  comInteg.forEach((s) => {
    s.integra.forEach((t) => {
      if (pos[s.nome] && pos[t]) arestas.push([s.nome, t]);
    });
  });

  $("#mapa").innerHTML = `
    <svg viewBox="0 0 700 ${svgH}" width="100%" role="img" aria-label="Mapa visual de sistemas conectados e isolados">
      <defs>
        <marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0L8,4L0,8z" style="fill:var(--ac)"/>
        </marker>
      </defs>
      <text x="210" y="22" text-anchor="middle" style="font-weight:700;font-size:12px;fill:var(--ac)">Ecossistema Integrado (Clique para abrir a ficha)</text>
      <line x1="430" y1="12" x2="430" y2="${svgH - 12}" style="stroke:var(--bd-strong);stroke-width:1.5;stroke-dasharray:5 5"/>
      <text x="565" y="22" text-anchor="middle" style="font-weight:700;font-size:12px;fill:var(--er)">Silos Isolados (Cópias Paralelas com Redigitação)</text>
      ${arestas
        .map(
          ([a, b]) =>
            `<line x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[a][0] + (pos[b][0] - pos[a][0]) * 0.75}" y2="${pos[a][1] + (pos[b][1] - pos[a][1]) * 0.75}" style="stroke:var(--ac);stroke-width:2" marker-end="url(#ar)"/>`
        )
        .join("")}
      ${nosIntegrados
        .map((n) => {
          const item = findByName(n);
          const attr = item ? `class="svg-node" data-d="${item.id}"` : "";
          return `<g ${attr}>
            <rect x="${pos[n][0] - 72}" y="${pos[n][1] - 16}" width="144" height="32" rx="8" style="fill:var(--ac2);stroke:var(--ac);stroke-width:1.5"/>
            <text x="${pos[n][0]}" y="${pos[n][1] + 4}" text-anchor="middle" style="font-weight:600">${esc(n.slice(0, 21))}</text>
          </g>`;
        })
        .join("")}
      ${
        silos.length
          ? silos
              .map((s, idx) => {
                const y = 50 + idx * 54;
                return `<g class="svg-node" data-d="${s.id}">
                  <rect x="455" y="${y}" width="220" height="42" rx="8" style="fill:var(--er-bg);stroke:var(--er);stroke-width:1.5"/>
                  <text x="565" y="${y + 17}" text-anchor="middle" style="font-weight:700">${esc(s.nome.slice(0, 26))}</text>
                  <text x="565" y="${y + 32}" text-anchor="middle" style="font-size:10px;fill:var(--tx-sec)">${esc(s.setor)} · ${horasAno(s)}h/ano de retrabalho</text>
                </g>`;
              })
              .join("")
          : `<text x="565" y="${svgH / 2}" text-anchor="middle" style="fill:var(--ok);font-weight:700">Nenhum silo isolado!</text>`
      }
    </svg>
  `;
}

// ============================================================================
// CONTRATOS, SETORES, MATRIZ TIME E AUDITORIA
// ============================================================================
function renderContratosSetoresRelatorios() {
  const c = dados.filter((s) => s.contrato).sort((a, b) => ((a.venc || "9") > (b.venc || "9") ? 1 : -1));
  const statusContrato = (s) => {
    const n = diasVenc(s);
    return n === null ? "Sem data" : n < 0 ? "Vencido" : n <= 90 ? "A vencer" : "Vigente";
  };
  const clSt = { "Vencido": "tag-err", "A vencer": "tag-warn", "Vigente": "tag-ok" };
  const icSt = { "Vencido": `${dot()} `, "A vencer": `${dot()} `, "Vigente": `${dot()} ` };
  const tot = c.reduce((a, s) => a + (+s.cValor || 0), 0);
  const fo = {};
  c.forEach((s) => {
    const f = s.fornecedor || "—";
    fo[f] = (fo[f] || 0) + (+s.cValor || 0);
  });

  $("#viewContratos").innerHTML = `
    <div class="kpis">
      ${[
        [c.length, "Contratos formalizados", ""],
        [brl(tot), "Soma global dos contratos", ""],
        [c.filter((s) => statusContrato(s) === "Vencido").length, "Contratos vencidos", "kpi-err"],
        [c.filter((s) => statusContrato(s) === "A vencer").length, "Vencem nos próximos 90 dias", "kpi-warn"]
      ]
        .map(([a, b, cl]) => `<div class="kpi ${cl}"><div class="kpi-top"><span class="kpi-label">${b}</span><span class="kpi-ico">${ico(kpiIcon(cl), 18)}</span></div><b>${a}</b></div>`)
        .join("")}
    </div>
    <div class="tw" style="margin-bottom:18px">
      <table>
        <thead><tr><th>Nº do Contrato</th><th>Sistema</th><th>Fornecedor</th><th class="num">Valor Contratual</th><th>Vigência</th><th>Status</th><th class="num">Ação</th></tr></thead>
        <tbody>
          ${c
            .map((s) => {
              const st = statusContrato(s);
              return `<tr>
                  <td><b>${esc(s.contrato)}</b></td>
                  <td><button class="lk" data-d="${s.id}">${esc(s.nome)}</button></td>
                  <td>${esc(s.fornecedor)}</td>
                  <td class="num"><b>${brl(s.cValor)}</b></td>
                  <td>${fdata(s.inicio)} até ${fdata(s.venc)}</td>
                  <td><span class="tag ${clSt[st] || "tag-neutral"}">${icSt[st] || ""}${st}</span></td>
                  <td class="num">${canEdit(s) ? `<button class="sm ghost" data-e="${s.id}">Editar Contrato</button>` : `<button class="sm ghost" data-d="${s.id}">Ver</button>`}</td>
                </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="box"><h3 class="h-ico"><i class="ph-duotone ph-handshake"></i>Valor Contratado por Empresa Fornecedora</h3><div id="bf"></div></div>
  `;
  renderBarras($("#bf"), fo, brl);

  const se = {};
  dados.forEach((s) => (se[s.setor] = se[s.setor] || []).push(s));
  $("#viewSetores").innerHTML = `
    <div class="cards">
      ${Object.entries(se)
        .sort()
        .map(([k, arr]) => {
          const t = arr.filter((s) => s.situacao !== "Desativado").reduce((x, s) => x + tco(s), 0);
          const h = arr.filter((s) => s.situacao !== "Desativado").reduce((x, s) => x + horasAno(s), 0);
          return `<div class="box" style="padding:16px">
            <h3 style="margin-bottom:4px">${esc(k)}</h3>
            <b style="font-size:1.25rem;color:var(--ac)">${brl(t)}/ano</b>
            <small style="color:var(--tx-sec);display:block;margin-bottom:8px">${arr.length} ferramenta(s) · ${h ? `${h}h/ano de retrabalho` : "Sem retrabalho"}</small>
            ${arr
              .map(
                (s) =>
                  `<div class="ov" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                    <button class="lk" data-d="${s.id}">${esc(s.nome)}</button>
                    ${renderBadgePapel(s.papelDados)}
                  </div>`
              )
              .join("")}
          </div>`;
        })
        .join("")}
    </div>
  `;

  const gruposTime = {};
  Object.values(DECISAO_TIME).forEach((d) => (gruposTime[d.acao] = []));
  dados.forEach((s) => {
    const d = DECISAO_TIME[s.situacao] || DECISAO_TIME["Ativo"];
    gruposTime[d.acao].push(s);
  });

  const lo = dados
    .filter((s) => s.situacao !== "Desativado" && s.licC > 0)
    .map((s) => ({ s, o: Math.max(0, s.licC - (s.licU || 0)) }))
    .filter((x) => x.o > 0);

  $("#viewRelatorios").innerHTML = `
    <div class="box" style="margin-bottom:18px">
      <div class="box-header">
        <h3 class="h-ico"><i class="ph-duotone ph-kanban"></i>Quadro de Decisão (Manter, Unificar ou Desligar)</h3>
      </div>
      <div class="cols">
        ${Object.entries(gruposTime)
          .map(
            ([acao, lista]) => `
            <div style="background:var(--sf-alt);padding:14px;border-radius:10px;border:1px solid var(--bd)">
              <b>${esc(acao)}</b> <span class="tag tag-neutral" style="margin-left:4px">${lista.length}</span>
              ${
                lista.length
                  ? lista
                      .map(
                        (s) =>
                          `<div class="ov">
                            <button class="lk" data-d="${s.id}">${esc(s.nome)}</button>
                            <small>${esc(s.setor)} · ${brl(tco(s))}/ano</small>
                          </div>`
                      )
                      .join("")
                  : '<div class="ov"><small>Nenhum item</small></div>'
              }
            </div>`
          )
          .join("")}
      </div>
    </div>
    <div class="box">
      <div class="box-header">
        <h3 class="h-ico"><i class="ph-duotone ph-key"></i>Licenças pagas sem uso</h3>
      </div>
      ${
        lo.length
          ? lo
              .map(
                ({ s, o }) =>
                  `<div class="ov">
                    <b><button class="lk" data-d="${s.id}">${esc(s.nome)}</button></b>: ${o} de ${s.licC} licenças contratadas estão paradas sem uso.
                    <small>Desperdício anual: <b>${brl(((+s.cLic || 0) * o) / s.licC)}/ano</b> · Fornecedor: ${esc(s.fornecedor || "—")}</small>
                  </div>`
              )
              .join("")
          : '<div class="empty">Nenhuma licença ociosa</div>'
      }
    </div>
  `;

  $("#boxHistorico").hidden = !canViewHist();
  $("#hist").innerHTML = hist.length
    ? hist
        .slice(0, 40)
        .map(
          (h) =>
            `<div class="ov"><b>${esc(h.acao)}</b> — ${esc(h.nome)}<small>${new Date(h.t).toLocaleString("pt-BR")} · Por: <b>${esc(h.u)}</b>${h.det ? " · " + esc(h.det) : ""}</small></div>`
        )
        .join("")
    : '<div class="empty">Nenhuma alteração registrada ainda.</div>';
}

// ============================================================================
// MODAL DE DETALHES (FICHA COMPLETA)
// ============================================================================
function abrirDetalhe(s) {
  if (!s) return;
  const n = diasVenc(s);
  const lgpd = avaliarRiscoLGPD(s);
  const dec = DECISAO_TIME[s.situacao] || DECISAO_TIME["Ativo"];
  const o = detectarSobreposicoes().filter((x) => x.k.id === s.id || x.z.id === s.id);
  const row = (label, val) => `<div class="ov"><small style="font-weight:700;color:var(--tx)">${label}</small><div style="margin-top:3px">${val || "—"}</div></div>`;

  $("#det").innerHTML = `
    <div style="padding-bottom:12px;border-bottom:1px solid var(--bd);margin-bottom:10px">
      <div class="modal-head" style="margin-bottom:6px">
        <h2 style="margin:0;font-size:1.3rem">${esc(s.nome)}</h2>
        <button type="button" class="modal-close" onclick="this.closest('dialog').close()" aria-label="Fechar ficha"><i class="ph-duotone ph-x"></i></button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${renderBadgePapel(s.papelDados)}
        <span class="tag s-${slug(s.situacao)}">${iconSituacao(s.situacao)} Uso: ${esc(s.situacao)}</span>
        <span class="tag g-${slug(s.governanca)}">${iconGov(s.governanca)} TI: ${esc(s.governanca)}</span>
        <span class="tag ${lgpd.cor}">${lgpd.icone} LGPD: ${lgpd.nivel} (${lgpd.pontos}/100)</span>
        <span class="tag ${dec.cor}">Recomendação: ${dec.acao}</span>
      </div>
    </div>
    ${row("Tipo, Categoria e Ambiente", esc(`${s.tipo} · ${s.categoria}${s.versao ? " · " + s.versao : ""}`))}
    ${row("Finalidade na Instituição", esc(s.finalidade))}
    ${row("Setor e Funcionário Responsável", esc(`Setor: ${s.setor} · Responsável: ${s.responsavel}`))}
    ${row(
      "Custo Anual (TCO) e Tempo de Retrabalho Manual",
      `Licenças: ${brl(s.cLic)} · Suporte: ${brl(s.cSup)} · Infraestrutura: ${brl(s.cInf)}<br>` +
        `Retrabalho manual: <b>${s.horasRetrabalhoSem || 0}h/semana (${horasAno(s)} horas/ano = ${brl(s.cOut)})</b><br>` +
        `<b style="font-size:1.05rem;color:var(--ac)">Custo Total Anual (TCO): ${brl(tco(s))}</b>`
    )}
    ${row(
      "Usuários e Licenças",
      `Usuários ativos: <b>${s.usuariosEst || 0}</b> (${esc(s.perfilUsuarios || "Geral")}) · ` +
        (s.licC ? `Licenças: <b>${s.licU || 0} em uso</b> de <b>${s.licC} pagas</b>` : "Sem pagamento de licenças")
    )}
    ${row(
      "Dados Tratados e Avaliação LGPD",
      `Categorias: <b>${esc(getLabelsDados(s).join(", ") || "Nenhuma")}</b><br>Campos: ${esc(s.dadosTexto || "—")}<br>Diagnóstico: ${esc(lgpd.motivos.join(" · "))}`
    )}
    ${row(
      "Integrações e Fluxo de Dados",
      Array.isArray(s.integra) && s.integra.length
        ? `Conectado com: <b>${esc(s.integra.join(", "))}</b> (${esc(s.troca || "Automático")})`
        : `<span class="venc-w">Ferramenta isolada (Silo sem integração)</span> — ${esc(s.troca || "Digitação manual")}`
    )}
    ${row(
      "Contrato e Fornecedor",
      s.contrato
        ? `Contrato <b>${esc(s.contrato)}</b> · ${esc(s.fornecedor)} · Valor: ${brl(s.cValor)} · Vigência: ${fdata(s.inicio)} a ${fdata(s.venc)}` +
            (n === null ? "" : n < 0 ? ` <span class="venc-e">(Vencido há ${-n} dias)</span>` : ` (${n} dias restantes)`)
        : esc(s.fornecedor || "Uso interno")
    )}
    ${row(
      "Conflitos / Duplicidades com outros sistemas",
      o.map((x) => `<b>${esc((x.k.id === s.id ? x.z : x.k).nome)}</b>: ${esc(x.motivos.join(" · "))}`).join("<br>") ||
        "Nenhuma duplicidade detectada"
    )}
    <div class="act">
      ${canEdit(s) ? `<button type="button" onclick="this.closest('dialog').close()" data-e="${s.id}">Editar Ferramenta</button>` : ""}
      <button type="button" class="p" onclick="this.closest('dialog').close()">Fechar</button>
    </div>
  `;
  $("#det").showModal();
}

// ============================================================================
// FORMULÁRIO DE CADASTRO / EDIÇÃO + CALCULADORA DE RETRABALHO
// ============================================================================
function popularCheckboxesFormulario(s) {
  const selDados = Array.isArray(s?.dadosCategorias) ? s.dadosCategorias : [];
  $("#chkDadosLgpd").innerHTML = LGPD_CATEGORIAS.map(
    (c) => `
    <label class="check-item">
      <input type="checkbox" name="dadosCat" value="${c.id}" ${selDados.includes(c.id) ? "checked" : ""}>
      <span>${esc(c.label)}</span>
    </label>`
  ).join("");

  const selControles = Array.isArray(s?.controles) ? s.controles : [];
  $("#chkControles").innerHTML = CONTROLES_SEGURANCA.map(
    (c) => `
    <label class="check-item">
      <input type="checkbox" name="ctrlSeg" value="${c.id}" ${selControles.includes(c.id) ? "checked" : ""}>
      <span>${esc(c.label)}</span>
    </label>`
  ).join("");

  const outrosSistemas = dados.filter((x) => !s || x.id !== s.id);
  const selIntegra = Array.isArray(s?.integra) ? s.integra : [];
  $("#chkIntegra").innerHTML = outrosSistemas.length
    ? outrosSistemas
        .map(
          (x) => `
        <label class="check-item">
          <input type="checkbox" name="integraSys" value="${esc(x.nome)}" ${selIntegra.includes(x.nome) ? "checked" : ""}>
          <span>${esc(x.nome)} <small style="display:inline">(${esc(x.setor)})</small></span>
        </label>`
        )
        .join("")
    : "<small>Nenhum outro sistema cadastrado</small>";
}

function aplicarRestricoesPerfilForm(s) {
  const frm = $("#frm");
  const apenasCustos = !!U && !p().pode_editar_tecnico && !!p().pode_editar_custos;
  const apenasProprio = !!U && !p().pode_editar_tecnico && !p().pode_editar_custos;

  if (!s && apenasProprio) {
    frm.elements.responsavel.value = U.nome;
    frm.elements.governanca.value = "Pendente de validação";
  }

  [...frm.elements].forEach((el) => {
    if (!el.name) return;
    if (apenasCustos) {
      el.disabled = !/^(c[A-Z]|horasRetrabalhoSem|fornecedor|contrato|inicio|venc)/.test(el.name);
    } else if (apenasProprio) {
      el.disabled = el.name === "responsavel" || el.name === "governanca";
    } else {
      el.disabled = false;
    }
  });
}

function atualizarLiveTco() {
  const frm = $("#frm");
  if (!frm) return;
  const total =
    (+frm.elements.cLic?.value || 0) +
    (+frm.elements.cSup?.value || 0) +
    (+frm.elements.cInf?.value || 0) +
    (+frm.elements.cOut?.value || 0);
  const hSem = +frm.elements.horasRetrabalhoSem?.value || 0;
  const hAno = Math.round(hSem * SEMANAS_ANO);
  const valEl = $("#liveTcoVal");
  const hrsEl = $("#liveTcoHrs");
  if (valEl) valEl.textContent = `${brl(total)} / ano`;
  if (hrsEl) hrsEl.textContent = hAno > 0 ? `${hAno}h/ano de retrabalho manual incluídas` : "Sem retrabalho manual informado";
}

function abrirFormulario(s) {
  editId = s ? s.id : null;
  $("#dt").textContent = s ? `Editar: ${s.nome}` : "Cadastrar Sistema ou Planilha";
  const frm = $("#frm");
  frm.reset();
  popularCheckboxesFormulario(s);

  if (s) {
    Object.entries(s).forEach(([k, v]) => {
      if (frm.elements[k] && typeof v !== "object") {
        frm.elements[k].value = v ?? "";
      }
    });
  }
  aplicarRestricoesPerfilForm(s);
  atualizarLiveTco();
  $("#dlg").showModal();
}

// ============================================================================
// SEÇÃO 6: PAINEL ADMINISTRATIVO DE USUÁRIOS E NÍVEIS DE ACESSO (RBAC)
// ============================================================================
function renderAdminAcessos() {
  if (!canManageUsers()) return;

  const total = adminUsers.length;
  const pendentes = adminUsers.filter((u) => u.status === "pendente").length;
  const ativos = adminUsers.filter((u) => u.status === "ativo").length;
  const bloqueados = adminUsers.filter((u) => u.status === "bloqueado").length;

  $("#adminKpis").innerHTML = [
    [total, "Contas cadastradas", "", "usersGear"],
    [pendentes, "Aguardando aprovação", pendentes ? "kpi-warn" : "kpi-ok", "clock"],
    [ativos, "Usuários ativos", "kpi-ok", "check"],
    [bloqueados, "Contas suspensas", bloqueados ? "kpi-err" : "", "errOct"]
  ]
    .map(
      ([val, label, cl, ic]) =>
        `<div class="kpi ${cl}"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-ico">${ico(ic, 18)}</span></div><b>${val}</b></div>`
    )
    .join("");

  const filtrados = adminUsers.filter((u) => userFilter === "todos" || u.status === userFilter);
  const perfisList = Object.values(PERFIS);
  const statusTag = {
    ativo: { cl: "tag-ok", label: "Ativo" },
    pendente: { cl: "tag-warn", label: "Pendente" },
    bloqueado: { cl: "tag-err", label: "Bloqueado" }
  };

  $("#listaUsuarios").innerHTML = filtrados.length
    ? filtrados
        .map((u) => {
          const st = statusTag[u.status] || statusTag.pendente;
          const isSelf = U && u.id === U.id;
          return `<tr>
            <td>
              <b>${esc(u.nome)}</b>
              ${isSelf ? '<span class="tag tag-neutral" style="margin-left:4px">Você</span>' : ""}
              ${u.reset_solicitado ? '<span class="tag tag-warn" style="margin-left:4px">Reset solicitado</span>' : ""}
              <small>${esc(u.email)}</small>
            </td>
            <td>${esc(u.setor)}</td>
            <td>
              <select class="role-select" data-user-role="${u.id}" ${isSelf ? "disabled" : ""} aria-label="Nível de acesso de ${esc(u.nome)}">
                ${perfisList.map((pf) => `<option value="${esc(pf)}" ${u.perfil === pf ? "selected" : ""}>${esc(pf)}</option>`).join("")}
              </select>
            </td>
            <td><span class="tag ${st.cl}">${dot()} ${st.label}</span></td>
            <td class="num">
              <div class="action-group">
                ${u.status === "pendente" ? `<button class="sm p" data-user-status="${u.id}" data-next-st="ativo">Aprovar</button>` : ""}
                <button class="sm ghost" data-user-edit="${u.id}">Editar / Senha</button>
                ${
                  !isSelf && u.status === "ativo"
                    ? `<button class="sm ghost" data-user-status="${u.id}" data-next-st="bloqueado">Suspender</button>`
                    : ""
                }
                ${
                  !isSelf && u.status === "bloqueado"
                    ? `<button class="sm ghost" data-user-status="${u.id}" data-next-st="ativo">Reativar</button>`
                    : ""
                }
                ${
                  !isSelf
                    ? `<button class="sm ghost" style="color:var(--er)" data-user-del="${u.id}" data-user-name="${esc(u.nome)}">Excluir</button>`
                    : ""
                }
              </div>
            </td>
          </tr>`;
        })
        .join("")
    : '<tr><td colspan="5" class="empty">Nenhum usuário encontrado neste filtro.</td></tr>';

  const permFlags = [
    "pode_cadastrar",
    "pode_editar_tecnico",
    "pode_editar_custos",
    "pode_excluir",
    "pode_homologar",
    "pode_planos",
    "pode_ver_auditoria",
    "pode_gerenciar_usuarios"
  ];

  $("#listaPermissoes").innerHTML = adminPerms
    .map(
      (pr) => `<tr>
        <td><b>${esc(pr.perfil)}</b></td>
        ${permFlags
          .map((fl) => {
            const locked = pr.perfil === "Gestor de TI" && fl === "pode_gerenciar_usuarios";
            return `<td><input type="checkbox" data-perm-perfil="${esc(pr.perfil)}" data-perm-flag="${fl}" ${pr[fl] ? "checked" : ""} ${locked ? "disabled title='Permissão obrigatória para o administrador'" : ""}></td>`;
          })
          .join("")}
      </tr>`
    )
    .join("");
}

// ============================================================================
// NAVEGAÇÃO LATERAL ENXUTA
// ============================================================================
const NAV_ITEMS = [
  ["painel", "Visão Geral", "Visão Geral", "Resumo de ferramentas, custos e economia potencial", "grid"],
  ["sistemas", "Catálogo", "Catálogo de Ferramentas", "Sistemas e planilhas por setor", "layers"],
  ["sobreposicoes", "Economia", "Duplicidades e Economia", "Ferramentas repetidas, retrabalho e simulador de cortes", "dollar"],
  ["governanca", "Segurança & Mapa", "Segurança, LGPD e Conexões", "Proteção de dados, sistemas integrados e pendências da TI", "shield"],
  ["contratos", "Contratos", "Contratos e Histórico", "Vigências de fornecedores e registro de alterações", "fileText"],
  ["acessos", "Acessos", "Usuários e Níveis de Acesso", "Aprove novos cadastros e configure permissões por perfil", "usersGear"]
];

function atualizarRota() {
  const itensVisiveis = NAV_ITEMS.filter(([k]) => k !== "acessos" || canManageUsers());
  let h = location.hash.slice(1);
  const item = itensVisiveis.find(([k]) => k === h) || itensVisiveis[0];
  h = item[0];

  NAV_ITEMS.forEach(([k]) => {
    const sec = $(`#sec-${k}`);
    if (sec) sec.hidden = k !== h;
  });

  $("#pageTitle").textContent = item[2];
  $("#pageSub").textContent = item[3];

  const pendenciasGov = dados.filter((s) => s.situacao !== "Desativado" && s.governanca !== "Homologado").length;
  const qtdSobrep = detectarSobreposicoes().length;

  $("#mainNav").innerHTML = itensVisiveis
    .map(([k, t, , , ic]) => {
      let badge = "";
      if (k === "governanca" && pendenciasGov > 0) badge = `<span class="nav-count" title="Aguardando avaliação da TI">${pendenciasGov}</span>`;
      if (k === "sobreposicoes" && qtdSobrep > 0) badge = `<span class="nav-count" title="Duplicidades encontradas">${qtdSobrep}</span>`;
      if (k === "acessos" && pendingUsersCount > 0) badge = `<span class="nav-count" title="Solicitações de acesso pendentes">${pendingUsersCount}</span>`;
      return `<a href="#${k}" class="${k === h ? "on" : ""}"><span class="nav-label">${ico(ic, 16)}<span>${t}</span></span>${badge}</a>`;
    })
    .join("");
}

function renderAll() {
  atualizarFiltros();
  renderPainel();
  renderTabelaSistemas();
  renderSobreposicoes();
  renderGovernancaLGPD();
  renderIntegracoes();
  renderContratosSetoresRelatorios();
  renderAdminAcessos();
  atualizarRota();

  $("#usrNome").textContent = U ? U.nome : "Visitante";
  $("#usrPerfil").textContent = U ? U.perfil : "Não autenticado";
  $("#novo").hidden = !canNew();
  $("#btnReset").hidden = !canManageUsers();

  if (!U && !$("#login").open) {
    $("#login").showModal();
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
// Menu suspenso (⋮) das linhas da tabela: posicionado como "fixed" para não ser cortado pela rolagem da tabela
let rowMenuEl = null;

function closeRowMenu() {
  if (rowMenuEl) rowMenuEl.hidden = true;
}

function toggleRowMenu(btn) {
  const s = dados.find((x) => x.id == btn.dataset.menu);
  if (!s) return;
  if (!rowMenuEl) {
    rowMenuEl = document.createElement("div");
    rowMenuEl.className = "row-menu";
    rowMenuEl.setAttribute("role", "menu");
    rowMenuEl.hidden = true;
    document.body.appendChild(rowMenuEl);
  }
  if (!rowMenuEl.hidden && rowMenuEl.dataset.for === String(s.id)) {
    rowMenuEl.hidden = true;
    return;
  }
  rowMenuEl.dataset.for = String(s.id);
  rowMenuEl.innerHTML =
    (canEdit(s) ? `<button type="button" role="menuitem" data-e="${s.id}">${ico("edit", 16)} Editar</button>` : "") +
    (canDel() ? `<button type="button" role="menuitem" class="danger" data-x="${s.id}">${ico("trash", 16)} Excluir</button>` : "");
  rowMenuEl.hidden = false;
  const r = btn.getBoundingClientRect();
  const w = rowMenuEl.offsetWidth;
  const h = rowMenuEl.offsetHeight;
  const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  rowMenuEl.style.left = left + "px";
  rowMenuEl.style.top = top + "px";
}

window.addEventListener("scroll", closeRowMenu, true);
window.addEventListener("resize", closeRowMenu);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeRowMenu();
});

window.addEventListener("DOMContentLoaded", () => {
  initPreferences();

  const toggleMenu = (abrir) => {
    const sb = $("#sidebar");
    const bd = $("#sbBackdrop");
    if (!sb || !bd) return;
    const estado = typeof abrir === "boolean" ? abrir : !sb.classList.contains("open");
    sb.classList.toggle("open", estado);
    bd.classList.toggle("open", estado);
  };

  if ($("#btnMobileMenu")) $("#btnMobileMenu").onclick = () => toggleMenu();
  if ($("#sbBackdrop")) $("#sbBackdrop").onclick = () => toggleMenu(false);

  window.addEventListener("hashchange", () => {
    atualizarRota();
    toggleMenu(false);
  });

  $$("[data-fsize]").forEach((btn) => {
    btn.onclick = () => setFontSize(btn.dataset.fsize);
  });

  $("#btnTheme").onclick = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    updateThemeButtonLabel(next);
  };

  if ($("#btnCsv")) {
    $("#btnCsv").onclick = exportarCSV;
  }

  $("#btnReset").onclick = async () => {
    if (!confirm("Restaurar os 7 sistemas/planilhas do exemplo oficial da instituição?")) return;
    try {
      await apiFetch("/api/demo/reset", { method: "POST" });
      simUnchecked.clear();
      await bootstrapApp();
      showToast("Base de demonstração restaurada no banco de dados");
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  // Calculadora automática de horas de retrabalho -> custo anual em R$ + TCO ao vivo
  $("#inpHorasSem").addEventListener("input", (e) => {
    const hSem = +e.target.value || 0;
    const hAno = Math.round(hSem * SEMANAS_ANO);
    const custoEst = Math.round(hAno * CUSTO_HORA_PADRAO);
    $("#inpCustoRetrab").value = custoEst;
    $("#calcRetrabHint").textContent =
      hSem > 0
        ? `Cálculo automático: ${hSem}h/semana × ${SEMANAS_ANO} semanas = ${hAno} horas/ano perdidas com retrabalho (Custo estimado: ${brl(custoEst)}/ano).`
        : "Sem retrabalho manual informado.";
    atualizarLiveTco();
  });

  ["cLic", "cSup", "cInf", "cOut"].forEach((name) => {
    const inp = $("#frm")?.elements[name];
    if (inp) inp.addEventListener("input", atualizarLiveTco);
  });

  // Abas do modal de Login / Cadastro
  const switchAuthTab = (tab) => {
    const isLogin = tab === "login";
    $("#tabBtnLogin").classList.toggle("active", isLogin);
    $("#tabBtnReg").classList.toggle("active", !isLogin);
    $("#tabBtnLogin").setAttribute("aria-selected", String(isLogin));
    $("#tabBtnReg").setAttribute("aria-selected", String(!isLogin));
    $("#lf").hidden = !isLogin;
    $("#rf").hidden = isLogin;
    $("#loginMsg").hidden = true;
    $("#regMsg").hidden = true;
  };
  $("#tabBtnLogin").onclick = () => switchAuthTab("login");
  $("#tabBtnReg").onclick = () => switchAuthTab("reg");

  // Acesso rápido de demonstração
  $$("[data-demo-email]").forEach((btn) => {
    btn.onclick = () => {
      $("#loginEmail").value = btn.dataset.demoEmail;
      $("#loginSenha").value = "123456";
      $("#lf").requestSubmit();
    };
  });

  // Esqueci minha senha (notifica Gestor de TI no painel Acessos)
  $("#btnForgotToggle").onclick = () => {
    const box = $("#forgotBox");
    box.hidden = !box.hidden;
    if (!box.hidden) {
      $("#forgotEmail").value = $("#loginEmail").value || "";
      $("#forgotMsg").hidden = true;
    }
  };

  $("#btnSendForgot").onclick = async () => {
    const email = $("#forgotEmail").value.trim();
    const fmsg = $("#forgotMsg");
    fmsg.hidden = true;
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      fmsg.style.color = "var(--ok)";
      fmsg.textContent = res.message;
      fmsg.hidden = false;
    } catch (err) {
      fmsg.style.color = "var(--er)";
      fmsg.textContent = err.message;
      fmsg.hidden = false;
    }
  };

  // Modal Criar / Editar Usuário (Painel Acessos)
  let editUserId = null;
  const abrirModalUsuario = (u) => {
    editUserId = u ? u.id : null;
    const isSelf = !!u && !!U && u.id === U.id;
    $("#duTitle").textContent = u ? `Editar Usuário: ${u.nome}` : "Cadastrar Novo Usuário";
    $("#frmUser").reset();
    if (u) {
      $("#uNome").value = u.nome;
      $("#uEmail").value = u.email;
      $("#uSetor").value = u.setor;
      $("#uPerfil").value = u.perfil;
      $("#uStatus").value = u.status;
      $("#uSenhaLabel").textContent = "Nova senha (opcional)";
      $("#uSenha").required = false;
      $("#uSenha").placeholder = "Deixe em branco para manter atual";
    } else {
      $("#uPerfil").value = "Responsável pelo sistema";
      $("#uStatus").value = "ativo";
      $("#uSenhaLabel").textContent = "Senha inicial * (mín. 6 caracteres)";
      $("#uSenha").required = true;
      $("#uSenha").placeholder = "••••••••";
    }
    $("#uPerfil").disabled = isSelf;
    $("#uStatus").disabled = isSelf;
    $("#dlgUser").showModal();
  };

  if ($("#btnNovoUsuario")) {
    $("#btnNovoUsuario").onclick = () => abrirModalUsuario(null);
  }

  $("#frmUser").onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: $("#uNome").value.trim(),
      email: $("#uEmail").value.trim(),
      setor: $("#uSetor").value.trim(),
      perfil: $("#uPerfil").value,
      status: $("#uStatus").value
    };
    const senha = $("#uSenha").value;
    try {
      if (editUserId) {
        if (senha) payload.novaSenha = senha;
        await apiFetch(`/api/admin/users/${editUserId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        showToast(senha ? `Usuário atualizado e senha redefinida` : `Dados de "${payload.nome}" atualizados`);
      } else {
        payload.senha = senha;
        await apiFetch("/api/admin/users", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast(`Usuário "${payload.nome}" criado com sucesso`);
      }
      $("#dlgUser").close();
      await bootstrapApp();
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  document.addEventListener("click", (e) => {
    const editUBtn = e.target.closest("[data-user-edit]");
    if (editUBtn && canManageUsers()) {
      const target = adminUsers.find((x) => x.id == editUBtn.dataset.userEdit);
      if (target) abrirModalUsuario(target);
    }
  });

  $("#novo").onclick = () => abrirFormulario(null);
  $("#cancel").onclick = () => $("#dlg").close();

  // Salvar ferramenta via API (POST / PUT)
  $("#frm").onsubmit = async (e) => {
    e.preventDefault();
    const frm = $("#frm");
    // Habilita temporariamente para FormData ler campos caso necessário, ou lê via elements
    const o = {};
    [...frm.elements].forEach((el) => {
      if (el.name && el.type !== "checkbox") o[el.name] = el.value;
    });

    ["cLic", "cSup", "cInf", "cOut", "cValor", "licC", "licU", "usuariosEst", "horasRetrabalhoSem"].forEach((k) => {
      if (k in o) o[k] = +o[k] || 0;
    });

    o.dadosCategorias = $$('input[name="dadosCat"]:checked').map((el) => el.value);
    o.controles = $$('input[name="ctrlSeg"]:checked').map((el) => el.value);
    o.integra = $$('input[name="integraSys"]:checked').map((el) => el.value);

    try {
      if (editId) {
        await apiFetch(`/api/systems/${editId}`, { method: "PUT", body: JSON.stringify(o) });
        showToast(`Alterações salvas em "${o.nome}"`);
      } else {
        await apiFetch("/api/systems", { method: "POST", body: JSON.stringify(o) });
        showToast(`"${o.nome}" cadastrado no banco de dados`);
      }
      $("#dlg").close();
      await bootstrapApp();
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  document.addEventListener("change", async (e) => {
    const simChk = e.target.closest("[data-sim-key]");
    if (simChk) {
      const k = simChk.dataset.simKey;
      if (simChk.checked) simUnchecked.delete(k);
      else simUnchecked.add(k);
      renderSobreposicoes();
      return;
    }

    // Alteração de perfil (nível de acesso) de um usuário no Painel Admin
    const roleSel = e.target.closest("[data-user-role]");
    if (roleSel && canManageUsers()) {
      const uid = Number(roleSel.dataset.userRole);
      try {
        await apiFetch(`/api/admin/users/${uid}`, {
          method: "PATCH",
          body: JSON.stringify({ perfil: roleSel.value })
        });
        await bootstrapApp();
        showToast(`Nível de acesso alterado para ${roleSel.value}`);
      } catch (err) {
        showToast(err.message, "warn");
        renderAdminAcessos();
      }
      return;
    }

    // Alteração de permissão na Matriz RBAC
    const permChk = e.target.closest("[data-perm-perfil]");
    if (permChk && canManageUsers()) {
      const perfilAlvo = permChk.dataset.permPerfil;
      const flag = permChk.dataset.permFlag;
      const atual = adminPerms.find((x) => x.perfil === perfilAlvo);
      if (!atual) return;
      const payload = { ...atual, [flag]: permChk.checked };
      try {
        const res = await apiFetch(`/api/admin/permissions/${encodeURIComponent(perfilAlvo)}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        adminPerms = res.permissions;
        await bootstrapApp();
        showToast(`Permissões de "${perfilAlvo}" atualizadas`);
      } catch (err) {
        showToast(err.message, "warn");
        permChk.checked = !permChk.checked;
      }
    }
  });

  document.addEventListener("click", async (e) => {
    const menuBtn = e.target.closest("[data-menu]");
    if (menuBtn) {
      toggleRowMenu(menuBtn);
      return;
    }
    closeRowMenu();

    // Filtro de usuários no Painel Admin
    const ufBtn = e.target.closest("[data-uf]");
    if (ufBtn) {
      userFilter = ufBtn.dataset.uf;
      $$("#userFilterTabs .pill-tab").forEach((b) => b.classList.toggle("active", b === ufBtn));
      renderAdminAcessos();
      return;
    }

    // Aprovar / Suspender / Reativar usuário no Painel Admin
    const stBtn = e.target.closest("[data-user-status]");
    if (stBtn && canManageUsers()) {
      const uid = Number(stBtn.dataset.userStatus);
      const nextSt = stBtn.dataset.nextSt;
      try {
        await apiFetch(`/api/admin/users/${uid}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextSt })
        });
        await bootstrapApp();
        showToast(nextSt === "ativo" ? "Usuário aprovado e ativado" : "Usuário suspenso", nextSt === "ativo" ? "ok" : "warn");
      } catch (err) {
        showToast(err.message, "warn");
      }
      return;
    }

    // Excluir usuário no Painel Admin
    const uDelBtn = e.target.closest("[data-user-del]");
    if (uDelBtn && canManageUsers()) {
      const uid = Number(uDelBtn.dataset.userDel);
      const uname = uDelBtn.dataset.userName;
      if (!confirm(`Remover a conta de "${uname}" permanentemente?`)) return;
      try {
        await apiFetch(`/api/admin/users/${uid}`, { method: "DELETE" });
        await bootstrapApp();
        showToast(`Conta de "${uname}" removida`, "warn");
      } catch (err) {
        showToast(err.message, "warn");
      }
      return;
    }

    const btnEdit = e.target.closest("[data-e]");
    if (btnEdit) {
      abrirFormulario(dados.find((s) => s.id == btnEdit.dataset.e));
      return;
    }

    const btnDet = e.target.closest("[data-d]");
    if (btnDet) {
      abrirDetalhe(dados.find((s) => s.id == btnDet.dataset.d));
      return;
    }

    const btnDel = e.target.closest("[data-x]");
    if (btnDel && canDel()) {
      delId = +btnDel.dataset.x;
      const alvo = dados.find((s) => s.id === delId);
      if (alvo) {
        $("#delNome").textContent = alvo.nome;
        $("#del").showModal();
      }
      return;
    }

    const btnGov = e.target.closest("[data-gov-id]");
    if (btnGov && canGov()) {
      const id = +btnGov.dataset.govId;
      const novoSt = btnGov.dataset.govSt;
      try {
        await apiFetch(`/api/systems/${id}/governance`, {
          method: "PATCH",
          body: JSON.stringify({ governanca: novoSt })
        });
        await bootstrapApp();
        showToast(`Status de TI atualizado para: ${novoSt}`);
      } catch (err) {
        showToast(err.message, "warn");
      }
      return;
    }

    const btnNovoPlano = e.target.closest("[data-novo-plano-orig]");
    if (btnNovoPlano && canPlans()) {
      const orig = dados.find((x) => x.id == btnNovoPlano.dataset.novoPlanoOrig);
      const dest = dados.find((x) => x.id == btnNovoPlano.dataset.novoPlanoDest);
      if (orig && dest) {
        $("#plOrigId").value = orig.id;
        $("#plDestId").value = dest.id;
        $("#plResumo").textContent = `Absorver "${orig.nome}" (${orig.setor}) no sistema oficial "${dest.nome}" (${dest.setor})`;
        $("#plResp").value = `${dest.responsavel} e ${orig.responsavel}`;
        $("#plPrazo").value = offsetDate(60);
        $("#plJust").value = `Eliminar ${horasAno(orig)}h/ano de redigitação manual em ${orig.categoria}, poupar ${brl(tco(orig))}/ano e centralizar na Fonte Oficial.`;
        $("#dlgPlano").showModal();
      }
      return;
    }

    const btnAvancar = e.target.closest("[data-avancar-plano]");
    if (btnAvancar && canPlans()) {
      const pid = +btnAvancar.dataset.avancarPlano;
      try {
        await apiFetch(`/api/plans/${pid}/complete`, { method: "PATCH" });
        await bootstrapApp();
        showToast("Unificação concluída e cópia paralela desativada");
      } catch (err) {
        showToast(err.message, "warn");
      }
      return;
    }

    const thSort = e.target.closest("th[data-sort]");
    if (thSort) {
      const f = thSort.dataset.sort;
      if (sortField === f) {
        sortAsc = !sortAsc;
      } else {
        sortField = f;
        sortAsc = f === "tco" || f === "risco" ? false : true;
      }
      renderTabelaSistemas();
    }
  });

  $("#frmPlano").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/plans", {
        method: "POST",
        body: JSON.stringify({
          sistemaOrigemId: Number($("#plOrigId").value),
          sistemaDestinoId: Number($("#plDestId").value),
          prazo: $("#plPrazo").value,
          responsavelAcao: $("#plResp").value,
          justificativa: $("#plJust").value
        })
      });
      $("#dlgPlano").close();
      await bootstrapApp();
      showToast("Plano de unificação aprovado e salvo");
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  $("#delNo").onclick = () => $("#del").close();
  $("#delYes").onclick = async () => {
    if (delId && canDel()) {
      try {
        await apiFetch(`/api/systems/${delId}`, { method: "DELETE" });
        $("#del").close();
        await bootstrapApp();
        showToast("Ferramenta removida do catálogo", "warn");
      } catch (err) {
        showToast(err.message, "warn");
      }
    }
  };

  // Login real contra /api/auth/login
  $("#login").addEventListener("cancel", (e) => e.preventDefault());
  $("#lf").onsubmit = async (e) => {
    e.preventDefault();
    const msg = $("#loginMsg");
    msg.hidden = true;
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: $("#loginEmail").value.trim(),
          senha: $("#loginSenha").value
        })
      });
      authToken = res.token;
      sessionStorage.setItem("vigia_ti_token", authToken);
      $("#login").close();
      await bootstrapApp();
      showToast(`Bem-vindo(a), ${res.user.nome} (${res.user.perfil})`);
    } catch (err) {
      msg.textContent = err.message;
      msg.hidden = false;
    }
  };

  // Cadastro de nova conta contra /api/auth/register
  $("#rf").onsubmit = async (e) => {
    e.preventDefault();
    const msg = $("#regMsg");
    msg.hidden = true;
    const senha = $("#regSenha").value;
    const senha2 = $("#regSenha2").value;
    if (senha !== senha2) {
      msg.className = "auth-msg err";
      msg.textContent = "As senhas não coincidem.";
      msg.hidden = false;
      return;
    }
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nome: $("#regNome").value.trim(),
          email: $("#regEmail").value.trim(),
          setor: $("#regSetor").value.trim(),
          senha
        })
      });
      $("#rf").reset();
      msg.className = "auth-msg ok";
      msg.textContent = res.message;
      msg.hidden = false;
    } catch (err) {
      msg.className = "auth-msg err";
      msg.textContent = err.message;
      msg.hidden = false;
    }
  };

  $("#troca").onclick = () => {
    authToken = "";
    U = null;
    sessionStorage.removeItem("vigia_ti_token");
    switchAuthTab("login");
    renderAll();
  };

  ["#q", "#fSetor", "#fSit", "#fCat", "#fPapel", "#fGov", "#fRisco"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", renderTabelaSistemas);
  });

  if ($("#btnLimparFiltros")) {
    $("#btnLimparFiltros").onclick = () => {
      ["#q", "#fSetor", "#fSit", "#fCat", "#fPapel", "#fGov", "#fRisco"].forEach((id) => {
        const el = $(id);
        if (el) el.value = "";
      });
      renderTabelaSistemas();
    };
  }

  bootstrapApp();
});
