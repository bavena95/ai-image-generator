// app/layout.tsx
import './globals.css';
import { AuthProvider } from './context/AuthContext'; // Caminho relativo correto
import { Toaster } from "@/components/ui/toaster";
// import { Inter } from 'next/font/google'; // Manter comentado por enquanto

// const inter = Inter({ subsets: ['latin'] });
export const metadata = {
  title: 'AI Image Generator',
  description: 'Gere imagens incríveis com IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("--- [RootLayout] RENDER ---");
  return (
    <html lang="pt-br">
      {/* <body className={inter.className}> */}
      <body>
        <AuthProvider> {/* AuthProvider DEVE envolver tudo que precisa do contexto */}
          <main className="flex-1">
            {console.log("--- [RootLayout] Renderizando children DENTRO de AuthProvider ---")}
            {children} {/* ProfilePage será parte destes children */}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}