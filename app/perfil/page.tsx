import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function PerfilPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4 max-w-2xl mx-auto">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-heading tracking-wider neon-text-blue">Meu Perfil</h1>
      </header>

      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="p-6 flex flex-col items-center border-b border-border">
          <div className="neon-border-blue p-1 rounded-full mb-4">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src="https://picsum.photos/seed/citizen/200/200" alt="Cidadão" />
              <AvatarFallback>CI</AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-2xl font-bold">Cidadão Fiscal</h2>
          <p className="text-muted-foreground mb-4">@cidadao.fiscal</p>
          
          <div className="flex gap-6 w-full justify-center mb-6">
            <div className="text-center">
              <div className="text-xl font-bold">142</div>
              <div className="text-xs text-muted-foreground uppercase">Votos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">12</div>
              <div className="text-xs text-muted-foreground uppercase">Políticos Seguidos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">Nível 5</div>
              <div className="text-xs text-muted-foreground uppercase">Engajamento</div>
            </div>
          </div>
          
          <Button className="w-full bg-primary text-primary-foreground font-bold">Editar Perfil</Button>
        </div>

        <Tabs defaultValue="votos" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border bg-transparent h-14">
            <TabsTrigger value="votos" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary">Meus Votos</TabsTrigger>
            <TabsTrigger value="seguindo" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary">Seguindo</TabsTrigger>
          </TabsList>
          <TabsContent value="votos" className="p-4 flex flex-col gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">Votou no Paredão #12</div>
                  <div className="text-sm text-muted-foreground">Há 2 dias</div>
                </div>
                <div className="text-destructive font-bold">Eliminar</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">Votou no Paredão #11</div>
                  <div className="text-sm text-muted-foreground">Há 1 semana</div>
                </div>
                <div className="text-destructive font-bold">Eliminar</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="seguindo" className="p-4">
            <div className="text-center text-muted-foreground py-10">
              Você ainda não segue nenhum político especificamente.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
