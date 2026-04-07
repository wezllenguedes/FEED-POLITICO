'use client';

import { useState, useMemo } from 'react';
import { PoliticoNormalizado, FeedEvent } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Megaphone, FileText, Share2, MoreHorizontal, ExternalLink, Filter, TrendingUp, Search, Info, Thermometer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';

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
  const [selectedPolitician, setSelectedPolitician] = useState<string | null>(null);

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
      const matchesSelected = selectedPolitician ? event.politico.id === selectedPolitician : true;

      return matchesType && matchesCasa && matchesPartido && matchesUF && matchesSearch && matchesSelected;
    });
  }, [events, filterType, filterCasa, filterPartido, filterUF, searchQuery, selectedPolitician]);

  // Dashboard data calculation
  const dashboardData = useMemo(() => {
    if (!showDashboard) return [];
    
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
  }, [events, showDashboard]);

  return (
    <div className="flex flex-col w-full">
      {/* Editorial Disclaimer */}
      <div className="bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2 border-b border-border">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Aviso Editorial:</strong> Esta análise segue critérios editoriais progressistas. 
          Falas isoladas ou redes sociais não representam integralmente a atuação parlamentar. 
          O Score é calculado com base em direitos sociais, meio ambiente e democracia.
        </p>
      </div>

      {/* Stories Section - ALL Politicians */}
      <div className="w-full border-b border-border py-4 bg-card/30">
        <div className="px-4 mb-2 flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {selectedPolitician ? 'Filtro Ativo' : 'Todos os Políticos'}
          </span>
          <div className="flex items-center gap-2">
            {selectedPolitician && (
              <button 
                onClick={() => setSelectedPolitician(null)}
                className="text-[10px] text-primary hover:underline"
              >
                Limpar Filtro
              </button>
            )}
            <span className="text-xs text-muted-foreground">{initialPoliticians.length} monitorados</span>
          </div>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 px-4 pb-2">
            {initialPoliticians.map((politico) => {
              const isSelected = selectedPolitician === politico.id;
              return (
                <div 
                  key={politico.id} 
                  onClick={() => setSelectedPolitician(isSelected ? null : politico.id)}
                  className={`flex flex-col items-center gap-1 cursor-pointer group relative transition-all ${isSelected ? 'scale-110' : selectedPolitician ? 'opacity-50' : ''}`}
                >
                  <div className={`p-1 rounded-full ${isSelected ? 'neon-border-green' : 'border-2 border-muted hover:border-primary transition-colors'}`}>
                    <Avatar className="w-16 h-16 border-2 border-background">
                      <AvatarImage src={politico.foto} alt={politico.nome} />
                      <AvatarFallback>{politico.nome.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className={`text-xs font-medium truncate w-16 text-center transition-colors ${isSelected ? 'text-primary font-bold' : 'group-hover:text-primary'}`}>
                    {politico.nome.split(' ')[0]}
                  </span>
                  <Badge variant="secondary" className="absolute -bottom-2 text-[9px] px-1 py-0 h-4 z-10 bg-background border border-border">
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
              className="pl-9 bg-muted/50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowDashboard(!showDashboard)}
            className={`p-2 rounded-md border ${showDashboard ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-transparent hover:bg-muted'}`}
            title="Ver Dashboard"
          >
            <TrendingUp className="h-5 w-5" />
          </button>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex items-center gap-2 pb-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-1" />
            
            <Select value={filterType} onValueChange={(val) => setFilterType(val || 'all')}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50 border-none">
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
              <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-none">
                <SelectValue placeholder="Casa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambos">Ambas as Casas</SelectItem>
                <SelectItem value="camara">Câmara</SelectItem>
                <SelectItem value="senado">Senado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPartido} onValueChange={(val) => setFilterPartido(val || 'todos')}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-none">
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
              <SelectTrigger className="w-[100px] h-8 text-xs bg-muted/50 border-none">
                <SelectValue placeholder="Região/UF" />
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
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Gastos por Partido (Amostra)
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="party" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `R${(val/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Gasto']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
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
      <div className="flex flex-col gap-6 p-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhuma ação encontrada para os filtros selecionados.
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
            >
              <Card className="bg-card border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-4 flex flex-col gap-3">
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className={`w-12 h-12 border-2 ${event.politico.score > 70 ? 'border-green-500' : event.politico.score < 40 ? 'border-red-500' : 'border-border'}`}>
                        <AvatarImage src={event.politico.foto} alt={event.politico.nome} />
                        <AvatarFallback>{event.politico.nome.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base hover:underline cursor-pointer">{event.politico.nome}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">{event.politico.partido}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {event.politico.cargo} • {event.politico.uf}
                        </span>
                      </div>
                    </div>
                    
                    {/* Visual Thermometer */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className={`w-4 h-4 ${event.politico.score > 70 ? 'text-green-500' : event.politico.score < 40 ? 'text-red-500' : 'text-yellow-500'}`} />
                        <span className={`text-lg font-heading ${event.politico.score > 70 ? 'text-green-500' : event.politico.score < 40 ? 'text-red-500' : 'text-yellow-500'}`}>
                          {event.politico.score}%
                        </span>
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${event.politico.score > 70 ? 'bg-green-500' : event.politico.score < 40 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                          style={{ width: `${event.politico.score}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags Ideológicas */}
                  <div className="flex gap-2 flex-wrap">
                    {event.politico.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className={`p-6 flex flex-col items-center justify-center text-center min-h-[180px] ${
                    event.actionType === 'expense' ? 'bg-gradient-to-br from-orange-900/20 to-black/10' :
                    event.actionType === 'proposal' ? 'bg-gradient-to-br from-blue-900/20 to-black/10' :
                    event.actionType === 'speech' ? 'bg-gradient-to-br from-purple-900/20 to-black/10' :
                    'bg-muted/10'
                  }`}>
                    <span className="text-5xl mb-4">{event.icon}</span>
                    <h3 className={`text-lg md:text-xl font-heading tracking-wide uppercase ${event.color || 'text-foreground'}`}>
                      {event.text}
                    </h3>
                  </div>
                </CardContent>

                <CardFooter className="p-4 flex flex-col gap-3 bg-card">
                  <div className="flex justify-between w-full">
                    <div className="flex gap-4">
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors" title="Cobrar Político">
                        <Megaphone className="w-5 h-5" />
                        <span className="text-xs font-medium hidden sm:inline">Cobrar</span>
                      </button>
                      {event.documentUrl && (
                        <a href={event.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors" title="Ver Documento">
                          <FileText className="w-5 h-5" />
                          <span className="text-xs font-medium hidden sm:inline">Doc</span>
                        </a>
                      )}
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors" title="Compartilhar">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  
                  {/* Indicadores Resumidos */}
                  <div className="w-full pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Dir. Sociais</span>
                        <span>{event.politico.indicadores.direitosSociais}%</span>
                      </div>
                      <Progress value={event.politico.indicadores.direitosSociais} className="h-1" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
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
    </div>
  );
}
