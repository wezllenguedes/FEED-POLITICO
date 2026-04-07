"use client";

import { useState, useMemo, useEffect } from 'react';
import { PoliticoNormalizado, FeedEvent } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Megaphone, FileText, Share2, MoreHorizontal, ExternalLink, Filter, TrendingUp, Search, Info, Thermometer, Home, User, ChevronRight, X } from 'lucide-react';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <div className="bg-muted/50 p-3 text-[10px] md:text-xs text-muted-foreground flex items-start gap-2 border-b border-border">
        <Info className="w-3 h-3 md:w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Aviso Editorial:</strong> Esta análise segue critérios editoriais progressistas. 
          O Score é calculado com base em direitos sociais, meio ambiente e democracia.
        </p>
      </div>

      {activeTab === 'feed' && (
        <>
          {/* Stories Section - ALL Politicians */}
          <div className="w-full border-b border-border py-4 bg-card/30">
            <div className="px-4 mb-2 flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {selectedPoliticianId ? 'Filtro Ativo' : 'Parlamentares'}
              </span>
              <div className="flex items-center gap-2">
                {selectedPoliticianId && (
                  <button 
                    onClick={() => setSelectedPoliticianId(null)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Limpar Filtro
                  </button>
                )}
                <span className="text-[10px] text-muted-foreground">{initialPoliticians.length} monitorados</span>
              </div>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 px-4 pb-2">
                {initialPoliticians.map((politico) => {
                  const isSelected = selectedPoliticianId === politico.id;
                  return (
                    <div 
                      key={politico.id} 
                      onClick={() => setSelectedPoliticianId(isSelected ? null : politico.id)}
                      className={`flex flex-col items-center gap-1 cursor-pointer group relative transition-all ${isSelected ? 'scale-110' : selectedPoliticianId ? 'opacity-50' : ''}`}
                    >
                      <div className={`p-1 rounded-full ${isSelected ? 'neon-border-green' : 'border-2 border-muted hover:border-primary transition-colors'}`}>
                        <Avatar className="w-14 h-14 md:w-16 md:h-16 border-2 border-background">
                          <AvatarImage src={politico.foto} alt={politico.nome} />
                          <AvatarFallback>{politico.nome.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className={`text-[10px] font-medium truncate w-14 md:w-16 text-center transition-colors ${isSelected ? 'text-primary font-bold' : 'group-hover:text-primary'}`}>
                        {politico.nome.split(' ')[0]}
                      </span>
                      <Badge variant="secondary" className="absolute -bottom-2 text-[8px] px-1 py-0 h-3.5 z-10 bg-background border border-border">
                        {politico.score}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>

          {/* Filters & Search Bar */}
          <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-md border-b border-border p-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar político ou termo..." 
                  className="pl-9 bg-muted/50 border-none h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowDashboard(!showDashboard)}
                className={`p-2 rounded-md border h-9 w-9 flex items-center justify-center ${showDashboard ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-transparent hover:bg-muted'}`}
                title="Ver Dashboard"
              >
                <TrendingUp className="h-4 w-4" />
              </button>
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex items-center gap-2 pb-2">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0 mr-1" />
                
                <Select value={filterType} onValueChange={(val) => setFilterType(val || 'all')}>
                  <SelectTrigger className="w-[120px] h-7 text-[10px] bg-muted/50 border-none">
                    <SelectValue placeholder="Tipo de Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Ações</SelectItem>
                    <SelectItem value="expense">💸 Gastos</SelectItem>
                    <SelectItem value="proposal">📜 Projetos</SelectItem>
                    <SelectItem value="speech">🗣️ Discursos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCasa} onValueChange={(val) => setFilterCasa(val || 'ambos')}>
                  <SelectTrigger className="w-[110px] h-7 text-[10px] bg-muted/50 border-none">
                    <SelectValue placeholder="Casa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambos">Ambas as Casas</SelectItem>
                    <SelectItem value="camara">Câmara</SelectItem>
                    <SelectItem value="senado">Senado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPartido} onValueChange={(val) => setFilterPartido(val || 'todos')}>
                  <SelectTrigger className="w-[110px] h-7 text-[10px] bg-muted/50 border-none">
                    <SelectValue placeholder="Partido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Partidos</SelectItem>
                    {partidos.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterUF} onValueChange={(val) => setFilterUF(val || 'todos')}>
                  <SelectTrigger className="w-[90px] h-7 text-[10px] bg-muted/50 border-none">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas UFs</SelectItem>
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
                  <h3 className="text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    Top Gastos por Partido (Amostra)
                  </h3>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="party" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Gasto']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }}
                        />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed Section */}
          <div className="flex flex-col gap-4 p-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhuma ação encontrada para os filtros selecionados.
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                >
                  <Card className="bg-card border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 md:p-4 flex flex-col gap-2 md:gap-3">
                      <div className="flex flex-row items-center justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setDetailPolitician(event.politico)}
                        >
                          <Avatar className={`w-10 h-10 md:w-12 md:h-12 border-2 ${event.politico.score > 70 ? 'border-green-500' : event.politico.score < 40 ? 'border-red-500' : 'border-border'}`}>
                            <AvatarImage src={event.politico.foto} alt={event.politico.nome} />
                            <AvatarFallback>{event.politico.nome.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm md:text-base group-hover:underline">{event.politico.nome}</span>
                              <Badge variant="outline" className="text-[9px] h-3.5 px-1 py-0">{event.politico.partido}</Badge>
                            </div>
                            <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                              {event.politico.cargo} • {event.politico.uf}
                            </span>
                          </div>
                        </div>
                        
                        {/* Visual Thermometer */}
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <Thermometer className={`w-3 h-3 md:w-4 h-4 ${event.politico.score > 70 ? 'text-green-500' : event.politico.score < 40 ? 'text-red-500' : 'text-yellow-500'}`} />
                            <span className={`text-sm md:text-lg font-heading ${event.politico.score > 70 ? 'text-green-500' : event.politico.score < 40 ? 'text-red-500' : 'text-yellow-500'}`}>
                              {event.politico.score}%
                            </span>
                          </div>
                          <div className="w-12 md:w-16 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${event.politico.score > 70 ? 'bg-green-500' : event.politico.score < 40 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                              style={{ width: `${event.politico.score}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Tags Ideológicas */}
                      <div className="flex gap-1.5 flex-wrap">
                        {event.politico.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[8px] md:text-[9px] bg-primary/10 text-primary hover:bg-primary/20 h-4 md:h-5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      <div className={`p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[180px] ${
                        event.actionType === 'expense' ? 'bg-gradient-to-br from-orange-900/20 to-black/10' :
                        event.actionType === 'proposal' ? 'bg-gradient-to-br from-blue-900/20 to-black/10' :
                        event.actionType === 'speech' ? 'bg-gradient-to-br from-purple-900/20 to-black/10' :
                        'bg-muted/10'
                      }`}>
                        <span className="text-3xl md:text-5xl mb-3 md:mb-4">{event.icon}</span>
                        <h3 className={`text-sm md:text-lg font-heading tracking-wide uppercase px-4 ${event.color || 'text-foreground'}`}>
                          {event.text}
                        </h3>
                      </div>
                    </CardContent>

                    <CardFooter className="p-3 md:p-4 flex flex-col gap-3 bg-card">
                      <div className="flex justify-between w-full">
                        <div className="flex gap-3 md:gap-4">
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors" title="Cobrar Político">
                            <Megaphone className="w-4 h-4 md:w-5 h-5" />
                            <span className="text-[10px] md:text-xs font-medium">Cobrar</span>
                          </button>
                          {event.documentUrl && (
                            <a href={event.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors" title="Ver Documento">
                              <FileText className="w-4 h-4 md:w-5 h-5" />
                              <span className="text-[10px] md:text-xs font-medium">Doc</span>
                            </a>
                          )}
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors" title="Compartilhar">
                            <Share2 className="w-4 h-4 md:w-5 h-5" />
                          </button>
                        </div>
                        <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                          {isMounted ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: ptBR }) : '...'}
                        </span>
                      </div>
                      
                      {/* Indicadores Resumidos */}
                      <div className="w-full pt-2 border-t border-border/50 grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>Dir. Sociais</span>
                            <span>{event.politico.indicadores.direitosSociais}%</span>
                          </div>
                          <Progress value={event.politico.indicadores.direitosSociais} className="h-1" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>Meio Ambiente</span>
                            <span>{event.politico.indicadores.meioAmbiente}%</span>
                          </div>
                          <Progress value={event.politico.indicadores.meioAmbiente} className="h-1" />
                        </div>
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
        <div className="p-4 flex flex-col gap-4">
          <h2 className="text-xl font-heading uppercase tracking-wider mb-2">Ranking Progressista</h2>
          <div className="flex flex-col gap-2">
            {rankingPoliticians.map((politico, index) => (
              <Card 
                key={politico.id} 
                className="p-3 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setDetailPolitician(politico)}
              >
                <div className="text-lg font-bold text-muted-foreground w-6 text-center">
                  {index + 1}
                </div>
                <Avatar className={`w-10 h-10 border-2 ${politico.score > 70 ? 'border-green-500' : politico.score < 40 ? 'border-red-500' : 'border-border'}`}>
                  <AvatarImage src={politico.foto} alt={politico.nome} />
                  <AvatarFallback>{politico.nome.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{politico.nome}</h3>
                  <p className="text-[10px] text-muted-foreground">{politico.partido} • {politico.uf}</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${politico.score > 70 ? 'text-green-500' : politico.score < 40 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {politico.score}%
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, partido ou UF..." 
              className="pl-10 h-12 text-base"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            {initialPoliticians
              .filter(p => p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || p.partido.toLowerCase().includes(searchQuery.toLowerCase()) || p.uf.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 20)
              .map((politico) => (
                <div 
                  key={politico.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setDetailPolitician(politico);
                    setActiveTab('feed');
                    setSelectedPoliticianId(politico.id);
                  }}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={politico.foto} alt={politico.nome} />
                    <AvatarFallback>{politico.nome.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{politico.nome}</span>
                    <span className="text-[10px] text-muted-foreground">{politico.cargo} • {politico.partido} • {politico.uf}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Politician Detail Modal */}
      <Dialog open={!!detailPolitician} onOpenChange={(open) => !open && setDetailPolitician(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none bg-background max-h-[90vh] overflow-y-auto">
          {detailPolitician && (
            <div className="flex flex-col">
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                <button 
                  onClick={() => setDetailPolitician(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-background/50 backdrop-blur-md hover:bg-background transition-colors z-50"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute -bottom-12 left-6 p-1 rounded-full bg-background">
                  <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage src={detailPolitician.foto} alt={detailPolitician.nome} />
                    <AvatarFallback>{detailPolitician.nome.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="mt-14 px-6 pb-6 flex flex-col gap-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{detailPolitician.nome}</h2>
                    <div className="text-right">
                      <div className={`text-2xl font-heading ${detailPolitician.score > 70 ? 'text-green-500' : detailPolitician.score < 40 ? 'text-red-500' : 'text-yellow-500'}`}>
                        {detailPolitician.score}%
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score Progressista</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{detailPolitician.cargo} • {detailPolitician.partido} • {detailPolitician.uf}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {detailPolitician.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-center">Perfil de Atuação</h3>
                  <div className="h-[220px] w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name={detailPolitician.nome}
                          dataKey="A"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider">Resumo</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {detailPolitician.resumo} Atualmente monitorado(a) com base em critérios de defesa da democracia, justiça social e preservação ambiental.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setSelectedPoliticianId(detailPolitician.id);
                      setDetailPolitician(null);
                      setActiveTab('feed');
                    }}
                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Ver Atividade no Feed
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border flex justify-around items-center h-16 px-4 max-w-2xl mx-auto">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ranking' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-medium">Ranking</span>
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'search' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Busca</span>
        </button>
        <button 
          onClick={() => {
            // Just for UI completeness, could lead to a general profile or info
            setActiveTab('feed');
            setSelectedPoliticianId(null);
          }}
          className={`flex flex-col items-center gap-1 transition-colors text-muted-foreground`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
