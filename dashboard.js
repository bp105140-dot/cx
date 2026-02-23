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
function makeChart(id, cfg) {
  if (CHARTS[id]) CHARTS[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return;

  // Inject datalabels based on chart type and showLabels flag
  if (!cfg.options) cfg.options = {};
  if (!cfg.options.plugins) cfg.options.plugins = {};

  const chartType = cfg.type;
  const isDoughnut = chartType === "doughnut" || chartType === "pie";
  const isBar = chartType === "bar";
  const isLine = chartType === "line";

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
    anchor: isDoughnut
      ? "center"
      : cfg.options.indexAxis === "y"
        ? "end"
        : "end",
    align: isDoughnut
      ? "center"
      : cfg.options.indexAxis === "y"
        ? "right"
        : "top",
    offset: isDoughnut ? 0 : isLine ? 8 : 6,
    clamp: true,
    clip: false,
    padding: 0,
    backgroundColor: null,
    borderRadius: 0,
  };

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

  const months = [...new Set(RAW_DATA.map((r) => r.mo))].sort();
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
  ["f-month", "f-agent", "f-status", "f-motivo", "f-tab", "f-day", "f-date-from", "f-date-to"].forEach(
    (id) => {
      document.getElementById(id).value = "";
    },
  );
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

  // Header
  document.getElementById("hdr-total").textContent =
    total.toLocaleString("pt-BR");
  const dates = d.map((r) => r.dt).sort((a, b) => (toISO(a) > toISO(b) ? 1 : -1));
  if (dates.length)
    document.getElementById("hdr-period").textContent =
      fmtDate(dates[0]) + " → " + fmtDate(dates[dates.length - 1]);
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

  // SLA Trend (by month) - FR and TR avg
  const months = ["Janeiro", "Fevereiro"];
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

  // Motivo por Mês
  const months = ["Janeiro", "Fevereiro"];
  const motivos = ["INFORMAÇÃO", "SOLICITAÇÃO", "RECLAMAÇÃO"];
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
  "Criação do ticket Data": "dt",
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

  tryParse("windows-1252")
    .then((parsed) => {
      if (!parsed.length) {
        showToast("⚠️ Nenhum registro encontrado no CSV.", true);
        return;
      }
      RAW_DATA = parsed;
      populateFilters();
      filteredData = RAW_DATA;
      clearFilters();
      document.getElementById("empty-state").style.display = "none";
      document
        .querySelectorAll(".tab-content")
        .forEach((el) => (el.style.display = ""));
      renderAll();
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
      let val = vals[idx] !== undefined ? vals[idx].trim() : "";
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
// INIT
// ============================================================
// Show empty state on load - data must be imported via CSV
document.getElementById("empty-state").style.display = "flex";
document
  .querySelectorAll(".tab-content")
  .forEach((el) => (el.style.display = "none"));
