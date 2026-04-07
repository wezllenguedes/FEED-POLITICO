import type {Metadata} from 'next';
import './globals.css';
import { Inter, Anton } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const anton = Anton({weight: '400', subsets:['latin'],variable:'--font-heading'});

export const metadata: Metadata = {
  title: 'Feed Político - Vibe BBB',
  description: 'Acompanhe os políticos brasileiros como se estivessem no BBB.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, anton.variable)} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
