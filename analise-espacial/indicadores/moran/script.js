console.log("🔗 Página do Índice de Moran carregada");

document.addEventListener('DOMContentLoaded', function() {
// Interatividade nos padrões
document.querySelectorAll('.padrao-card').forEach(card => {
card.addEventListener('click', function() {
const tipo = this.dataset.tipo;

// Remover destaque de todos
document.querySelectorAll('.padrao-card').forEach(c => {
c.style.transform = 'translateY(0) scale(1)';
c.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
});

// Destacar o clicado
this.style.transform = 'translateY(-15px) scale(1.05)';
this.style.boxShadow = '0 25px 50px rgba(0,0,0,0.25)';

// Atualizar exemplos baseados no padrão
atualizarExemplosMoran(tipo);
});
});

function atualizarExemplosMoran(tipo) {
const cenarios = document.querySelectorAll('.cenario');

cenarios.forEach(cenario => {
cenario.style.opacity = '0.5';
cenario.style.transform = 'scale(0.95)';
});

const cenarioSelecionado = document.querySelector(`.cenario[data-resultado="${tipo}"]`);
if (cenarioSelecionado) {
cenarioSelecionado.style.opacity = '1';
cenarioSelecionado.style.transform = 'scale(1)';
cenarioSelecionado.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
}

// Animar distribuição normal baseada no tipo
const curvaNormal = document.querySelector('.curva-normal');
const linhaMedia = document.querySelector('.linha-media');

if (tipo === 'agrupamento') {
linhaMedia.style.transition = 'all 1s ease';
linhaMedia.style.transform = 'translateX(150%)';
linhaMedia.style.background = '#e74c3c';

setTimeout(() => {
linhaMedia.style.transform = 'translateX(-50%)';
linhaMedia.style.background = '#1a237e';
}, 2000);
} else if (tipo === 'dispersao') {
linhaMedia.style.transition = 'all 1s ease';
linhaMedia.style.transform = 'translateX(-150%)';
linhaMedia.style.background = '#3498db';

setTimeout(() => {
linhaMedia.style.transform = 'translateX(-50%)';
linhaMedia.style.background = '#1a237e';
}, 2000);
}
}

// Simulação de cálculo do Moran
const formulaContainer = document.querySelector('.formula-container');

formulaContainer.addEventListener('click', function() {
// Criar simulador interativo
const simulador = document.createElement('div');
simulador.className = 'simulador-moran';
simulador.innerHTML = `
<h3>🧪 Simule o Índice de Moran</h3>
<div class="controles">
<div>
<label>Padrão:
<select id="padrao-simulacao">
<option value="agrupamento">Agrupamento</option>
<option value="aleatorio">Aleatório</option>
<option value="dispersao">Dispersão</option>
</select>
</label>
</div>
<div>
<label>Número de áreas: <input type="range" id="n-areas" min="10" max="100" value="50"></label>
<span id="n-value">50</span>
</div>
</div>
<button id="simular-moran">Simular Moran I</button>
<div id="resultado-simulacao" style="margin-top:20px;"></div>
`;

// Remover simulador anterior
const simAnterior = document.querySelector('.simulador-moran');
if (simAnterior) simAnterior.remove();

this.appendChild(simulador);

// Atualizar valor do range
const nRange = document.getElementById('n-areas');
const nValue = document.getElementById('n-value');

nRange.addEventListener('input', function() {
nValue.textContent = this.value;
});

// Evento de simulação
document.getElementById('simular-moran').addEventListener('click', simularMoran);
});

function simularMoran() {
const padrao = document.getElementById('padrao-simulacao').value;
const n = parseInt(document.getElementById('n-areas').value);

let moranI, zScore, significancia;

// Gerar valores baseados no padrão
switch(padrao) {
case 'agrupamento':
moranI = (0.3 + Math.random() * 0.4).toFixed(3);
zScore = (1.96 + Math.random() * 2).toFixed(2);
significancia = 'Altamente significativo (p < 0.05)';
break;
case 'aleatorio':
moranI = (-0.1 + Math.random() * 0.2).toFixed(3);
zScore = (-1 + Math.random() * 2).toFixed(2);
significancia = Math.abs(parseFloat(zScore)) > 1.96 ? 'Significativo' : 'Não significativo';
break;
case 'dispersao':
moranI = (-0.4 + Math.random() * 0.3).toFixed(3);
zScore = (-2 - Math.random() * 1).toFixed(2);
significancia = 'Altamente significativo (p < 0.05)';
break;
}

const resultado = document.getElementById('resultado-simulacao');
const cor = parseFloat(moranI) > 0 ? '#e74c3c' : parseFloat(moranI) < 0 ? '#3498db' : '#f39c12';

resultado.innerHTML = `
<div style="background:${cor}20; padding:20px; border-radius:10px; border-left:5px solid ${cor}">
<h4>📊 Resultado da Simulação</h4>
<p><strong>Moran I:</strong> ${moranI}</p>
<p><strong>Z-Score:</strong> ${zScore}</p>
<p><strong>Significância:</strong> ${significancia}</p>
<p><strong>Padrão detectado:</strong> ${padrao === 'agrupamento' ? 'Agrupamento (Clusters)' :
padrao === 'dispersao' ? 'Dispersão (Outliers)' : 'Aleatório'}</p>
<p><strong>Número de áreas:</strong> ${n}</p>
</div>
`;
}

// Animação inicial da distribuição
setTimeout(() => {
const linhaMedia = document.querySelector('.linha-media');
linhaMedia.style.transition = 'all 2s ease';
linhaMedia.style.height = '100%';

  

setTimeout(() => {
atualizarExemplosMoran('agrupamento');
}, 1000);
}, 500);
});
