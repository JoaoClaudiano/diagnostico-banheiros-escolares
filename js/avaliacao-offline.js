document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const dados = {
    escola: form.escola.value,
    banheiro: form.banheiro.value,
    vasos: form.vasos.value,
    pias: form.pias.value,
    estado_geral: form.estado_geral.value,
    observacoes: form.observacoes.value
  };

  try {
    await salvarAvaliacaoOffline(dados);
    alert("Avaliação salva no dispositivo. Será sincronizada quando houver internet.");
    form.reset();
  } catch (err) {
    alert("Erro ao salvar avaliação offline.");
    console.error(err);
  }
});
