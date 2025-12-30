const API_URL = "https://script.google.com/macros/s/.../exec"; // substitua pelo seu URL

const map = L.map("map").setView([-3.7319, -38.5267], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let modoIndicador = 1;
let dadosOriginais = [];

const camadaHeatmap = L.heatLayer([], { radius:35, blur:25, minOpacity:0.35 }).addTo(map);
const camadaZonas = L.layerGroup().addTo(map);

fetch(API_URL).then(r=>r.json()).then(d=>{
  dadosOriginais = d;
  recalcularMapa(dadosOriginais);
});

