
import { marked } from "/vendor/marked.esm.js";

// ---------------------------------------------------------------- i18n
const I18N = {
  fr: {
    tagline: "Ton tuteur IA à la maison",
    learner: "Élève",
    addLearner: "+ Nouvel élève",
    guest: "Invité (non suivi)",
    chooseLesson: "Choisir une leçon",
    level: "Niveau",
    class: "Classe",
    subject: "Matière",
    topic: "Sujet",
    topicPlaceholder: "…ou tape ton propre sujet",
    difficulty: "Difficulté",
    basic: "Basique",
    advanced: "Avancé",
    teachingLanguage: "Langue du cours",
    tabLesson: "Cours",
    tabQuiz: "Épreuves",
    tabProgress: "Progrès",
    startLesson: "Commencer le cours",
    lessonEmpty: "Choisis une matière et un sujet, puis clique sur « Commencer le cours ».",
    preparing: "Prof. Ada prépare ton cours…",
    thinking: "Prof. Ada réfléchit…",
    askTutor: "Pose une question à Prof. Ada",
    chatPlaceholder: "Ex. : Peux-tu réexpliquer avec un autre exemple ?",
    send: "Envoyer",
    testMe: "📝 Me tester sur ce sujet",
    numQuestions: "Questions",
    generateQuiz: "Générer une épreuve",
    quizEmpty: "Génère une épreuve pour vérifier ce que tu as appris.",
    generatingQuiz: "Prof. Ada prépare ton épreuve…",
    question: "Question",
    yourAnswer: "Ta réponse…",
    submit: "Rendre ma copie",
    grading: "Correction en cours…",
    unanswered: "Tu n'as pas répondu à toutes les questions. Rendre quand même ?",
    score: "Score",
    strengths: "Points forts",
    toReview: "À revoir",
    expected: "Réponse attendue",
    retry: "Nouvelle épreuve",
    notSaved: "Mode invité : ce résultat n'est pas enregistré. Crée un élève pour suivre les progrès.",
    saved: "Résultat enregistré dans le suivi de",
    progressNoStudent: "Sélectionne ou crée un élève pour suivre ses progrès.",
    progressEmpty: "Aucune épreuve passée pour l'instant. Passe une première épreuve pour voir les progrès ici.",
    aiReport: "✨ Rapport IA",
    tests: "Épreuves passées",
    average: "Moyenne générale",
    best: "Meilleure matière",
    lastScore: "Dernier score",
    bySubject: "Moyenne par matière",
    trend: "Évolution des scores",
    history: "Historique",
    date: "Date",
    diff: "Niveau",
    newLearner: "Nouvel élève",
    name: "Prénom",
    cancel: "Annuler",
    create: "Créer",
    deleteLearner: "Supprimer l'élève",
    confirmDelete: "Supprimer cet élève et tout son historique ?",
    pickSubject: "Choisis d'abord une matière et un sujet.",
    loginIntro: "Entre le code d'accès qu'on t'a donné.",
    wrongCode: "Code incorrect, réessaie.",
    enter: "Entrer",
    context: (c) => `<b>${c.subject}</b> · ${c.topic} · ${c.grade} · ${c.diff}`,
  },
  en: {
    tagline: "Your AI home tutor",
    learner: "Learner",
    addLearner: "+ New learner",
    guest: "Guest (not tracked)",
    chooseLesson: "Choose a lesson",
    level: "Level",
    class: "Class",
    subject: "Subject",
    topic: "Topic",
    topicPlaceholder: "…or type your own topic",
    difficulty: "Difficulty",
    basic: "Basic",
    advanced: "Advanced",
    teachingLanguage: "Teaching language",
    tabLesson: "Lesson",
    tabQuiz: "Tests",
    tabProgress: "Progress",
    startLesson: "Start lesson",
    lessonEmpty: "Pick a subject and a topic, then click “Start lesson”.",
    preparing: "Prof. Ada is preparing your lesson…",
    thinking: "Prof. Ada is thinking…",
    askTutor: "Ask Prof. Ada a question",
    chatPlaceholder: "e.g. Can you explain it again with another example?",
    send: "Send",
    testMe: "📝 Test me on this topic",
    numQuestions: "Questions",
    generateQuiz: "Generate a test",
    quizEmpty: "Generate a test to check what you have learned.",
    generatingQuiz: "Prof. Ada is preparing your test…",
    question: "Question",
    yourAnswer: "Your answer…",
    submit: "Submit my answers",
    grading: "Marking your answers…",
    unanswered: "You have not answered every question. Submit anyway?",
    score: "Score",
    strengths: "Strengths",
    toReview: "To review",
    expected: "Expected answer",
    retry: "New test",
    notSaved: "Guest mode: this result is not saved. Create a learner to track progress.",
    saved: "Result saved to the progress record of",
    progressNoStudent: "Select or create a learner to track their progress.",
    progressEmpty: "No tests taken yet. Take a first test to see progress here.",
    aiReport: "✨ AI report",
    tests: "Tests taken",
    average: "Overall average",
    best: "Best subject",
    lastScore: "Last score",
    bySubject: "Average by subject",
    trend: "Score trend",
    history: "History",
    date: "Date",
    diff: "Level",
    newLearner: "New learner",
    name: "First name",
    cancel: "Cancel",
    create: "Create",
    deleteLearner: "Delete learner",
    confirmDelete: "Delete this learner and all their history?",
    pickSubject: "Pick a subject and a topic first.",
    loginIntro: "Enter the access code you were given.",
    wrongCode: "Wrong code, please try again.",
    enter: "Enter",
    context: (c) => `<b>${c.subject}</b> · ${c.topic} · ${c.grade} · ${c.diff}`,
  },
};

// ---------------------------------------------------------------- state
const state = {
  uiLang: localStorage.getItem("uiLang") || "fr",
  contentLang: localStorage.getItem("contentLang") || "fr",
  level: "primary",
  grade: "P1",
  subject: null,
  topic: "",
  difficulty: "basic",
  studentId: localStorage.getItem("studentId") || "",
  students: [],
  catalog: null,
  lessonText: "",
  lessonKey: "",
  chat: [],
  busy: false,
};

const $ = (sel) => document.querySelector(sel);
const t = (key) => I18N[state.uiLang][key] ?? key;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Model output is rendered as Markdown with raw HTML escaped.
marked.use({ renderer: { html: (tok) => esc(typeof tok === "string" ? tok : tok.text) } });
const md = (text) => marked.parse(text || "");

// ---------------------------------------------------------------- api
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.error === "ACCESS_REQUIRED") showLogin();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

/** POSTs and reads a Server-Sent Events stream; calls onText(fullText) as text arrives. */
async function streamPost(url, body, onText) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && data.error === "ACCESS_REQUIRED") showLogin();
    throw new Error(data.error || res.statusText);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const event = /^event: (.*)$/m.exec(raw)?.[1];
      const data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] || "{}");
      if (event === "delta") {
        text += data.text;
        onText(text);
      } else if (event === "error") {
        throw new Error(data.message);
      }
    }
  }
  return text;
}

function toast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast" + (isError ? " error" : "");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add("hidden"), isError ? 7000 : 3500);
}

const thinkingHTML = (label) => `<div class="thinking"><span class="dots"><span></span><span></span><span></span></span>${esc(label)}</div>`;

// ---------------------------------------------------------------- context
function context() {
  if (!state.subject || !state.topic.trim()) return null;
  return {
    level: state.level,
    grade: state.grade,
    subject: state.subject,
    topic: state.topic.trim(),
    difficulty: state.difficulty,
    lang: state.contentLang,
    studentId: state.studentId || undefined,
  };
}

function contextLabel() {
  const c = context();
  if (!c) return "";
  const cat = state.catalog;
  const grade = cat.levels[c.level].grades.find((g) => g.id === c.grade)[state.uiLang];
  return t("context")({
    subject: esc(cat.subjects[c.subject].label[state.uiLang]),
    topic: esc(c.topic),
    grade: esc(grade),
    diff: t(c.difficulty),
  });
}

// ---------------------------------------------------------------- rendering
function renderStatic() {
  document.documentElement.lang = state.uiLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $("#topicInput").placeholder = t("topicPlaceholder");
  $("#chatInput").placeholder = t("chatPlaceholder");
  document.querySelectorAll(".lang-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.lang === state.uiLang));
  document.querySelectorAll("#contentLangToggle button").forEach((b) => b.classList.toggle("active", b.dataset.clang === state.contentLang));
  document.querySelectorAll("#difficultyToggle button").forEach((b) => b.classList.toggle("active", b.dataset.diff === state.difficulty));
}

function fillLevelSelect(sel, value) {
  sel.innerHTML = Object.entries(state.catalog.levels)
    .map(([id, l]) => `<option value="${id}" ${id === value ? "selected" : ""}>${esc(l.label[state.uiLang])}</option>`)
    .join("");
}
function fillGradeSelect(sel, level, value) {
  sel.innerHTML = state.catalog.levels[level].grades
    .map((g) => `<option value="${g.id}" ${g.id === value ? "selected" : ""}>${esc(g[state.uiLang])}${state.uiLang === "fr" ? "" : ` (${esc(g.fr)})`}</option>`)
    .join("");
}

function renderSetup() {
  fillLevelSelect($("#levelSelect"), state.level);
  fillGradeSelect($("#gradeSelect"), state.level, state.grade);

  $("#subjectGrid").innerHTML = Object.entries(state.catalog.subjects)
    .map(([id, s]) => `<button data-subject="${id}" class="${id === state.subject ? "active" : ""}"><span class="ico">${s.icon}</span>${esc(s.label[state.uiLang])}</button>`)
    .join("");

  const topics = state.subject ? state.catalog.subjects[state.subject].topics[state.level][state.contentLang] : [];
  $("#topicChips").innerHTML = topics
    .map((tp) => `<button class="chip ${tp === state.topic ? "active" : ""}" data-topic="${esc(tp)}">${esc(tp)}</button>`)
    .join("");
  $("#topicInput").value = topics.includes(state.topic) ? "" : state.topic;
  renderHeadings();
}

function renderHeadings() {
  const label = contextLabel();
  $("#lessonHeading").innerHTML = label;
  $("#quizHeading").innerHTML = label;
}

function renderStudents() {
  const sel = $("#studentSelect");
  sel.innerHTML =
    `<option value="">${esc(t("guest"))}</option>` +
    state.students.map((s) => `<option value="${s.id}" ${s.id === state.studentId ? "selected" : ""}>${esc(s.name)}</option>`).join("");
}

function renderAll() {
  renderStatic();
  renderStudents();
  renderSetup();
  if (!state.lessonText) $("#lessonOutput").innerHTML = esc(t("lessonEmpty"));
  if ($("#quizArea").classList.contains("empty")) $("#quizArea").textContent = t("quizEmpty");
  if ($("#pane-progress").classList.contains("active")) loadProgress();
}

// ---------------------------------------------------------------- lesson
async function startLesson() {
  const ctx = context();
  if (!ctx) return toast(t("pickSubject"), true);
  const out = $("#lessonOutput");
  out.classList.remove("empty");
  out.innerHTML = thinkingHTML(t("preparing"));
  $("#chatBox").classList.add("hidden");
  $("#chatLog").innerHTML = "";
  state.chat = [];
  state.lessonText = "";
  setBusy(true);
  try {
    let pending = 0;
    const text = await streamPost("/api/lesson", ctx, (full) => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => (out.innerHTML = md(full)));
    });
    cancelAnimationFrame(pending);
    out.innerHTML = md(text);
    state.lessonText = text;
    state.lessonKey = JSON.stringify(ctx);
    $("#chatBox").classList.remove("hidden");
  } catch (err) {
    out.innerHTML = `<p>⚠️ ${esc(err.message)}</p>`;
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

async function sendChat(e) {
  e.preventDefault();
  const input = $("#chatInput");
  const q = input.value.trim();
  if (!q || state.busy) return;
  input.value = "";
  state.chat.push({ role: "user", content: q });
  const log = $("#chatLog");
  log.insertAdjacentHTML("beforeend", `<div class="msg user">${esc(q)}</div>`);
  const bubble = document.createElement("div");
  bubble.className = "msg assistant markdown";
  bubble.innerHTML = thinkingHTML(t("thinking"));
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
  setBusy(true);
  try {
    const ctx = JSON.parse(state.lessonKey);
    const text = await streamPost("/api/tutor/chat", { ...ctx, lessonText: state.lessonText, history: state.chat }, (full) => {
      bubble.innerHTML = md(full);
      log.scrollTop = log.scrollHeight;
    });
    state.chat.push({ role: "assistant", content: text });
  } catch (err) {
    state.chat.pop();
    bubble.innerHTML = `⚠️ ${esc(err.message)}`;
  } finally {
    setBusy(false);
  }
}

// ---------------------------------------------------------------- quiz
let currentQuiz = null;

async function generateQuiz() {
  const ctx = context();
  if (!ctx) return toast(t("pickSubject"), true);
  const area = $("#quizArea");
  area.classList.remove("empty");
  area.innerHTML = thinkingHTML(t("generatingQuiz"));
  setBusy(true);
  try {
    currentQuiz = await api("/api/quiz", { method: "POST", body: { ...ctx, count: Number($("#quizCount").value) } });
    renderQuiz();
  } catch (err) {
    area.innerHTML = `<p>⚠️ ${esc(err.message)}</p>`;
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

function renderQuiz() {
  const q = currentQuiz;
  $("#quizArea").innerHTML = `
    <h2 class="quiz-title">${esc(q.title)}</h2>
    <form id="quizForm">
      ${q.questions
        .map(
          (qq, i) => `
        <div class="question" data-i="${i}">
          <div class="qnum">${t("question")} ${i + 1} / ${q.questions.length}</div>
          <div class="qprompt">${md(qq.prompt)}</div>
          ${
            qq.type === "mcq"
              ? qq.options
                  .map((o, j) => `<label class="option"><input type="radio" name="q${i}" value="${j}" /> <span>${esc(o)}</span></label>`)
                  .join("")
              : `<input type="text" name="q${i}" placeholder="${esc(t("yourAnswer"))}" autocomplete="off" />`
          }
        </div>`,
        )
        .join("")}
      <div class="quiz-submit"><button class="btn primary">${esc(t("submit"))}</button></div>
    </form>`;
  $("#quizForm").addEventListener("submit", submitQuiz);
}

async function submitQuiz(e) {
  e.preventDefault();
  const form = e.target;
  const answers = currentQuiz.questions.map((qq, i) => {
    if (qq.type === "mcq") {
      const v = form.querySelector(`input[name="q${i}"]:checked`)?.value;
      return v === undefined ? null : Number(v);
    }
    return form.querySelector(`input[name="q${i}"]`).value;
  });
  const missing = answers.some((a) => a === null || a === "");
  if (missing && !confirm(t("unanswered"))) return;

  const btn = form.querySelector(".quiz-submit button");
  btn.disabled = true;
  btn.textContent = t("grading");
  form.querySelectorAll("input").forEach((i) => (i.disabled = true));
  setBusy(true);
  try {
    const result = await api(`/api/quiz/${currentQuiz.id}/submit`, { method: "POST", body: { answers } });
    renderResult(result);
  } catch (err) {
    toast(err.message, true);
    btn.disabled = false;
    btn.textContent = t("submit");
    form.querySelectorAll("input").forEach((i) => (i.disabled = false));
  } finally {
    setBusy(false);
  }
}

const scoreClass = (p) => (p >= 75 ? "good" : p >= 50 ? "mid" : "bad");
const scoreColor = (p) => (p >= 75 ? "var(--good)" : p >= 50 ? "var(--mid)" : "var(--bad)");

function renderResult(r) {
  const pct = Math.round(r.percent);
  const student = state.students.find((s) => s.id === r.studentId);
  $("#quizArea").innerHTML = `
    <div class="score-hero">
      <div class="score-ring" style="--p:${pct};--ring:${scoreColor(pct)}"><b>${pct}%</b></div>
      <div class="feedback">
        <div><strong>${t("score")} : ${formatScore(r.score)} / ${r.outOf}</strong></div>
        <p>${esc(r.overallFeedback)}</p>
        ${r.strengths?.length ? `<div><small>${t("strengths")}</small><div class="tags">${r.strengths.map((s) => `<span class="tag">✅ ${esc(s)}</span>`).join("")}</div></div>` : ""}
        ${r.toReview?.length ? `<div style="margin-top:8px"><small>${t("toReview")}</small><div class="tags">${r.toReview.map((s) => `<span class="tag">🔁 ${esc(s)}</span>`).join("")}</div></div>` : ""}
        <p><small>${student ? `${esc(t("saved"))} <b>${esc(student.name)}</b>.` : esc(t("notSaved"))}</small></p>
      </div>
    </div>
    ${r.corrections
      .map((c, i) => {
        const badge = `<span class="badge ${scoreClass(c.score * 100)}">${formatScore(c.score)} / 1</span>`;
        const body =
          c.type === "mcq"
            ? c.options
                .map((o, j) => {
                  const cls = j === c.correctIndex ? "correct" : j === c.given ? "wrong" : "";
                  return `<div class="option ${cls}"><span>${j === c.correctIndex ? "✅" : j === c.given ? "❌" : "◻️"}</span><span>${esc(o)}</span></div>`;
                })
                .join("")
            : `<div class="option ${c.score >= 1 ? "correct" : c.score > 0 ? "" : "wrong"}">✍️ <span>${esc(c.given || "—")}</span></div>
               <div><small><b>${t("expected")} :</b> ${esc(c.expectedAnswer)}</small></div>
               ${c.feedback ? `<div><small>${esc(c.feedback)}</small></div>` : ""}`;
        return `<div class="question graded">
          <div class="qnum">${t("question")} ${i + 1} ${badge}</div>
          <div class="qprompt">${md(c.prompt)}</div>
          ${body}
          <div class="explain">💡 ${md(c.explanation)}</div>
        </div>`;
      })
      .join("")}
    <div class="quiz-submit"><button class="btn primary" id="retryQuiz">${esc(t("retry"))}</button></div>`;
  $("#retryQuiz").addEventListener("click", generateQuiz);
  $("#quizArea").scrollIntoView({ behavior: "smooth", block: "start" });
}

const formatScore = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// ---------------------------------------------------------------- progress
async function loadProgress() {
  const area = $("#progressArea");
  $("#reportOutput").classList.add("hidden");
  const student = state.students.find((s) => s.id === state.studentId);
  $("#reportBtn").classList.toggle("hidden", !student);
  if (!student) {
    $("#progressHeading").innerHTML = "";
    area.innerHTML = `<div class="card empty">${esc(t("progressNoStudent"))}</div>`;
    return;
  }
  const cat = state.catalog;
  const grade = cat.levels[student.level].grades.find((g) => g.id === student.grade)[state.uiLang];
  $("#progressHeading").innerHTML = `<b>${esc(student.name)}</b> · ${esc(grade)} · <a href="#" id="delStudent">${esc(t("deleteLearner"))}</a>`;
  $("#delStudent").addEventListener("click", deleteStudent);

  const data = await api(`/api/students/${student.id}/progress`);
  if (!data.results.length) {
    area.innerHTML = `<div class="card empty">${esc(t("progressEmpty"))}</div>`;
    return;
  }
  const subjLabel = (id) => `${cat.subjects[id]?.icon ?? ""} ${cat.subjects[id]?.label[state.uiLang] ?? id}`;
  const best = [...data.subjects].sort((a, b) => b.average - a.average)[0];
  const last = data.results.at(-1);

  area.innerHTML = `
    <div class="stats">
      <div class="card stat"><div class="label">${t("tests")}</div><div class="value">${data.results.length}</div></div>
      <div class="card stat"><div class="label">${t("average")}</div><div class="value" style="color:${scoreColor(data.average)}">${Math.round(data.average)}%</div></div>
      <div class="card stat"><div class="label">${t("lastScore")}</div><div class="value" style="color:${scoreColor(last.percent)}">${Math.round(last.percent)}%</div></div>
      <div class="card stat"><div class="label">${t("best")}</div><div class="value" style="font-size:18px">${esc(subjLabel(best.subject))}</div></div>
    </div>
    <div class="card">
      <h3 class="section-title" style="margin-top:0">${t("bySubject")}</h3>
      <div class="bars">
        ${data.subjects
          .map(
            (s) => `<div class="bar-row"><span>${esc(subjLabel(s.subject))}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, s.average)}%;background:${scoreColor(s.average)}"></div></div>
              <b>${Math.round(s.average)}%</b></div>`,
          )
          .join("")}
      </div>
      <h3 class="section-title">${t("trend")}</h3>
      ${sparkline(data.results.slice(-20).map((r) => r.percent))}
      <h3 class="section-title">${t("history")}</h3>
      <table class="history">
        <thead><tr><th>${t("date")}</th><th>${t("subject")}</th><th>${t("topic")}</th><th>${t("diff")}</th><th>${t("score")}</th><th>${t("toReview")}</th></tr></thead>
        <tbody>
          ${[...data.results]
            .reverse()
            .map(
              (r) => `<tr>
                <td>${new Date(r.date).toLocaleDateString(state.uiLang)}</td>
                <td>${esc(subjLabel(r.subject))}</td>
                <td>${esc(r.topic)}</td>
                <td>${t(r.difficulty)}</td>
                <td><span class="badge ${scoreClass(r.percent)}">${Math.round(r.percent)}%</span></td>
                <td><small>${esc((r.toReview || []).join(", "))}</small></td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function sparkline(values) {
  const w = 640, h = 120, pad = 12;
  if (values.length < 2) return `<p><small>—</small></p>`;
  const x = (i) => pad + (i * (w - 2 * pad)) / (values.length - 1);
  const y = (v) => h - pad - (v / 100) * (h - 2 * pad);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="${esc(t("trend"))}">
    ${[0, 50, 100].map((g) => `<line x1="${pad}" x2="${w - pad}" y1="${y(g)}" y2="${y(g)}" stroke="#e6e2d8" stroke-dasharray="3 4"/><text x="${w - pad}" y="${y(g) - 3}" font-size="10" fill="#6b7280" text-anchor="end">${g}%</text>`).join("")}
    <polyline points="${pts}" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${scoreColor(v)}"><title>${Math.round(v)}%</title></circle>`).join("")}
  </svg>`;
}

async function generateReport() {
  const out = $("#reportOutput");
  out.classList.remove("hidden");
  out.innerHTML = thinkingHTML(t("thinking"));
  setBusy(true);
  try {
    const text = await streamPost(`/api/students/${state.studentId}/report`, { lang: state.contentLang }, (full) => (out.innerHTML = md(full)));
    out.innerHTML = md(text);
  } catch (err) {
    out.innerHTML = `⚠️ ${esc(err.message)}`;
  } finally {
    setBusy(false);
  }
}

// ---------------------------------------------------------------- learners
async function loadStudents() {
  state.students = await api("/api/students");
  if (state.studentId && !state.students.some((s) => s.id === state.studentId)) selectStudent("");
}

function selectStudent(id) {
  state.studentId = id;
  localStorage.setItem("studentId", id);
  const s = state.students.find((x) => x.id === id);
  if (s) {
    state.level = s.level;
    state.grade = s.grade;
    state.contentLang = s.lang;
    localStorage.setItem("contentLang", s.lang);
    if (state.subject) state.topic = "";
  }
  renderAll();
}

function openStudentDialog() {
  const dlg = $("#studentDialog");
  const form = $("#studentForm");
  form.reset();
  fillLevelSelect(form.level, state.level);
  fillGradeSelect(form.grade, state.level, state.grade);
  form.level.onchange = () => fillGradeSelect(form.grade, form.level.value);
  dlg.showModal();
  dlg.onclose = async () => {
    if (dlg.returnValue !== "ok") return;
    try {
      const s = await api("/api/students", {
        method: "POST",
        body: { name: form.name.value, level: form.level.value, grade: form.grade.value, lang: state.contentLang },
      });
      state.students.push(s);
      selectStudent(s.id);
    } catch (err) {
      toast(err.message, true);
    }
  };
}

async function deleteStudent(e) {
  e.preventDefault();
  if (!confirm(t("confirmDelete"))) return;
  await api(`/api/students/${state.studentId}`, { method: "DELETE" });
  state.students = state.students.filter((s) => s.id !== state.studentId);
  selectStudent("");
}

// ---------------------------------------------------------------- misc
function setBusy(b) {
  state.busy = b;
  ["#startLessonBtn", "#genQuizBtn", "#reportBtn", "#lessonToQuizBtn"].forEach((s) => ($(s).disabled = b));
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tabpane").forEach((p) => p.classList.toggle("active", p.id === `pane-${name}`));
  if (name === "progress") loadProgress().catch((err) => toast(err.message, true));
}

function bindEvents() {
  document.querySelectorAll(".lang-toggle button").forEach((b) =>
    b.addEventListener("click", () => {
      state.uiLang = b.dataset.lang;
      localStorage.setItem("uiLang", state.uiLang);
      renderAll();
    }),
  );
  document.querySelectorAll("#contentLangToggle button").forEach((b) =>
    b.addEventListener("click", () => {
      state.contentLang = b.dataset.clang;
      localStorage.setItem("contentLang", state.contentLang);
      state.topic = "";
      renderStatic();
      renderSetup();
    }),
  );
  document.querySelectorAll("#difficultyToggle button").forEach((b) =>
    b.addEventListener("click", () => {
      state.difficulty = b.dataset.diff;
      renderStatic();
      renderHeadings();
    }),
  );
  $("#levelSelect").addEventListener("change", (e) => {
    state.level = e.target.value;
    state.grade = state.catalog.levels[state.level].grades[0].id;
    state.topic = "";
    renderSetup();
  });
  $("#gradeSelect").addEventListener("change", (e) => {
    state.grade = e.target.value;
    renderHeadings();
  });
  $("#subjectGrid").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-subject]");
    if (!b) return;
    state.subject = b.dataset.subject;
    state.topic = "";
    renderSetup();
  });
  $("#topicChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-topic]");
    if (!b) return;
    state.topic = b.dataset.topic;
    renderSetup();
  });
  $("#topicInput").addEventListener("input", (e) => {
    state.topic = e.target.value;
    document.querySelectorAll("#topicChips .chip").forEach((c) => c.classList.remove("active"));
    renderHeadings();
  });
  $("#studentSelect").addEventListener("change", (e) => selectStudent(e.target.value));
  $("#addStudentBtn").addEventListener("click", openStudentDialog);
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("#startLessonBtn").addEventListener("click", startLesson);
  $("#chatForm").addEventListener("submit", sendChat);
  $("#genQuizBtn").addEventListener("click", generateQuiz);
  $("#lessonToQuizBtn").addEventListener("click", () => {
    switchTab("quiz");
    generateQuiz();
  });
  $("#reportBtn").addEventListener("click", generateReport);
}

// ---------------------------------------------------------------- access code
let loginResolve = null;

/** Shows the access-code screen; resolves once the code is accepted. */
function showLogin() {
  renderStatic();
  $("#loginScreen").classList.remove("hidden");
  $("#loginCode").focus();
  return new Promise((resolve) => (loginResolve = resolve));
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  $("#loginError").classList.add("hidden");
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: $("#loginCode").value }),
    });
    if (!res.ok) {
      $("#loginError").classList.remove("hidden");
      return;
    }
    $("#loginScreen").classList.add("hidden");
    $("#loginCode").value = "";
    loginResolve?.();
    loginResolve = null;
  } finally {
    btn.disabled = false;
  }
});

// ---------------------------------------------------------------- boot
(async function init() {
  const session = await api("/api/session");
  if (session.authRequired && !session.authed) await showLogin();
  state.catalog = await api("/api/curriculum");
  await loadStudents();
  const s = state.students.find((x) => x.id === state.studentId);
  if (s) {
    state.level = s.level;
    state.grade = s.grade;
  }
  bindEvents();
  renderAll();
})().catch((err) => toast(err.message, true));
