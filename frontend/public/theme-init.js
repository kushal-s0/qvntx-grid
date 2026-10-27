// Apply the theme before CSS/React paint, avoiding a light flash on dark visits.
(() => {
  let theme;
  try {
    theme = localStorage.getItem("qvntx-grid-theme");
  } catch {
    /* Storage is optional. */
  }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0e1425" : "#ede8f5");
})();
