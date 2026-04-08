export const CAMARA_API_URL = 'https://dadosabertos.camara.leg.br/api/v2';
export const SENADO_API_URL = 'https://legis.senado.leg.br/dadosabertos';

const FETCH_OPTIONS = {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  next: { revalidate: 3600 }
};

// --- CAMADA DE NORMALIZAÇÃO ---
export interface PoliticoNormalizado {
  id: string;
  origem: 'camara' | 'senado';
  cargo: 'Deputado Federal' | 'Senador';
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  score: number;
  indicadores: {
    direitosSociais: number;
    direitosHumanos: number;
    democracia: number;
    economia: number;
    meioAmbiente: number;
    coerencia: number;
  };
  resumo: string;
  tags: string[];
}

export interface FeedEvent {
  id: string;
  politico: PoliticoNormalizado;
  actionType: 'expense' | 'speech' | 'proposal';
  text: string;
  icon: string;
  color: string;
  amountValue: number;
  timestamp: string;
  impactScore: number;
  documentUrl?: string | null;
}

// --- FUNÇÕES DE SCORE (DETERMINÍSTICO BASEADO NO PARTIDO - SEM DADOS FALSOS) ---
function calculateProgressiveScore(partido: string) {
  const leftWing = ['PT', 'PSOL', 'PCdoB', 'REDE', 'PDT', 'PSB', 'PV'];
  const rightWing = ['PL', 'NOVO', 'REPUBLICANOS', 'PP', 'UNIÃO', 'PRD', 'MDB', 'PSD', 'AVANTE', 'SOLIDARIEDADE'];
  
  let baseScore = 50;
  let ind = {
    direitosSociais: 50,
    direitosHumanos: 50,
    democracia: 50,
    economia: 50,
    meioAmbiente: 50,
    coerencia: 50
  };

  if (leftWing.includes(partido)) {
    baseScore = 85;
    ind = {
      direitosSociais: 90,
      direitosHumanos: 95,
      democracia: 85,
      economia: 70,
      meioAmbiente: 90,
      coerencia: 80
    };
    // Specific adjustments
    if (partido === 'PSOL') {
      ind.direitosHumanos = 98;
      ind.direitosSociais = 95;
    }
    if (partido === 'PV' || partido === 'REDE') {
      ind.meioAmbiente = 98;
    }
  } else if (rightWing.includes(partido)) {
    baseScore = 25;
    ind = {
      direitosSociais: 20,
      direitosHumanos: 15,
      democracia: 40,
      economia: 80, // High score in "Economy" from a market perspective
      meioAmbiente: 20,
      coerencia: 60
    };
    if (partido === 'NOVO') {
      ind.economia = 95;
      ind.coerencia = 85;
    }
  } else {
    // Centro
    baseScore = 50;
    ind = {
      direitosSociais: 50,
      direitosHumanos: 45,
      democracia: 60,
      economia: 55,
      meioAmbiente: 40,
      coerencia: 40
    };
  }

  return {
    total: baseScore,
    indicadores: ind,
    tags: leftWing.includes(partido) ? ['Defensor do SUS', 'Pró-Trabalhador'] : rightWing.includes(partido) ? ['Pró-Mercado', 'Conservador'] : ['Centrão']
  };
}

// --- CÂMARA DOS DEPUTADOS ---
export async function getDeputadosNormalizados(page = 1, itens = 100): Promise<PoliticoNormalizado[]> {
  try {
    const response = await fetch(`${CAMARA_API_URL}/deputados?ordem=ASC&ordenarPor=nome&pagina=${page}&itens=${itens}`, FETCH_OPTIONS);
    if (!response.ok) {
      console.error(`Erro API Câmara Deputados: ${response.status}`);
      return [];
    }
    const data = await response.json();
    
    return data.dados.map((d: any): PoliticoNormalizado => {
      const scoreData = calculateProgressiveScore(d.siglaPartido);
      return {
        id: `camara-${d.id}`,
        origem: 'camara',
        cargo: 'Deputado Federal',
        nome: d.nome,
        partido: d.siglaPartido,
        uf: d.siglaUf,
        foto: d.urlFoto,
        score: scoreData.total,
        indicadores: scoreData.indicadores,
        tags: scoreData.tags,
        resumo: `Deputado(a) Federal por ${d.siglaUf} filiado(a) ao ${d.siglaPartido}.`
      };
    });
  } catch (error) {
    console.error("Erro ao buscar deputados:", error);
    return [];
  }
}

export async function getCamaraExpenses(id: string): Promise<any[]> {
  const rawId = id.replace('camara-', '');
  try {
    const response = await fetch(`${CAMARA_API_URL}/deputados/${rawId}/despesas?ordem=DESC&ordenarPor=dataDocumento&itens=5`, FETCH_OPTIONS);
    if (!response.ok) return [];
    const data = await response.json();
    return data.dados || [];
  } catch (error) {
    return [];
  }
}

export async function getCamaraProposicoes(id: string): Promise<any[]> {
  const rawId = id.replace('camara-', '');
  try {
    // Ordenar por ano e numero para pegar os mais recentes
    const response = await fetch(`${CAMARA_API_URL}/proposicoes?idDeputadoAutor=${rawId}&ordem=DESC&ordenarPor=id&itens=5`, FETCH_OPTIONS);
    if (!response.ok) return [];
    const data = await response.json();
    return data.dados || [];
  } catch (error) {
    return [];
  }
}

export async function getCamaraDiscursos(id: string): Promise<any[]> {
  const rawId = id.replace('camara-', '');
  try {
    const response = await fetch(`${CAMARA_API_URL}/deputados/${rawId}/discursos?ordem=DESC&ordenarPor=dataHoraInicio&itens=3`, FETCH_OPTIONS);
    if (!response.ok) return [];
    const data = await response.json();
    return data.dados || [];
  } catch (error) {
    return [];
  }
}

// --- SENADO FEDERAL ---
export async function getSenadoresNormalizados(): Promise<PoliticoNormalizado[]> {
  try {
    const response = await fetch(`${SENADO_API_URL}/senador/lista/atual`, FETCH_OPTIONS);
    if (!response.ok) {
      console.error(`Erro API Senado: ${response.status}`);
      return [];
    }
    const data = await response.json();
    
    const senadores = data.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
    
    return senadores.map((s: any): PoliticoNormalizado => {
      const id = s.IdentificacaoParlamentar.CodigoParlamentar;
      const nome = s.IdentificacaoParlamentar.NomeParlamentar;
      const partido = s.IdentificacaoParlamentar.SiglaPartidoParlamentar;
      const uf = s.IdentificacaoParlamentar.UfParlamentar;
      const foto = s.IdentificacaoParlamentar.UrlFotoParlamentar;
      
      const scoreData = calculateProgressiveScore(partido);
      
      return {
        id: `senado-${id}`,
        origem: 'senado',
        cargo: 'Senador',
        nome,
        partido,
        uf,
        foto,
        score: scoreData.total,
        indicadores: scoreData.indicadores,
        tags: scoreData.tags,
        resumo: `Senador(a) por ${uf} filiado(a) ao ${partido}.`
      };
    });
  } catch (error) {
    console.error("Erro ao buscar senadores:", error);
    return [];
  }
}

export async function getSenadoDiscursos(id: string): Promise<any[]> {
  const rawId = id.replace('senado-', '');
  try {
    const response = await fetch(`${SENADO_API_URL}/senador/${rawId}/discursos`, FETCH_OPTIONS);
    if (!response.ok) return [];
    const data = await response.json();
    const discursos = data?.DiscursosParlamentar?.Parlamentar?.Discursos?.Discurso || [];
    return Array.isArray(discursos) ? discursos.slice(0, 3) : [discursos];
  } catch (error) {
    return [];
  }
}

// --- FEED UNIFICADO (APENAS DADOS REAIS) ---
export async function getRealFeedEvents(politicos: PoliticoNormalizado[]): Promise<FeedEvent[]> {
  const events: FeedEvent[] = [];
  
  // Amostra reduzida para evitar rate limit da API (25 políticos * 3 requests cada = 75 requests)
  const amostra = politicos.sort(() => 0.5 - Math.random()).slice(0, 25);

  console.log(`Iniciando busca de eventos reais para ${amostra.length} políticos...`);

  await Promise.all(amostra.map(async (politico) => {
    try {
      if (politico.origem === 'camara') {
        // Usando Promise.allSettled para não travar se um falhar
        const results = await Promise.allSettled([
          getCamaraExpenses(politico.id),
          getCamaraProposicoes(politico.id),
          getCamaraDiscursos(politico.id)
        ]);
        
        const expenses = results[0].status === 'fulfilled' ? results[0].value : [];
        const proposicoes = results[1].status === 'fulfilled' ? results[1].value : [];
        const discursos = results[2].status === 'fulfilled' ? results[2].value : [];
        
        expenses.slice(0, 2).forEach((exp: any) => {
          if (exp.valorLiquido > 0) {
            events.push({
              id: `exp-${exp.codDocumento || Math.random()}`,
              politico,
              actionType: 'expense',
              text: `${exp.tipoDespesa}: R$ ${exp.valorLiquido.toLocaleString('pt-BR')}`,
              icon: '💸',
              color: 'text-red-600',
              amountValue: exp.valorLiquido,
              timestamp: exp.dataDocumento || new Date().toISOString(),
              impactScore: exp.valorLiquido > 5000 ? 30 : 60,
              documentUrl: exp.urlDocumento
            });
          }
        });

        proposicoes.slice(0, 2).forEach((prop: any) => {
          const anoStr = prop.ano && prop.ano !== 0 ? `/${prop.ano}` : '';
          events.push({
            id: `prop-${prop.id}`,
            politico,
            actionType: 'proposal',
            text: `${prop.siglaTipo} ${prop.numero}${anoStr}: ${prop.ementa}`,
            icon: '📜',
            color: 'text-red-600',
            amountValue: 0,
            timestamp: prop.dataApresentacao || new Date().toISOString(),
            impactScore: 90,
            documentUrl: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${prop.id}`
          });
        });

        discursos.slice(0, 2).forEach((disc: any) => {
          events.push({
            id: `disc-camara-${Math.random()}`,
            politico,
            actionType: 'speech',
            text: `Discurso: ${disc.sumario || 'Pronunciamento em plenário'}`,
            icon: '🗣️',
            color: 'text-red-600',
            amountValue: 0,
            timestamp: disc.dataHoraInicio || new Date().toISOString(),
            impactScore: 70,
            documentUrl: null
          });
        });
      } else if (politico.origem === 'senado') {
        const discursos = await getSenadoDiscursos(politico.id);
        
        discursos.slice(0, 2).forEach(disc => {
          const resumo = disc.ResumoPronunciamento || disc.TextoPronunciamento || 'Pronunciamento no Senado Federal';
          events.push({
            id: `disc-senado-${disc.CodigoPronunciamento || Math.random()}`,
            politico,
            actionType: 'speech',
            text: `Senado: ${resumo}`,
            icon: '🗣️',
            color: 'text-red-600',
            amountValue: 0,
            timestamp: disc.DataPronunciamento || new Date().toISOString(),
            impactScore: 75,
            documentUrl: disc.UrlTexto
          });
        });
      }
    } catch (e) {
      console.error(`Failed to fetch data for ${politico.nome}:`, e);
    }
  }));

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
