const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#main-nav");
const header = document.querySelector(".nav");

const getTheme = () => {
  const saved = localStorage.getItem("legitech-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

const setTheme = (theme) => {
  document.body.dataset.theme = theme;
  localStorage.setItem("legitech-theme", theme);
  const button = document.querySelector(".theme-toggle");
  if (button) {
    const isLight = theme === "light";
    button.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    button.innerHTML = `${isLight ? "☾" : "☀"} <span>${isLight ? "Dark" : "Light"}</span>`;
  }
};

if (header) {
  const themeButton = document.createElement("button");
  themeButton.type = "button";
  themeButton.className = "theme-toggle";
  header.insertBefore(themeButton, menuButton);
  themeButton.addEventListener("click", () => {
    setTheme(document.body.dataset.theme === "light" ? "dark" : "light");
  });
  setTheme(getTheme());
}

if (menuButton && nav) {
  const closeMenu = () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const form = document.querySelector("#project-form");

if (form) {
  const status = document.querySelector("#form-status");

  const buildBrief = (data) => [
    "LegiTech.io project brief",
    "",
    `Name: ${data.get("name") || ""}`,
    `Email: ${data.get("email") || ""}`,
    `Company: ${data.get("company") || "Not provided"}`,
    `Service: ${data.get("service") || ""}`,
    `Budget: ${data.get("budget") || "Not decided yet"}`,
    `Timeline: ${data.get("timeline") || "Flexible / exploring"}`,
    "",
    "Project idea:",
    data.get("idea") || ""
  ].join("\n");

  const downloadBrief = (text) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "legitech-project-brief.txt";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitter = event.submitter;

    if (!form.reportValidity()) return;

    const brief = buildBrief(new FormData(form));

    try {
      if (submitter?.value === "download") {
        downloadBrief(brief);
        status.textContent = "Your project brief has been downloaded.";
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(brief);
        status.textContent = "Your project brief has been copied.";
      } else {
        downloadBrief(brief);
        status.textContent = "Copy was not available, so your brief has been downloaded.";
      }
    } catch {
      downloadBrief(brief);
      status.textContent = "Copy was not available, so your brief has been downloaded.";
    }
  });
}
