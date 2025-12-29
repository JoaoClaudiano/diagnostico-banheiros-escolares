const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = document.getElementById("feedback-form");
const status = document.getElementById("feedback-status");
const submitBtn = document.getElementById("feedback-submit");
const ratingInput = document.getElementById("rating-value");

/* abrir / fechar modal */
fab.onclick = () => modal.classList.remove("hidden");
closeBtn.onclick = () => modal.classList.add("hidden");

/* capturar URL da página automaticamente */
document.getElementById("page-url").value = window.location.href;

/* emojis clicáveis */
document.querySelectorAll(".rating input").forEach(input => {
  input.addEventListener("change", () => {
    ratingInput.value = input.value;
    // marcar visualmente
    document.querySelectorAll(".rating span").forEach(s => s.style.fontWeight = "normal");
    input.nextElementSibling.style.fontWeight = "bold";
  });
});

/* SUBMIT ASSÍNCRONO */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // limpar status
  status.className = "";
  status.textContent = "";

  // botão em carregamento
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Enviando…";

  const data = new FormData(form);

  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      // feedback enviado
      status.textContent = "✅ Obrigado! Seu feedback foi enviado.";
      status.classList.add("success");
      form.reset();
      ratingInput.value = "";

      // suavemente fechar modal depois de 1,8s
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

  // remover estado de carregamento do botão
  submitBtn.classList.remove("loading");
  submitBtn.textContent = "Enviar feedback";
});