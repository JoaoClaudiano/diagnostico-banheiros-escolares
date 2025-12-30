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


