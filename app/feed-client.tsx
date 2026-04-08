"use client";

import { useState, useMemo, useEffect } from 'react';
import { PoliticoNormalizado, FeedEvent, getCamaraProposicoes, getCamaraExpenses, getCamaraDiscursos, getSenadoDiscursos } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Megaphone, FileText, Share2, MoreHorizontal, ExternalLink, Filter, TrendingUp, Search, Info, Thermometer, Home, User, ChevronRight, X, ShieldAlert, Loader2, Receipt, MessageSquare, ScrollText, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface FeedClientProps {
  initialPoliticians: PoliticoNormalizado[];
  initialEvents: FeedEvent[];
}

export default function FeedClient({ initialPoliticians, initialEvents }: FeedClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [filterType, setFilterType] = useState('all');
  const [filterCasa, setFilterCasa] = useState('ambos');
  const [filterPartido, setFilterPartido] = useState('todos');
  const [filterUF, setFilterUF] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedPoliticianId, setSelectedPoliticianId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'ranking' | 'search'>('feed');
  const [detailPolitician, setDetailPolitician] = useState<PoliticoNormalizado | null>(null);
  const [modalTab, setModalTab] = useState<'perfil' | 'projetos' | 'gastos' | 'discursos'>('perfil');
  const [modalData, setModalData] = useState<{
    proposicoes: any[];
    gastos: any[];
    discursos: any[];
    loading: boolean;
  }>({
    proposicoes: [],
    gastos: [],
    discursos: [],
    loading: false
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch extra data when modal opens
  useEffect(() => {
    if (!detailPolitician) {
      const timer = setTimeout(() => {
        setModalData({ proposicoes: [], gastos: [], discursos: [], loading: false });
        setModalTab('perfil');
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchData = async () => {
      setModalData(prev => ({ ...prev, loading: true }));
      try {
        if (detailPolitician.origem === 'camara') {
          const [props, expenses, speeches] = await Promise.all([
            getCamaraProposicoes(detailPolitician.id),
            getCamaraExpenses(detailPolitician.id),
            getCamaraDiscursos(detailPolitician.id)
          ]);
          setModalData({
            proposicoes: props,
            gastos: expenses,
            discursos: speeches,
            loading: false
          });
        } else {
          const speeches = await getSenadoDiscursos(detailPolitician.id);
          setModalData({
            proposicoes: [],
            gastos: [],
            discursos: speeches,
            loading: false
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do modal:", error);
        setModalData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [detailPolitician]);

  // Extract unique parties and UFs for the dropdowns
  const partidos = useMemo(() => Array.from(new Set(initialPoliticians.map(p => p.partido))).sort(), [initialPoliticians]);
  const ufs = useMemo(() => Array.from(new Set(initialPoliticians.map(p => p.uf))).sort(), [initialPoliticians]);

  // Filter events based on type, casa, partido, uf, search query, and selected story
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesType = filterType === 'all' || event.actionType === filterType;
      const matchesCasa = filterCasa === 'ambos' || event.politico.origem === filterCasa;
      const matchesPartido = filterPartido === 'todos' || event.politico.partido === filterPartido;
      const matchesUF = filterUF === 'todos' || event.politico.uf === filterUF;
      const matchesSearch = event.politico.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            event.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSelected = selectedPoliticianId ? event.politico.id === selectedPoliticianId : true;

      return matchesType && matchesCasa && matchesPartido && matchesUF && matchesSearch && matchesSelected;
    });
  }, [events, filterType, filterCasa, filterPartido, filterUF, searchQuery, selectedPoliticianId]);

  // Ranking data
  const rankingPoliticians = useMemo(() => {
    return [...initialPoliticians].sort((a, b) => b.score - a.score);
  }, [initialPoliticians]);

  // Dashboard data calculation
  const dashboardData = useMemo(() => {
    const expensesByParty: Record<string, number> = {};
    events.forEach(event => {
      if (event.actionType === 'expense' && event.amountValue) {
        expensesByParty[event.politico.partido] = (expensesByParty[event.politico.partido] || 0) + event.amountValue;
      }
    });

    return Object.entries(expensesByParty)
      .map(([party, amount]) => ({ party, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 parties
  }, [events]);

  // Radar chart data for detail modal
  const radarData = useMemo(() => {
    if (!detailPolitician) return [];
    const ind = detailPolitician.indicadores;
    return [
      { subject: 'Sociais', A: ind.direitosSociais, fullMark: 100 },
      { subject: 'Humanos', A: ind.direitosHumanos, fullMark: 100 },
      { subject: 'Democracia', A: ind.democracia, fullMark: 100 },
      { subject: 'Economia', A: ind.economia, fullMark: 100 },
      { subject: 'Ambiente', A: ind.meioAmbiente, fullMark: 100 },
      { subject: 'Coerência', A: ind.coerencia, fullMark: 100 },
    ];
  }, [detailPolitician]);

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Editorial Disclaimer */}
      <div className="bg-primary p-3 text-[10px] md:text-xs text-primary-foreground flex items-start gap-2 border-b-2 border-foreground">
        <Info className="w-3 h-3 md:w-4 h-4 shrink-0 mt-0.5" />
        <p className="font-bold uppercase tracking-widest">
          Aviso Editorial: Esta análise segue critérios editoriais progressistas. 
          Dados reais de gastos, leis e discursos obtidos via APIs oficiais da Câmara e Senado.
        </p>
      </div>

      {activeTab === 'feed' && (
        <>
          {/* Stories Section - ALL Politicians */}
          <div className="w-full border-b-2 border-foreground py-6 bg-background">
            <div className="px-4 mb-4 flex justify-between items-end">
              <h2 className="text-xl font-black uppercase tracking-tighter italic">
                Parlamentares <span className="text-primary">Monitorados</span>
              </h2>
              <div className="flex flex-col items-end gap-1">
                {selectedPoliticianId && (
                  <button 
                    onClick={() => setSelectedPoliticianId(null)}
                    className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 uppercase"
                  >
                    Limpar Filtro [X]
                  </button>
                )}
                <span className="text-[10px] font-bold uppercase opacity-60">{initialPoliticians.length} parlamentares</span>
              </div>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-6 px-4 pb-4">
                {initialPoliticians.map((politico) => {
                  const isSelected = selectedPoliticianId === politico.id;
                  return (
                    <div 
                      key={politico.id} 
                      onClick={() => setSelectedPoliticianId(isSelected ? null : politico.id)}
                      className={`flex flex-col items-center gap-2 cursor-pointer group relative transition-all ${isSelected ? 'scale-110' : selectedPoliticianId ? 'opacity-40' : ''}`}
                    >
                      <div className={`relative p-0.5 transition-all ${isSelected ? 'bg-primary ring-4 ring-primary/20' : 'bg-foreground group-hover:bg-primary'}`}>
                        <Avatar className="w-16 h-16 md:w-20 md:h-20 rounded-none border-2 border-background">
                          <AvatarImage src={politico.foto} alt={politico.nome} className="object-cover" />
                          <AvatarFallback className="rounded-none bg-muted">{politico.nome.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <Badge className="absolute -top-2 -right-2 rounded-none bg-primary text-white border-2 border-background font-black text-[10px]">
                          {politico.score}%
                        </Badge>
                      </div>
                      <span className={`text-[10px] font-black uppercase truncate w-16 md:w-20 text-center tracking-tighter ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {politico.nome.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>

          {/* Filters & Search Bar */}
          <div className="sticky top-[72px] z-40 bg-background border-b-2 border-foreground p-4 flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                <Input 
                  placeholder="BUSCAR PARLAMENTAR..." 
                  className="pl-10 bg-background border-2 border-foreground h-12 text-sm font-bold uppercase rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowDashboard(!showDashboard)}
                className={`p-2 border-2 h-12 w-12 flex items-center justify-center transition-all ${showDashboard ? 'bg-primary text-white border-primary' : 'bg-background border-foreground hover:bg-primary hover:text-white hover:border-primary'}`}
                title="Ver Dashboard"
              >
                <TrendingUp className="h-6 w-6" />
              </button>
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex items-center gap-3 pb-2">
                <Filter className="h-4 w-4 text-foreground shrink-0" />
                
                <Select value={filterType} onValueChange={(val) => setFilterType(val || 'all')}>
                  <SelectTrigger className="w-[140px] h-9 text-[10px] font-black uppercase bg-background border-2 border-foreground rounded-none">
                    <SelectValue placeholder="TIPO" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="all">TODAS AS AÇÕES</SelectItem>
                    <SelectItem value="expense">💸 GASTOS</SelectItem>
                    <SelectItem value="proposal">📜 PROJETOS</SelectItem>
                    <SelectItem value="speech">🗣️ DISCURSOS</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCasa} onValueChange={(val) => setFilterCasa(val || 'ambos')}>
                  <SelectTrigger className="w-[130px] h-9 text-[10px] font-black uppercase bg-background border-2 border-foreground rounded-none">
                    <SelectValue placeholder="CASA" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="ambos">AMBAS AS CASAS</SelectItem>
                    <SelectItem value="camara">CÂMARA</SelectItem>
                    <SelectItem value="senado">SENADO</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPartido} onValueChange={(val) => setFilterPartido(val || 'todos')}>
                  <SelectTrigger className="w-[130px] h-9 text-[10px] font-black uppercase bg-background border-2 border-foreground rounded-none">
                    <SelectValue placeholder="PARTIDO" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="todos">TODOS PARTIDOS</SelectItem>
                    {partidos.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterUF} onValueChange={(val) => setFilterUF(val || 'todos')}>
                  <SelectTrigger className="w-[100px] h-9 text-[10px] font-black uppercase bg-background border-2 border-foreground rounded-none">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="todos">TODAS UFS</SelectItem>
                    {ufs.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>

          {/* Dashboard Section (Collapsible) */}
          <AnimatePresence>
            {showDashboard && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border bg-card/10"
              >
                <div className="p-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 bg-foreground text-background px-3 py-1 w-fit">
                    <Thermometer className="h-3 w-3" />
                    Termômetro de Gastos por Partido
                  </h3>
                  
                  <div className="flex justify-around items-end h-[220px] pt-4 pb-10 px-6 md:px-12 relative">
                    {/* Temperature Scale */}
                    <div className="absolute left-2 top-4 bottom-10 flex flex-col justify-between text-[7px] font-black opacity-40 pr-2 border-r-2 border-foreground/20">
                       <span>QUENTE</span>
                       <span>75%</span>
                       <span>50%</span>
                       <span>25%</span>
                       <span>FRIO</span>
                    </div>

                    {dashboardData.map((data, i) => {
                      const maxAmount = Math.max(...dashboardData.map(d => d.amount));
                      const percentage = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
                      
                      return (
                        <div key={data.party} className="flex flex-col items-center h-full relative">
                          {/* Top party indicator */}
                          {i === 0 && (
                            <motion.div 
                              animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary"
                            >
                              <Flame className="w-4 h-4 fill-current" />
                            </motion.div>
                          )}
                          {/* Thermometer Tube */}
                          <div className="relative w-3 md:w-5 bg-muted/20 border-2 border-foreground h-full flex flex-col justify-end rounded-t-full">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${percentage}%` }}
                              transition={{ duration: 2.5, ease: "circOut", delay: i * 0.1 }}
                              className="w-full bg-primary rounded-t-full relative overflow-hidden"
                            >
                              {/* Reflection shine */}
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 md:w-1.5 h-[80%] bg-white/20 rounded-full blur-[1px]" />
                              
                              {/* Bubbles */}
                              {[1, 2, 3].map((b) => (
                                <motion.div
                                  key={b}
                                  initial={{ y: "100%", opacity: 0 }}
                                  animate={{ y: "-100%", opacity: [0, 0.5, 0] }}
                                  transition={{ 
                                    duration: 2 + Math.random(), 
                                    repeat: Infinity, 
                                    delay: Math.random() * 2,
                                    ease: "linear"
                                  }}
                                  className="absolute w-1 h-1 bg-white rounded-full"
                                  style={{ left: `${20 + b * 20}%` }}
                                />
                              ))}
                            </motion.div>
                            
                            {/* Bulb at the bottom */}
                            <motion.div 
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 md:w-10 h-8 md:h-10 rounded-full bg-primary border-2 border-foreground z-10 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                               <div className="w-3 h-3 md:w-4 md:h-4 bg-white/30 rounded-full blur-[2px] -translate-x-1 -translate-y-1" />
                            </motion.div>
                          </div>
                          
                          {/* Labels */}
                          <div className="absolute -bottom-16 flex flex-col items-center w-20">
                            <span className="text-[10px] font-black uppercase tracking-tighter">{data.party}</span>
                            <motion.span 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 2 + i * 0.1 }}
                              className="text-[9px] font-black text-primary italic"
                            >
                              R${(data.amount/1000).toFixed(0)}k
                            </motion.span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-12" /> {/* Spacer for labels */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed Section */}
          <div className="flex flex-col gap-6 p-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20 border-4 border-dashed border-muted flex flex-col items-center gap-4">
                <Search className="w-12 h-12 opacity-20" />
                <p className="font-black uppercase tracking-tighter text-muted-foreground">
                  Nenhuma ação encontrada para os filtros selecionados.
                </p>
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                >
                  <Card className="bg-background border-4 border-foreground rounded-none overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    <CardHeader className="p-4 border-b-2 border-foreground bg-background">
                      <div className="flex flex-row items-center justify-between">
                        <div 
                          className="flex items-center gap-4 cursor-pointer group"
                          onClick={() => setDetailPolitician(event.politico)}
                        >
                          <Avatar className="w-12 h-12 md:w-16 md:h-16 rounded-none border-2 border-foreground">
                            <AvatarImage src={event.politico.foto} alt={event.politico.nome} className="object-cover" />
                            <AvatarFallback className="rounded-none">{event.politico.nome.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base md:text-xl uppercase tracking-tighter group-hover:text-primary transition-colors">{event.politico.nome}</span>
                              <Badge className="rounded-none bg-foreground text-background font-black text-[10px]">{event.politico.partido}</Badge>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold uppercase opacity-60">
                              {event.politico.cargo} • {event.politico.uf}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className={`text-2xl md:text-4xl font-black italic tracking-tighter ${event.politico.score > 70 ? 'text-green-600' : event.politico.score < 40 ? 'text-primary' : 'text-yellow-600'}`}>
                            {event.politico.score}%
                          </span>
                          <span className="text-[8px] font-black uppercase opacity-40">Score</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      <div className={`p-6 md:p-10 flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[200px] border-b-2 border-foreground ${
                        event.actionType === 'expense' ? 'bg-primary/5' :
                        event.actionType === 'proposal' ? 'bg-foreground/5' :
                        'bg-muted/20'
                      }`}>
                        <span className="text-5xl md:text-7xl mb-4 drop-shadow-md">{event.icon}</span>
                        <h3 className="text-base md:text-2xl font-black tracking-tighter uppercase px-4 leading-tight">
                          {event.text}
                        </h3>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 flex flex-col gap-4 bg-background">
                      <div className="flex justify-between w-full items-center">
                        <div className="flex gap-4">
                          <button className="flex items-center gap-2 font-black uppercase text-xs hover:text-primary transition-colors">
                            <Megaphone className="w-5 h-5" />
                            <span>Cobrar</span>
                          </button>
                          {event.documentUrl && (
                            <a href={event.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-black uppercase text-xs hover:text-primary transition-colors">
                              <FileText className="w-5 h-5" />
                              <span>Doc</span>
                            </a>
                          )}
                          <button className="flex items-center gap-2 font-black uppercase text-xs hover:text-primary transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                        <span className="text-[10px] font-black uppercase opacity-40 italic">
                          {isMounted ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: ptBR }) : '...'}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'ranking' && (
        <div className="p-4 flex flex-col gap-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic border-b-4 border-primary pb-2">
            Ranking <span className="text-primary">Progressista</span>
          </h2>
          <div className="flex flex-col gap-4">
            {rankingPoliticians.map((politico, index) => (
              <Card 
                key={politico.id} 
                className="p-4 flex items-center gap-4 cursor-pointer border-2 border-foreground rounded-none hover:bg-primary hover:text-white transition-all group"
                onClick={() => setDetailPolitician(politico)}
              >
                <div className="text-2xl font-black italic w-8 text-center opacity-20 group-hover:opacity-100">
                  #{index + 1}
                </div>
                <Avatar className="w-12 h-12 rounded-none border-2 border-foreground">
                  <AvatarImage src={politico.foto} alt={politico.nome} className="object-cover" />
                  <AvatarFallback className="rounded-none">{politico.nome.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-base uppercase tracking-tighter truncate">{politico.nome}</h3>
                  <p className="text-[10px] font-bold uppercase opacity-60 group-hover:opacity-100">{politico.partido} • {politico.uf}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black italic tracking-tighter">
                    {politico.score}%
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="p-4 flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground" />
            <Input 
              placeholder="BUSCAR NOME, PARTIDO OU UF..." 
              className="pl-12 h-16 text-lg font-black uppercase border-4 border-foreground rounded-none focus-visible:ring-0 focus-visible:border-primary"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialPoliticians
              .filter(p => p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || p.partido.toLowerCase().includes(searchQuery.toLowerCase()) || p.uf.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 40)
              .map((politico) => (
                <div 
                  key={politico.id} 
                  className="flex items-center gap-4 p-4 border-2 border-foreground rounded-none hover:bg-primary hover:text-white cursor-pointer transition-all group"
                  onClick={() => {
                    setDetailPolitician(politico);
                    setActiveTab('feed');
                    setSelectedPoliticianId(politico.id);
                  }}
                >
                  <Avatar className="w-14 h-14 rounded-none border-2 border-foreground">
                    <AvatarImage src={politico.foto} alt={politico.nome} className="object-cover" />
                    <AvatarFallback className="rounded-none">{politico.nome.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tighter">{politico.nome}</span>
                    <span className="text-[10px] font-bold uppercase opacity-60 group-hover:opacity-100">{politico.cargo} • {politico.partido} • {politico.uf}</span>
                    <Badge className="w-fit mt-1 rounded-none bg-foreground text-background font-black text-[8px] group-hover:bg-white group-hover:text-primary">{politico.score}% SCORE</Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Politician Detail Modal */}
      <Dialog open={!!detailPolitician} onOpenChange={(open) => !open && setDetailPolitician(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-4 border-foreground bg-background max-h-[90vh] overflow-y-auto rounded-none">
          {detailPolitician && (
            <div className="flex flex-col">
              <div className="relative h-40 bg-primary flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <button 
                  onClick={() => setDetailPolitician(null)}
                  className="absolute top-4 right-4 p-2 bg-background border-2 border-foreground hover:bg-primary hover:text-white transition-all z-50"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-16 left-8 p-1 bg-background border-4 border-foreground">
                  <Avatar className="w-32 h-32 rounded-none">
                    <AvatarImage src={detailPolitician.foto} alt={detailPolitician.nome} className="object-cover" />
                    <AvatarFallback className="rounded-none">{detailPolitician.nome.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="mt-20 px-4 md:px-8 pb-8 flex flex-col gap-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col">
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">{detailPolitician.nome}</h2>
                      <p className="text-xs md:text-sm font-bold uppercase opacity-60 mt-2">{detailPolitician.cargo} • {detailPolitician.partido} • {detailPolitician.uf}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-3xl md:text-4xl font-black italic tracking-tighter text-primary">
                        {detailPolitician.score}%
                      </div>
                      <div className="text-[8px] font-black uppercase tracking-widest opacity-40">Score Progressista</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {detailPolitician.tags.map(tag => (
                      <Badge key={tag} className="rounded-none bg-primary text-white font-black text-[10px] px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Modal Tabs */}
                <div className="flex border-b-4 border-foreground overflow-x-auto no-scrollbar">
                  {[
                    { id: 'perfil', label: 'Perfil', icon: User },
                    { id: 'projetos', label: 'Projetos', icon: ScrollText },
                    { id: 'gastos', label: 'Gastos', icon: Receipt },
                    { id: 'discursos', label: 'Discursos', icon: MessageSquare },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setModalTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 font-black uppercase text-[10px] md:text-xs whitespace-nowrap transition-all ${
                        modalTab === tab.id 
                          ? 'bg-foreground text-background translate-y-0' 
                          : 'bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="min-h-[300px]">
                  {modalData.loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-[10px] font-black uppercase opacity-40">Carregando dados oficiais...</p>
                    </div>
                  ) : (
                    <>
                      {modalTab === 'perfil' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                          <div className="border-4 border-foreground p-6 bg-muted/10 relative">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-center bg-foreground text-background py-1 absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                              Radar de Atuação
                            </h3>
                            <div className="h-[250px] w-full flex justify-center">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                  <PolarGrid stroke="rgba(0,0,0,0.1)" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: 'black' }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  <Radar
                                    name={detailPolitician.nome}
                                    dataKey="A"
                                    stroke="oklch(0.55 0.25 25)"
                                    fill="oklch(0.55 0.25 25)"
                                    fillOpacity={0.7}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <h3 className="text-xs font-black uppercase tracking-widest border-l-4 border-primary pl-2">Análise Editorial</h3>
                            <p className="text-sm font-bold leading-relaxed text-foreground/80">
                              {detailPolitician.nome} é {detailPolitician.cargo} por {detailPolitician.uf}, filiado(a) ao {detailPolitician.partido}. 
                              Os indicadores acima refletem a análise de sua atividade parlamentar sob a ótica da linha editorial desta plataforma.
                            </p>
                          </div>
                        </div>
                      )}

                      {modalTab === 'projetos' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                          {modalData.proposicoes.length === 0 ? (
                            <div className="text-center py-10 opacity-40 font-black uppercase text-xs">Nenhum projeto recente encontrado.</div>
                          ) : (
                            modalData.proposicoes.map((prop) => {
                              const anoStr = prop.ano && prop.ano !== 0 ? `/${prop.ano}` : '';
                              return (
                                <div key={prop.id} className="border-2 border-foreground p-4 bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <Badge className="rounded-none bg-foreground text-background font-black text-[8px]">
                                      {prop.siglaTipo} {prop.numero}{anoStr}
                                    </Badge>
                                    <span className="text-[8px] font-black opacity-40">{prop.dataApresentacao ? new Date(prop.dataApresentacao).toLocaleDateString('pt-BR') : ''}</span>
                                  </div>
                                  <p className="text-xs font-bold leading-tight mb-3">{prop.ementa}</p>
                                  <a 
                                    href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${prop.id}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[8px] font-black uppercase flex items-center gap-1 hover:text-primary"
                                  >
                                    Ver Tramitação <ExternalLink className="w-2 h-2" />
                                  </a>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {modalTab === 'gastos' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                          {modalData.gastos.length === 0 ? (
                            <div className="text-center py-10 opacity-40 font-black uppercase text-xs">Nenhum gasto recente encontrado.</div>
                          ) : (
                            modalData.gastos.map((gasto, i) => (
                              <div key={i} className="border-2 border-foreground p-4 bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] font-black uppercase opacity-60">{gasto.tipoDespesa}</span>
                                  <span className="text-[10px] font-black">{gasto.dataDocumento ? new Date(gasto.dataDocumento).toLocaleDateString('pt-BR') : ''}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-black text-primary">R$ {gasto.valorLiquido?.toLocaleString('pt-BR')}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {modalTab === 'discursos' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                          {modalData.discursos.length === 0 ? (
                            <div className="text-center py-10 opacity-40 font-black uppercase text-xs">Nenhum discurso recente encontrado.</div>
                          ) : (
                            modalData.discursos.map((disc, i) => (
                              <div key={i} className="border-2 border-foreground p-4 bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <span className="text-[8px] font-black uppercase opacity-60">Pronunciamento</span>
                                  <span className="text-[8px] font-black opacity-40">
                                    {disc.dataHoraInicio ? new Date(disc.dataHoraInicio).toLocaleDateString('pt-BR') : 
                                     disc.DataPronunciamento ? new Date(disc.DataPronunciamento).toLocaleDateString('pt-BR') : ''}
                                  </span>
                                </div>
                                <p className="text-xs font-bold leading-tight italic">
                                  &quot;{disc.sumario || disc.ResumoPronunciamento || disc.TextoPronunciamento || 'Sem resumo disponível'}&quot;
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button 
                    onClick={() => {
                      setSelectedPoliticianId(detailPolitician.id);
                      setDetailPolitician(null);
                      setActiveTab('feed');
                    }}
                    className="w-full bg-primary text-white py-4 font-black uppercase tracking-widest hover:bg-foreground transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                  >
                    Filtrar Feed por este Parlamentar
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-4 border-foreground flex justify-around items-center h-20 px-4 max-w-2xl mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'feed' ? 'text-primary scale-110' : 'text-foreground opacity-40 hover:opacity-100'}`}
        >
          <Home className="w-7 h-7" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Feed</span>
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'text-primary scale-110' : 'text-foreground opacity-40 hover:opacity-100'}`}
        >
          <TrendingUp className="w-7 h-7" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Ranking</span>
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'search' ? 'text-primary scale-110' : 'text-foreground opacity-40 hover:opacity-100'}`}
        >
          <Search className="w-7 h-7" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Busca</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('feed');
            setSelectedPoliticianId(null);
          }}
          className={`flex flex-col items-center gap-1 transition-all text-foreground opacity-40 hover:opacity-100`}
        >
          <User className="w-7 h-7" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
