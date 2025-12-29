const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = document.getElementById("feedback-form");
const status = document.getElementById("feedback-status");
const submitBtn = document.getElementById("feedback-submit");

/* abrir / fechar */
fab.onclick = () => modal.classList.remove("hidden");
closeBtn.onclick = () => modal.classList.add("hidden");

/* capturar URL automaticamente */
document.getElementById("page-url").value = window.location.href;

/* SUBMIT ASSÍNCRONO */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // estado inicial
  status.className = "";
  status.textContent = "";
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Enviando…";

  const data = new FormData(form);

  try {
    const res = await fetch("https://formspree.io/f/xdaobedn", {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      status.textContent = "✅ Obrigado! Seu feedback foi enviado.";
      status.classList.add("success");
      form.reset();

      setTimeout(() => {
        modal.classList.add("hidden");
        status.textContent = "";
      }, 1800);
    } else {
      throw new Error("Erro no envio");
    }

  } catch {
    status.textContent = "⚠️ Não foi possível enviar agora. Tente novamente.";
    status.classList.add("error");
  }

  submitBtn.classList.remove("loading");
  submitBtn.textContent = "Enviar feedback";
});