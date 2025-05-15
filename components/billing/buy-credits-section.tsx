"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Embora não usemos para redirect, pode ser útil
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Zap, Gem, Crown } from "lucide-react"; // Ícones para os pacotes

// Defina os pacotes de crédito aqui.
// IMPORTANTE: Substitua 'price_xxxx' pelos IDs de Preço REAIS do seu painel Stripe (Modo de Teste primeiro).
const creditPackages = [
  {
    id: 'price_1PxxxxxxxTESTxxxxxxx001', // SUBSTITUA PELO SEU PRICE ID REAL
    name: 'Pacote Básico',
    description: 'Ideal para começar.',
    credits: 50,
    price: '$5', // Apenas para exibição
    icon: <Zap className="h-6 w-6 text-yellow-500 mb-2" />,
    bgColor: 'bg-yellow-500/10',
  },
  {
    id: 'price_1PxxxxxxxTESTxxxxxxx002', // SUBSTITUA PELO SEU PRICE ID REAL
    name: 'Pacote Padrão',
    description: 'O mais popular.',
    credits: 200,
    price: '$15', // Apenas para exibição
    icon: <Gem className="h-6 w-6 text-blue-500 mb-2" />,
    bgColor: 'bg-blue-500/10',
    recommended: true, // Opcional: destacar um pacote
  },
  {
    id: 'price_1PxxxxxxxTESTxxxxxxx003', // SUBSTITUA PELO SEU PRICE ID REAL
    name: 'Pacote Pro',
    description: 'Para usuários frequentes.',
    credits: 1000,
    price: '$50', // Apenas para exibição
    icon: <Crown className="h-6 w-6 text-purple-500 mb-2" />,
    bgColor: 'bg-purple-500/10',
  },
];

export function BuyCreditsSection() {
  // Estado para controlar qual botão está carregando
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const router = useRouter(); // Pode ser usado para outras navegações se necessário

  // Função para lidar com o clique no botão de compra
  const handleCheckout = async (priceId: string) => {
    setLoadingPriceId(priceId); // Define qual botão está carregando

    try {
      // Chama a API Route /api/checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: priceId }), // Envia o ID do preço selecionado
      });

      const data = await response.json();

      // Verifica se a resposta foi bem-sucedida e contém a URL do Stripe
      if (response.ok && data.url) {
        // Redireciona o usuário para a página de checkout do Stripe
        window.location.href = data.url;
        // O usuário sairá da sua página aqui. O fluxo continua no Stripe
        // e depois retorna para as URLs de sucesso/cancelamento.
      } else {
        // Se houver um erro conhecido (ex: não autorizado), a API já retorna status correto
        console.error("Erro ao iniciar checkout:", data.error);
        toast({
          title: "Erro",
          description: data.error || "Não foi possível iniciar o processo de pagamento. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Falha na requisição de checkout:", error);
      toast({
        title: "Erro de Rede",
        description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setLoadingPriceId(null); // Limpa o estado de carregamento
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-4 text-white">Comprar Créditos</h2>
      <p className="text-center text-muted-foreground mb-10">Escolha o pacote que melhor se adapta às suas necessidades.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`flex flex-col border ${pkg.recommended ? 'border-purple-500 shadow-lg shadow-purple-900/20' : 'border-gray-800'} bg-gray-900/50 backdrop-blur-sm text-white transition-all hover:border-gray-600`}
          >
            <CardHeader className={`items-center text-center rounded-t-lg ${pkg.bgColor} pt-6`}>
               {pkg.icon}
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription className="text-gray-400">{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center pt-6">
              <p className="text-4xl font-bold mb-2">{pkg.credits}</p>
              <p className="text-sm text-muted-foreground mb-4">Créditos</p>
              <p className="text-2xl font-semibold">{pkg.price}</p>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${pkg.recommended ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600' : ''}`}
                onClick={() => handleCheckout(pkg.id)}
                disabled={loadingPriceId === pkg.id} // Desabilita apenas o botão clicado
              >
                {loadingPriceId === pkg.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguarde...
                  </>
                ) : (
                  'Comprar Agora'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
