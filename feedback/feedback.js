const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = document.getElementById("feedback-form");
const status = document.getElementById("feedback-status");
const ratingInput = document.getElementById("rating-value");

fab.onclick = () => modal.classList.remove("hidden");
closeBtn.onclick = () => modal.classList.add("hidden");

/* Rating */
document.querySelectorAll(".rating span").forEach(el => {
  el.onclick = () => {
    document.querySelectorAll(".rating span").forEach(s => s.classList.remove("active"));
    el.classList.add("active");
    ratingInput.value = el.dataset.value;
  };
});

/* SUBMIT ASSÍNCRONO */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  status.textContent = "Enviando...";

  const data = new FormData(form);

  try {
    const res = await fetch("https://formspree.io/f/SEU_ID_AQUI", {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      status.textContent = "✅ Feedback enviado. Obrigado!";
      form.reset();
      setTimeout(() => modal.classList.add("hidden"), 1500);
    } else {
      status.textContent = "⚠️ Erro ao enviar. Tente novamente.";
    }

  } catch {
    status.textContent = "⚠️ Falha de conexão.";
  }
});