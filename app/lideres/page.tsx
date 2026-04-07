import { getDeputadosNormalizados } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export const revalidate = 3600;

export default async function LideresPage() {
  const deputados = await getDeputadosNormalizados(1, 20);
  
  // Mock ranking based on score
  const leaders = [...deputados].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4 max-w-2xl mx-auto">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
        <h1 className="text-xl font-heading tracking-wider neon-text-orange">Líderes da Semana</h1>
      </header>

      <div className="max-w-2xl mx-auto border-x border-border min-h-screen p-4">
        <div className="flex flex-col gap-4">
          {leaders.map((leader, index) => (
            <div key={leader.id} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
              <div className="text-2xl font-bold text-muted-foreground w-8 text-center">
                {index + 1}
              </div>
              <Avatar className="w-12 h-12 border-2 border-green-500">
                <AvatarImage src={leader.foto} alt={leader.nome} />
                <AvatarFallback>{leader.nome.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold">{leader.nome}</h3>
                <p className="text-xs text-muted-foreground">{leader.partido} - {leader.uf}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-500">{leader.score}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
