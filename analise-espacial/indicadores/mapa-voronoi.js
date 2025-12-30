/* =========================
   VISUALIZAÇÃO VORONOI - DADOS REAIS
========================= */

function desenharPoligonosVoronoi(poligonos) {
    if (!poligonos || poligonos.length === 0) {
        console.log('⚠️ Nenhum polígono Voronoi para desenhar');
        return;
    }
    
    camadaVoronoi.clearLayers();
    
    // Encontrar máximo de impacto para normalização
    const maxImpacto = Math.max(...poligonos.map(p => 
        p.impactoTotal || p.metricas?.impactoTotal || 0
    ));
    
    poligonos.forEach((poligono) => {
        let vertices, impacto, escola, nivel;
        
        // Lidar com diferentes formatos de entrada
        if (poligono.vertices) {
            // Formato direto do polígono
            vertices = poligono.vertices;
            impacto = poligono.impactoTotal || 0;
            escola = poligono.escola || poligono.pontoCentro?.escola;
            nivel = poligono.nivelImpacto || 'Desconhecido';
        } else if (poligono.metricas) {
            // Formato de métricas
            vertices = poligono.metricas.vertices;
            impacto = poligono.metricas.impactoTotal;
            escola = poligono.metricas.escola;
            nivel = poligono.metricas.nivelImpacto;
        } else {
            return; // Formato desconhecido
        }
        
        if (!vertices || vertices.length < 3 || !escola) return;
        
        // Determinar cor baseada no impacto
        const cor = getCorPorImpactoVoronoi(impacto, maxImpacto);
        
        // Criar polígono
        const coords = vertices.map(v => [v.lat, v.lng]);
        const polygon = L.polygon(coords, {
            color: cor,
            fillColor: cor,
            fillOpacity: 0.25,
            weight: 2,
            opacity: 0.6,
            dashArray: '5,3'
        });
        
        polygon.addTo(camadaVoronoi);
        
        // Marcador da escola central
        const marker = L.circleMarker([escola.lat, escola.lng], {
            radius: 8,
            fillColor: '#e74c3c',
            color: '#fff',
            weight: 2,
            fillOpacity: 1
        });
        
        marker.addTo(camadaVoronoi);
        
        // Conectar marcador aos vértices
        vertices.forEach(vertice => {
            const line = L.polyline([
                [escola.lat, escola.lng],
                [vertice.lat, vertice.lng]
            ], {
                color: cor,
                weight: 1,
                opacity: 0.3,
                dashArray: '3,3'
            });
            
            line.addTo(camadaVoronoi);
        });
        
        // Popup com informações
        const popupContent = criarPopupVoronoi(escola, vertices, impacto, nivel);
        polygon.bindPopup(popupContent, { 
            maxWidth: 300,
            className: 'voronoi-popup'
        });
        
        marker.bindPopup(popupContent);
        
        // Tooltip simples
        polygon.bindTooltip(`
            ${escola.nome}<br>
            Impacto: ${impacto}/100
        `);
    });
    
    // Adicionar legenda
    adicionarLegendaVoronoi(maxImpacto);
}

function criarPopupVoronoi(escola, vertices, impacto, nivel) {
    const areaKm2 = calcularAreaPoligono(vertices).toFixed(2);
    const raioMedio = calcularRaioMedio(escola, vertices).toFixed(2);
    
    return `
        <div style="font-size: 12px; min-width: 250px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #e74c3c;"></div>
                <strong style="font-size: 13px;">${escola.nome}</strong>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0;">
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #666;">Área</div>
                    <div style="font-weight: bold;">${areaKm2} km²</div>
                </div>
                
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #666;">Raio Médio</div>
                    <div style="font-weight: bold;">${raioMedio} km</div>
                </div>
                
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #666;">Vértices</div>
                    <div style="font-weight: bold;">${vertices.length}</div>
                </div>
                
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #666;">Nível</div>
                    <div style="font-weight: bold;">${nivel}</div>
                </div>
            </div>
            
            <div style="margin: 10px 0; padding: 10px; background: ${getCorPorImpactoVoronoi(impacto)}20; border-radius: 8px; border-left: 4px solid ${getCorPorImpactoVoronoi(impacto)};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>Impacto Total</strong>
                    <span style="font-size: 16px; font-weight: bold;">${impacto}/100</span>
                </div>
                <div style="font-size: 11px; color: #666;">${getDescricaoImpacto(impacto)}</div>
            </div>
            
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                <button onclick="simularFechamentoVoronoi('${escola.id}')" 
                        style="width: 100%; padding: 8px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">
                    🧪 Simular Fechamento
                </button>
            </div>
        </div>
    `;
}

function getCorPorImpactoVoronoi(impacto, maxImpacto = 100) {
    const intensidade = maxImpacto > 0 ? impacto / maxImpacto : 0;
    
    if (intensidade >= 0.8) return '#8B0000'; // Vermelho escuro
    if (intensidade >= 0.6) return '#FF0000'; // Vermelho
    if (intensidade >= 0.4) return '#FFA500'; // Laranja
    if (intensidade >= 0.2) return '#FFFF00'; // Amarelo
    return '#90EE90'; // Verde claro
}

function getDescricaoImpacto(impacto) {
    if (impacto >= 80) return 'Impacto crítico - Prioridade máxima';
    if (impacto >= 60) return 'Impacto alto - Requer intervenção';
    if (impacto >= 40) return 'Impacto moderado - Monitorar';
    if (impacto >= 20) return 'Impacto baixo - Situação controlada';
    return 'Impacto mínimo - Baixa prioridade';
}

function calcularAreaPoligono(vertices) {
    if (vertices.length < 3) return 0;
    
    let area = 0;
    const n = vertices.length;
    
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += vertices[i].lng * vertices[j].lat;
        area -= vertices[j].lng * vertices[i].lat;
    }
    
    area = Math.abs(area) / 2;
    
    // Converter para km² (aproximação)
    const areaKm2 = area * 111 * 111 * Math.cos(-3.7 * Math.PI / 180);
    
    return Math.max(areaKm2, 0.01);
}

function calcularRaioMedio(centro, vertices) {
    if (!vertices || vertices.length === 0) return 0;
    
    let somaDistancias = 0;
    
    vertices.forEach(vertice => {
        const distancia = distanciaKmSimples(
            centro.lat, centro.lng,
            vertice.lat, vertice.lng
        );
        somaDistancias += distancia;
    });
    
    return somaDistancias / vertices.length;
}

function distanciaKmSimples(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function adicionarLegendaVoronoi(maxImpacto) {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        div.style.fontSize = '12px';
        
        div.innerHTML = `
            <strong>🔺 Área de Influência</strong><br>
            <small>Impacto do fechamento (0-100)</small><br>
            <div style="margin-top: 8px;">
                <div style="display: flex; align-items: center; margin: 4px 0;">
                    <div style="width: 20px; height: 10px; background: #8B0000; margin-right: 8px;"></div>
                    <span>80-100: Crítico</span>
                </div>
                <div style="display: flex; align-items: center; margin: 4px 0;">
                    <div style="width: 20px; height: 10px; background: #FF0000; margin-right: 8px;"></div>
                    <span>60-80: Alto</span>
                </div>
                <div style="display: flex; align-items: center; margin: 4px 0;">
                    <div style="width: 20px; height: 10px; background: #FFA500; margin-right: 8px;"></div>
                    <span>40-60: Moderado</span>
                </div>
                <div style="display: flex; align-items: center; margin: 4px 0;">
                    <div style="width: 20px; height: 10px; background: #FFFF00; margin-right: 8px;"></div>
                    <span>20-40: Baixo</span>
                </div>
                <div style="display: flex; align-items: center; margin: 4px 0;">
                    <div style="width: 20px; height: 10px; background: #90EE90; margin-right: 8px;"></div>
                    <span>0-20: Mínimo</span>
                </div>
            </div>
            <div style="margin-top: 8px; font-size: 10px; color: #666;">
                Baseado em: área, densidade, vulnerabilidade
            </div>
        `;
        
        return div;
    };
    
    legend.addTo(map);
}

// Adicionar ao mapa quando carregar
if (map) {
    console.log('✅ Módulo Voronoi carregado e pronto para uso');
}