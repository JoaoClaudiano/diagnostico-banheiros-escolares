// mapa/escolas.js
// Base oficial de escolas municipais de Fortaleza

window.escolas = [
  { nome: "MARIA DALVA DOS SANTOS", lat: -3.713231714, lng: -38.54572195 },
  { nome: "ANTÔNIO CÉSAR PEREIRA PINHEIRO", lat: -3.85876949, lng: -38.51526774 },
  { nome: "LUIZ TEIXEIRA MATOS", lat: -3.827787717, lng: -38.56953765 },
  { nome: "PROFESSORA MARIA MIRTES BASTOS MANGUEIRA", lat: -3.789810118, lng: -38.6190791 },
  { nome: "PAULO CÉSAR FEITOSA", lat: -3.75284507, lng: -38.47289004 },
  { nome: "JOSÉ CARLOS DE OLIVEIRA NETO", lat: -3.738321255, lng: -38.59517747 },
  { nome: "CIDADE JARDIM II", lat: -3.847467907, lng: -38.55418019 },
  { nome: "CIDADE JARDIM I", lat: -3.828669565, lng: -38.54493117 },
  { nome: "MARIA DA CONCEIÇÃO HOLANDA CAVALCANTE", lat: -3.759825961, lng: -38.58346115 },
  { nome: "PASTOR FLORÊNCIO NUNES NETO", lat: -3.826481646, lng: -38.59335783 },
  { nome: "FRANCISCA RODRIGUES DE SOUSA", lat: -3.799259371, lng: -38.54849143 },
  { nome: "REITOR ROBERTO CLÁUDIO FROTA BEZERRA", lat: -3.803738348, lng: -38.55118437 },
  { nome: "MARCÍLIO AMORIM", lat: -3.798681034, lng: -38.58789742 },
  { nome: "TIO SÉRGIO", lat: -3.817021888, lng: -38.57057957 },
  { nome: "ACADEMIA DA CRIANÇA", lat: -3.805184417, lng: -38.50464545 },
  { nome: "MÃE BALBINA", lat: -3.78654629, lng: -38.61829067 },
  { nome: "SEMENTE DO AMANHÃ II", lat: -3.794048385, lng: -38.58877966 },
  { nome: "DOMINGOS SÁVIO", lat: -3.768396592, lng: -38.53105177 }
  { nome: "DOMINGOS SÁVIO", lat: -3.768396592, lng: -38.53105177 },
  { nome: "PETRONILLA ISONNI", lat: -3.772599965, lng: -38.5283 },
  { nome: "VILA DA CRIANÇA", lat: -3.766056979, lng: -38.53758769 },
];

// Evento global para avisar que as escolas carregaram
document.dispatchEvent(new Event("escolasCarregadas"));
