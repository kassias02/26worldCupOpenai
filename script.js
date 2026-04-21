const DEFAULT_TEAMS = [
  "USA", "Mexico", "Canada", "Brazil", "Argentina", "France", "Spain", "Germany",
  "England", "Portugal", "Netherlands", "Belgium", "Italy", "Croatia", "Morocco", "Japan",
  "South Korea", "Senegal", "Nigeria", "Ivory Coast", "Cameroon", "Uruguay", "Colombia", "Ecuador",
  "Chile", "Australia", "Iran", "Saudi Arabia", "Qatar", "New Zealand", "Poland", "Switzerland"
];

const rounds = [
  { key: "r32", label: "1/16 de finale", matches: 16 },
  { key: "r16", label: "1/8 de finale", matches: 8 },
  { key: "r8", label: "1/4 de finale", matches: 4 },
  { key: "r4", label: "1/2 finale", matches: 2 },
  { key: "r2", label: "Finale", matches: 1 }
];

const round32El = document.getElementById("round32");
const bracketEl = document.getElementById("bracket");

function renderTeamInputs() {
  round32El.innerHTML = "";
  DEFAULT_TEAMS.forEach((team, idx) => {
    const input = document.createElement("input");
    input.value = team;
    input.dataset.index = idx;
    input.ariaLabel = `Equipe ${idx + 1}`;
    round32El.appendChild(input);
  });
}

function getTeams() {
  return [...round32El.querySelectorAll("input")].map((i, idx) => i.value.trim() || `Team ${idx + 1}`);
}

function pair(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i += 2) result.push([arr[i], arr[i + 1]]);
  return result;
}

const state = { picks: {} };

function renderBracket() {
  bracketEl.innerHTML = "";
  let current = getTeams();

  rounds.forEach((round, roundIndex) => {
    const section = document.createElement("section");
    section.className = "round";

    const title = document.createElement("h3");
    title.textContent = round.label;
    section.appendChild(title);

    const matches = pair(current);
    const next = [];

    matches.forEach((m, matchIndex) => {
      const id = `${round.key}-${matchIndex}`;
      const previousPick = state.picks[id] && m.includes(state.picks[id]) ? state.picks[id] : m[0];
      state.picks[id] = previousPick;

      const row = document.createElement("div");
      row.className = "match";

      const label = document.createElement("span");
      label.textContent = `${m[0]} vs ${m[1]}`;

      const select = document.createElement("select");
      [m[0], m[1]].forEach((t) => {
        const option = document.createElement("option");
        option.value = t;
        option.textContent = t;
        if (t === previousPick) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        state.picks[id] = select.value;
        renderBracket();
      });

      row.append(label, select);
      section.appendChild(row);
      next.push(state.picks[id]);
    });

    bracketEl.appendChild(section);
    current = next;

    if (roundIndex === rounds.length - 1 && current[0]) {
      const champ = document.createElement("p");
      champ.innerHTML = `🏆 Champion prédit : <strong>${current[0]}</strong>`;
      section.appendChild(champ);
    }
  });
}

function getPathAndWinner() {
  let current = getTeams();
  const path = [];

  rounds.forEach((round) => {
    const matches = pair(current);
    const winners = matches.map((m, idx) => {
      const key = `${round.key}-${idx}`;
      const pick = state.picks[key] && m.includes(state.picks[key]) ? state.picks[key] : m[0];
      path.push({ round: round.label, match: `${m[0]} vs ${m[1]}`, winner: pick });
      return pick;
    });
    current = winners;
  });

  return { winner: current[0], path };
}

function drawShareCard() {
  const canvas = document.getElementById("shareCanvas");
  const ctx = canvas.getContext("2d");
  const { winner, path } = getPathAndWinner();

  ctx.fillStyle = "#0a1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#32d4a4";
  ctx.font = "bold 48px Inter, sans-serif";
  ctx.fillText("CUP26PREDICTOR.COM", 48, 76);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Inter, sans-serif";
  ctx.fillText(`🏆 ${winner}`, 48, 164);

  ctx.fillStyle = "#d2dcff";
  ctx.font = "26px Inter, sans-serif";
  ctx.fillText("Parcours depuis les 1/16 :", 48, 214);

  ctx.font = "20px Inter, sans-serif";
  path.slice(-8).forEach((step, i) => {
    const y = 260 + i * 44;
    ctx.fillText(`${step.round}: ${step.winner}`, 48, y);
  });

  ctx.fillStyle = "#9fb0d8";
  ctx.fillText("Simule ton bracket FIFA 2026 sur cup26predictor.com", 48, 640);

  const dataUrl = canvas.toDataURL("image/png");
  const caption = `Mon champion du Mondial 2026: ${winner} 🏆\nSimule le tien sur https://cup26predictor.com`;

  const downloadBtn = document.getElementById("downloadBtn");
  downloadBtn.disabled = false;
  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "cup26predictor-bracket.png";
    a.click();
  };

  const copyCaptionBtn = document.getElementById("copyCaptionBtn");
  copyCaptionBtn.disabled = false;
  copyCaptionBtn.onclick = async () => {
    await navigator.clipboard.writeText(caption);
    copyCaptionBtn.textContent = "Texte copié ✓";
    setTimeout(() => (copyCaptionBtn.textContent = "Copier le texte"), 1200);
  };

  document.getElementById("shareX").href = `https://x.com/intent/tweet?text=${encodeURIComponent(caption)}`;
  document.getElementById("shareWhatsapp").href = `https://wa.me/?text=${encodeURIComponent(caption)}`;
  document.getElementById("shareInstagram").href = "https://www.instagram.com/";
}

document.getElementById("generateImageBtn").addEventListener("click", drawShareCard);
round32El.addEventListener("input", renderBracket);

document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const emailInput = document.getElementById("emailInput");
  const status = document.getElementById("emailStatus");
  const email = emailInput.value.trim().toLowerCase();

  if (!email.includes("@")) {
    status.textContent = "Email invalide.";
    return;
  }

  const localKey = "cup26_emails";
  const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
  if (!existing.includes(email)) {
    existing.push(email);
    localStorage.setItem(localKey, JSON.stringify(existing));
  }

  try {
    await fetch("/api/subscribe.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
  } catch (_) {
    // Intentionally silent: local capture still works in static mode.
  }

  status.textContent = "Merci ! Tu es inscrit(e).";
  emailInput.value = "";
});

renderTeamInputs();
renderBracket();
