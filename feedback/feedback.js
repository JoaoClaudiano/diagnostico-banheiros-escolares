const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = document.getElementById("feedback-form");
const success = document.getElementById("feedback-success");

/* ESTADO INICIAL */
success.classList.add("hidden");
form.classList.remove("hidden");

/* ABRIR / FECHAR */
fab.onclick = () => modal.classList.remove("hidden");
closeBtn.onclick = () => modal.classList.add("hidden");

/* URL automática */
document.getElementById("page-url").value = window.location.href;

/* SUBMIT */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  try {
    const res = await fetch("https://formspree.io/f/SEU_ID_REAL_AQUI", {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      form.classList.add("hidden");
      success.classList.remove("hidden");

      setTimeout(() => {
        modal.classList.add("hidden");
        success.classList.add("hidden");
        form.classList.remove("hidden");
        form.reset();
      }, 2000);
    } else {
      alert("Erro ao enviar feedback.");
    }
  } catch {
    alert("Falha de conexão.");
  }
});