'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Landmark, Building2, Receipt, UserCircle } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Newspaper className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">Feed</span>
        </Link>
        <Link href="/camara" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/camara' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Landmark className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">Câmara</span>
        </Link>
        <Link href="/senado" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/senado' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Building2 className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">Senado</span>
        </Link>
        <Link href="/gastos" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/gastos' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Receipt className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">Gastos</span>
        </Link>
        <Link href="/perfil" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/perfil' ? 'text-primary' : 'text-muted-foreground'}`}>
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">Perfil</span>
        </Link>
      </div>
    </div>
  );
}
