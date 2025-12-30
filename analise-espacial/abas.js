
function abrirAba(id) {
  document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
  document.querySelectorAll(".abas button").forEach(b => b.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
  event.target.classList.add("ativa");
}


