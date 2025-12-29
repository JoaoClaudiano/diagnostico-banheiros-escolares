const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = modal.querySelector("form");
const success = document.getElementById("feedback-success");

/* ABRIR MODAL */
fab.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

/* FECHAR MODAL */
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

/* FECHAR AO CLICAR FORA (UX) */
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

/* ESC para fechar (desktop) */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.classList.add("hidden");
  }
});

/* RATING – tornar emojis clicáveis */
document.querySelectorAll(".rating label").forEach(label => {
  label.addEventListener("click", () => {
    document
      .querySelectorAll(".rating label")
      .forEach(l => l.classList.remove("active"));

    label.classList.add("active");
  });
});

/* URL AUTOMÁTICA DA PÁGINA */
document.getElementById("page-url").value = window.location.href;

/* CALLBACK DE ENVIO (iframe) */
function feedbackEnviado() {
  form.classList.add("hidden");
  success.classList.remove("hidden");

  setTimeout(() => {
    modal.classList.add("hidden");
    success.classList.add("hidden");
    form.classList.remove("hidden");
    form.reset();

    document
      .querySelectorAll(".rating label")
      .forEach(l => l.classList.remove("active"));
  }, 2000);
}