import { getDeputadosNormalizados } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const revalidate = 3600;

export default async function ParedaoPage() {
  const deputados = await getDeputadosNormalizados(1, 20);
  
  // Mock paredao data based on lowest scores
  const paredao = [...deputados]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((politico, index) => ({
      politico,
      reason: index === 0 ? 'Votou contra direitos trabalhistas' : index === 1 ? 'Excesso de gastos com cota parlamentar' : 'Faltas não justificadas em plenário',
      votes: index === 0 ? 75 : index === 1 ? 15 : 10
    }));

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4 max-w-2xl mx-auto">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-heading tracking-wider neon-text-pink">Paredão da Semana</h1>
      </header>

      <div className="max-w-2xl mx-auto border-x border-border min-h-screen p-6">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-heading uppercase text-destructive mb-2">Quem deve sair?</h2>
          <p className="text-muted-foreground">Vote no político com o pior desempenho da semana.</p>
        </div>

        <div className="flex flex-col gap-8">
          {paredao.map((item, index) => (
            <div key={item.politico.id || index} className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground font-heading px-4 py-1 rounded-bl-xl z-10">
                {item.votes}%
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-20">
                <div className="neon-border-pink p-1 rounded-full">
                  <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage src={item.politico.foto} alt={item.politico.nome} />
                    <AvatarFallback>{item.politico.nome.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold">{item.politico.nome}</h3>
                  <p className="text-muted-foreground mb-4">{item.politico.partido} - {item.politico.uf}</p>
                  
                  <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm mb-4 inline-block">
                    <strong>Motivo:</strong> {item.reason}
                  </div>
                  
                  <div className="w-full">
                    <Progress value={item.votes} className="h-3 bg-muted" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-heading text-xl uppercase h-14">
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
