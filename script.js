/* ============================================================
   Portfolio — Samir Mahaman Sadissou
   Logique interactive (thème, menu, données, animations, formulaire)
   ============================================================ */

// ---- Données : compétences ----
const skills = [
  { name: "HTML & CSS", level: 90 },
  { name: "JavaScript", level: 80 },
  { name: "React", level: 70 },
  { name: "Node.js", level: 65 },
  { name: "Python", level: 60 },
  { name: "Git & GitHub", level: 75 },
];

// ---- Données : parcours / expérience (à personnaliser !) ----
const timeline = [
  {
    date: "2024 — Aujourd'hui",
    title: "Développeur web",
    place: "Projets personnels & freelance",
    desc: "Conception de sites et applications web modernes. Remplace ce texte par ta vraie expérience.",
  },
  {
    date: "2023 — 2024",
    title: "Formation en développement",
    place: "École / Autoformation",
    desc: "Apprentissage des fondamentaux du web : HTML, CSS, JavaScript et frameworks modernes.",
  },
  {
    date: "2022",
    title: "Début du parcours",
    place: "Découverte de la programmation",
    desc: "Premiers pas dans le code et les premiers projets. Décris ici tes débuts.",
  },
];

// ---- Données : projets (à personnaliser !) ----
// Ajoute "link" (démo) et/ou "code" (dépôt GitHub) — laisse vide "" pour masquer le bouton.
const projects = [
  {
    icon: "🌐",
    title: "Site portfolio",
    desc: "Ce site personnel responsive, réalisé en HTML, CSS et JavaScript pur, avec mode sombre/clair.",
    tags: ["HTML", "CSS", "JS"],
    link: "",
    code: "https://github.com/samirmahamansadissou-lang/Samir",
  },
  {
    icon: "📱",
    title: "Application web",
    desc: "Un projet d'application interactive. Décris ici ton idée, ses fonctionnalités et son objectif.",
    tags: ["React", "API"],
    link: "",
    code: "",
  },
  {
    icon: "🛠️",
    title: "Projet à venir",
    desc: "Une place réservée pour ton prochain projet. Remplace ce texte quand tu seras prêt !",
    tags: ["Bientôt"],
    link: "",
    code: "",
  },
];

// ---- Rendu des compétences ----
function renderSkills() {
  const container = document.getElementById("skills");
  container.innerHTML = skills
    .map(
      (s) => `
      <div class="skill" data-level="${s.level}">
        <div class="skill__head">
          <span class="skill__name">${s.name}</span>
          <span class="skill__pct">${s.level}%</span>
        </div>
        <div class="skill__bar"><div class="skill__fill"></div></div>
      </div>`
    )
    .join("");
}

// ---- Rendu du parcours ----
function renderTimeline() {
  const container = document.getElementById("timeline");
  container.innerHTML = timeline
    .map(
      (t) => `
      <div class="tl-item reveal">
        <div class="tl-dot"></div>
        <div class="tl-content">
          <span class="tl-date">${t.date}</span>
          <h3 class="tl-title">${t.title}</h3>
          <span class="tl-place">${t.place}</span>
          <p class="tl-desc">${t.desc}</p>
        </div>
      </div>`
    )
    .join("");
}

// ---- Rendu des projets ----
function renderProjects() {
  const container = document.getElementById("projects");
  container.innerHTML = projects
    .map((p) => {
      const links = [
        p.link ? `<a href="${p.link}" target="_blank" rel="noopener">🔗 Démo</a>` : "",
        p.code ? `<a href="${p.code}" target="_blank" rel="noopener">💻 Code</a>` : "",
      ]
        .filter(Boolean)
        .join("");
      return `
      <article class="project reveal">
        <div class="project__icon">${p.icon}</div>
        <h3 class="project__title">${p.title}</h3>
        <p class="project__desc">${p.desc}</p>
        <div class="project__tags">${p.tags
          .map((t) => `<span>${t}</span>`)
          .join("")}</div>
        ${links ? `<div class="project__links">${links}</div>` : ""}
      </article>`;
    })
    .join("");
}

// ---- Gestion du thème (mémorisé) ----
function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon();

  toggle.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "dark"
        : "light";
    document.documentElement.setAttribute("data-theme", current);
    localStorage.setItem("theme", current);
    updateThemeIcon();
  });
}
function updateThemeIcon() {
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  document.getElementById("themeToggle").textContent = isLight ? "☀️" : "🌙";
}

// ---- Menu mobile ----
function initMenu() {
  const toggle = document.getElementById("menuToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

// ---- Formulaire de contact ----
function initForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    // Si Formspree n'est pas encore configuré, on prévient au lieu d'envoyer.
    if (form.action.includes("VOTRE_ID_FORMSPREE")) {
      e.preventDefault();
      status.textContent =
        "⚠️ Formulaire non configuré. Ajoute ton identifiant Formspree (voir README).";
      status.className = "form-status error";
      return;
    }

    e.preventDefault();
    status.textContent = "Envoi en cours...";
    status.className = "form-status";

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        status.textContent = "✅ Merci ! Ton message a bien été envoyé.";
        status.className = "form-status success";
        form.reset();
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (err) {
      status.textContent =
        "❌ Oups, l'envoi a échoué. Réessaie ou écris-moi par email.";
      status.className = "form-status error";
    }
  });
}

// ---- Animations au défilement ----
function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          const fill = entry.target.querySelector(".skill__fill");
          if (fill) {
            fill.style.width = entry.target.dataset.level + "%";
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document
    .querySelectorAll(".section, .project, .skill, .tl-item")
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
}

// ---- Initialisation ----
document.addEventListener("DOMContentLoaded", () => {
  renderSkills();
  renderTimeline();
  renderProjects();
  initTheme();
  initMenu();
  initForm();
  initReveal();
  document.getElementById("year").textContent = new Date().getFullYear();
});
