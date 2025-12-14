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
  { nome: "DOMINGOS SÁVIO", lat: -3.768396592, lng: -38.53105177 },
  { nome: "DOMINGOS SÁVIO", lat: -3.768396592, lng: -38.53105177 },
  { nome: "PETRONILLA ISONNI", lat: -3.772599965, lng: -38.5283 },
  { nome: "VILA DA CRIANÇA", lat: -3.766056979, lng: -38.53758769 },
  { nome: "JOSÉ BONIFÁCIO", lat: -3.761233118, lng: -38.56690912 },
  { nome: "PROFESSOR JOSÉ ARTUR DE CARVALHO", lat: -3.812347901, lng: -38.49211844 },
  { nome: "SÃO FRANCISCO", lat: -3.743991288, lng: -38.52044177 },
  { nome: "PADRE MIGUEL", lat: -3.779481662, lng: -38.56488091 },
  { nome: "IRACEMA", lat: -3.790665233, lng: -38.54623788 },
  { nome: "LÚCIA ALMEIDA", lat: -3.801923447, lng: -38.57391422 },
  { nome: "JOÃO PAULO II", lat: -3.831552109, lng: -38.50977163 },
  { nome: "MONTE CASTELO", lat: -3.742198334, lng: -38.53844719 },
  { nome: "SÃO JOSÉ", lat: -3.788902417, lng: -38.55281006 },
  { nome: "ALVORADA", lat: -3.815447283, lng: -38.52188374 },
  { nome: "NOSSA SENHORA DAS GRAÇAS", lat: -3.796003912, lng: -38.56731105 },
  { nome: "EDUARDO CAMPOS", lat: -3.828118664, lng: -38.49766231 },
  { nome: "PARQUE DOIS IRMÃOS", lat: -3.806441932, lng: -38.58944177 },
  { nome: "JARDIM AMÉRICA", lat: -3.752114882, lng: -38.56011209 },
  { nome: "ANTÔNIO BANDEIRA", lat: -3.770881447, lng: -38.57900384 },
  { nome: "SANTA RITA", lat: -3.785114992, lng: -38.53688127 },
  { nome: "CRISTO REDENTOR", lat: -3.822774331, lng: -38.51544788 },
  { nome: "PAULO FREIRE", lat: -3.799882447, lng: -38.59211833 },
  { nome: "BELA VISTA", lat: -3.768882114, lng: -38.55499122 },
  { nome: "SANTO ANTÔNIO", lat: -3.807441228, lng: -38.54122899 },
  { nome: "JARDIM DAS OLIVEIRAS", lat: -3.834118992, lng: -38.50277144 },
  { nome: "NOSSA SENHORA APARECIDA", lat: -3.775229881, lng: -38.56888211 },
  { nome: "SÃO VICENTE", lat: -3.742881449, lng: -38.56177209 },
  { nome: "MENINO JESUS", lat: -3.791118223, lng: -38.54911877 },
  { nome: "PARQUE SANTA MARIA", lat: -3.844772118, lng: -38.52299118 },
  { nome: "FÁTIMA", lat: -3.768441229, lng: -38.58344122 },
  { nome: "VILA NOVA", lat: -3.781882114, lng: -38.55711833 },
  { nome: "SÃO PEDRO", lat: -3.812991118, lng: -38.53344199 }


];

// Evento global para avisar que as escolas carregaram
document.dispatchEvent(new Event("escolasCarregadas"));
