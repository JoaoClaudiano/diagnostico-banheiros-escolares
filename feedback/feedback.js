emailjs.init("vCgPESmVfPbJdk-U7");

let avaliacaoSelecionada = "";

document.getElementById("feedback-tab")
  .addEventListener("click", () => {
    const panel = document.getElementById("feedback-panel");
    panel.style.right = panel.style.right === "0px" ? "-330px" : "0px";
  });

document.querySelectorAll(".feedback-rating span")
  .forEach(span => {
    span.addEventListener("click", () => {
      document.querySelectorAll(".feedback-rating span")
        .forEach(s => s.classList.remove("selected"));

      span.classList.add("selected");
      avaliacaoSelecionada = span.dataset.value;
    });
  });

document.getElementById("feedback-send")
  .addEventListener("click", () => {
    if (!avaliacaoSelecionada) {
      alert("Selecione uma avaliação.");
      return;
    }

    emailjs.send(
      "service_a519te7",
      "template_oc2zio4",
      {
        rating: avaliacaoSelecionada,
        message:
          document.getElementById("feedback-textarea").value ||
          "Sem comentário adicional."
      }
    ).then(() => {
      document.getElementById("feedback-status")
        .innerText = "Obrigado! Feedback enviado.";
    });
  });