// ===================== ID CHECKINFRA =====================
function gerarIdCheckInfra() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CI-${ano}-${mes}-${dia}-${rand}`;
}
// ===================== PDF =====================
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("CheckInfra – Avaliação Sanitária", 20, 20);

  pdf.setFontSize(11);
  pdf.text(`Código: ${d.id}`, 20, 35);
  pdf.text(`Escola: ${d.escola}`, 20, 45);
  pdf.text(`Avaliador: ${d.avaliador}`, 20, 55);
  pdf.text(`Pontuação: ${d.pontuacao}`, 20, 65);
  pdf.text(`Status: ${d.status}`, 20, 75);

  let y = 90;
  pdf.text("Problemas identificados:", 20, y);
  y += 10;

  d.problemas.forEach(p => {
    pdf.text(`- ${p}`, 25, y);
    y += 8;
  });

  pdf.text(`Data: ${new Date().toLocaleDateString()}`, 20, y + 10);

  pdf.save(`${d.id}.pdf`);
}
