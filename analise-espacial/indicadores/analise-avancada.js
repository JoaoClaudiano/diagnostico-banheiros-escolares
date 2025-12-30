
/* =========================
   ANÁLISE ESPACIAL AVANÇADA
   Métodos: KDE, Gini, Moran, LQ - DADOS REAIS
========================= */

class AnaliseEspacialAvancada {
    constructor(escolas) {
        this.escolas = escolas;
        this.RAIO_TERRA_KM = 6371;
    }
    
    /* ========================
       KERNEL DENSITY ESTIMATION (KDE)
       Calcula densidade real de pontos críticos
    ========================= */
    
    calcularKDE(larguraBanda = 1.0) {
        console.log('📊 Calculando KDE com dados reais...');
        
        // Usar dados filtrados pelos controles do CheckInfra
        const dadosFiltrados = this.obterDadosFiltrados();
        const escolasCriticas = dadosFiltrados.filter(e => e.status === 'crítica');
        const escolasAlerta = dadosFiltrados.filter(e => e.status === 'alerta');
        
        if (escolasCriticas.length === 0 && escolasAlerta.length === 0) {
            console.warn('⚠️ Nenhuma escola crítica ou em alerta para KDE');
            return { celulas: [], tipo: 'kde', mensagem: 'Sem dados críticos' };
        }
        
        // Criar grid para KDE
        const bounds = map.getBounds();
        const celulas = this.criarGrid(bounds, 0.005); // Grid fino para precisão
        
        // Para cada célula, calcular densidade KDE
        celulas.forEach(celula => {
            const centro = this.calcularCentroide(celula.bounds);
            let densidadeTotal = 0;
            
            // Contribuição das escolas críticas (peso maior)
            escolasCriticas.forEach(escola => {
                const distancia = this.distanciaKm(centro, escola);
                const peso = this.kernelGaussiano(distancia, larguraBanda);
                densidadeTotal += peso * 2.0; // Peso maior para críticas
            });
            
            // Contribuição das escolas em alerta
            escolasAlerta.forEach(escola => {
                const distancia = this.distanciaKm(centro, escola);
                const peso = this.kernelGaussiano(distancia, larguraBanda);
                densidadeTotal += peso * 1.0; // Peso menor para alertas
            });
            
            // Armazenar resultados
            celula.kde = densidadeTotal;
            celula.densidadeKm2 = densidadeTotal / (Math.PI * larguraBanda * larguraBanda);
            celula.escolasCriticas = escolasCriticas.filter(e => 
                this.distanciaKm(centro, e) <= larguraBanda
            ).length;
            celula.escolasTotal = dadosFiltrados.filter(e => 
                this.distanciaKm(centro, e) <= larguraBanda
            ).length;
        });
        
        // Normalizar valores para 0-1
        const maxKDE = Math.max(...celulas.map(c => c.kde || 0));
        celulas.forEach(c => {
            c.kdeNormalizado = maxKDE > 0 ? c.kde / maxKDE : 0;
            c.intensidade = (c.kdeNormalizado * 100).toFixed(1);
        });
        
        return {
            celulas: celulas.filter(c => c.kde > 0),
            tipo: 'kde',
            estatisticas: {
                totalPontos: escolasCriticas.length + escolasAlerta.length,
                larguraBanda: larguraBanda,
                maxDensidade: maxKDE.toFixed(4),
                celulasComDensidade: celulas.filter(c => c.kde > 0).length
            }
        };
    }
    
    kernelGaussiano(distancia, larguraBanda) {
        return Math.exp(-0.5 * Math.pow(distancia / larguraBanda, 2));
    }
    
    /* ========================
       LOCATION QUOTIENT (LQ)
       Concentração relativa vs média da cidade
    ========================= */
    
    calcularLQ() {
        console.log('📈 Calculando Location Quotient (LQ)...');
        
        const dadosFiltrados = this.obterDadosFiltrados();
        const totalCidade = {
            escolas: dadosFiltrados.length,
            criticas: dadosFiltrados.filter(e => e.status === 'crítica').length,
            alertas: dadosFiltrados.filter(e => e.status === 'alerta').length
        };
        
        if (totalCidade.escolas === 0) {
            return { celulas: [], tipo: 'lq', mensagem: 'Sem dados' };
        }
        
        const proporcaoCidade = totalCidade.criticas / totalCidade.escolas;
        const bounds = map.getBounds();
        const celulas = this.criarGrid(bounds, 0.01);
        
        celulas.forEach(celula => {
            const escolasNaCelula = dadosFiltrados.filter(e => 
                e.lat >= celula.bounds[0][0] && 
                e.lat < celula.bounds[1][0] && 
                e.lng >= celula.bounds[0][1] && 
                e.lng < celula.bounds[1][1]
            );
            
            const criticasLocal = escolasNaCelula.filter(e => e.status === 'crítica').length;
            const totalLocal = escolasNaCelula.length;
            
            if (totalLocal === 0) {
                celula.lq = 0;
                celula.proporcaoLocal = 0;
                celula.classificacao = 'sem_dados';
            } else {
                celula.proporcaoLocal = criticasLocal / totalLocal;
                celula.lq = proporcaoCidade > 0 ? celula.proporcaoLocal / proporcaoCidade : 0;
                
                // Classificar concentração
                if (celula.lq >= 2.0) celula.classificacao = 'muito_alta';
                else if (celula.lq >= 1.5) celula.classificacao = 'alta';
                else if (celula.lq >= 1.0) celula.classificacao = 'media';
                else if (celula.lq >= 0.5) celula.classificacao = 'baixa';
                else celula.classificacao = 'muito_baixa';
            }
            
            celula.escolas = escolasNaCelula;
            celula.total = totalLocal;
            celula.criticas = criticasLocal;
            celula.proporcaoCidade = proporcaoCidade;
        });
        
        const celulasComDados = celulas.filter(c => c.total > 0);
        
        return {
            celulas: celulasComDados,
            tipo: 'lq',
            estatisticas: {
                proporcaoCidade: (proporcaoCidade * 100).toFixed(1) + '%',
                mediaLQ: celulasComDados.reduce((sum, c) => sum + c.lq, 0) / celulasComDados.length,
                desvioLQ: this.calcularDesvioPadrao(celulasComDados.map(c => c.lq)),
                classificacoes: this.contarClassificacoes(celulasComDados)
            }
        };
    }
    
    /* ========================
       ÍNDICE DE GINI ESPACIAL
       Mede desigualdade na distribuição
    ========================= */
    
    calcularGiniEspacial() {
        console.log('⚖️ Calculando Índice de Gini Espacial...');
        
        const dadosFiltrados = this.obterDadosFiltrados();
        const bounds = map.getBounds();
        const celulas = this.criarGrid(bounds, 0.01);
        
        // Contar escolas críticas por célula
        const criticasPorCelula = celulas.map(celula => {
            return dadosFiltrados.filter(e => 
                e.status === 'crítica' &&
                e.lat >= celula.bounds[0][0] && 
                e.lat < celula.bounds[1][0] && 
                e.lng >= celula.bounds[0][1] && 
                e.lng < celula.bounds[1][1]
            ).length;
        }).filter(n => n > 0);
        
        if (criticasPorCelula.length === 0) {
            return { 
                gini: 0, 
                tipo: 'gini',
                mensagem: 'Sem escolas críticas para cálculo'
            };
        }
        
        // Ordenar valores
        criticasPorCelula.sort((a, b) => a - b);
        const n = criticasPorCelula.length;
        const somaTotal = criticasPorCelula.reduce((a, b) => a + b, 0);
        
        // Calcular curva de Lorenz
        let areaLorenz = 0;
        let acumulado = 0;
        
        for (let i = 0; i < n; i++) {
            acumulado += criticasPorCelula[i];
            const yi = acumulado / somaTotal; // Proporção acumulada de críticas
            const xi = (i + 1) / n;          // Proporção acumulada de células
            
            // Área do trapézio entre (xi-1, yi-1) e (xi, yi)
            const base = xi - (i / n);
            const alturaMedia = (yi + (i > 0 ? (acumulado - criticasPorCelula[i]) / somaTotal : 0)) / 2;
            areaLorenz += base * alturaMedia;
        }
        
        const gini = 1 - (2 * areaLorenz);
        
        // Classificar desigualdade
        let classificacao = 'Igualdade';
        if (gini >= 0.6) classificacao = 'Desigualdade Extrema';
        else if (gini >= 0.5) classificacao = 'Alta Desigualdade';
        else if (gini >= 0.4) classificacao = 'Desigualdade Moderada';
        else if (gini >= 0.3) classificacao = 'Desigualdade Baixa';
        else if (gini >= 0.2) classificacao = 'Relativa Igualdade';
        
        return {
            gini: gini.toFixed(3),
            classificacao: classificacao,
            tipo: 'gini',
            estatisticas: {
                totalCelulas: n,
                somaCriticas: somaTotal,
                mediaPorCelula: (somaTotal / n).toFixed(2),
                desvioPadrao: this.calcularDesvioPadrao(criticasPorCelula),
                coeficienteVariacao: this.calcularDesvioPadrao(criticasPorCelula) / (somaTotal / n)
            }
        };
    }
    
    /* ========================
       ÍNDICE DE MORAN (Autocorrelação Espacial)
       Mede agrupamento de valores similares
    ========================= */
    
    calcularMoranI() {
        console.log('🔗 Calculando Índice de Moran I...');
        
        const dadosFiltrados = this.obterDadosFiltrados();
        const bounds = map.getBounds();
        const celulas = this.criarGrid(bounds, 0.01);
        
        // Calcular valor para cada célula (proporção de críticas)
        const valores = [];
        const coordenadas = [];
        const celulasComDados = [];
        
        celulas.forEach(celula => {
            const escolasNaCelula = dadosFiltrados.filter(e => 
                e.lat >= celula.bounds[0][0] && 
                e.lat < celula.bounds[1][0] && 
                e.lng >= celula.bounds[0][1] && 
                e.lng < celula.bounds[1][1]
            );
            
            if (escolasNaCelula.length > 0) {
                const criticas = escolasNaCelula.filter(e => e.status === 'crítica').length;
                const valor = criticas / escolasNaCelula.length;
                valores.push(valor);
                
                const centro = this.calcularCentroide(celula.bounds);
                coordenadas.push(centro);
                celulasComDados.push({
                    ...celula,
                    valor: valor,
                    criticas: criticas,
                    total: escolasNaCelula.length
                });
            }
        });
        
        if (valores.length < 2) {
            return { 
                moranI: 0, 
                tipo: 'moran',
                mensagem: 'Dados insuficientes para análise de autocorrelação'
            };
        }
        
        // Calcular média
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const n = valores.length;
        
        // Calcular matriz de pesos (baseado na distância inversa)
        let numerador = 0;
        let denominador = 0;
        let S0 = 0;
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const distancia = this.distanciaKm(coordenadas[i], coordenadas[j]);
                    // Peso baseado na distância inversa (com limite mínimo)
                    const peso = 1 / Math.max(distancia, 0.1);
                    
                    numerador += peso * (valores[i] - media) * (valores[j] - media);
                    S0 += peso;
                }
            }
            denominador += Math.pow(valores[i] - media, 2);
        }
        
        const moranI = (n / S0) * (numerador / denominador);
        
        // Calivar valor esperado e variância para teste Z
        const valorEsperado = -1 / (n - 1);
        const varianciaNumerador = n * n * this.calcularS1(n) - 3 * n * n;
        const varianciaDenominador = (n - 1) * (n + 1) * S0 * S0;
        const variancia = varianciaNumerador / varianciaDenominador - valorEsperado * valorEsperado;
        
        const zScore = (moranI - valorEsperado) / Math.sqrt(variancia);
        
        // Teste de significância
        let significancia = 'Não significativo';
        let padrao = 'Aleatório';
        
        if (Math.abs(zScore) > 1.96) { // p < 0.05
            significancia = 'Significativo (95% confiança)';
            if (zScore > 0 && moranI > valorEsperado) {
                padrao = 'Agrupamento (clusters)';
            } else if (zScore < 0 && moranI < valorEsperado) {
                padrao = 'Dispersão (outliers)';
            }
        }
        
        if (Math.abs(zScore) > 2.58) { // p < 0.01
            significancia = 'Altamente significativo (99% confiança)';
        }
        
        return {
            moranI: moranI.toFixed(3),
            zScore: zScore.toFixed(3),
            significancia: significancia,
            padrao: padrao,
            tipo: 'moran',
            estatisticas: {
                n: n,
                media: media.toFixed(3),
                valorEsperado: valorEsperado.toFixed(3),
                variancia: variancia.toFixed(6),
                intervaloConfianca: `[${(moranI - 1.96 * Math.sqrt(variancia)).toFixed(3)}, ${(moranI + 1.96 * Math.sqrt(variancia)).toFixed(3)}]`
            }
        };
    }
    
    calcularS1(n) {
        // Função auxiliar para cálculo de variância do Moran
        let soma = 0;
        for (let i = 1; i <= n - 1; i++) {
            soma += 1 / i;
        }
        return soma;
    }
    
    /* ========================
       ÍNDICE DE SATURAÇÃO SINTÉTICO (ISS)
       Combina múltiplos indicadores
    ========================= */
    
    calcularISS() {
        console.log('🧮 Calculando Índice de Saturação Sintético...');
        
        // Calcular todos os indicadores
        const kde = this.calcularKDE();
        const lq = this.calcularLQ();
        const gini = this.calcularGiniEspacial();
        const moran = this.calcularMoranI();
        
        // Para KDE e LQ, precisamos de células comuns
        const bounds = map.getBounds();
        const celulas = this.criarGrid(bounds, 0.01);
        
        const resultados = celulas.map(celula => {
            // Calcular KDE para esta célula
            const centro = this.calcularCentroide(celula.bounds);
            const dadosFiltrados = this.obterDadosFiltrados();
            
            // KDE local
            let kdeLocal = 0;
            dadosFiltrados.forEach(escola => {
                const distancia = this.distanciaKm(centro, escola);
                const peso = this.kernelGaussiano(distancia, 1.0);
                const multiplicador = escola.status === 'crítica' ? 2.0 : 1.0;
                kdeLocal += peso * multiplicador;
            });
            
            // LQ local
            const escolasNaCelula = dadosFiltrados.filter(e => 
                e.lat >= celula.bounds[0][0] && 
                e.lat < celula.bounds[1][0] && 
                e.lng >= celula.bounds[0][1] && 
                e.lng < celula.bounds[1][1]
            );
            
            const criticasLocal = escolasNaCelula.filter(e => e.status === 'crítica').length;
            const totalLocal = escolasNaCelula.length;
            const criticasCidade = dadosFiltrados.filter(e => e.status === 'crítica').length;
            const totalCidade = dadosFiltrados.length;
            
            const proporcaoLocal = totalLocal > 0 ? criticasLocal / totalLocal : 0;
            const proporcaoCidade = totalCidade > 0 ? criticasCidade / totalCidade : 0;
            const lqLocal = proporcaoCidade > 0 ? proporcaoLocal / proporcaoCidade : 0;
            
            // Calcular ISS (0-100)
            const iss = this.calcularISSIndividual(kdeLocal, lqLocal, escolasNaCelula);
            
            return {
                bounds: celula.bounds,
                centro: centro,
                iss: iss,
                kde: kdeLocal,
                lq: lqLocal,
                escolas: escolasNaCelula,
                criticas: criticasLocal,
                total: totalLocal,
                nivel: this.classificarISS(iss)
            };
        }).filter(c => c.total > 0);
        
        // Ordenar por ISS
        resultados.sort((a, b) => b.iss - a.iss);
        
        return {
            resultados: resultados,
            tipo: 'iss',
            estatisticas: {
                mediaISS: (resultados.reduce((sum, r) => sum + r.iss, 0) / resultados.length).toFixed(1),
                maxISS: Math.max(...resultados.map(r => r.iss)),
                minISS: Math.min(...resultados.map(r => r.iss)),
                gini: gini.gini,
                moran: moran.moranI,
                top5: resultados.slice(0, 5).map(r => ({
                    iss: r.iss,
                    nivel: r.nivel,
                    criticas: r.criticas
                }))
            }
        };
    }
    
    calcularISSIndividual(kde, lq, escolas) {
        // Componentes do ISS:
        // 1. Densidade (KDE) - até 40 pontos
        const componenteDensidade = Math.min(kde * 20, 40);
        
        // 2. Concentração (LQ) - até 30 pontos
        const componenteConcentracao = Math.min(lq * 15, 30);
        
        // 3. Criticidade local - até 30 pontos
        const criticas = escolas.filter(e => e.status === 'crítica').length;
        const total = escolas.length;
        const criticidade = total > 0 ? (criticas / total) * 30 : 0;
        
        return Math.min(componenteDensidade + componenteConcentracao + criticidade, 100);
    }
    
    classificarISS(valor) {
        if (valor >= 80) return 'Saturação Extrema';
        if (valor >= 60) return 'Saturação Alta';
        if (valor >= 40) return 'Saturação Moderada';
        if (valor >= 20) return 'Saturação Baixa';
        return 'Saturação Mínima';
    }
    
    /* ========================
       FUNÇÕES AUXILIARES
    ========================= */
    
    obterDadosFiltrados() {
        // Aplicar filtros do CheckInfra
        const filtros = {
            critico: document.getElementById('fCritico')?.checked || true,
            atencao: document.getElementById('fAtencao')?.checked || true,
            alerta: document.getElementById('fAlerta')?.checked || true,
            adequado: document.getElementById('fAdequado')?.checked || true
        };
        
        return dadosOriginais.filter(escola => {
            if (escola.status === 'crítica') return filtros.critico;
            if (escola.status === 'alerta') return filtros.atencao || filtros.alerta;
            if (escola.status === 'ok') return filtros.adequado;
            return true;
        });
    }
    
    criarGrid(bounds, tamanho) {
        const grid = [];
        for (let lat = bounds.getSouth(); lat < bounds.getNorth(); lat += tamanho) {
            for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += tamanho) {
                grid.push({
                    bounds: [[lat, lng], [lat + tamanho, lng + tamanho]],
                    centro: [lat + tamanho/2, lng + tamanho/2]
                });
            }
        }
        return grid;
    }
    
    distanciaKm(ponto1, ponto2) {
        const dLat = (ponto2.lat - ponto1.lat) * Math.PI / 180;
        const dLon = (ponto2.lng - ponto1.lng) * Math.PI / 180;
        const lat1 = ponto1.lat * Math.PI / 180;
        const lat2 = ponto2.lat * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return this.RAIO_TERRA_KM * c;
    }
    
    calcularCentroide(bounds) {
        return {
            lat: (bounds[0][0] + bounds[1][0]) / 2,
            lng: (bounds[0][1] + bounds[1][1]) / 2
        };
    }
    
    calcularDesvioPadrao(valores) {
        const n = valores.length;
        if (n === 0) return 0;
        
        const media = valores.reduce((a, b) => a + b, 0) / n;
        const variancia = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / n;
        return Math.sqrt(variancia);
    }
    
    contarClassificacoes(celulas) {
        const contagem = {
            muito_alta: 0,
            alta: 0,
            media: 0,
            baixa: 0,
            muito_baixa: 0,
            sem_dados: 0
        };
        
        celulas.forEach(c => {
            if (c.classificacao && contagem[c.classificacao] !== undefined) {
                contagem[c.classificacao]++;
            }
        });
        
        return contagem;
    }
}

/* =========================
   FUNÇÕES DE VISUALIZAÇÃO
========================= */

function desenharAnaliseAvancada(resultado) {
    if (!resultado) return;
    
    camadaZonas.clearLayers();
    
    switch (modoIndicador) {
        case 'kde':
            desenharKDE(resultado.celulas);
            break;
        case 'lq':
            desenharLQ(resultado.celulas);
            break;
        case 'iss':
            desenharISS(resultado.resultados);
            break;
        case 'gini':
        case 'moran':
            exibirResultadosGlobais(resultado);
            break;
    }
}

function desenharKDE(celulas) {
    if (!celulas || celulas.length === 0) return;
    
    // Encontrar valor máximo para normalização
    const maxKDE = Math.max(...celulas.map(c => c.kde || 0));
    
    celulas.forEach(celula => {
        if (celula.kde > 0) {
            const intensidade = celula.kde / maxKDE;
            const cor = getCorGradiente(intensidade);
            
            const poligono = L.rectangle(celula.bounds, {
                color: cor,
                fillColor: cor,
                fillOpacity: Math.min(intensidade * 0.8, 0.6),
                weight: 0.5,
                opacity: 0.3
            });
            
            // Adicionar tooltip
            poligono.bindTooltip(`
                KDE: ${celula.kde.toFixed(3)}<br>
                Densidade: ${celula.densidadeKm2.toFixed(2)}/km²<br>
                Escolas críticas: ${celula.escolasCriticas}
            `);
            
            poligono.addTo(camadaZonas);
            
            // Adicionar label com intensidade
            if (intensidade > 0.3) {
                const label = L.divIcon({
                    html: `<div style="
                        background: rgba(255,255,255,0.8);
                        padding: 2px 5px;
                        border-radius: 3px;
                        font-size: 9px;
                        color: #333;
                        border: 1px solid ${cor};
                    ">${(intensidade * 100).toFixed(0)}%</div>`,
                    className: 'kde-label'
                });
                
                L.marker(celula.centro, { icon: label }).addTo(camadaZonas);
            }
        }
    });
    
    // Adicionar legenda
    adicionarLegendaKDE(maxKDE);
}

function desenharLQ(celulas) {
    if (!celulas || celulas.length === 0) return;
    
    celulas.forEach(celula => {
        if (celula.lq > 0) {
            let cor, descricao;
            
            if (celula.lq >= 2.0) {
                cor = '#8B0000'; descricao = 'Muito Alta';
            } else if (celula.lq >= 1.5) {
                cor = '#FF0000'; descricao = 'Alta';
            } else if (celula.lq >= 1.0) {
                cor = '#FFA500'; descricao = 'Média';
            } else if (celula.lq >= 0.5) {
                cor = '#90EE90'; descricao = 'Baixa';
            } else {
                cor = '#008000'; descricao = 'Muito Baixa';
            }
            
            const poligono = L.rectangle(celula.bounds, {
                color: cor,
                fillColor: cor,
                fillOpacity: 0.4,
                weight: 1
            });
            
            poligono.addTo(camadaZonas);
            
            // Popup com detalhes
            const popupContent = `
                <div style="font-size:12px">
                    <strong>Location Quotient: ${celula.lq.toFixed(2)}</strong><br>
                    <hr>
                    <strong>Concentração:</strong> ${descricao}<br>
                    <strong>Escolas:</strong> ${celula.total}<br>
                    <strong>Críticas:</strong> ${celula.criticas}<br>
                    <strong>Proporção local:</strong> ${(celula.proporcaoLocal * 100).toFixed(1)}%<br>
                    <strong>Proporção cidade:</strong> ${(celula.proporcaoCidade * 100).toFixed(1)}%<br>
                    <hr>
                    ${celula.lq > 1 ? '🔺 Acima da média da cidade' : '🔻 Abaixo da média da cidade'}
                </div>
            `;
            
            poligono.bindPopup(popupContent);
        }
    });
    
    adicionarLegendaLQ();
}

function desenharISS(resultados) {
    if (!resultados || resultados.length === 0) return;
    
    // Ordenar por ISS e pegar top 10
    const top10 = resultados.slice(0, 10);
    
    top10.forEach((resultado, index) => {
        const cor = getCorPorISS(resultado.iss);
        
        const poligono = L.rectangle(resultado.bounds, {
            color: cor,
            fillColor: cor,
            fillOpacity: 0.5,
            weight: 2,
            dashArray: index === 0 ? null : '5,5'
        });
        
        poligono.addTo(camadaZonas);
        
        // Label com posição e ISS
        const label = L.divIcon({
            html: `<div style="
                background: ${cor};
                color: white;
                border-radius: 50%;
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${index + 1}</div>`,
            className: 'iss-label'
        });
        
        L.marker(resultado.centro, { icon: label }).addTo(camadaZonas);
        
        // Popup detalhado
        const popupContent = `
            <div style="font-size:12px">
                <strong>ISS: ${resultado.iss.toFixed(1)}/100</strong><br>
                <strong>Nível: ${resultado.nivel}</strong><br>
                <hr>
                <strong>📊 Detalhes:</strong><br>
                • KDE: ${resultado.kde.toFixed(2)}<br>
                • LQ: ${resultado.lq.toFixed(2)}<br>
                • Escolas: ${resultado.total}<br>
                • Críticas: ${resultado.criticas}<br>
                • % Críticas: ${resultado.total > 0 ? ((resultado.criticas / resultado.total) * 100).toFixed(1) : 0}%
            </div>
        `;
        
        poligono.bindPopup(popupContent);
    });
    
    adicionarLegendaISS();
}

function exibirResultadosGlobais(resultado) {
    const rankingDiv = document.getElementById('tabelaRanking');
    if (!rankingDiv) return;
    
    let html = '<div class="card">';
    
    if (resultado.tipo === 'gini') {
        html += `
            <h4>⚖️ Índice de Gini Espacial</h4>
            <div style="text-align:center; padding:20px">
                <div style="font-size:48px; color:#2c3e50; font-weight:bold">${resultado.gini}</div>
                <div style="font-size:18px; color:#7f8c8d">Coeficiente de Desigualdade</div>
                <div style="margin-top:20px">
                    <span class="badge ${resultado.classificacao.includes('Extrema') || resultado.classificacao.includes('Alta') ? 'badge-critico' : resultado.classificacao.includes('Moderada') ? 'badge-alerta' : 'badge-ok'}">
                        ${resultado.classificacao}
                    </span>
                </div>
                
                <div style="margin-top:30px; text-align:left">
                    <strong>📈 Interpretação:</strong><br>
                    <p>0 = Igualdade perfeita (críticas igualmente distribuídas)</p>
                    <p>1 = Desigualdade máxima (todas críticas em uma única área)</p>
                    <p>Valor acima de 0.4 indica concentração territorial significativa.</p>
                </div>
                
                <div style="margin-top:20px; background:#f8f9fa; padding:15px; border-radius:8px">
                    <strong>📊 Estatísticas:</strong><br>
                    • Células analisadas: ${resultado.estatisticas.totalCelulas}<br>
                    • Escolas críticas totais: ${resultado.estatisticas.somaCriticas}<br>
                    • Média por célula: ${resultado.estatisticas.mediaPorCelula}<br>
                    • Coef. de variação: ${resultado.estatisticas.coeficienteVariacao.toFixed(2)}
                </div>
            </div>
        `;
    } else if (resultado.tipo === 'moran') {
        html += `
            <h4>🔗 Índice de Moran I</h4>
            <div style="text-align:center; padding:20px">
                <div style="font-size:36px; color:#2c3e50; font-weight:bold">I = ${resultado.moranI}</div>
                <div style="font-size:18px; color:#7f8c8d">Autocorrelação Espacial</div>
                
                <div style="margin-top:20px">
                    <div class="badge ${Math.abs(parseFloat(resultado.zScore)) > 1.96 ? 'badge-critico' : 'badge-ok'}">
                        ${resultado.significancia}
                    </div>
                    <div class="badge badge-alerta" style="margin-top:10px">
                        Padrão: ${resultado.padrao}
                    </div>
                </div>
                
                <div style="margin-top:30px; text-align:left">
                    <strong>📈 Interpretação:</strong><br>
                    <p>I > 0: Agrupamento (escolas críticas próximas umas das outras)</p>
                    <p>I < 0: Dispersão (escolas críticas afastadas umas das outras)</p>
                    <p>I ≈ 0: Distribuição aleatória</p>
                    <p>Z-Score > |1.96|: Significativo a 95% de confiança</p>
                </div>
                
                <div style="margin-top:20px; background:#f8f9fa; padding:15px; border-radius:8px">
                    <strong>📊 Estatísticas:</strong><br>
                    • Z-Score: ${resultado.zScore}<br>
                    • Valor esperado: ${resultado.estatisticas.valorEsperado}<br>
                    • Número de áreas: ${resultado.estatisticas.n}<br>
                    • Intervalo de confiança: ${resultado.estatisticas.intervaloConfianca}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    rankingDiv.innerHTML = html;
}

/* =========================
   FUNÇÕES AUXILIARES VISUAIS
========================= */

function getCorGradiente(intensidade) {
    const cores = [
        '#FFEDA0', '#FED976', '#FEB24C',
        '#FD8D3C', '#FC4E2A', '#E31A1C',
        '#BD0026', '#800026'
    ];
    
    const index = Math.min(Math.floor(intensidade * (cores.length - 1)), cores.length - 1);
    return cores[index];
}

function getCorPorISS(iss) {
    if (iss >= 80) return '#8B0000'; // Vermelho escuro
    if (iss >= 60) return '#FF0000'; // Vermelho
    if (iss >= 40) return '#FFA500'; // Laranja
    if (iss >= 20) return '#FFFF00'; // Amarelo
    return '#90EE90'; // Verde claro
}

function adicionarLegendaKDE(maxKDE) {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        div.style.fontSize = '12px';
        
        div.innerHTML = `
            <strong>🔥 Kernel Density Estimation</strong><br>
            <small>Intensidade de concentração crítica</small><br>
            <div style="margin-top:8px">
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FFEDA0; margin-right:8px"></div>
                    <span>Baixa (0-15%)</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FEB24C; margin-right:8px"></div>
                    <span>Média (15-30%)</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FD8D3C; margin-right:8px"></div>
                    <span>Alta (30-50%)</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#E31A1C; margin-right:8px"></div>
                    <span>Muito Alta (50%+)</span>
                </div>
            </div>
            <div style="margin-top:8px; font-size:10px; color:#666">
                Máxima densidade: ${maxKDE.toFixed(2)}
            </div>
        `;
        
        return div;
    };
    
    legend.addTo(map);
}

function adicionarLegendaLQ() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        div.style.fontSize = '12px';
        
        div.innerHTML = `
            <strong>📈 Location Quotient (LQ)</strong><br>
            <small>Concentração relativa vs média</small><br>
            <div style="margin-top:8px">
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#8B0000; margin-right:8px"></div>
                    <span>LQ ≥ 2.0 (Muito Alta)</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FF0000; margin-right:8px"></div>
                    <span>1.5 ≤ LQ < 2.0 (Alta)</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FFA500; margin-right:8px"></div>
                    <span>1.0 ≤ LQ < 1.5 (Média)</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#90EE90; margin-right:8px"></div>
                    <span>0.5 ≤ LQ < 1.0 (Baixa)</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#008000; margin-right:8px"></div>
                    <span>LQ < 0.5 (Muito Baixa)</span>
                </div>
            </div>
            <div style="margin-top:8px; font-size:10px; color:#666">
                LQ = Proporção local / Proporção cidade
            </div>
        `;
        
        return div;
    };
    
    legend.addTo(map);
}

function adicionarLegendaISS() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        div.style.fontSize = '12px';
        
        div.innerHTML = `
            <strong>🧮 Índice de Saturação Sintético</strong><br>
            <small>ISS (0-100) - Priorização combinada</small><br>
            <div style="margin-top:8px">
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#8B0000; margin-right:8px"></div>
                    <span>80-100: Saturação Extrema</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FF0000; margin-right:8px"></div>
                    <span>60-80: Saturação Alta</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FFA500; margin-right:8px"></div>
                    <span>40-60: Saturação Moderada</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#FFFF00; margin-right:8px"></div>
                    <span>20-40: Saturação Baixa</span>
                </div>
                <div style="display:flex; align-items:center; margin:4px 0">
                    <div style="width:20px; height:10px; background:#90EE90; margin-right:8px"></div>
                    <span>0-20: Saturação Mínima</span>
                </div>
            </div>
            <div style="margin-top:8px; font-size:10px; color:#666">
                ISS = KDE + LQ + Criticidade Local
            </div>
        `;
        
        return div;
    };
    
    legend.addTo(map);
}

/* =========================
   FUNÇÃO PRINCIPAL DE ANÁLISE AVANÇADA
========================= */

function analiseAvancada() {
    const analise = new AnaliseEspacialAvancada(dadosOriginais);
    
    switch (modoIndicador) {
        case 'kde':
            const parametro = parseFloat(document.getElementById('parametroRange')?.value || 1.0);
            return analise.calcularKDE(parametro);
        case 'lq':
            return analise.calcularLQ();
        case 'gini':
            return analise.calcularGiniEspacial();
        case 'moran':
            return analise.calcularMoranI();
        case 'iss':
            return analise.calcularISS();
        default:
            return analise.calcularKDE(1.0);
    }
}
```

🎯 2. voronoi-impacto.js (Polígonos de Voronoi - Dados Reais)

```javascript
/* =========================
   ANÁLISE DE IMPACTO POR VORONOI
   Dados reais do CheckInfra
========================= */

class AnaliseVoronoi {
    constructor(escolas) {
        this.escolas = escolas;
        this.RAIO_TERRA_KM = 6371;
    }
    
    gerarPoligonosVoronoi() {
        console.log('🔺 Gerando polígonos de Voronoi com dados reais...');
        
        // Usar apenas escolas críticas
        const escolasCriticas = this.obterEscolasCriticasFiltradas();
        
        if (escolasCriticas.length < 3) {
            console.warn(`⚠️ Insuficientes escolas críticas para Voronoi: ${escolasCriticas.length}`);
            return { 
                poligonos: [], 
                metricas: [],
                tipo: 'voronoi',
                mensagem: 'Mínimo 3 escolas críticas necessário'
            };
        }
        
        // Converter para pontos com lat/lng
        const pontos = escolasCriticas.map((escola, index) => ({
            x: escola.lng,
            y: escola.lat,
            escola: escola,
            id: escola.id || `crit_${index}`,
            originalIndex: index
        }));
        
        // Gerar triangulação de Delaunay usando método alternativo
        const poligonos = this.gerarVoronoiSimples(pontos);
        
        // Calcular métricas de impacto
        const metricas = this.calcularMetricasImpacto(poligonos);
        
        return {
            poligonos: poligonos,
            metricas: metricas,
            tipo: 'voronoi',
            estatisticas: {
                totalEscolasCriticas: escolasCriticas.length,
                poligonosGerados: poligonos.length,
                areaTotal: metricas.reduce((sum, m) => sum + parseFloat(m.areaKm2), 0).toFixed(2),
                impactoMedio: (metricas.reduce((sum, m) => sum + m.impactoTotal, 0) / metricas.length).toFixed(1)
            }
        };
    }
    
    gerarVoronoiSimples(pontos) {
        const poligonos = [];
        
        pontos.forEach((ponto, i) => {
            // Encontrar os 3 vizinhos mais próximos
            const vizinhos = pontos
                .filter((_, j) => j !== i)
                .map(v => ({
                    ponto: v,
                    distancia: this.distanciaPontos(ponto, v)
                }))
                .sort((a, b) => a.distancia - b.distancia)
                .slice(0, 3);
            
            if (vizinhos.length >= 2) {
                // Criar polígono baseado nos vizinhos
                const vertices = this.calcularVerticesPoligono(ponto, vizinhos);
                poligonos.push({
                    pontoCentro: ponto,
                    vertices: vertices,
                    vizinhos: vizinhos.map(v => v.ponto.escola.id),
                    areaKm2: this.calcularAreaPoligono(vertices)
                });
            }
        });
        
        return poligonos;
    }
    
    calcularVerticesPoligono(centro, vizinhos) {
        const vertices = [];
        
        vizinhos.forEach(vizinho => {
            // Calcular ponto médio entre centro e vizinho
            const pontoMedio = {
                lat: (centro.y + vizinho.ponto.y) / 2,
                lng: (centro.x + vizinho.ponto.x) / 2
            };
            vertices.push(pontoMedio);
        });
        
        // Adicionar pontos intermediários para completar polígono
        if (vizinhos.length >= 3) {
            // Ordenar vértices em sentido horário
            return this.ordenarVerticesSentidoHorario(vertices, centro);
        }
        
        return vertices;
    }
    
    calcularMetricasImpacto(poligonos) {
        const dadosFiltrados = this.obterDadosFiltrados();
        
        return poligonos.map(poligono => {
            const centro = poligono.pontoCentro.escola;
            const vertices = poligono.vertices;
            
            // 1. Área de Influência (km²)
            const areaKm2 = poligono.areaKm2;
            
            // 2. Raio Médio de Influência
            const distancias = vertices.map(v => 
                this.distanciaKm(centro, v)
            );
            const raioMedio = distancias.reduce((a, b) => a + b, 0) / distancias.length;
            
            // 3. Escolas dentro do polígono
            const escolasNaArea = this.encontrarEscolasNaArea(vertices, dadosFiltrados);
            
            // 4. Matrículas na área
            const totalAlunos = escolasNaArea.reduce((sum, e) => sum + (e.matriculas || 200), 0);
            const densidadeAlunos = areaKm2 > 0 ? Math.round(totalAlunos / areaKm2) : 0;
            
            // 5. Vulnerabilidade (% críticas na área)
            const escolasCriticasNaArea = escolasNaArea.filter(e => e.status === 'crítica').length;
            const vulnerabilidade = escolasNaArea.length > 0 ? 
                (escolasCriticasNaArea / escolasNaArea.length) * 100 : 0;
            
            // 6. Índice de Impacto Total (0-100)
            const impacto = this.calcularImpactoTotal(
                areaKm2, 
                densidadeAlunos, 
                vulnerabilidade, 
                escolasNaArea.length
            );
            
            return {
                escola: centro,
                areaKm2: areaKm2.toFixed(2),
                raioMedioKm: raioMedio.toFixed(2),
                densidadeAlunos: densidadeAlunos,
                vulnerabilidade: vulnerabilidade.toFixed(1) + '%',
                impactoTotal: Math.min(Math.round(impacto), 100),
                escolasNaArea: escolasNaArea.length,
                escolasCriticasNaArea: escolasCriticasNaArea,
                vertices: vertices,
                nivelImpacto: this.classificarImpacto(impacto),
                detalhes: {
                    alunosAfetados: totalAlunos,
                    raioMaximo: Math.max(...distancias).toFixed(2),
                    proporcaoCriticas: escolasNaArea.length > 0 ? 
                        (escolasCriticasNaArea / escolasNaArea.length).toFixed(2) : 0
                }
            };
        }).filter(m => m.impactoTotal > 0);
    }
    
    calcularImpactoTotal(area, densidade, vulnerabilidade, numEscolas) {
        let impacto = 0;
        
        // Componente de área (até 25 pontos)
        impacto += Math.min(area * 3, 25);
        
        // Componente de densidade (até 25 pontos)
        impacto += Math.min(densidade / 20, 25);
        
        // Componente de vulnerabilidade (até 30 pontos)
        impacto += (vulnerabilidade / 100) * 30;
        
        // Componente de quantidade de escolas (até 20 pontos)
        impacto += Math.min(numEscolas * 2, 20);
        
        return impacto;
    }
    
    classificarImpacto(impacto) {
        if (impacto >= 80) return 'Impacto Crítico';
        if (impacto >= 60) return 'Impacto Alto';
        if (impacto >= 40) return 'Impacto Moderado';
        if (impacto >= 20) return 'Impacto Baixo';
        return 'Impacto Mínimo';
    }
    
    simularFechamento(escolaId, poligonos, metricas) {
        console.log(`🧪 Simulando fechamento da escola ${escolaId}...`);
        
        const metrica = metricas.find(m => m.escola.id === escolaId);
        if (!metrica) {
            console.error('Escola não encontrada para simulação');
            return null;
        }
        
        const centro = metrica.escola;
        const vertices = metrica.vertices;
        const dadosFiltrados = this.obterDadosFiltrados();
        
        // Encontrar escolas na área (excluindo a que será fechada)
        const escolasNaArea = this.encontrarEscolasNaArea(vertices, dadosFiltrados)
            .filter(e => e.id !== escolaId);
        
        // Calcular distâncias e capacidades
        const escolasReceptoras = escolasNaArea.map(escola => ({
            escola: escola,
            distancia: this.distanciaKm(centro, escola),
            capacidade: this.calcularCapacidadeDisponivel(escola),
            ocupacaoAtual: escola.matriculas || 200
        })).sort((a, b) => a.distancia - b.distancia);
        
        // Alunos a realocar
        const alunosDeslocados = centro.matriculas || 200;
        const capacidadeTotal = escolasReceptoras.reduce((sum, e) => sum + e.capacidade, 0);
        
        // Distribuir alunos proporcionalmente
        let alunosRestantes = alunosDeslocados;
        const sobrecargaPorEscola = [];
        
        escolasReceptoras.slice(0, 5).forEach(receptora => {
            const proporcao = receptora.capacidade / capacidadeTotal;
            const alunosAlocados = Math.min(
                alunosRestantes,
                Math.round(alunosDeslocados * proporcao)
            );
            
            if (alunosAlocados > 0) {
                sobrecargaPorEscola.push({
                    escola: receptora.escola,
                    alunosAlocados: alunosAlocados,
                    sobrecargaPercentual: (alunosAlocados / receptora.capacidade) * 100,
                    novaOcupacao: receptora.ocupacaoAtual + alunosAlocados,
                    capacidadeOriginal: receptora.ocupacaoAtual + receptora.capacidade,
                    distancia: receptora.distancia.toFixed(2) + ' km'
                });
                
                alunosRestantes -= alunosAlocados;
            }
        });
        
        const capacidadeSuficiente = capacidadeTotal >= alunosDeslocados;
        const deficit = Math.max(0, alunosDeslocados - capacidadeTotal);
        
        return {
            escolaFechada: centro,
            alunosDeslocados: alunosDeslocados,
            capacidadeTotal: capacidadeTotal,
            capacidadeSuficiente: capacidadeSuficiente,
            deficit: deficit,
            escolasReceptoras: sobrecargaPorEscola,
            raioAfetacao: Math.max(...escolasReceptoras.map(e => e.distancia)),
            estatisticas: {
                totalEscolasReceptoras: escolasReceptoras.length,
                mediaSobrecarga: sobrecargaPorEscola.length > 0 ? 
                    sobrecargaPorEscola.reduce((sum, e) => sum + e.sobrecargaPercentual, 0) / sobrecargaPorEscola.length : 0,
                escolaMaisSobrecarregada: sobrecargaPorEscola.length > 0 ? 
                    sobrecargaPorEscola.sort((a, b) => b.sobrecargaPercentual - a.sobrecargaPercentual)[0] : null
            },
            recomendacao: capacidadeSuficiente ? 
                `✅ Viável: ${escolasReceptoras.length} escolas podem absorver ${alunosDeslocados} alunos` :
                `❌ Crítico: Déficit de ${deficit} vagas. Necessário ${Math.ceil(deficit / 200)} nova(s) sala(s)`
        };
    }
    
    /* ========================
       FUNÇÕES AUXILIARES
    ========================= */
    
    obterEscolasCriticasFiltradas() {
        const filtros = {
            critico: document.getElementById('fCritico')?.checked || true,
            atencao: document.getElementById('fAtencao')?.checked || true,
            alerta: document.getElementById('fAlerta')?.checked || true
        };
        
        return dadosOriginais.filter(escola => {
            if (escola.status !== 'crítica') return false;
            return filtros.critico;
        });
    }
    
    obterDadosFiltrados() {
        const filtros = {
            critico: document.getElementById('fCritico')?.checked || true,
            atencao: document.getElementById('fAtencao')?.checked || true,
            alerta: document.getElementById('fAlerta')?.checked || true,
            adequado: document.getElementById('fAdequado')?.checked || true
        };
        
        return dadosOriginais.filter(escola => {
            if (escola.status === 'crítica') return filtros.critico;
            if (escola.status === 'alerta') return filtros.atencao || filtros.alerta;
            if (escola.status === 'ok') return filtros.adequado;
            return true;
        });
    }
    
    distanciaPontos(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    distanciaKm(ponto1, ponto2) {
        const dLat = (ponto2.lat - ponto1.lat) * Math.PI / 180;
        const dLon = (ponto2.lng - ponto1.lng) * Math.PI / 180;
        const lat1 = ponto1.lat * Math.PI / 180;
        const lat2 = ponto2.lat * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return this.RAIO_TERRA_KM * c;
    }
    
    calcularAreaPoligono(vertices) {
        if (vertices.length < 3) return 0.01; // área mínima
        
        let area = 0;
        const n = vertices.length;
        
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += vertices[i].lng * vertices[j].lat;
            area -= vertices[j].lng * vertices[i].lat;
        }
        
        area = Math.abs(area) / 2;
        
        // Converter graus² para km² (aproximação para latitude de Fortaleza)
        const areaKm2 = area * 111 * 111 * Math.cos(-3.7 * Math.PI / 180);
        
        return Math.max(areaKm2, 0.01); // Mínimo 0.01 km²
    }
    
    ordenarVerticesSentidoHorario(vertices, centro) {
        return vertices.sort((a, b) => {
            const anguloA = Math.atan2(a.lat - centro.y, a.lng - centro.x);
            const anguloB = Math.atan2(b.lat - centro.y, b.lng - centro.x);
            return anguloA - anguloB;
        });
    }
    
    encontrarEscolasNaArea(vertices, escolas) {
        // Filtro simples: escolas dentro do bounding box do polígono
        const bounds = {
            minLat: Math.min(...vertices.map(v => v.lat)),
            maxLat: Math.max(...vertices.map(v => v.lat)),
            minLng: Math.min(...vertices.map(v => v.lng)),
            maxLng: Math.max(...vertices.map(v => v.lng))
        };
        
        return escolas.filter(escola => {
            // Verificação rápida por bounding box
            const dentroBB = escola.lat >= bounds.minLat && 
                           escola.lat <= bounds.maxLat &&
                           escola.lng >= bounds.minLng && 
                           escola.lng <= bounds.maxLng;
            
            if (!dentroBB) return false;
            
            // Verificação mais precisa por ponto no polígono
            return this.pontoNoPoligono(escola, vertices);
        });
    }
    
    pontoNoPoligono(ponto, vertices) {
        let dentro = false;
        const x = ponto.lng;
        const y = ponto.lat;
        
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].lng;
            const yi = vertices[i].lat;
            const xj = vertices[j].lng;
            const yj = vertices[j].lat;
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) dentro = !dentro;
        }
        
        return dentro;
    }
    
    calcularCapacidadeDisponivel(escola) {
        // Capacidade baseada no tipo de escola e matrículas atuais
        const capacidades = {
            'EMEI': 150,
            'EMEF': 300,
            'EMEIEF': 250,
            'default': 200
        };
        
        const capacidadeBase = capacidades[escola.tipo] || capacidades.default;
        const ocupacaoAtual = escola.matriculas || 150;
        const disponivel = Math.max(capacidadeBase - ocupacaoAtual, 0);
        
        // Adicionar margem de segurança (10%)
        return Math.floor(disponivel * 0.9);
    }
}

/* =========================
   FUNÇÕES DE INTERFACE VORONOI
========================= */

function analisePorVoronoi() {
    if (!dadosOriginais || dadosOriginais.length === 0) {
        console.warn('⚠️ Nenhum dado disponível para análise Voronoi');
        return { poligonos: [], metricas: [], tipo: 'voronoi' };
    }
    
    const analise = new AnaliseVoronoi(dadosOriginais);
    const resultado = analise.gerarPoligonosVoronoi();
    
    // Atualizar tabela de impacto
    if (resultado.metricas && resultado.metricas.length > 0) {
        atualizarTabelaImpacto(resultado.metricas);
    }
    
    return resultado;
}

function atualizarTabelaImpacto(metricas) {
    const tabelaImpacto = document.getElementById('tabelaImpacto');
    if (!tabelaImpacto) return;
    
    if (!metricas || metricas.length === 0) {
        tabelaImpacto.innerHTML = `
            <div class="card">
                <h4>🔥 Análise de Impacto</h4>
                <p>Nenhuma escola crítica encontrada para análise de impacto.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por impacto
    metricas.sort((a, b) => b.impactoTotal - a.impactoTotal);
    
    let html = `
        <div class="card">
            <h4>🔥 Ranking de Impacto - Fechamento de Escolas</h4>
            <p style="font-size:12px; color:#666; margin-bottom:15px;">
                ${metricas.length} escolas críticas analisadas | 
                Impacto médio: ${(metricas.reduce((sum, m) => sum + m.impactoTotal, 0) / metricas.length).toFixed(1)}/100
            </p>
            <table class="tabela-analise">
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Escola</th>
                        <th>Área (km²)</th>
                        <th>Raio (km)</th>
                        <th>Escolas na Área</th>
                        <th>Impacto</th>
                        <th>Nível</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    metricas.slice(0, 15).forEach((metrica, index) => {
        const nivel = metrica.nivelImpacto;
        let badgeClass = 'badge-ok';
        if (nivel.includes('Crítico')) badgeClass = 'badge-critico';
        else if (nivel.includes('Alto')) badgeClass = 'badge-critico';
        else if (nivel.includes('Moderado')) badgeClass = 'badge-alerta';
        else if (nivel.includes('Baixo')) badgeClass = 'badge-ok';
        
        html += `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${metrica.escola.nome}</td>
                <td>${metrica.areaKm2}</td>
                <td>${metrica.raioMedioKm}</td>
                <td>${metrica.escolasNaArea}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px">
                        <span>${metrica.impactoTotal}/100</span>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${metrica.nivelImpacto}</span></td>
                <td>
                    <button onclick="simularFechamentoVoronoi('${metrica.escola.id}')" 
                            style="padding:4px 8px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">
                        Simular
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    tabelaImpacto.innerHTML = html;
}

function simularFechamentoVoronoi(escolaId) {
    const analise = new AnaliseVoronoi(dadosOriginais);
    const resultado = analise.gerarPoligonosVoronoi();
    const simulacao = analise.simularFechamento(escolaId, resultado.poligonos, resultado.metricas);
    
    if (!simulacao) {
        alert('❌ Não foi possível simular o fechamento desta escola.');
        return;
    }
    
    // Exibir resultados em modal ou seção específica
    exibirResultadoSimulacao(simulacao);
}

function exibirResultadoSimulacao(simulacao) {
    const resultadoDiv = document.getElementById('simulacaoResultado');
    if (!resultadoDiv) return;
    
    resultadoDiv.style.display = 'block';
    
    resultadoDiv.innerHTML = `
        <div class="card">
            <h4>🧪 Simulação de Fechamento - ${simulacao.escolaFechada.nome}</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <h5 style="margin-top: 0;">📊 Dados da Escola</h5>
                    <p><strong>Nome:</strong> ${simulacao.escolaFechada.nome}</p>
                    <p><strong>Alunos:</strong> ${simulacao.alunosDeslocados}</p>
                    <p><strong>Tipo:</strong> ${simulacao.escolaFechada.tipo}</p>
                    <p><strong>Status:</strong> <span class="badge badge-critico">Crítica</span></p>
                </div>
                
                <div style="background: ${simulacao.capacidadeSuficiente ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 8px;">
                    <h5 style="margin-top: 0;">${simulacao.capacidadeSuficiente ? '✅ Viabilidade' : '❌ Viabilidade'}</h5>
                    <p><strong>Capacidade disponível:</strong> ${simulacao.capacidadeTotal}</p>
                    <p><strong>Alunos a realocar:</strong> ${simulacao.alunosDeslocados}</p>
                    <p><strong>${simulacao.capacidadeSuficiente ? '✅ Suficiente' : '❌ Insuficiente'}</strong></p>
                    <p><em>${simulacao.recomendacao}</em></p>
                </div>
            </div>
            
            <h5>🏫 Escolas Receptoras (${simulacao.escolasReceptoras.length})</h5>
            <div style="max-height: 300px; overflow-y: auto;">
                ${simulacao.escolasReceptoras.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f1f3f4">
                                <th style="padding: 10px; text-align: left;">Escola</th>
                                <th style="padding: 10px; text-align: left;">Distância</th>
                                <th style="padding: 10px; text-align: left;">Alunos Alocados</th>
                                <th style="padding: 10px; text-align: left;">Sobrecarga</th>
                                <th style="padding: 10px; text-align: left;">Nova Ocupação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${simulacao.escolasReceptoras.map(e => `
                                <tr style="border-bottom: 1px solid #eee">
                                    <td style="padding: 10px">${e.escola.nome}</td>
                                    <td style="padding: 10px">${e.distancia}</td>
                                    <td style="padding: 10px">${e.alunosAlocados}</td>
                                    <td style="padding: 10px">
                                        <div style="display: flex; align-items: center; gap: 8px">
                                            <div style="flex: 1; height: 6px; background: #e0e0e0; border-radius: 3px">
                                                <div style="width: ${Math.min(e.sobrecargaPercentual, 100)}%; height: 100%; background: ${e.sobrecargaPercentual > 80 ? '#e74c3c' : e.sobrecargaPercentual > 60 ? '#f39c12' : '#2ecc71'}; border-radius: 3px"></div>
                                            </div>
                                            <span>${e.sobrecargaPercentual.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td style="padding: 10px">${e.novaOcupacao}/${e.capacidadeOriginal}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>Nenhuma escola receptora encontrada na área de influência.</p>'}
            </div>
            
            ${simulacao.deficit > 0 ? `
                <div style="margin-top: 20px; padding: 15px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
                    <h5>⚠️ Recomendações para Déficit</h5>
                    <p>Para atender o déficit de ${simulacao.deficit} vagas:</p>
                    <ul>
                        <li>Considerar construção de ${Math.ceil(simulacao.deficit / 200)} nova(s) sala(s) de aula</li>
                        <li>Ampliar capacidade das escolas existentes</li>
                        <li>Implementar sistema de turnos alternados</li>
                        <li>Transferir para escolas em bairros adjacentes</li>
                    </ul>
                </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <button onclick="exportarRelatorioSimulacao(${JSON.stringify(simulacao).replace(/"/g, '&quot;')})" 
                        style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer">
                    📥 Exportar Relatório de Simulação
                </button>
                
                <button onclick="document.getElementById('simulacaoResultado').style.display = 'none'" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px">
                    ✕ Fechar
                </button>
            </div>
        </div>
    `;
}

function exportarRelatorioSimulacao(simulacao) {
    // Criar conteúdo do relatório
    let conteudo = `RELATÓRIO DE SIMULAÇÃO DE FECHAMENTO\n`;
    conteudo += `========================================\n\n`;
    conteudo += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    conteudo += `Escola: ${simulacao.escolaFechada.nome}\n`;
    conteudo += `Status: Crítica\n`;
    conteudo += `Alunos afetados: ${simulacao.alunosDeslocados}\n`;
    conteudo += `Viabilidade: ${simulacao.capacidadeSuficiente ? 'VIÁVEL' : 'CRÍTICO'}\n`;
    conteudo += `Capacidade disponível: ${simulacao.capacidadeTotal}\n`;
    conteudo += `Déficit: ${simulacao.deficit}\n\n`;
    
    if (simulacao.escolasReceptoras.length > 0) {
        conteudo += `ESCOLAS RECEPTORAS:\n`;
        conteudo += `==================\n\n`;
        simulacao.escolasReceptoras.forEach((e, i) => {
            conteudo += `${i + 1}. ${e.escola.nome}\n`;
            conteudo += `   Alunos alocados: ${e.alunosAlocados}\n`;
            conteudo += `   Sobrecarga: ${e.sobrecargaPercentual.toFixed(1)}%\n`;
            conteudo += `   Distância: ${e.distancia}\n`;
            conteudo += `   Nova ocupação: ${e.novaOcupacao}/${e.capacidadeOriginal}\n\n`;
        });
    }
    
    // Criar e fazer download
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao-fechamento-${simulacao.escolaFechada.nome.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📤 Relatório de simulação exportado');
}
```

🎨 3. mapa-voronoi.js (Visualização - Dados Reais)

```javascript
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


