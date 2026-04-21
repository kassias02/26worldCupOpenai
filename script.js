const DATA_SOURCE = "AP News (updated April 2026)";
const GROUPS = [
  { name: "A", teams: ["Mexico", "South Korea", "Czechia", "South Africa"] },
  { name: "B", teams: ["Switzerland", "Canada", "Qatar", "Bosnia and Herzegovina"] },
  { name: "C", teams: ["Brazil", "Morocco", "Scotland", "Haiti"] },
  { name: "D", teams: ["United States", "Turkey", "Australia", "Paraguay"] },
  { name: "E", teams: ["Germany", "Ecuador", "Ivory Coast", "Curacao"] },
  { name: "F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
  { name: "G", teams: ["Belgium", "Iran", "Egypt", "New Zealand"] },
  { name: "H", teams: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"] },
  { name: "I", teams: ["France", "Senegal", "Norway", "Iraq"] },
  { name: "J", teams: ["Argentina", "Algeria", "Austria", "Jordan"] },
  { name: "K", teams: ["Portugal", "Colombia", "Congo", "Uzbekistan"] },
  { name: "L", teams: ["England", "Croatia", "Panama", "Ghana"] }
];

const THIRD_MATCH_SLOTS = [
  { id: "M51", label: "Winner E vs Best 3rd" },
  { id: "M53", label: "Winner B vs Best 3rd" },
  { id: "M55", label: "Winner D vs Best 3rd" },
  { id: "M57", label: "Winner I vs Best 3rd" },
  { id: "M60", label: "Winner L vs Best 3rd" },
  { id: "M61", label: "Runner-up A vs Best 3rd" }
];

const groupContainer = document.getElementById("groupsContainer");
const standingsContainer = document.getElementById("standingsContainer");
const qualifiedContainer = document.getElementById("qualifiedContainer");
const round32Container = document.getElementById("round32Container");
const bracketContainer = document.getElementById("knockoutBracket");

const state = {
  groupMatches: {},
  qualified: null,
  knockout: {}
};

function scheduleForGroup(teams) {
  return [
    [teams[0], teams[1]],
    [teams[2], teams[3]],
    [teams[0], teams[2]],
    [teams[1], teams[3]],
    [teams[0], teams[3]],
    [teams[1], teams[2]]
  ];
}

function initGroupMatches() {
  GROUPS.forEach((g) => {
    state.groupMatches[g.name] = scheduleForGroup(g.teams).map(([home, away]) => ({
      home,
      away,
      homeGoals: "",
      awayGoals: ""
    }));
  });
}

function renderGroups() {
  groupContainer.innerHTML = "";
  GROUPS.forEach((group) => {
    const section = document.createElement("section");
    section.className = "group-card";
    section.innerHTML = `<h3>Groupe ${group.name}</h3>`;

    state.groupMatches[group.name].forEach((m, idx) => {
      const row = document.createElement("div");
      row.className = "match-input";
      row.innerHTML = `
        <span>${m.home}</span>
        <input type="number" min="0" value="${m.homeGoals}" aria-label="${m.home} buts" />
        <span>-</span>
        <input type="number" min="0" value="${m.awayGoals}" aria-label="${m.away} buts" />
        <span>${m.away}</span>
      `;
      const inputs = row.querySelectorAll("input");
      inputs[0].addEventListener("input", () => {
        m.homeGoals = inputs[0].value;
        recomputeAll();
      });
      inputs[1].addEventListener("input", () => {
        m.awayGoals = inputs[1].value;
        recomputeAll();
      });
      section.appendChild(row);
    });

    groupContainer.appendChild(section);
  });
}

function emptyTeamStats(team, group) {
  return { team, group, pts: 0, played: 0, gf: 0, ga: 0, gd: 0, wins: 0, draws: 0, losses: 0 };
}

function applyMatch(statsMap, home, away, hg, ag) {
  const h = statsMap.get(home);
  const a = statsMap.get(away);
  h.played += 1; a.played += 1;
  h.gf += hg; h.ga += ag;
  a.gf += ag; a.ga += hg;
  h.gd = h.gf - h.ga;
  a.gd = a.gf - a.ga;

  if (hg > ag) { h.pts += 3; h.wins += 1; a.losses += 1; }
  else if (hg < ag) { a.pts += 3; a.wins += 1; h.losses += 1; }
  else { h.pts += 1; a.pts += 1; h.draws += 1; a.draws += 1; }
}

function buildHeadToHeadMiniTable(matches, tiedTeams) {
  const map = new Map(tiedTeams.map((t) => [t, { team: t, pts: 0, gd: 0, gf: 0 }]));
  matches.forEach((m) => {
    if (m.homeGoals === "" || m.awayGoals === "") return;
    if (!map.has(m.home) || !map.has(m.away)) return;
    const hg = Number(m.homeGoals);
    const ag = Number(m.awayGoals);
    const h = map.get(m.home);
    const a = map.get(m.away);
    h.gf += hg; h.gd += hg - ag;
    a.gf += ag; a.gd += ag - hg;
    if (hg > ag) h.pts += 3;
    else if (hg < ag) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  });
  return map;
}

function rankGroup(groupName) {
  const group = GROUPS.find((g) => g.name === groupName);
  const matches = state.groupMatches[groupName];
  const map = new Map(group.teams.map((t) => [t, emptyTeamStats(t, groupName)]));

  matches.forEach((m) => {
    if (m.homeGoals === "" || m.awayGoals === "") return;
    applyMatch(map, m.home, m.away, Number(m.homeGoals), Number(m.awayGoals));
  });

  const rows = [...map.values()];
  rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));

  // head-to-head adjustment among exact ties
  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (j < rows.length && rows[j].pts === rows[i].pts && rows[j].gd === rows[i].gd && rows[j].gf === rows[i].gf) j += 1;
    if (j - i > 1) {
      const tied = rows.slice(i, j).map((r) => r.team);
      const mini = buildHeadToHeadMiniTable(matches, tied);
      rows.slice(i, j).sort((a, b) => {
        const ma = mini.get(a.team);
        const mb = mini.get(b.team);
        return mb.pts - ma.pts || mb.gd - ma.gd || mb.gf - ma.gf || a.team.localeCompare(b.team);
      }).forEach((r, idx) => { rows[i + idx] = r; });
    }
    i = j;
  }

  return rows;
}

function rankThirdPlaces(allRankings) {
  const thirds = allRankings.map((rows) => rows[2]);
  return thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
}

function renderStandings(allRankings, bestThird) {
  standingsContainer.innerHTML = "";
  allRankings.forEach((rows, idx) => {
    const group = GROUPS[idx].name;
    const table = document.createElement("table");
    table.className = "standings-table";
    table.innerHTML = `
      <caption>Classement Groupe ${group}</caption>
      <thead><tr><th>#</th><th>Equipe</th><th>Pts</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff</th></tr></thead>
      <tbody>
        ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.team}</td><td>${r.pts}</td><td>${r.played}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td></tr>`).join("")}
      </tbody>
    `;
    standingsContainer.appendChild(table);
  });

  const best = document.createElement("section");
  best.className = "best-third";
  best.innerHTML = `
    <h3>8 meilleurs 3e</h3>
    <ol>${bestThird.slice(0, 8).map((t) => `<li>${t.team} (Groupe ${t.group}) — ${t.pts} pts, Diff ${t.gd}, BP ${t.gf}</li>`).join("")}</ol>
  `;
  standingsContainer.appendChild(best);
}

function buildQualified(allRankings, bestThird) {
  const winners = {};
  const runners = {};
  allRankings.forEach((rows, idx) => {
    const g = GROUPS[idx].name;
    winners[g] = rows[0];
    runners[g] = rows[1];
  });
  return { winners, runners, bestThird: bestThird.slice(0, 8) };
}

function assignThirdSlots(qualified) {
  const topThird = qualified.bestThird;
  const slots = {};
  THIRD_MATCH_SLOTS.forEach((s, i) => { slots[s.id] = topThird[i] || null; });
  return slots;
}

function buildRoundOf32(qualified) {
  const thirds = assignThirdSlots(qualified);
  const W = qualified.winners;
  const R = qualified.runners;
  return [
    { id: "M49", sideA: W.A, sideB: R.B, label: "Winner A vs Runner-up B" },
    { id: "M50", sideA: W.C, sideB: R.D, label: "Winner C vs Runner-up D" },
    { id: "M51", sideA: W.E, sideB: thirds.M51, label: "Winner E vs Best 3rd" },
    { id: "M52", sideA: W.F, sideB: R.C, label: "Winner F vs Runner-up C" },
    { id: "M53", sideA: W.B, sideB: thirds.M53, label: "Winner B vs Best 3rd" },
    { id: "M54", sideA: W.G, sideB: R.H, label: "Winner G vs Runner-up H" },
    { id: "M55", sideA: W.D, sideB: thirds.M55, label: "Winner D vs Best 3rd" },
    { id: "M56", sideA: W.H, sideB: R.G, label: "Winner H vs Runner-up G" },
    { id: "M57", sideA: W.I, sideB: thirds.M57, label: "Winner I vs Best 3rd" },
    { id: "M58", sideA: W.J, sideB: R.K, label: "Winner J vs Runner-up K" },
    { id: "M59", sideA: W.K, sideB: R.J, label: "Winner K vs Runner-up J" },
    { id: "M60", sideA: W.L, sideB: thirds.M60, label: "Winner L vs Best 3rd" },
    { id: "M61", sideA: R.A, sideB: thirds.M61, label: "Runner-up A vs Best 3rd" },
    { id: "M62", sideA: R.E, sideB: W.I, label: "Runner-up E vs Winner I" },
    { id: "M63", sideA: R.L, sideB: W.K, label: "Runner-up L vs Winner K" },
    { id: "M64", sideA: R.D, sideB: W.G, label: "Runner-up D vs Winner G" }
  ];
}

function winnerPicker(match, roundKey) {
  const key = `${roundKey}-${match.id}`;
  const current = state.knockout[key] || match.sideA.team;
  state.knockout[key] = current;

  const div = document.createElement("div");
  div.className = "ko-match";
  div.innerHTML = `<span>${match.label}</span>`;

  const select = document.createElement("select");
  [match.sideA.team, match.sideB.team].forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    if (t === current) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    state.knockout[key] = select.value;
    renderKnockout();
  });

  div.appendChild(select);
  return { element: div, winner: state.knockout[key], id: match.id };
}

function renderRound(matches, title, key, target) {
  const section = document.createElement("section");
  section.className = "bracket-round";
  section.innerHTML = `<h3>${title}</h3>`;
  const winners = [];
  matches.forEach((m) => {
    const p = winnerPicker(m, key);
    section.appendChild(p.element);
    winners.push({ team: p.winner, from: m.id });
  });
  target.appendChild(section);
  return winners;
}

function renderKnockout() {
  const qualified = state.qualified;
  if (!qualified) return;

  const round32 = buildRoundOf32(qualified);
  round32Container.innerHTML = `<p class="hint">1/32 organisé selon la structure FIFA 2026 (avec insertion des meilleurs 3e).</p>`;
  round32.forEach((m) => {
    const p = document.createElement("p");
    p.textContent = `${m.id}: ${m.sideA.team} vs ${m.sideB.team}`;
    round32Container.appendChild(p);
  });

  bracketContainer.innerHTML = "";
  const col = document.createElement("div");
  col.className = "bracket-grid";

  const r32W = renderRound(round32, "1/32 de finale", "r32", col);

  const r16M = [
    { id: "M65", sideA: r32W[2], sideB: r32W[4], label: "Winner M51 vs Winner M53" },
    { id: "M66", sideA: r32W[0], sideB: r32W[3], label: "Winner M49 vs Winner M52" },
    { id: "M67", sideA: r32W[1], sideB: r32W[5], label: "Winner M50 vs Winner M54" },
    { id: "M68", sideA: r32W[12], sideB: r32W[13], label: "Winner M61 vs Winner M62" },
    { id: "M69", sideA: r32W[7], sideB: r32W[9], label: "Winner M56 vs Winner M58" },
    { id: "M70", sideA: r32W[6], sideB: r32W[8], label: "Winner M55 vs Winner M57" },
    { id: "M71", sideA: r32W[10], sideB: r32W[15], label: "Winner M59 vs Winner M64" },
    { id: "M72", sideA: r32W[11], sideB: r32W[14], label: "Winner M60 vs Winner M63" }
  ];
  const r16W = renderRound(r16M, "1/16 de finale", "r16", col);

  const qf = [
    { id: "M73", sideA: r16W[0], sideB: r16W[1], label: "Winner M65 vs Winner M66" },
    { id: "M74", sideA: r16W[4], sideB: r16W[5], label: "Winner M69 vs Winner M70" },
    { id: "M75", sideA: r16W[2], sideB: r16W[3], label: "Winner M67 vs Winner M68" },
    { id: "M76", sideA: r16W[6], sideB: r16W[7], label: "Winner M71 vs Winner M72" }
  ];
  const qfW = renderRound(qf, "Quarts", "qf", col);

  const sf = [
    { id: "M77", sideA: qfW[0], sideB: qfW[1], label: "Winner M73 vs Winner M74" },
    { id: "M78", sideA: qfW[2], sideB: qfW[3], label: "Winner M75 vs Winner M76" }
  ];
  const sfW = renderRound(sf, "Demies", "sf", col);

  const final = [{ id: "M80", sideA: sfW[0], sideB: sfW[1], label: "Finale" }];
  const finalW = renderRound(final, "Finale", "final", col);

  const champ = document.createElement("section");
  champ.className = "winner-center";
  champ.innerHTML = `<h3>🏆 Gagnant</h3><p>${finalW[0].team}</p>`;

  bracketContainer.append(col, champ);
}

function renderQualifiedSummary(qualified) {
  qualifiedContainer.innerHTML = `
    <h3>Qualifiés</h3>
    <p>Top 2 de chaque groupe + 8 meilleurs troisièmes.</p>
    <div class="qualified-grid">
      ${Object.keys(qualified.winners).map((g) => `<p><strong>G${g}</strong>: ${qualified.winners[g].team} (1er), ${qualified.runners[g].team} (2e)</p>`).join("")}
    </div>
  `;
}

function recomputeAll() {
  const rankings = GROUPS.map((g) => rankGroup(g.name));
  const bestThird = rankThirdPlaces(rankings);
  renderStandings(rankings, bestThird);
  state.qualified = buildQualified(rankings, bestThird);
  renderQualifiedSummary(state.qualified);
  renderKnockout();
}

function initShare() {
  const genBtn = document.getElementById("generateImageBtn");
  const dlBtn = document.getElementById("downloadBtn");
  const copyBtn = document.getElementById("copyCaptionBtn");

  genBtn.addEventListener("click", () => {
    const finalWinner = state.knockout["final-M80"] || "Champion";
    const canvas = document.getElementById("shareCanvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#32d4a4";
    ctx.font = "bold 46px sans-serif";
    ctx.fillText("CUP26PREDICTOR.COM", 50, 72);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 62px sans-serif";
    ctx.fillText(`🏆 ${finalWinner}`, 50, 170);
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#cdd8ff";
    ctx.fillText("Simulation FIFA 2026 — Groupes + Bracket complet", 50, 235);
    ctx.fillText(`Source groupes: ${DATA_SOURCE}`, 50, 290);

    const dataUrl = canvas.toDataURL("image/png");
    dlBtn.disabled = false;
    copyBtn.disabled = false;
    const caption = `Mon champion du Monde 2026: ${finalWinner} 🏆 — https://cup26predictor.com`;

    dlBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "cup26predictor-champion.png";
      a.click();
    };
    copyBtn.onclick = async () => {
      await navigator.clipboard.writeText(caption);
      copyBtn.textContent = "Copié ✓";
      setTimeout(() => (copyBtn.textContent = "Copier le texte"), 1000);
    };
    document.getElementById("shareX").href = `https://x.com/intent/tweet?text=${encodeURIComponent(caption)}`;
    document.getElementById("shareWhatsapp").href = `https://wa.me/?text=${encodeURIComponent(caption)}`;
    document.getElementById("shareInstagram").href = "https://www.instagram.com/";
  });
}

function initEmail() {
  document.getElementById("emailForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("emailInput");
    const status = document.getElementById("emailStatus");
    const email = emailInput.value.trim().toLowerCase();
    if (!email.includes("@")) return;

    const key = "cup26_emails";
    const all = JSON.parse(localStorage.getItem(key) || "[]");
    if (!all.includes(email)) localStorage.setItem(key, JSON.stringify([...all, email]));
    try {
      await fetch("/api/subscribe.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
    } catch (_) {}
    status.textContent = "Merci, inscription validée.";
    emailInput.value = "";
  });
}

function boot() {
  document.getElementById("groupsSource").textContent = `Source: ${DATA_SOURCE}`;
  initGroupMatches();
  renderGroups();
  recomputeAll();
  initShare();
  initEmail();
}

boot();
