/* ============================================================
   Portfolio — Samir Mahaman Sadissou
   Logique interactive (thème, menu, données, animations)
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

// ---- Données : projets (à personnaliser !) ----
const projects = [
  {
    icon: "🌐",
    title: "Site portfolio",
    desc: "Ce site personnel responsive, réalisé en HTML, CSS et JavaScript pur, avec mode sombre/clair.",
    tags: ["HTML", "CSS", "JS"],
  },
  {
    icon: "📱",
    title: "Application web",
    desc: "Un projet d'application interactive. Décris ici ton idée, ses fonctionnalités et son objectif.",
    tags: ["React", "API"],
  },
  {
    icon: "🛠️",
    title: "Projet à venir",
    desc: "Une place réservée pour ton prochain projet. Remplace ce texte quand tu seras prêt !",
    tags: ["Bientôt"],
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

// ---- Rendu des projets ----
function renderProjects() {
  const container = document.getElementById("projects");
  container.innerHTML = projects
    .map(
      (p) => `
      <article class="project reveal">
        <div class="project__icon">${p.icon}</div>
        <h3 class="project__title">${p.title}</h3>
        <p class="project__desc">${p.desc}</p>
        <div class="project__tags">${p.tags
          .map((t) => `<span>${t}</span>`)
          .join("")}</div>
      </article>`
    )
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

// ---- Animations au défilement ----
function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Remplir les barres de compétences quand visibles
          const fill = entry.target.querySelector(".skill__fill");
          if (fill) {
            fill.style.width = entry.target.dataset.level + "%";
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document
    .querySelectorAll(".section, .project, .skill")
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
}

// ---- Initialisation ----
document.addEventListener("DOMContentLoaded", () => {
  renderSkills();
  renderProjects();
  initTheme();
  initMenu();
  initReveal();
  document.getElementById("year").textContent = new Date().getFullYear();
});
