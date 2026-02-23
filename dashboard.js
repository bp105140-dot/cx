// Register datalabels plugin globally
Chart.register(ChartDataLabels);

let RAW_DATA = [];

// ============================================================
// UTILS
// ============================================================
const avg = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const fmt = (n) => (n != null ? Math.round(n) : "—");

// Normalise any date string to ISO yyyy-mm-dd for comparisons
function toISO(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return str.slice(0, 10);
}

// Format ISO date (or any date) to dd/mm/yyyy for display
function fmtDate(str) {
  const iso = toISO(str);
  if (!iso) return str || "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const DAYS_ORDER = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
];

const MONTH_ORDER = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

// Sort months in calendar order from a set of month name strings
function sortMonths(monthSet) {
  return [...monthSet].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
}
const COLORS = [
  "#00d4ff",
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
];

// Charts registry
const CHARTS = {};
let showLabels = false;

function toggleLabels() {
  showLabels = !showLabels;
  const btn = document.getElementById("btn-labels");
  btn.textContent = "";
  const dot = document.createElement("span");
  dot.className = "lbl-dot";
  btn.appendChild(dot);
  btn.appendChild(
    document.createTextNode(" Rótulos: " + (showLabels ? "ON" : "OFF")),
  );
  btn.classList.toggle("on", showLabels);
  renderAll();
}
function injectDatalabels(cfg) {
  if (!cfg.options) cfg.options = {};
  if (!cfg.options.plugins) cfg.options.plugins = {};
  const isDoughnut = cfg.type === "doughnut" || cfg.type === "pie";
  const isLine = cfg.type === "line";
  cfg.options.plugins.datalabels = {
    display: showLabels,
    color: "#e2e8f0",
    font: { family: "DM Sans", size: 11, weight: "400" },
    formatter: (value) => {
      if (value === 0 || value == null) return null;
      if (typeof value === "number") {
        if (value >= 1000) return (value / 1000).toFixed(1) + "k";
        return Math.round(value);
      }
      return value;
    },
    anchor: isDoughnut ? "center" : cfg.options.indexAxis === "y" ? "end" : "end",
    align:  isDoughnut ? "center" : cfg.options.indexAxis === "y" ? "right" : "top",
    offset: isDoughnut ? 0 : isLine ? 8 : 6,
    clamp: true, clip: false, padding: 0,
    backgroundColor: null, borderRadius: 0,
  };
}

function makeChart(id, cfg) {
  if (CHARTS[id]) CHARTS[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return;
  injectDatalabels(cfg);
  CHARTS[id] = new Chart(ctx, cfg);
  return CHARTS[id];
}

const baseChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#94a3b8", font: { family: "DM Sans", size: 11 } },
    },
    tooltip: {
      backgroundColor: "#1e2840",
      titleColor: "#e2e8f0",
      bodyColor: "#94a3b8",
      borderColor: "#263050",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: "#64748b", font: { size: 10 } },
      grid: { color: "rgba(38,48,80,0.5)" },
    },
    y: {
      ticks: { color: "#64748b", font: { size: 10 } },
      grid: { color: "rgba(38,48,80,0.5)" },
    },
  },
};

// Populate filters
function populateFilters() {
  const agents = [...new Set(RAW_DATA.map((r) => r.ag))].sort();
  const sel = document.getElementById("f-agent");
  sel.innerHTML = '<option value="">Todos</option>';
  agents.forEach((a) => {
    const o = document.createElement("option");
    o.value = a;
    o.textContent = a;
    sel.appendChild(o);
  });

  const tabs = [...new Set(RAW_DATA.map((r) => r.tb).filter(Boolean))].sort();
  const sel2 = document.getElementById("f-tab");
  sel2.innerHTML = '<option value="">Todas</option>';
  tabs.forEach((t) => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    sel2.appendChild(o);
  });

  const months = sortMonths(new Set(RAW_DATA.map((r) => r.mo).filter(Boolean)));
  const sel4 = document.getElementById("f-month");
  sel4.innerHTML = '<option value="">Todos</option>';
  months.forEach((m) => {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = m;
    sel4.appendChild(o);
  });

  const statuses = [...new Set(RAW_DATA.map((r) => r.st))].sort();
  const sel5 = document.getElementById("f-status");
  sel5.innerHTML = '<option value="">Todos</option>';
  statuses.forEach((s) => {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    sel5.appendChild(o);
  });

  const motivos = [...new Set(RAW_DATA.map((r) => r.mt))].sort();
  const sel6 = document.getElementById("f-motivo");
  sel6.innerHTML = '<option value="">Todos</option>';
  motivos.forEach((m) => {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = m;
    sel6.appendChild(o);
  });

  const days = DAYS_ORDER;
  const sel3 = document.getElementById("f-day");
  sel3.innerHTML = '<option value="">Todos</option>';
  days.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    sel3.appendChild(o);
  });
}

let filteredData = [];

function getFilters() {
  return {
    month: document.getElementById("f-month").value,
    agent: document.getElementById("f-agent").value,
    status: document.getElementById("f-status").value,
    motivo: document.getElementById("f-motivo").value,
    tab: document.getElementById("f-tab").value,
    day: document.getElementById("f-day").value,
    dateFrom: document.getElementById("f-date-from").value, // yyyy-mm-dd (input type=date)
    dateTo: document.getElementById("f-date-to").value,
  };
}

function applyFilters() {
  const f = getFilters();
  filteredData = RAW_DATA.filter((r) => {
    if (f.month && r.mo !== f.month) return false;
    if (f.agent && r.ag !== f.agent) return false;
    if (f.status && r.st !== f.status) return false;
    if (f.motivo && r.mt !== f.motivo) return false;
    if (f.tab && r.tb !== f.tab) return false;
    if (f.day && r.dw !== f.day) return false;
    if (f.dateFrom || f.dateTo) {
      const iso = toISO(r.dt);
      if (iso) {
        if (f.dateFrom && iso < f.dateFrom) return false;
        if (f.dateTo && iso > f.dateTo) return false;
      }
    }
    return true;
  });
  renderAll();
}

function clearFilters() {
  ["f-month", "f-agent", "f-status", "f-motivo", "f-tab", "f-day"].forEach(
    (id) => { document.getElementById(id).value = ""; },
  );
  // Reset date range to full data range
  const isoDates = RAW_DATA.map((r) => toISO(r.dt)).filter(Boolean).sort();
  if (isoDates.length) {
    document.getElementById("f-date-from").value = isoDates[0];
    document.getElementById("f-date-to").value = isoDates[isoDates.length - 1];
  }
  applyFilters();
}

// ============================================================
// RENDER ALL
// ============================================================
function renderAll() {
  const d = filteredData;
  renderExecutive(d);
  renderSLA(d);
  renderTeam(d);
  renderCauses(d);
  renderOperational(d);
}

// ============================================================
// ABA 1: EXECUTIVA
// ============================================================
function renderExecutive(d) {
  const total = d.length;
  const closed = d.filter((r) => r.st === "Closed" || r.st === "Solved").length;
  const frVals = d.map((r) => r.fr).filter((v) => v != null);
  const trVals = d.map((r) => r.tr).filter((v) => v != null);
  const clients = new Set(d.map((r) => r.ci));
  const clientCounts = {};
  d.forEach((r) => {
    clientCounts[r.ci] = (clientCounts[r.ci] || 0) + 1;
  });
  const recurrent = Object.values(clientCounts).filter((v) => v > 1).length;

  // Daily avg
  const daysSet = new Set(d.map((r) => r.dt));
  const dailyAvg = daysSet.size ? total / daysSet.size : 0;

  document.getElementById("kpi-total").textContent =
    total.toLocaleString("pt-BR");
  document.getElementById("kpi-total-sub").textContent =
    `${daysSet.size} dias ativos`;
  document.getElementById("kpi-closed-pct").textContent =
    pct(closed, total) + "%";
  document.getElementById("kpi-closed-sub").textContent =
    `${closed} fechados / ${total - closed} abertos`;
  document.getElementById("kpi-daily-avg").textContent = dailyAvg.toFixed(1);
  document.getElementById("kpi-fr-avg").textContent = fmt(avg(frVals));
  document.getElementById("kpi-tr-avg").textContent = fmt(avg(trVals));
  document.getElementById("kpi-clients").textContent =
    clients.size.toLocaleString("pt-BR");
  document.getElementById("kpi-recurrent").textContent =
    `${recurrent} reincidentes`;
  document.getElementById("kpi-recurrent-pct").textContent =
    pct(recurrent, clients.size) + "%";
  const sla5 = frVals.filter((v) => v <= 5).length;
  document.getElementById("kpi-sla5").textContent =
    pct(sla5, frVals.length) + "%";

  // Header — update ticket count (date inputs stay as-is, user edits them directly)
  document.getElementById("hdr-total").textContent = total.toLocaleString("pt-BR");
  document.getElementById("vol-badge").textContent = `${daysSet.size} dias`;

  // Chart: volume by date
  const dateCount = {};
  d.forEach((r) => {
    dateCount[r.dt] = (dateCount[r.dt] || 0) + 1;
  });
  const sortedDates = Object.keys(dateCount).sort((a, b) => (toISO(a) > toISO(b) ? 1 : -1));
  makeChart("chart-volume-day", {
    type: "line",
    data: {
      labels: sortedDates.map(fmtDate),
      datasets: [
        {
          label: "Tickets",
          data: sortedDates.map((dt) => dateCount[dt]),
          borderColor: "#00d4ff",
          backgroundColor: "rgba(0,212,255,0.08)",
          fill: true,
          tension: 0.4,
          pointRadius: sortedDates.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // Chart: status pie
  const statusCount = {};
  d.forEach((r) => {
    statusCount[r.st] = (statusCount[r.st] || 0) + 1;
  });
  makeChart("chart-status", {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCount),
      datasets: [
        {
          data: Object.values(statusCount),
          backgroundColor: ["#10b981", "#00d4ff", "#f59e0b"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          labels: { color: "#94a3b8", font: { size: 11 } },
          position: "bottom",
        },
        tooltip: {
          backgroundColor: "#1e2840",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          borderColor: "#263050",
          borderWidth: 1,
        },
      },
    },
  });

  // Chart: month bar
  const monthCount = {};
  d.forEach((r) => {
    monthCount[r.mo] = (monthCount[r.mo] || 0) + 1;
  });
  makeChart("chart-month", {
    type: "bar",
    data: {
      labels: Object.keys(monthCount),
      datasets: [
        {
          label: "Tickets",
          data: Object.values(monthCount),
          backgroundColor: "#7c3aed",
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // Chart: day of week
  const dayCount = {};
  DAYS_ORDER.forEach((d2) => (dayCount[d2] = 0));
  d.forEach((r) => {
    if (dayCount[r.dw] !== undefined) dayCount[r.dw]++;
  });
  makeChart("chart-dayofweek", {
    type: "bar",
    data: {
      labels: DAYS_ORDER.map((d2) => d2.replace("-feira", "")),
      datasets: [
        {
          label: "Tickets",
          data: DAYS_ORDER.map((d2) => dayCount[d2]),
          backgroundColor: COLORS,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // Chart: motivo pie
  const motivoCount = {};
  d.forEach((r) => {
    motivoCount[r.mt] = (motivoCount[r.mt] || 0) + 1;
  });
  makeChart("chart-motivo-pie", {
    type: "doughnut",
    data: {
      labels: Object.keys(motivoCount),
      datasets: [
        {
          data: Object.values(motivoCount),
          backgroundColor: ["#00d4ff", "#7c3aed", "#ef4444"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          labels: { color: "#94a3b8", font: { size: 11 } },
          position: "bottom",
        },
        tooltip: {
          backgroundColor: "#1e2840",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          borderColor: "#263050",
          borderWidth: 1,
        },
      },
    },
  });
}

// ============================================================
// ABA 2: SLA
// ============================================================
function renderSLA(d) {
  const frVals = d.map((r) => r.fr).filter((v) => v != null);
  const trVals = d.map((r) => r.tr).filter((v) => v != null);
  const arVals = d.map((r) => r.ar).filter((v) => v != null);

  document.getElementById("sla-fr-avg").textContent = fmt(avg(frVals));
  document.getElementById("sla-fr-med").textContent = fmt(median(frVals));
  document.getElementById("sla-fr-5").textContent =
    pct(frVals.filter((v) => v <= 5).length, frVals.length) + "%";
  document.getElementById("sla-fr-15").textContent =
    pct(frVals.filter((v) => v <= 15).length, frVals.length) + "%";

  const f1 = frVals.filter((v) => v <= 5).length;
  const f2 = frVals.filter((v) => v > 5 && v <= 15).length;
  const f3 = frVals.filter((v) => v > 15 && v <= 60).length;
  const f4 = frVals.filter((v) => v > 60).length;

  document.getElementById("fr-faixa-0-5").textContent =
    pct(f1, frVals.length) + "%";
  document.getElementById("fr-faixa-5-15").textContent =
    pct(f2, frVals.length) + "%";
  document.getElementById("fr-faixa-15-60").textContent =
    pct(f3, frVals.length) + "%";
  document.getElementById("fr-faixa-60p").textContent =
    pct(f4, frVals.length) + "%";

  document.getElementById("sla-tr-avg").textContent = fmt(avg(trVals));
  document.getElementById("sla-tr-med").textContent = fmt(median(trVals));
  document.getElementById("sla-tr-4h").textContent =
    pct(trVals.filter((v) => v <= 240).length, trVals.length) + "%";
  document.getElementById("sla-ar-avg").textContent = fmt(avg(arVals));

  // FR Distribution chart
  makeChart("chart-fr-dist", {
    type: "bar",
    data: {
      labels: ["0–5 min", "5–15 min", "15–60 min", "+60 min"],
      datasets: [
        {
          label: "Tickets",
          data: [f1, f2, f3, f4],
          backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // TR Distribution chart
  const t1 = trVals.filter((v) => v <= 60).length;
  const t2 = trVals.filter((v) => v > 60 && v <= 240).length;
  const t3 = trVals.filter((v) => v > 240 && v <= 480).length;
  const t4 = trVals.filter((v) => v > 480).length;
  makeChart("chart-tr-dist", {
    type: "bar",
    data: {
      labels: ["0–1h", "1–4h", "4–8h", "+8h"],
      datasets: [
        {
          label: "Tickets",
          data: [t1, t2, t3, t4],
          backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // SLA Trend (by month) - FR and TR avg — dynamic months from data
  const months = sortMonths(new Set(d.map((r) => r.mo).filter(Boolean)));
  const mFR = months.map((m) =>
    avg(
      d
        .filter((r) => r.mo === m)
        .map((r) => r.fr)
        .filter((v) => v != null),
    ),
  );
  const mTR = months.map((m) =>
    avg(
      d
        .filter((r) => r.mo === m)
        .map((r) => r.tr)
        .filter((v) => v != null),
    ),
  );
  makeChart("chart-sla-trend", {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "FR Médio (min)",
          data: mFR,
          borderColor: "#00d4ff",
          backgroundColor: "rgba(0,212,255,0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "TR Médio (min)",
          data: mTR.map((v) => v / 10),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.05)",
          fill: true,
          tension: 0.4,
          yAxisID: "y2",
        },
      ],
    },
    options: {
      ...baseChartOpts,
      scales: {
        x: {
          ticks: { color: "#64748b" },
          grid: { color: "rgba(38,48,80,0.5)" },
        },
        y: {
          // Usamos Math.round(v) para garantir que o eixo da esquerda não tenha decimais gigantes
          ticks: { color: "#64748b", callback: (v) => Math.round(v) + "min" },
          grid: { color: "rgba(38,48,80,0.5)" },
        },
        y2: {
          position: "right",
          // Usamos Math.round(v * 10) para arredondar a multiplicação antes de colocar o "min"
          ticks: {
            color: "#ef4444",
            callback: (v) => Math.round(v * 10) + "min",
          },
          grid: { display: false },
        },
      },
    },
  });

  // FR by day of week
  const dayFR = {};
  DAYS_ORDER.forEach((dw) => {
    const vals = d
      .filter((r) => r.dw === dw)
      .map((r) => r.fr)
      .filter((v) => v != null);
    dayFR[dw] = avg(vals);
  });
  makeChart("chart-fr-dayofweek", {
    type: "bar",
    data: {
      labels: DAYS_ORDER.map((d2) => d2.replace("-feira", "")),
      datasets: [
        {
          label: "FR Médio (min)",
          data: DAYS_ORDER.map((dw) => Math.round(dayFR[dw] || 0)),
          backgroundColor: "#7c3aed",
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });
}

// ============================================================
// ABA 3: EQUIPE
// ============================================================
function renderTeam(d) {
  const agentStats = {};
  d.forEach((r) => {
    if (!agentStats[r.ag])
      agentStats[r.ag] = { count: 0, fr: [], tr: [], name: r.ag };
    agentStats[r.ag].count++;
    if (r.fr != null) agentStats[r.ag].fr.push(r.fr);
    if (r.tr != null) agentStats[r.ag].tr.push(r.tr);
  });

  const agents = Object.values(agentStats).sort((a, b) => b.count - a.count);
  const total = d.length;

  // Helper: set chart-wrap height dynamically based on item count
  function setChartHeight(canvasId, itemCount) {
    const wrap = document.getElementById(canvasId).parentElement;
    wrap.style.height = Math.max(200, itemCount * 24 + 40) + "px";
  }

  // Volume chart
  setChartHeight("chart-agent-vol", agents.length);
  makeChart("chart-agent-vol", {
    type: "bar",
    data: {
      labels: agents.map((a) => a.name),
      datasets: [
        {
          label: "Tickets",
          data: agents.map((a) => a.count),
          backgroundColor: agents.map((_, i) => COLORS[i % COLORS.length]),
          borderRadius: 4,
          barThickness: 14,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
      scales: {
        ...baseChartOpts.scales,
        y: {
          ...baseChartOpts.scales.y,
          ticks: {
            ...baseChartOpts.scales.y.ticks,
            autoSkip: false,
          },
        },
      },
    },
  });

  // FR chart
  const agentsSortFR = [...agents].sort((a, b) => avg(a.fr) - avg(b.fr));
  setChartHeight("chart-agent-fr", agentsSortFR.length);
  makeChart("chart-agent-fr", {
    type: "bar",
    data: {
      labels: agentsSortFR.map((a) => a.name),
      datasets: [
        {
          label: "FR Médio (min)",
          data: agentsSortFR.map((a) => Math.round(avg(a.fr))),
          backgroundColor: "rgba(0,212,255,0.7)",
          borderRadius: 4,
          barThickness: 14,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
      scales: {
        ...baseChartOpts.scales,
        y: {
          ...baseChartOpts.scales.y,
          ticks: { ...baseChartOpts.scales.y.ticks, autoSkip: false },
        },
      },
    },
  });

  // TR chart
  const agentsSortTR = [...agents].sort((a, b) => avg(a.tr) - avg(b.tr));
  setChartHeight("chart-agent-tr", agentsSortTR.length);
  makeChart("chart-agent-tr", {
    type: "bar",
    data: {
      labels: agentsSortTR.map((a) => a.name),
      datasets: [
        {
          label: "TR Médio (min)",
          data: agentsSortTR.map((a) => Math.round(avg(a.tr))),
          backgroundColor: "rgba(239,68,68,0.7)",
          borderRadius: 4,
          barThickness: 14,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
      scales: {
        ...baseChartOpts.scales,
        y: {
          ...baseChartOpts.scales.y,
          ticks: { ...baseChartOpts.scales.y.ticks, autoSkip: false },
        },
      },
    },
  });

  // Table
  const tbody = document.getElementById("agent-table");
  tbody.innerHTML = "";
  agents.forEach((a, i) => {
    const frAvg = Math.round(avg(a.fr));
    const trAvg = Math.round(avg(a.tr));
    const frMed = Math.round(median(a.fr));
    const trMed = Math.round(median(a.tr));
    const barW = Math.round((a.count / agents[0].count) * 100);
    tbody.innerHTML += `<tr>
<td><span class="rank-num">${i + 1}</span></td>
<td style="color:#e2e8f0;font-weight:500">${a.name}</td>
<td>${a.count}<div class="agent-bar"><div class="agent-bar-fill" style="width:${barW}%"></div></div></td>
<td>${pct(a.count, total)}%</td>
<td style="color:${frAvg <= 30 ? "#10b981" : frAvg <= 60 ? "#f59e0b" : "#ef4444"}">${frAvg}</td>
<td style="color:${trAvg <= 120 ? "#10b981" : trAvg <= 300 ? "#f59e0b" : "#ef4444"}">${trAvg}</td>
<td>${frMed}</td>
<td>${trMed}</td>
    </tr>`;
  });
}

// ============================================================
// ABA 4: CAUSAS
// ============================================================
function renderCauses(d) {
  // Motivo bar
  const motivoCount = {};
  d.forEach((r) => {
    motivoCount[r.mt] = (motivoCount[r.mt] || 0) + 1;
  });
  makeChart("chart-motivo-bar", {
    type: "bar",
    data: {
      labels: Object.keys(motivoCount),
      datasets: [
        {
          label: "Tickets",
          data: Object.values(motivoCount),
          backgroundColor: ["#00d4ff", "#7c3aed", "#ef4444"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // Tabulação bar
  const tabCount = {};
  d.forEach((r) => {
    if (r.tb) tabCount[r.tb] = (tabCount[r.tb] || 0) + 1;
  });
  const tabSorted = Object.entries(tabCount).sort((a, b) => b[1] - a[1]);
  makeChart("chart-tab-bar", {
    type: "bar",
    data: {
      labels: tabSorted.map((e) => e[0]),
      datasets: [
        {
          label: "Tickets",
          data: tabSorted.map((e) => e[1]),
          backgroundColor: COLORS,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // Sub-motivos
  function subChart(id, field) {
    const cnt = {};
    d.forEach((r) => {
      if (r[field]) cnt[r[field]] = (cnt[r[field]] || 0) + 1;
    });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    makeChart(id, {
      type: "bar",
      data: {
        labels: sorted.map((e) => e[0]),
        datasets: [
          {
            label: "Tickets",
            data: sorted.map((e) => e[1]),
            backgroundColor: COLORS,
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...baseChartOpts,
        indexAxis: "y",
        plugins: { ...baseChartOpts.plugins, legend: { display: false } },
        scales: {
          ...baseChartOpts.scales,
          y: {
            ...baseChartOpts.scales.y,
            ticks: {
              ...baseChartOpts.scales.y.ticks,
              autoSkip: false, // <--- Esta é a regra que força exibir todos os nomes
            },
          },
        },
      },
    });
  }
  subChart("chart-sub-pedidos", "sp");
  subChart("chart-sub-entrega", "se");
  subChart("chart-sub-assist", "ss");
  subChart("chart-sub-atend", "sa");

  // Pareto
  const combined = {};
  d.forEach((r) => {
    const sub = r.sp || r.se || r.ss || r.sa || r.sr || "(sem submotivo)";
    const key = (r.tb || r.mt) + " › " + sub;
    combined[key] = (combined[key] || 0) + 1;
  });
  const sorted = Object.entries(combined).sort((a, b) => b[1] - a[1]);
  const total = d.length;
  let cumPct = 0;
  const paretoEl = document.getElementById("pareto-list");
  paretoEl.innerHTML = "";
  const colors = [
    "#00d4ff",
    "#7c3aed",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#06b6d4",
    "#f97316",
    "#84cc16",
    "#ec4899",
  ];
  sorted.slice(0, 15).forEach((e, i) => {
    const pctThis = pct(e[1], total);
    cumPct += pctThis;
    const color = colors[i % colors.length];
    paretoEl.innerHTML += `<div class="pareto-line">
<div class="pareto-rank">${i + 1}</div>
<div class="pareto-info">
  <div class="pareto-name">${e[0]}</div>
  <div class="pareto-count">${e[1]} tickets · Acumulado: ${cumPct}%</div>
</div>
<div class="pareto-pct">${pctThis}%</div>
<div class="pareto-bar-wrap">
  <div class="pareto-bar"><div class="pareto-bar-fill" style="width:${pct(e[1], sorted[0][1])}%;background:${color}"></div></div>
</div>
    </div>`;
    if (cumPct >= 80 && i < 14) {
      paretoEl.innerHTML += `<div style="text-align:center;padding:8px;font-size:11px;color:#f59e0b">▲ 80% do volume acumulado acima</div>`;
    }
  });

  // Motivo por Mês — dynamic months
  const months = sortMonths(new Set(d.map((r) => r.mo).filter(Boolean)));
  const motivos = [...new Set(d.map((r) => r.mt).filter(Boolean))];
  makeChart("chart-motivo-month", {
    type: "bar",
    data: {
      labels: months,
      datasets: motivos.map((m, i) => ({
        label: m,
        data: months.map(
          (mo) => d.filter((r) => r.mo === mo && r.mt === m).length,
        ),
        backgroundColor: ["#00d4ff", "#7c3aed", "#ef4444"][i],
        borderRadius: 4,
      })),
    },
    options: { ...baseChartOpts, plugins: { ...baseChartOpts.plugins } },
  });

  // Tabulação por Mês
  const tabs = tabSorted.slice(0, 5).map((e) => e[0]);
  makeChart("chart-tab-month", {
    type: "bar",
    data: {
      labels: months,
      datasets: tabs.map((t, i) => ({
        label: t,
        data: months.map(
          (mo) => d.filter((r) => r.mo === mo && r.tb === t).length,
        ),
        backgroundColor: COLORS[i],
        borderRadius: 4,
      })),
    },
    options: { ...baseChartOpts },
  });
}

// ============================================================
// ABA 5: OPERACIONAL
// ============================================================
function renderOperational(d) {
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

  // Heatmap Volume
  function buildHeatmap(containerId, getValue, colorFn, unit) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const grid = document.createElement("div");
    const cols = HOURS.length + 1;
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "80px " + HOURS.map(() => "1fr").join(" ");
    grid.style.gap = "3px";

    // Header
    const empty = document.createElement("div");
    grid.appendChild(empty);
    HOURS.forEach((h) => {
      const el = document.createElement("div");
      el.className = "hm-header";
      el.textContent = h + "h";
      el.style.color = "#64748b";
      el.style.fontSize = "10px";
      grid.appendChild(el);
    });

    // Rows
    DAYS_ORDER.forEach((day) => {
      const rowLabel = document.createElement("div");
      rowLabel.className = "hm-row-label";
      rowLabel.textContent = day.replace("-feira", "");
      grid.appendChild(rowLabel);

      const vals = HOURS.map((h) => getValue(d, day, h));
      const maxVal = Math.max(...vals, 1);

      HOURS.forEach((h, i) => {
        const v = vals[i];
        const intensity = v / maxVal;
        const el = document.createElement("div");
        el.className = "hm-cell";
        el.style.background = colorFn(intensity);
        el.style.color = intensity > 0.5 ? "#fff" : "#64748b";
        el.textContent = v ? (unit === "min" ? Math.round(v) : v) : "";
        el.title = `${day} ${h}h: ${v} ${unit}`;
        grid.appendChild(el);
      });
    });

    container.appendChild(grid);
  }

  buildHeatmap(
    "heatmap-volume",
    (d, day, h) => d.filter((r) => r.dw === day && r.hr === h).length,
    (i) => `rgba(0,212,255,${Math.max(0.05, i * 0.9)})`,
    "tickets",
  );

  buildHeatmap(
    "heatmap-fr",
    (d, day, h) => {
      const vals = d
        .filter((r) => r.dw === day && r.hr === h)
        .map((r) => r.fr)
        .filter((v) => v != null);
      return vals.length ? Math.round(avg(vals)) : 0;
    },
    (i) => {
      if (i < 0.01) return "rgba(255,255,255,0.03)";
      const r = Math.round(255 * i);
      const g = Math.round(100 * (1 - i));
      return `rgba(${r},${g},50,${Math.max(0.1, i * 0.8)})`;
    },
    "min",
  );

  // Volume by hour
  const hourVol = {};
  HOURS.forEach((h) => (hourVol[h] = 0));
  d.forEach((r) => {
    if (hourVol[r.hr] !== undefined) hourVol[r.hr]++;
    else hourVol[r.hr] = (hourVol[r.hr] || 0) + 1;
  });
  makeChart("chart-hour-vol", {
    type: "bar",
    data: {
      labels: Object.keys(hourVol)
        .sort((a, b) => a - b)
        .map((h) => h + "h"),
      datasets: [
        {
          label: "Tickets",
          data: Object.keys(hourVol)
            .sort((a, b) => a - b)
            .map((h) => hourVol[h]),
          backgroundColor: "rgba(0,212,255,0.7)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // FR by hour
  const hourFR = {};
  HOURS.forEach((h) => {
    const vals = d
      .filter((r) => r.hr === h)
      .map((r) => r.fr)
      .filter((v) => v != null);
    hourFR[h] = vals.length ? Math.round(avg(vals)) : 0;
  });
  makeChart("chart-hour-fr", {
    type: "bar",
    data: {
      labels: Object.keys(hourFR)
        .sort((a, b) => a - b)
        .map((h) => h + "h"),
      datasets: [
        {
          label: "FR Médio (min)",
          data: Object.keys(hourFR)
            .sort((a, b) => a - b)
            .map((h) => hourFR[h]),
          backgroundColor: "rgba(245,158,11,0.7)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...baseChartOpts,
      plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    },
  });

  // Top 10 clients
  const clientCounts = {};
  d.forEach((r) => {
    if (!clientCounts[r.ci]) clientCounts[r.ci] = { count: 0, motivos: {} };
    clientCounts[r.ci].count++;
    clientCounts[r.ci].motivos[r.mt] =
      (clientCounts[r.ci].motivos[r.mt] || 0) + 1;
  });
  const top10 = Object.entries(clientCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  const tbody = document.getElementById("top-clients-table");
  tbody.innerHTML = "";
  top10.forEach(([ci, v], i) => {
    const topMotivos = Object.entries(v.motivos)
      .sort((a, b) => b[1] - a[1])
      .map((e) => `${e[0]} (${e[1]})`)
      .join(", ");
    const shortId = ci.slice(-8);
    tbody.innerHTML += `<tr>
<td><span class="rank-num">${i + 1}</span></td>
<td style="font-family:monospace;color:#00d4ff">...${shortId}</td>
<td style="font-weight:600;color:#fff">${v.count}</td>
<td style="color:#94a3b8">${topMotivos}</td>
    </tr>`;
  });
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(id) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const idx = ["aba1", "aba2", "aba3", "aba4", "aba5"].indexOf(id);
  document.querySelectorAll(".tab-btn")[idx].classList.add("active");
  renderAll();
}

// Sort table helper
function sortTable(tbodyId, colIdx) {
  const tbody = document.getElementById(tbodyId);
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const dir = tbody.dataset.sortDir === "asc" ? -1 : 1;
  tbody.dataset.sortDir = dir === 1 ? "asc" : "desc";
  rows.sort((a, b) => {
    const aVal = a.cells[colIdx].textContent.replace(/[^0-9.\-]/g, "");
    const bVal = b.cells[colIdx].textContent.replace(/[^0-9.\-]/g, "");
    return dir * (parseFloat(aVal) || 0 - parseFloat(bVal) || 0);
  });
  rows.forEach((r) => tbody.appendChild(r));
}

// ============================================================
// CSV IMPORT
// ============================================================
// Mapeamento dos cabeçalhos reais do CSV para as chaves internas do dashboard
const CSV_HEADER_MAP = {
  "Criação do ticket Data": "dt",        // formato antigo
  "Criação do ticket - Data": "dt",      // formato novo (com " - ")
  "Criação do ticket - Mês": "mo",
  "Criação do ticket - Dia da semana": "dw",
  "Criação do ticket - Hora": "hr",
  "ID do ticket": "id",
  "Status do ticket": "st",
  "Canal do ticket": "ch",
  "Nome do atribuído": "ag",
  "ID do solicitante": "ci",
  "Motivo do Contato:": "mt",
  "Tabulação Whatsapp:": "tb",
  "Submotivo: Ocorrência na Entrega": "se",
  "Submotivo: Atendimento": "sa",
  "Submotivo: Assistência Técnica": "ss",
  "Submotivo: Reclamações Internas": "sr",
  "Submotivo: Pedidos": "sp",
  "Tempo da primeira resposta (min)": "fr",
  "Tempo total de resolução (min)": "tr",
  "Tempo da primeira atribuição até a resolução (min)": "ar",
};

function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Try latin-1 first (Zendesk exports), fallback to UTF-8
  const tryParse = (encoding) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = parseCSV(e.target.result);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, encoding);
    });

  // Smart encoding detection: try UTF-8 first, validate by checking known Portuguese month names
  // If months are garbled (windows-1252 file read as UTF-8), retry with windows-1252
  const PT_MONTHS = new Set(["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]);

  tryParse("utf-8").then((parsed) => {
    if (parsed.length > 0) {
      const sampleMo = parsed[0].mo || "";
      if (sampleMo && !PT_MONTHS.has(sampleMo)) {
        // Garbled — retry as windows-1252
        return tryParse("windows-1252");
      }
    }
    return parsed;
  })
    .then((parsed) => {
      if (!parsed.length) {
        showToast("⚠️ Nenhum registro encontrado no CSV.", true);
        return;
      }
      RAW_DATA = parsed;
      populateFilters();
      // Auto-set date range from data
      const isoDates = parsed.map((r) => toISO(r.dt)).filter(Boolean).sort();
      if (isoDates.length) {
        const minD = isoDates[0];
        const maxD = isoDates[isoDates.length - 1];
        const fromEl = document.getElementById("f-date-from");
        const toEl = document.getElementById("f-date-to");
        fromEl.min = minD; fromEl.max = maxD; fromEl.value = minD;
        toEl.min = minD; toEl.max = maxD; toEl.value = maxD;
      }
      filteredData = RAW_DATA;
      clearFilters();
      document.getElementById("empty-state").style.display = "none";
      document
        .querySelectorAll(".tab-content")
        .forEach((el) => (el.style.display = ""));
      renderAll();
      enablePresentationButton();
      showToast(
        "✅ " +
          parsed.length.toLocaleString("pt-BR") +
          " tickets importados com sucesso!",
      );
    })
    .catch((err) =>
      showToast("❌ Erro ao processar CSV: " + err.message, true),
    );

  event.target.value = "";
}

function parseCSV(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) return [];
  const rawHeaders = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (!vals.length || vals.every((v) => !v.trim())) continue;
    const obj = {};

    rawHeaders.forEach((h, idx) => {
      const key = CSV_HEADER_MAP[h.trim()] || h.trim();
      // Strip regular whitespace AND non-breaking spaces (\xa0) from all values
      let val = vals[idx] !== undefined ? vals[idx].replace(/[\u00a0\u200b\ufeff]/g, " ").trim() : "";
      obj[key] = val;
    });

    // Limpar emoji/caracteres especiais do nome do agente
    if (obj.ag) obj.ag = obj.ag.replace(/[^\w\sÀ-ú]/gu, "").trim();

    // Converter campos numéricos
    obj.hr = parseInt(obj.hr) || 0;
    obj.fr = obj.fr !== "" ? parseFloat(obj.fr) || null : null;
    obj.tr = obj.tr !== "" ? parseFloat(obj.tr) || null : null;
    obj.ar = obj.ar !== "" ? parseFloat(obj.ar) || null : null;

    rows.push(obj);
  }
  return rows;
}

function parseLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if ((c === "," || c === ";") && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function showToast(msg, isError) {
  const toast = document.getElementById("import-toast");
  const msgEl = document.getElementById("toast-msg");
  msgEl.textContent = msg;
  toast.style.borderColor = isError ? "#ef4444" : "var(--accent)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}


// ============================================================
// MODO APRESENTAÇÃO
// ============================================================

const PRES_SLIDES = [
  // ── Aba 1: Visão Executiva ──────────────────────────────────
  { id: "kpis",         label: "📊 KPIs Principais",                  agentData: false, group: "Visão Executiva" },
  { id: "volume",       label: "📈 Volume por Data",                   agentData: false, group: "Visão Executiva" },
  { id: "volume-month", label: "🗓️ Volume por Mês",                    agentData: false, group: "Visão Executiva" },
  { id: "status",       label: "🔵 Distribuição de Status",            agentData: false, group: "Visão Executiva" },
  { id: "dayofweek",    label: "📅 Volume por Dia da Semana",          agentData: false, group: "Visão Executiva" },
  { id: "motivo-pie",   label: "💬 Motivo do Contato (pizza)",         agentData: false, group: "Visão Executiva" },
  // ── Aba 2: SLA ──────────────────────────────────────────────
  { id: "sla-fr",       label: "⚡ SLA — 1ª Resposta (faixas)",       agentData: false, group: "SLA & Eficiência" },
  { id: "sla-tr",       label: "⏳ SLA — Resolução (faixas)",         agentData: false, group: "SLA & Eficiência" },
  { id: "sla-trend",    label: "📈 Evolução Mensal FR e TR",           agentData: false, group: "SLA & Eficiência" },
  { id: "fr-dayofweek", label: "🗓️ FR Médio por Dia da Semana",       agentData: false, group: "SLA & Eficiência" },
  // ── Aba 3: Equipe ───────────────────────────────────────────
  { id: "agents-vol",   label: "🏆 Ranking Agentes — Volume",         agentData: true,  group: "Performance da Equipe" },
  { id: "agents-fr",    label: "🏅 Ranking Agentes — 1ª Resposta",    agentData: true,  group: "Performance da Equipe" },
  { id: "agents-tr",    label: "⏱️ Ranking Agentes — Resolução",      agentData: true,  group: "Performance da Equipe" },
  { id: "agent-table",  label: "📋 Tabela Detalhada de Agentes",       agentData: true,  group: "Performance da Equipe" },
  // ── Aba 4: Motivos ──────────────────────────────────────────
  { id: "motivos",      label: "📞 Motivos de Contato",               agentData: false, group: "Motivos & Causas" },
  { id: "tabulation",   label: "🗂️ Tabulação / Área",                 agentData: false, group: "Motivos & Causas" },
  { id: "sub-pedidos",  label: "📦 Submotivos: Pedidos",              agentData: false, group: "Motivos & Causas" },
  { id: "sub-entrega",  label: "🚚 Submotivos: Ocorrência na Entrega",agentData: false, group: "Motivos & Causas" },
  { id: "sub-assist",   label: "🔧 Submotivos: Assistência Técnica",  agentData: false, group: "Motivos & Causas" },
  { id: "sub-atend",    label: "💬 Submotivos: Atendimento",          agentData: false, group: "Motivos & Causas" },
  { id: "pareto",       label: "⚖️ Top Submotivos (Pareto)",          agentData: false, group: "Motivos & Causas" },
  { id: "motivo-month", label: "📅 Motivos por Mês",                  agentData: false, group: "Motivos & Causas" },
  { id: "tab-month",    label: "📅 Tabulação por Mês",                agentData: false, group: "Motivos & Causas" },
  // ── Aba 5: Operacional ──────────────────────────────────────
  { id: "heatmap",      label: "🔥 Heatmap: Volume por Hora × Dia",  agentData: false, group: "Análise Operacional" },
  { id: "heatmap-fr",   label: "🌡️ Heatmap: FR Médio por Hora × Dia",agentData: false, group: "Análise Operacional" },
  { id: "hour-vol",     label: "🕐 Volume por Hora do Dia",           agentData: false, group: "Análise Operacional" },
  { id: "hour-fr",      label: "⚡ FR Médio por Hora",                agentData: false, group: "Análise Operacional" },
  { id: "top-clients",  label: "👥 Top Clientes Recorrentes",         agentData: false, group: "Análise Operacional" },
];

let presState = {
  selectedIds: PRES_SLIDES.map((s) => s.id),
  hideAgents:  false,
  intervalSec: 15,
  activeSlides: [],
  currentIdx:  0,
  paused:      false,
  timer:       null,
  clockTimer:  null,
  progressStart: null,
  progressTimer: null,
};

// ---- OPEN CONFIG ----
function openPresentationConfig() {
  if (!filteredData.length) return;
  document.getElementById("pres-overlay").style.display = "block";
  document.getElementById("pres-config").style.display = "flex";
  document.getElementById("pres-show").style.display = "none";
  renderPresSlideList();
}

function closePresentationConfig() {
  document.getElementById("pres-overlay").style.display = "none";
}

function renderPresSlideList() {
  const list = document.getElementById("pres-slide-list");
  list.innerHTML = "";
  let lastGroup = null;
  PRES_SLIDES.forEach((s) => {
    if (s.group !== lastGroup) {
      lastGroup = s.group;
      const grp = document.createElement("div");
      grp.style.cssText = "font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;padding:8px 10px 3px;margin-top:4px";
      grp.textContent = s.group;
      list.appendChild(grp);
    }
    const checked = presState.selectedIds.includes(s.id);
    const item = document.createElement("label");
    item.className = "pres-slide-item";
    item.innerHTML = `
      <input type="checkbox" ${checked ? "checked" : ""} onchange="presToggleSlide('${s.id}', this.checked)" />
      <span class="pres-slide-item-label">${s.label}</span>
      ${s.agentData ? '<span class="pres-slide-item-badge">👤 agentes</span>' : ""}
    `;
    list.appendChild(item);
  });
}

function presToggleSlide(id, checked) {
  if (checked) {
    if (!presState.selectedIds.includes(id)) presState.selectedIds.push(id);
  } else {
    presState.selectedIds = presState.selectedIds.filter((x) => x !== id);
  }
}

function presSelectAll()      { presState.selectedIds = PRES_SLIDES.map((s) => s.id); renderPresSlideList(); }
function presSelectNone()     { presState.selectedIds = []; renderPresSlideList(); }
function presSelectNoAgents() { presState.selectedIds = PRES_SLIDES.filter((s) => !s.agentData).map((s) => s.id); renderPresSlideList(); }

function presToggleAgents() {
  presState.hideAgents = !presState.hideAgents;
  document.getElementById("toggle-hide-agents").classList.toggle("on", presState.hideAgents);
}

function presSetInterval(sec) {
  presState.intervalSec = sec;
  document.querySelectorAll(".pres-int-btn").forEach((b) => {
    b.classList.toggle("pres-int-active", parseInt(b.dataset.v) === sec);
  });
}

// ---- START / CLOSE ----
function startPresentation() {
  const active = PRES_SLIDES.filter((s) => presState.selectedIds.includes(s.id));
  if (!active.length) { alert("Selecione pelo menos um visual."); return; }

  presState.activeSlides = active;
  presState.currentIdx = 0;
  presState.paused = false;

  document.getElementById("pres-config").style.display = "none";
  document.getElementById("pres-show").style.display = "flex";

  // Show filtered period
  const fromEl = document.getElementById("f-date-from");
  const toEl   = document.getElementById("f-date-to");
  const fromVal = fromEl && fromEl.value ? fmtDate(fromEl.value) : null;
  const toVal   = toEl   && toEl.value   ? fmtDate(toEl.value)   : null;
  const periodEl = document.getElementById("pres-period");
  if (periodEl) {
    if (fromVal && toVal) periodEl.textContent = `📅 ${fromVal} → ${toVal}`;
    else if (fromVal)     periodEl.textContent = `📅 A partir de ${fromVal}`;
    else if (toVal)       periodEl.textContent = `📅 Até ${toVal}`;
    else {
      // fallback: derive from data
      const isos = filteredData.map((r) => toISO(r.dt)).filter(Boolean).sort();
      if (isos.length) periodEl.textContent = `📅 ${fmtDate(isos[0])} → ${fmtDate(isos[isos.length - 1])}`;
      else periodEl.textContent = "";
    }
  }

  // Request fullscreen
  const el = document.getElementById("pres-overlay");
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();

  presStartClock();
  presRenderCurrent();
  presScheduleNext();
}

function closePresentation() {
  clearTimeout(presState.timer);
  clearInterval(presState.clockTimer);
  presStopProgress();
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
  document.getElementById("pres-overlay").style.display = "none";
  document.getElementById("pres-show").style.display = "none";
}

// ESC key exits
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("pres-show").style.display !== "none") {
    // fullscreen already exits on ESC, but close our overlay too
    setTimeout(() => {
      if (!document.fullscreenElement) closePresentation();
    }, 100);
  }
});

// ---- CONTROLS ----
function presGoNext() {
  presStopProgress();
  clearTimeout(presState.timer);
  presState.currentIdx = (presState.currentIdx + 1) % presState.activeSlides.length;
  presRenderCurrent();
  if (!presState.paused) presScheduleNext();
}

function presGoPrev() {
  presStopProgress();
  clearTimeout(presState.timer);
  presState.currentIdx = (presState.currentIdx - 1 + presState.activeSlides.length) % presState.activeSlides.length;
  presRenderCurrent();
  if (!presState.paused) presScheduleNext();
}

function presTogglePause() {
  presState.paused = !presState.paused;
  const btn = document.getElementById("pres-pause-btn");
  btn.textContent = presState.paused ? "▶" : "⏸";
  btn.title = presState.paused ? "Retomar" : "Pausar";
  if (presState.paused) {
    clearTimeout(presState.timer);
    presStopProgress();
  } else {
    presScheduleNext();
  }
}

function presScheduleNext() {
  clearTimeout(presState.timer);
  presStartProgress();
  presState.timer = setTimeout(() => {
    presState.currentIdx = (presState.currentIdx + 1) % presState.activeSlides.length;
    presRenderCurrent();
    presScheduleNext();
  }, presState.intervalSec * 1000);
}

// ---- PROGRESS BAR ----
function presStartProgress() {
  presStopProgress();
  const bar = document.getElementById("pres-progress-bar");
  bar.style.transition = "none";
  bar.style.width = "0%";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.transition = `width ${presState.intervalSec}s linear`;
      bar.style.width = "100%";
    });
  });
}

function presStopProgress() {
  const bar = document.getElementById("pres-progress-bar");
  const cur = bar.getBoundingClientRect().width;
  const total = bar.parentElement.getBoundingClientRect().width;
  bar.style.transition = "none";
  bar.style.width = (total ? (cur / total) * 100 : 0) + "%";
}

// ---- CLOCK ----
function presStartClock() {
  clearInterval(presState.clockTimer);
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const el = document.getElementById("pres-clock");
    if (el) el.textContent = h + ":" + m + ":" + s;
  }
  tick();
  presState.clockTimer = setInterval(tick, 1000);
}

// ---- DATA HELPERS ----
function presGetData() { return filteredData; }

function presAnonymizeAgents(agentsArr) {
  if (!presState.hideAgents) return agentsArr;
  return agentsArr.map((name, i) => `Agente ${i + 1}`);
}

function presGetAgentStats(d) {
  const map = {};
  d.forEach((r) => {
    if (!map[r.ag]) map[r.ag] = { name: r.ag, count: 0, fr: [], tr: [] };
    map[r.ag].count++;
    if (r.fr != null) map[r.ag].fr.push(r.fr);
    if (r.tr != null) map[r.ag].tr.push(r.tr);
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// TV-friendly chart options
const presChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#94a3b8", font: { family: "DM Sans", size: 14 }, padding: 14 },
    },
    tooltip: {
      backgroundColor: "#1e2840",
      titleColor: "#e2e8f0",
      bodyColor: "#94a3b8",
      borderColor: "#263050",
      borderWidth: 1,
      titleFont: { size: 14 },
      bodyFont: { size: 13 },
    },
  },
  scales: {
    x: { ticks: { color: "#64748b", font: { size: 13 } }, grid: { color: "rgba(38,48,80,0.4)" } },
    y: { ticks: { color: "#64748b", font: { size: 13 } }, grid: { color: "rgba(38,48,80,0.4)" } },
  },
};

// Destroy any old presentation charts
const PRES_CHARTS = {};
function makePresChart(id, cfg) {
  if (PRES_CHARTS[id]) { PRES_CHARTS[id].destroy(); delete PRES_CHARTS[id]; }
  const ctx = document.getElementById(id);
  if (!ctx) return;
  // Inject datalabels respecting showLabels, with larger font for TV
  injectDatalabels(cfg);
  if (cfg.options.plugins.datalabels) {
    cfg.options.plugins.datalabels.font = { family: "DM Sans", size: 14, weight: "600" };
  }
  PRES_CHARTS[id] = new Chart(ctx, cfg);
  return PRES_CHARTS[id];
}

// ---- RENDER CURRENT SLIDE ----
function presRenderCurrent() {
  const slide = presState.activeSlides[presState.currentIdx];
  const total = presState.activeSlides.length;

  document.getElementById("pres-slide-title").textContent = slide.label;
  document.getElementById("pres-counter").textContent =
    `${presState.currentIdx + 1} / ${total}`;

  const content = document.getElementById("pres-content");
  // Destroy old pres charts before clearing DOM
  Object.keys(PRES_CHARTS).forEach((k) => { PRES_CHARTS[k].destroy(); delete PRES_CHARTS[k]; });
  content.innerHTML = "";

  const d = presGetData();
  const renderer = presSlideRenderers[slide.id];
  if (renderer) renderer(d, content);
}

// ---- SLIDE RENDERERS ----
const presSlideRenderers = {

  // 1. KPIs
  kpis(d, el) {
    const total = d.length;
    const closed = d.filter((r) => r.st === "Closed" || r.st === "Solved").length;
    const frVals = d.map((r) => r.fr).filter((v) => v != null);
    const trVals = d.map((r) => r.tr).filter((v) => v != null);
    const clients = new Set(d.map((r) => r.ci)).size;
    const daysSet = new Set(d.map((r) => r.dt)).size;
    const sla5 = pct(frVals.filter((v) => v <= 5).length, frVals.length);
    const clientCounts = {};
    d.forEach((r) => { clientCounts[r.ci] = (clientCounts[r.ci] || 0) + 1; });
    const recurrent = Object.values(clientCounts).filter((v) => v > 1).length;

    const kpis = [
      { icon: "🎫", val: total.toLocaleString("pt-BR"), label: "Total de Tickets",      sub: `${daysSet} dias ativos`,           color: "#00d4ff" },
      { icon: "✅", val: pct(closed, total) + "%",      label: "Taxa de Fechamento",    sub: `${closed} fechados`,               color: "#10b981" },
      { icon: "⏱️", val: fmt(avg(frVals)),              label: "1ª Resposta Média",     sub: "minutos",                          color: "#7c3aed" },
      { icon: "🔄", val: fmt(avg(trVals)),              label: "Resolução Média",       sub: "minutos",                          color: "#ef4444" },
      { icon: "📅", val: daysSet > 0 ? (total / daysSet).toFixed(1) : "—", label: "Média Diária", sub: "tickets/dia",           color: "#f59e0b" },
      { icon: "👥", val: clients.toLocaleString("pt-BR"), label: "Clientes Únicos",    sub: `${recurrent} reincidentes`,        color: "#06b6d4" },
      { icon: "🔁", val: pct(recurrent, clients) + "%", label: "Reincidência",          sub: "clientes c/ +1 ticket",            color: "#f97316" },
      { icon: "🏆", val: sla5 + "%",                    label: "SLA ≤ 5 min (FR)",     sub: "1ª resposta",                      color: "#a855f7" },
    ];

    const grid = document.createElement("div");
    grid.className = "pres-kpi-grid";
    kpis.forEach((k) => {
      grid.innerHTML += `
        <div class="pres-kpi-card" style="--accent-color:${k.color}">
          <span class="pres-kpi-icon">${k.icon}</span>
          <div class="pres-kpi-value">${k.val}</div>
          <div class="pres-kpi-label">${k.label}</div>
          <div class="pres-kpi-sub">${k.sub}</div>
        </div>`;
    });
    el.appendChild(grid);
  },

  // 2. Volume por data
  volume(d, el) {
    const dateCount = {};
    d.forEach((r) => { dateCount[r.dt] = (dateCount[r.dt] || 0) + 1; });
    const sorted = Object.keys(dateCount).sort((a, b) => (toISO(a) > toISO(b) ? 1 : -1));
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-vol"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-vol", {
      type: "line",
      data: {
        labels: sorted.map(fmtDate),
        datasets: [{ label: "Tickets", data: sorted.map((dt) => dateCount[dt]),
          borderColor: "#00d4ff", backgroundColor: "rgba(0,212,255,0.1)",
          fill: true, tension: 0.4, pointRadius: sorted.length > 20 ? 0 : 4, pointHoverRadius: 7,
          borderWidth: 2 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 3. Status
  status(d, el) {
    const statusCount = {};
    d.forEach((r) => { statusCount[r.st] = (statusCount[r.st] || 0) + 1; });
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-status"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-status", {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCount),
        datasets: [{ data: Object.values(statusCount),
          backgroundColor: ["#10b981", "#00d4ff", "#f59e0b", "#ef4444"], borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "60%",
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 16 }, padding: 20 } },
          tooltip: presChartOpts.plugins.tooltip,
          datalabels: {
            display: true, color: "#fff",
            font: { family: "Syne", size: 18, weight: "700" },
            formatter: (v, ctx) => {
              const t = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              return Math.round((v / t) * 100) + "%";
            },
          },
        },
      },
    });
  },

  // 4. Dia da semana
  dayofweek(d, el) {
    const dayCount = {};
    DAYS_ORDER.forEach((dw) => (dayCount[dw] = 0));
    d.forEach((r) => { if (dayCount[r.dw] !== undefined) dayCount[r.dw]++; });
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-dow"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-dow", {
      type: "bar",
      data: {
        labels: DAYS_ORDER.map((dw) => dw.replace("-feira", "")),
        datasets: [{ label: "Tickets", data: DAYS_ORDER.map((dw) => dayCount[dw]),
          backgroundColor: COLORS, borderRadius: 8 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 5. SLA — 1ª Resposta
  "sla-fr"(d, el) {
    const frVals = d.map((r) => r.fr).filter((v) => v != null);
    const f1 = frVals.filter((v) => v <= 5).length;
    const f2 = frVals.filter((v) => v > 5 && v <= 15).length;
    const f3 = frVals.filter((v) => v > 15 && v <= 60).length;
    const f4 = frVals.filter((v) => v > 60).length;

    const faixas = document.createElement("div");
    faixas.className = "pres-sla-faixas";
    [
      { label: "≤ 5 min", val: pct(f1, frVals.length) + "%", color: "#10b981" },
      { label: "5–15 min", val: pct(f2, frVals.length) + "%", color: "#f59e0b" },
      { label: "15–60 min", val: pct(f3, frVals.length) + "%", color: "#f97316" },
      { label: "> 60 min", val: pct(f4, frVals.length) + "%", color: "#ef4444" },
    ].forEach((item) => {
      faixas.innerHTML += `<div class="pres-sla-faixa">
        <div class="pres-sla-val" style="color:${item.color}">${item.val}</div>
        <div class="pres-sla-lbl">${item.label}</div>
      </div>`;
    });
    el.appendChild(faixas);

    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.style.flex = "1";
    wrap.innerHTML = `<canvas id="pres-canvas-sla-fr"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-sla-fr", {
      type: "bar",
      data: {
        labels: ["0–5 min", "5–15 min", "15–60 min", "+60 min"],
        datasets: [{ label: "Tickets", data: [f1, f2, f3, f4],
          backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"], borderRadius: 8 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 6. SLA — Resolução
  "sla-tr"(d, el) {
    const trVals = d.map((r) => r.tr).filter((v) => v != null);
    const t1 = trVals.filter((v) => v <= 60).length;
    const t2 = trVals.filter((v) => v > 60 && v <= 240).length;
    const t3 = trVals.filter((v) => v > 240 && v <= 480).length;
    const t4 = trVals.filter((v) => v > 480).length;

    const faixas = document.createElement("div");
    faixas.className = "pres-sla-faixas";
    [
      { label: "≤ 1h",  val: pct(t1, trVals.length) + "%", color: "#10b981" },
      { label: "1–4h",  val: pct(t2, trVals.length) + "%", color: "#f59e0b" },
      { label: "4–8h",  val: pct(t3, trVals.length) + "%", color: "#f97316" },
      { label: "> 8h",  val: pct(t4, trVals.length) + "%", color: "#ef4444" },
    ].forEach((item) => {
      faixas.innerHTML += `<div class="pres-sla-faixa">
        <div class="pres-sla-val" style="color:${item.color}">${item.val}</div>
        <div class="pres-sla-lbl">${item.label}</div>
      </div>`;
    });
    el.appendChild(faixas);

    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.style.flex = "1";
    wrap.innerHTML = `<canvas id="pres-canvas-sla-tr"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-sla-tr", {
      type: "bar",
      data: {
        labels: ["0–1h", "1–4h", "4–8h", "+8h"],
        datasets: [{ label: "Tickets", data: [t1, t2, t3, t4],
          backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"], borderRadius: 8 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 7. Motivos
  motivos(d, el) {
    const cnt = {};
    d.forEach((r) => { cnt[r.mt] = (cnt[r.mt] || 0) + 1; });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-motivos"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-motivos", {
      type: "bar",
      data: {
        labels: sorted.map((e) => e[0]),
        datasets: [{ label: "Tickets", data: sorted.map((e) => e[1]),
          backgroundColor: COLORS, borderRadius: 8 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 8. Tabulação
  tabulation(d, el) {
    const cnt = {};
    d.forEach((r) => { if (r.tb) cnt[r.tb] = (cnt[r.tb] || 0) + 1; });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-tab"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-tab", {
      type: "bar",
      data: {
        labels: sorted.map((e) => e[0]),
        datasets: [{ label: "Tickets", data: sorted.map((e) => e[1]),
          backgroundColor: COLORS, borderRadius: 4, barThickness: 20 }],
      },
      options: {
        ...presChartOpts,
        indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: {
          x: presChartOpts.scales.x,
          y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } },
        },
      },
    });
  },

  // 9. Pareto / Top Submotivos
  pareto(d, el) {
    const combined = {};
    d.forEach((r) => {
      const sub = r.sp || r.se || r.ss || r.sa || r.sr || "(sem submotivo)";
      const key = (r.tb || r.mt || "—") + " › " + sub;
      combined[key] = (combined[key] || 0) + 1;
    });
    const sorted = Object.entries(combined).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = d.length;
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-pareto"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-pareto", {
      type: "bar",
      data: {
        labels: sorted.map((e) => e[0].length > 40 ? e[0].slice(0, 40) + "…" : e[0]),
        datasets: [{ label: "Tickets", data: sorted.map((e) => e[1]),
          backgroundColor: COLORS, borderRadius: 4, barThickness: 22 }],
      },
      options: {
        ...presChartOpts,
        indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: {
          x: presChartOpts.scales.x,
          y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } },
        },
      },
    });
  },

  // 10. Heatmap
  heatmap(d, el) {
    const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
    const mat = {};
    DAYS_ORDER.forEach((dw) => { mat[dw] = {}; HOURS.forEach((h) => (mat[dw][h] = 0)); });
    d.forEach((r) => { if (mat[r.dw] && r.hr >= 8 && r.hr <= 20) mat[r.dw][r.hr]++; });
    const allVals = DAYS_ORDER.flatMap((dw) => HOURS.map((h) => mat[dw][h]));
    const maxVal = Math.max(...allVals, 1);

    const container = document.createElement("div");
    container.style.cssText = "overflow-x:auto;flex:1;display:flex;flex-direction:column;justify-content:center;";

    // Header row
    let html = `<table style="border-collapse:separate;border-spacing:4px;width:100%">
      <thead><tr><th style="color:var(--text3);font-size:13px;padding:4px 8px;text-align:left">Dia</th>`;
    HOURS.forEach((h) => { html += `<th style="color:var(--text3);font-size:12px;padding:4px 2px;text-align:center">${h}h</th>`; });
    html += `</tr></thead><tbody>`;

    DAYS_ORDER.forEach((dw) => {
      html += `<tr><td style="color:var(--text2);font-size:13px;padding:4px 8px;white-space:nowrap">${dw.replace("-feira", "")}</td>`;
      HOURS.forEach((h) => {
        const v = mat[dw][h];
        const intensity = v / maxVal;
        const bg = v === 0 ? "rgba(38,48,80,0.3)" :
          `rgba(0,${Math.round(100 + intensity * 112)},${Math.round(200 + intensity * 55)},${0.15 + intensity * 0.75})`;
        const color = intensity > 0.4 ? "#fff" : "#94a3b8";
        html += `<td style="background:${bg};color:${color};border-radius:6px;text-align:center;font-size:13px;font-weight:600;padding:10px 4px">${v || ""}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
    el.appendChild(container);
  },

  // 11. Agentes — Volume
  "agents-vol"(d, el) {
    const agents = presGetAgentStats(d).slice(0, 12);
    const labels = presAnonymizeAgents(agents.map((a) => a.name));
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-ag-vol"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-ag-vol", {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Tickets", data: agents.map((a) => a.count),
          backgroundColor: agents.map((_, i) => COLORS[i % COLORS.length]),
          borderRadius: 4, barThickness: 20 }],
      },
      options: {
        ...presChartOpts,
        indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: {
          x: presChartOpts.scales.x,
          y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } },
        },
      },
    });
  },

  // 12. Agentes — FR
  "agents-fr"(d, el) {
    const agents = presGetAgentStats(d)
      .filter((a) => a.fr.length > 0)
      .sort((a, b) => avg(a.fr) - avg(b.fr))
      .slice(0, 12);
    const labels = presAnonymizeAgents(agents.map((a) => a.name));
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-ag-fr"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-ag-fr", {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "FR Médio (min)", data: agents.map((a) => Math.round(avg(a.fr))),
          backgroundColor: "rgba(0,212,255,0.75)", borderRadius: 4, barThickness: 20 }],
      },
      options: {
        ...presChartOpts,
        indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: {
          x: presChartOpts.scales.x,
          y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } },
        },
      },
    });
  },

  // 13. Volume por Mês
  "volume-month"(d, el) {
    const cnt = {};
    d.forEach((r) => { if (r.mo) cnt[r.mo] = (cnt[r.mo] || 0) + 1; });
    const months = Object.keys(cnt);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-vol-month"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-vol-month", {
      type: "bar",
      data: {
        labels: months,
        datasets: [{ label: "Tickets", data: months.map((m) => cnt[m]),
          backgroundColor: "#7c3aed", borderRadius: 8 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 14. Motivo do Contato (pizza)
  "motivo-pie"(d, el) {
    const cnt = {};
    d.forEach((r) => { cnt[r.mt] = (cnt[r.mt] || 0) + 1; });
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-motivo-pie"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-motivo-pie", {
      type: "doughnut",
      data: {
        labels: Object.keys(cnt),
        datasets: [{ data: Object.values(cnt),
          backgroundColor: ["#00d4ff", "#7c3aed", "#ef4444", "#f59e0b", "#10b981"], borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "55%",
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 16 }, padding: 22 } },
          tooltip: presChartOpts.plugins.tooltip,
          datalabels: {
            display: true, color: "#fff",
            font: { family: "Syne", size: 18, weight: "700" },
            formatter: (v, ctx) => {
              const t = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              return Math.round((v / t) * 100) + "%";
            },
          },
        },
      },
    });
  },

  // 15. Evolução Mensal SLA
  "sla-trend"(d, el) {
    const months = [...new Set(d.map((r) => r.mo).filter(Boolean))];
    const mFR = months.map((m) => Math.round(avg(d.filter((r) => r.mo === m).map((r) => r.fr).filter((v) => v != null))));
    const mTR = months.map((m) => Math.round(avg(d.filter((r) => r.mo === m).map((r) => r.tr).filter((v) => v != null)) / 10));
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-sla-trend"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-sla-trend", {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "FR Médio (min)", data: mFR, borderColor: "#00d4ff", backgroundColor: "rgba(0,212,255,0.1)", fill: true, tension: 0.4, borderWidth: 3, pointRadius: 6 },
          { label: "TR ÷10 (min)", data: mTR, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.05)", fill: true, tension: 0.4, borderWidth: 3, pointRadius: 6 },
        ],
      },
      options: { ...presChartOpts },
    });
  },

  // 16. FR por Dia da Semana
  "fr-dayofweek"(d, el) {
    const dayFR = {};
    DAYS_ORDER.forEach((dw) => {
      const vals = d.filter((r) => r.dw === dw).map((r) => r.fr).filter((v) => v != null);
      dayFR[dw] = vals.length ? Math.round(avg(vals)) : 0;
    });
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-fr-dow"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-fr-dow", {
      type: "bar",
      data: {
        labels: DAYS_ORDER.map((dw) => dw.replace("-feira", "")),
        datasets: [{ label: "FR Médio (min)", data: DAYS_ORDER.map((dw) => dayFR[dw]),
          backgroundColor: "#7c3aed", borderRadius: 8 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 17. Ranking Agentes — TR
  "agents-tr"(d, el) {
    const agents = presGetAgentStats(d)
      .filter((a) => a.tr.length > 0)
      .sort((a, b) => avg(a.tr) - avg(b.tr))
      .slice(0, 12);
    const labels = presAnonymizeAgents(agents.map((a) => a.name));
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-ag-tr"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-ag-tr", {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "TR Médio (min)", data: agents.map((a) => Math.round(avg(a.tr))),
          backgroundColor: "rgba(239,68,68,0.75)", borderRadius: 4, barThickness: 20 }],
      },
      options: {
        ...presChartOpts, indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: {
          x: presChartOpts.scales.x,
          y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } },
        },
      },
    });
  },

  // 18. Tabela Detalhada de Agentes
  "agent-table"(d, el) {
    const agentStats = presGetAgentStats(d);
    const total = d.length;
    const labels = presAnonymizeAgents(agentStats.map((a) => a.name));
    el.style.overflow = "auto";
    let html = `<table style="width:100%;border-collapse:collapse;font-size:clamp(12px,1.2vw,16px)">
      <thead><tr>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:left">#</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:left">Agente</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:right">Tickets</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:right">% Total</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:right">FR Médio</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:right">TR Médio</th>
      </tr></thead><tbody>`;
    agentStats.forEach((a, i) => {
      const frAvg = Math.round(avg(a.fr));
      const trAvg = Math.round(avg(a.tr));
      const frColor = frAvg <= 30 ? "#10b981" : frAvg <= 60 ? "#f59e0b" : "#ef4444";
      const trColor = trAvg <= 120 ? "#10b981" : trAvg <= 300 ? "#f59e0b" : "#ef4444";
      html += `<tr style="border-bottom:1px solid rgba(38,48,80,0.4)">
        <td style="padding:10px 12px;color:var(--accent);font-family:'Syne',sans-serif;font-weight:700">${i + 1}</td>
        <td style="padding:10px 12px;color:#e2e8f0;font-weight:500">${labels[i]}</td>
        <td style="padding:10px 12px;color:#fff;font-weight:700;text-align:right">${a.count}</td>
        <td style="padding:10px 12px;color:var(--text2);text-align:right">${pct(a.count, total)}%</td>
        <td style="padding:10px 12px;color:${frColor};font-weight:700;text-align:right">${frAvg} min</td>
        <td style="padding:10px 12px;color:${trColor};font-weight:700;text-align:right">${trAvg} min</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    const container = document.createElement("div");
    container.style.cssText = "flex:1;overflow:auto;";
    container.innerHTML = html;
    el.appendChild(container);
  },

  // 19. Submotivos: Pedidos
  "sub-pedidos"(d, el) {
    const cnt = {};
    d.forEach((r) => { if (r.sp) cnt[r.sp] = (cnt[r.sp] || 0) + 1; });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-sub-pedidos"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-sub-pedidos", {
      type: "bar",
      data: { labels: sorted.map((e) => e[0]),
        datasets: [{ label: "Tickets", data: sorted.map((e) => e[1]), backgroundColor: COLORS, borderRadius: 4, barThickness: 20 }] },
      options: { ...presChartOpts, indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: { x: presChartOpts.scales.x, y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } } } },
    });
  },

  // 20. Submotivos: Entrega
  "sub-entrega"(d, el) {
    const cnt = {};
    d.forEach((r) => { if (r.se) cnt[r.se] = (cnt[r.se] || 0) + 1; });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-sub-entrega"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-sub-entrega", {
      type: "bar",
      data: { labels: sorted.map((e) => e[0]),
        datasets: [{ label: "Tickets", data: sorted.map((e) => e[1]), backgroundColor: COLORS, borderRadius: 4, barThickness: 20 }] },
      options: { ...presChartOpts, indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: { x: presChartOpts.scales.x, y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } } } },
    });
  },

  // 21. Submotivos: AT
  "sub-assist"(d, el) {
    const cnt = {};
    d.forEach((r) => { if (r.ss) cnt[r.ss] = (cnt[r.ss] || 0) + 1; });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-sub-assist"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-sub-assist", {
      type: "bar",
      data: { labels: sorted.map((e) => e[0]),
        datasets: [{ label: "Tickets", data: sorted.map((e) => e[1]), backgroundColor: COLORS, borderRadius: 4, barThickness: 20 }] },
      options: { ...presChartOpts, indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: { x: presChartOpts.scales.x, y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } } } },
    });
  },

  // 22. Submotivos: Atendimento
  "sub-atend"(d, el) {
    const cnt = {};
    d.forEach((r) => { if (r.sa) cnt[r.sa] = (cnt[r.sa] || 0) + 1; });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-sub-atend"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-sub-atend", {
      type: "bar",
      data: { labels: sorted.map((e) => e[0]),
        datasets: [{ label: "Tickets", data: sorted.map((e) => e[1]), backgroundColor: COLORS, borderRadius: 4, barThickness: 20 }] },
      options: { ...presChartOpts, indexAxis: "y",
        plugins: { ...presChartOpts.plugins, legend: { display: false } },
        scales: { x: presChartOpts.scales.x, y: { ...presChartOpts.scales.y, ticks: { ...presChartOpts.scales.y.ticks, autoSkip: false } } } },
    });
  },

  // 23. Motivos por Mês
  "motivo-month"(d, el) {
    const months = [...new Set(d.map((r) => r.mo).filter(Boolean))];
    const motivos = [...new Set(d.map((r) => r.mt).filter(Boolean))];
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-motivo-month"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-motivo-month", {
      type: "bar",
      data: {
        labels: months,
        datasets: motivos.map((m, i) => ({
          label: m, borderRadius: 4,
          data: months.map((mo) => d.filter((r) => r.mo === mo && r.mt === m).length),
          backgroundColor: COLORS[i % COLORS.length],
        })),
      },
      options: { ...presChartOpts },
    });
  },

  // 24. Tabulação por Mês
  "tab-month"(d, el) {
    const months = [...new Set(d.map((r) => r.mo).filter(Boolean))];
    const tabCnt = {};
    d.forEach((r) => { if (r.tb) tabCnt[r.tb] = (tabCnt[r.tb] || 0) + 1; });
    const tabs = Object.entries(tabCnt).sort((a, b) => b[1] - a[1]).slice(0, 5).map((e) => e[0]);
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-tab-month"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-tab-month", {
      type: "bar",
      data: {
        labels: months,
        datasets: tabs.map((t, i) => ({
          label: t, borderRadius: 4,
          data: months.map((mo) => d.filter((r) => r.mo === mo && r.tb === t).length),
          backgroundColor: COLORS[i % COLORS.length],
        })),
      },
      options: { ...presChartOpts },
    });
  },

  // 25. Heatmap FR por Hora × Dia
  "heatmap-fr"(d, el) {
    const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
    const mat = {};
    DAYS_ORDER.forEach((dw) => { mat[dw] = {}; HOURS.forEach((h) => (mat[dw][h] = 0)); });
    d.forEach((r) => {
      if (mat[r.dw] && r.hr >= 8 && r.hr <= 19) {
        const vals = d.filter((x) => x.dw === r.dw && x.hr === r.hr).map((x) => x.fr).filter((v) => v != null);
        mat[r.dw][r.hr] = vals.length ? Math.round(avg(vals)) : 0;
      }
    });
    // deduplicate: compute once per cell
    const computed = {};
    DAYS_ORDER.forEach((dw) => {
      HOURS.forEach((h) => {
        const vals = d.filter((r) => r.dw === dw && r.hr === h).map((r) => r.fr).filter((v) => v != null);
        computed[dw + h] = vals.length ? Math.round(avg(vals)) : 0;
      });
    });
    const allVals = DAYS_ORDER.flatMap((dw) => HOURS.map((h) => computed[dw + h]));
    const maxVal = Math.max(...allVals, 1);

    const container = document.createElement("div");
    container.style.cssText = "overflow-x:auto;flex:1;display:flex;flex-direction:column;justify-content:center;";
    let html = `<table style="border-collapse:separate;border-spacing:4px;width:100%">
      <thead><tr><th style="color:var(--text3);font-size:13px;padding:4px 8px;text-align:left">Dia</th>`;
    HOURS.forEach((h) => { html += `<th style="color:var(--text3);font-size:12px;padding:4px 2px;text-align:center">${h}h</th>`; });
    html += `</tr></thead><tbody>`;
    DAYS_ORDER.forEach((dw) => {
      html += `<tr><td style="color:var(--text2);font-size:13px;padding:4px 8px;white-space:nowrap">${dw.replace("-feira", "")}</td>`;
      HOURS.forEach((h) => {
        const v = computed[dw + h];
        const intensity = v / maxVal;
        const r = Math.round(255 * intensity);
        const g = Math.round(100 * (1 - intensity));
        const bg = v === 0 ? "rgba(38,48,80,0.3)" : `rgba(${r},${g},50,${0.15 + intensity * 0.75})`;
        const color = intensity > 0.4 ? "#fff" : "#94a3b8";
        html += `<td style="background:${bg};color:${color};border-radius:6px;text-align:center;font-size:13px;font-weight:600;padding:10px 4px">${v || ""}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
    el.appendChild(container);
  },

  // 26. Volume por Hora do Dia
  "hour-vol"(d, el) {
    const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
    const hourVol = {};
    HOURS.forEach((h) => (hourVol[h] = 0));
    d.forEach((r) => { if (r.hr >= 8 && r.hr <= 20) hourVol[r.hr] = (hourVol[r.hr] || 0) + 1; });
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-hour-vol"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-hour-vol", {
      type: "bar",
      data: {
        labels: HOURS.map((h) => h + "h"),
        datasets: [{ label: "Tickets", data: HOURS.map((h) => hourVol[h]),
          backgroundColor: "rgba(0,212,255,0.7)", borderRadius: 6 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 27. FR Médio por Hora
  "hour-fr"(d, el) {
    const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
    const hourFR = {};
    HOURS.forEach((h) => {
      const vals = d.filter((r) => r.hr === h).map((r) => r.fr).filter((v) => v != null);
      hourFR[h] = vals.length ? Math.round(avg(vals)) : 0;
    });
    const wrap = document.createElement("div");
    wrap.className = "pres-chart-wrap";
    wrap.innerHTML = `<canvas id="pres-canvas-hour-fr"></canvas>`;
    el.appendChild(wrap);
    makePresChart("pres-canvas-hour-fr", {
      type: "bar",
      data: {
        labels: HOURS.map((h) => h + "h"),
        datasets: [{ label: "FR Médio (min)", data: HOURS.map((h) => hourFR[h]),
          backgroundColor: "rgba(245,158,11,0.7)", borderRadius: 6 }],
      },
      options: { ...presChartOpts, plugins: { ...presChartOpts.plugins, legend: { display: false } } },
    });
  },

  // 28. Top Clientes Recorrentes
  "top-clients"(d, el) {
    const clientCounts = {};
    d.forEach((r) => {
      if (!clientCounts[r.ci]) clientCounts[r.ci] = { count: 0, motivos: {} };
      clientCounts[r.ci].count++;
      clientCounts[r.ci].motivos[r.mt] = (clientCounts[r.ci].motivos[r.mt] || 0) + 1;
    });
    const top = Object.entries(clientCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 12);
    const container = document.createElement("div");
    container.style.cssText = "flex:1;overflow:auto;";
    let html = `<table style="width:100%;border-collapse:collapse;font-size:clamp(12px,1.2vw,15px)">
      <thead><tr>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:left">#</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:left">ID do Cliente</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:right">Tickets</th>
        <th style="padding:10px 12px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border);text-align:left">Motivos Principais</th>
      </tr></thead><tbody>`;
    top.forEach(([ci, v], i) => {
      const topMotivos = Object.entries(v.motivos).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => `${e[0]} (${e[1]})`).join(", ");
      html += `<tr style="border-bottom:1px solid rgba(38,48,80,0.4)">
        <td style="padding:10px 12px;color:var(--accent);font-family:'Syne',sans-serif;font-weight:700">${i + 1}</td>
        <td style="padding:10px 12px;font-family:monospace;color:#00d4ff">...${ci.slice(-8)}</td>
        <td style="padding:10px 12px;color:#fff;font-weight:700;text-align:right">${v.count}</td>
        <td style="padding:10px 12px;color:var(--text2)">${topMotivos}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
    el.appendChild(container);
  },
};

// Enable the presentation button once data loads
function enablePresentationButton() {
  const btn = document.getElementById("btn-present");
  if (btn) btn.disabled = false;
}

// Show empty state on load - data must be imported via CSV
document.getElementById("empty-state").style.display = "flex";
document
  .querySelectorAll(".tab-content")
  .forEach((el) => (el.style.display = "none"));
