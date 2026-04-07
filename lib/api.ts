export const CAMARA_API_URL = 'https://dadosabertos.camara.leg.br/api/v2';
export const SENADO_API_URL = 'https://legis.senado.leg.br/dadosabertos';

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
    const response = await fetch(`${CAMARA_API_URL}/deputados?ordem=ASC&ordenarPor=nome&pagina=${page}&itens=${itens}`);
    if (!response.ok) return [];
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
    return [];
  }
}

export async function getCamaraExpenses(id: string): Promise<any[]> {
  const rawId = id.replace('camara-', '');
  try {
    const response = await fetch(`${CAMARA_API_URL}/deputados/${rawId}/despesas?ordem=DESC&ordenarPor=dataDocumento&itens=5`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.dados;
  } catch (error) {
    return [];
  }
}

export async function getCamaraProposicoes(id: string): Promise<any[]> {
  const rawId = id.replace('camara-', '');
  try {
    const response = await fetch(`${CAMARA_API_URL}/proposicoes?idDeputadoAutor=${rawId}&ordem=DESC&ordenarPor=id&itens=3`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.dados;
  } catch (error) {
    return [];
  }
}

// --- SENADO FEDERAL ---
export async function getSenadoresNormalizados(): Promise<PoliticoNormalizado[]> {
  try {
    const response = await fetch(`${SENADO_API_URL}/senador/lista/atual`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
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
    const response = await fetch(`${SENADO_API_URL}/senador/${rawId}/discursos`, {
      headers: { 'Accept': 'application/json' }
    });
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
  
  // Amostra maior para ter bastante dado real, mas sem estourar limite da API
  const amostra = politicos.sort(() => 0.5 - Math.random()).slice(0, 25);

  await Promise.all(amostra.map(async (politico) => {
    try {
      if (politico.origem === 'camara') {
        const [expenses, proposicoes] = await Promise.all([
          getCamaraExpenses(politico.id),
          getCamaraProposicoes(politico.id)
        ]);
        
        expenses.forEach(exp => {
          if (exp.valorLiquido > 0) {
            events.push({
              id: `exp-${exp.codDocumento}-${Math.random()}`,
              politico,
              actionType: 'expense',
              text: `Gastou R$ ${exp.valorLiquido.toLocaleString('pt-BR')} com ${exp.tipoDespesa.toLowerCase()}`,
              icon: '💸',
              color: 'text-orange-500',
              amountValue: exp.valorLiquido,
              timestamp: exp.dataDocumento || new Date().toISOString(),
              impactScore: exp.valorLiquido > 5000 ? 40 : 70,
              documentUrl: exp.urlDocumento
            });
          }
        });

        proposicoes.forEach(prop => {
          events.push({
            id: `prop-${prop.id}-${Math.random()}`,
            politico,
            actionType: 'proposal',
            text: `Apresentou o projeto ${prop.siglaTipo} ${prop.numero}/${prop.ano}: ${prop.ementa.substring(0, 120)}...`,
            icon: '📜',
            color: 'text-blue-500',
            amountValue: 0,
            timestamp: prop.dataApresentacao || new Date().toISOString(),
            impactScore: 85,
            documentUrl: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${prop.id}`
          });
        });
      } else if (politico.origem === 'senado') {
        const discursos = await getSenadoDiscursos(politico.id);
        
        discursos.forEach(disc => {
          const resumo = disc.ResumoPronunciamento || disc.TextoPronunciamento || 'Atuação parlamentar no Senado';
          events.push({
            id: `disc-${disc.CodigoPronunciamento || Math.random()}-${Math.random()}`,
            politico,
            actionType: 'speech',
            text: `Discursou no Senado sobre: ${resumo.substring(0, 150)}...`,
            icon: '🗣️',
            color: 'text-purple-500',
            amountValue: 0,
            timestamp: disc.DataPronunciamento || new Date().toISOString(),
            impactScore: 75,
            documentUrl: disc.UrlTexto
          });
        });
      }
    } catch (e) {
      console.error(`Failed to fetch data for ${politico.nome}`);
    }
  }));

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
