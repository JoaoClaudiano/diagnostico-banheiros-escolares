const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = document.getElementById("feedback-form");
const status = document.getElementById("feedback-status");
const submitBtn = document.getElementById("feedback-submit");

// abrir / fechar
fab.onclick = () => modal.classList.remove("hidden");
closeBtn.onclick = () => modal.classList.add("hidden");

// capturar URL automaticamente
document.getElementById("page-url").value = window.location.href;

// rating clicável
document.querySelectorAll(".rating input").forEach(input => {
  input.addEventListener("change", () => {
    document.querySelectorAll(".rating label span").forEach(s => s.style.fontWeight = "normal");
    input.nextElementSibling.style.fontWeight = "bold";
  });
});

// submit assíncrono
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // estado inicial
  status.className = "";
  status.textContent = "";
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;
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
    } else {
      throw new Error("Erro no envio");
    }
  } catch {
    status.textContent = "⚠️ Não foi possível enviar agora. Tente novamente.";
    status.classList.add("error");
  }

  submitBtn.classList.remove("loading");
  submitBtn.disabled = false;
  submitBtn.textContent = "Enviar feedback";
});