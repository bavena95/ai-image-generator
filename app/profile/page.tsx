// app/profile/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Zap, Copy, CreditCard, ImageIcon, User, ArrowLeft, Loader2, Gem, Crown,
  Share2, Shield, Rocket, RefreshCw, Tags, Mail, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '../context/AuthContext'; // VERIFIQUE O CAMINHO

// --- Dynamic Imports ---
const DynamicBadge = dynamic(
  () => import('@/components/ui/badge').then(mod => mod.Badge),
  {
    ssr: false,
    loading: () => (
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-md h-9 w-[100px] flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
      </div>
    ),
  }
);

const DynamicProfileForm = dynamic(
  () => import('@/components/profile/profile-form').then(mod => mod.ProfileForm),
  {
    ssr: false,
    loading: () => (
      <Card className="bg-gray-900/50 border-gray-800/50">
        <CardHeader> <CardTitle>Carregando Formulário de Perfil...</CardTitle> </CardHeader>
        <CardContent> <div className="h-40 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" /></div> </CardContent>
      </Card>
    ),
  }
);

const DynamicImageGallery = dynamic(
  () => import('@/components/profile/image-gallery').then(mod => mod.ImageGallery),
  {
    ssr: false,
    loading: () => (
      <Card className="bg-gray-900/50 border-gray-800/50">
        <CardHeader> <CardTitle>Carregando Galeria...</CardTitle> </CardHeader>
        <CardContent> <div className="h-60 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div> </CardContent>
      </Card>
    ),
  }
);
// ---------------------

// --- Definição dos Pacotes (Mantida - SUBSTITUA PELOS SEUS PRICE IDs REAIS) ---
const pricingPlans = [
  { id: 'price_YOUR_BASIC_ONETIME_ID', name: "Básico", icon: <Zap className="h-5 w-5" />, description: "Ideal para experimentar", oneTime: { price: 5, credits: 50 }, subscription: { price: 3.5, credits: 30, renewalCredits: 30 }, features: ["Geração padrão", "5 estilos", "Suporte email"], popular: false, gradient: "from-blue-600 to-cyan-500", bgGradient: "from-blue-600/10 to-cyan-500/10"},
  { id: 'price_YOUR_STANDARD_ONETIME_ID', name: "Padrão", icon: <Shield className="h-5 w-5" />, description: "Perfeito para uso regular", oneTime: { price: 15, credits: 200 }, subscription: { price: 10, credits: 150, renewalCredits: 150 }, features: ["Alta qualidade", "Todos estilos", "Fila prioritária", "Suporte prioritário"], popular: true, gradient: "from-purple-600 to-pink-500", bgGradient: "from-purple-600/10 to-pink-500/10"},
  { id: 'price_YOUR_PREMIUM_ONETIME_ID', name: "Premium", icon: <Rocket className="h-5 w-5" />, description: "Para uso profissional", oneTime: { price: 50, credits: 1000 }, subscription: { price: 35, credits: 700, renewalCredits: 700 }, features: ["Qualidade máxima", "Acesso antecipado", "Sem marca d'água", "Suporte dedicado"], popular: false, gradient: "from-amber-500 to-orange-600", bgGradient: "from-amber-500/10 to-orange-600/10"},
  { id: 'price_YOUR_TEST_SUB_ID', name: "Assinatura Essencial", icon: <Gem className="h-5 w-5" />, description: "Créditos recorrentes", oneTime: null, /* ou { price: 10, credits: 75 }*/ subscription: { price: 7.99, credits: 100, renewalCredits: 100 }, features: ["Créditos mensais", "Descontos exclusivos", "Cancelamento fácil"], popular: false, gradient: "from-teal-600 to-green-500", bgGradient: "from-teal-600/10 to-green-500/10"},
];
const planPriceIds: { [key: string]: { oneTime: string | null, subscription: string | null } } = {
    "Básico": { oneTime: 'price_YOUR_BASIC_ONETIME_ID', subscription: 'price_YOUR_BASIC_SUB_ID' }, // SUBSTITUA
    "Padrão": { oneTime: 'price_YOUR_STANDARD_ONETIME_ID', subscription: 'price_YOUR_STANDARD_SUB_ID' }, // SUBSTITUA
    "Premium": { oneTime: 'price_YOUR_PREMIUM_ONETIME_ID', subscription: 'price_YOUR_PREMIUM_SUB_ID' }, // SUBSTITUA
    "Assinatura Essencial": { oneTime: null /* ou 'price_YOUR_ESSENTIAL_ONETIME_ID_IF_EXISTS' */, subscription: 'price_YOUR_TEST_SUB_ID' }, // SUBSTITUA
};
// ---------------------------

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    user,
    credits,
    isLoading: isLoadingAuth, // Renomeado para clareza ao consumir
    openLoginModal, // Para redirecionar para login se necessário
  } = useAuth();

  console.log(`[ProfilePage] Renderizando. isLoadingAuth: ${isLoadingAuth}, User ID: ${user?.id}, Credits: ${credits}`);

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");

  // Estados locais para a UI da página de perfil
  const [discountCode, setDiscountCode] = useState(""); // Lógica de código de desconto pode ser mantida ou movida para backend
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [isSubscription, setIsSubscription] = useState(false); // Começa com compra avulsa como padrão

  // Proteção de Rota e Carregamento
  useEffect(() => {
    console.log(`[ProfilePage] useEffect [user, isLoadingAuth, router, openLoginModal] executando. isLoadingAuth: ${isLoadingAuth}, User ID: ${user?.id}`);
    if (!isLoadingAuth && !user) {
      console.log("[ProfilePage] CONTEXTO CARREGADO, SEM USUÁRIO. Redirecionando para / ou abrindo login modal.");
      toast({ title: "Acesso Negado", description: "Você precisa estar logado para ver seu perfil.", variant: "destructive" });
      // Opção 1: Redirecionar para a home
      router.push('/');
      // Opção 2: Abrir modal de login (se a página home não tiver um header que já faz isso)
      // openLoginModal(); // Se preferir abrir o modal em vez de redirecionar
    }
  }, [user, isLoadingAuth, router, openLoginModal]);

  // Atualiza a aba ativa se o parâmetro da URL mudar
  useEffect(() => {
    console.log(`[ProfilePage] useEffect [tabParam, user] executando. tabParam: ${tabParam}, User ID: ${user?.id}`);
    if (tabParam && ["profile", "gallery", "credits"].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam && user) { // Define 'profile' como padrão se logado e sem tab
      console.log("[ProfilePage] Definindo aba padrão 'profile' pois não há tabParam e usuário está logado.");
      setActiveTab("profile");
    }
  }, [tabParam, user]);


  const handleCheckout = async (planName: string) => {
    console.log(`[ProfilePage] handleCheckout para plano: ${planName}, Usuário: ${user?.id}`);
    if (!user) {
      openLoginModal();
      return;
    }
    const priceMapEntry = planPriceIds[planName];
    if (!priceMapEntry) {
      toast({ title: "Erro", description: "Configuração de preço inválida para este plano.", variant: "destructive" });
      return;
    }
    const priceId = isSubscription ? priceMapEntry.subscription : priceMapEntry.oneTime;
    if (!priceId) {
      toast({ title: "Opção Indisponível", description: `Este plano não oferece ${isSubscription ? 'assinatura' : 'compra avulsa'}.`, variant: "destructive" });
      return;
    }
    setLoadingPriceId(priceId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Erro no Pagamento", description: data.error || "Não foi possível iniciar.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de Rede", description: "Não foi possível conectar.", variant: "destructive" });
    } finally {
      setLoadingPriceId(null);
    }
  };

  const generateDiscountCode = async () => { setIsGeneratingCode(true); await new Promise(r => setTimeout(r, 1000)); setDiscountCode(`NOVO${Math.floor(Math.random()*1000)}`); setIsGeneratingCode(false); toast({title:"Código Gerado!"});};
  const copyDiscountCode = () => { if(discountCode) {navigator.clipboard.writeText(discountCode); toast({title:"Copiado!"})}};

  const DiscountCodeSection = () => (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-800/50">
      <CardHeader> <CardTitle>Código de Indicação</CardTitle> <CardDescription className="text-gray-400">Compartilhe e ganhe bônus!</CardDescription> </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-300">Seu código: <strong className="text-purple-400">{user?.user_metadata?.referral_code || "N/A"}</strong></p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={user?.user_metadata?.referral_code || "N/A"} readOnly className="bg-gray-800/50 border-gray-700/50 text-white font-mono flex-grow" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => user?.user_metadata?.referral_code && copyDiscountCode()} disabled={!user?.user_metadata?.referral_code}><Copy className="h-4 w-4 mr-2" />Copiar</Button>
            </div>
          </div>
          {/* <Button onClick={generateDiscountCode} disabled={isGeneratingCode || !user} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
            {isGeneratingCode ? (<><Loader2 className="animate-spin mr-2 h-4 w-4" />Gerando...</>) : (<><Zap className="mr-2 h-4 w-4" />{user?.user_metadata?.referral_code ? "Gerar Novo" : "Obter Código"}</>)}
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoadingAuth) { // Mostra loader APENAS se isLoadingAuth for true
    console.log(`[ProfilePage] Exibindo loader principal (isLoadingAuth é true).`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    // Este bloco será alcançado se isLoadingAuth for false mas user for null.
    // O useEffect acima já deve ter iniciado o redirecionamento.
    // Este é um fallback para evitar renderizar a UI do perfil para um usuário nulo.
    console.log(`[ProfilePage] isLoadingAuth é false, mas não há usuário. Redirecionamento deve ocorrer.`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white flex items-center justify-center">
        <p>Redirecionando...</p> {/* Ou um loader menor aqui */}
      </div>
    );
  }

  // Se chegou aqui, isLoadingAuth é false E user existe.
  console.log(`[ProfilePage] Renderizando conteúdo completo do perfil para usuário: ${user.id}`);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" /> <span>Voltar</span>
            </Link>
          </div>
          <div className="flex items-center gap-4 h-9">
            <DynamicBadge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 min-w-[100px] h-full text-center flex items-center justify-center">
              {`${credits ?? 0} créditos`}
            </DynamicBadge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
          <Tabs value={activeTab} onValueChange={(value) => router.push(`/profile?tab=${value}`)} className="space-y-6">
            <TabsList className="bg-gray-900/50 border border-gray-800/50">
              <TabsTrigger value="profile" className="data-[state=active]:bg-purple-900/30"> <User className="h-4 w-4 mr-2" /> Perfil </TabsTrigger>
              <TabsTrigger value="gallery" className="data-[state=active]:bg-purple-900/30"> <ImageIcon className="h-4 w-4 mr-2" /> Galeria </TabsTrigger>
              <TabsTrigger value="credits" className="data-[state=active]:bg-purple-900/30"> <CreditCard className="h-4 w-4 mr-2" /> Créditos </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {user && <DynamicProfileForm user={user} />}
              <DiscountCodeSection />
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader> <CardTitle>Minhas Imagens</CardTitle> <CardDescription>Suas obras de arte geradas.</CardDescription> </CardHeader>
                <CardContent>
                  {user && <DynamicImageGallery userId={user.id} />}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                 <span className={cn("text-sm font-medium transition-colors", !isSubscription ? "text-white" : "text-gray-400")}> Compra Única </span>
                 <Switch id="subscription-toggle" checked={isSubscription} onCheckedChange={setIsSubscription} className="data-[state=checked]:bg-purple-600" />
                 <span className={cn("text-sm font-medium transition-colors flex items-center gap-1", isSubscription ? "text-white" : "text-gray-400")}> Assinatura <Badge className="ml-1 bg-purple-600 text-white text-xs">Economize</Badge> </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {pricingPlans.map((plan, index) => {
                  const displayData = isSubscription ? plan.subscription : plan.oneTime;
                  const priceMapEntry = planPriceIds[plan.name];
                  const checkoutPriceId = isSubscription ? priceMapEntry?.subscription : priceMapEntry?.oneTime;

                  if (!displayData || !checkoutPriceId) return null; // Não renderiza se não há dados para o modo ou priceId

                  return (
                    <motion.div key={plan.id + (isSubscription ? '-sub' : '-one')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }} className={cn("relative rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm overflow-hidden flex flex-col", plan.popular ? "shadow-xl shadow-purple-900/20 ring-2 ring-purple-600" : "hover:border-gray-700")}>
                      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", plan.bgGradient)}></div>
                      {plan.popular && ( <div className="absolute top-0 right-0"><div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold py-1 px-3 rounded-bl-lg"> MAIS POPULAR </div></div> )}
                      <div className="p-6 relative z-10 flex flex-col flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={cn("p-2 rounded-lg bg-gradient-to-br", plan.gradient)}>{plan.icon}</div>
                          <div> <h3 className="text-xl font-bold">{plan.name}</h3> <p className="text-sm text-gray-400">{plan.description}</p> </div>
                        </div>
                        <div className="mb-6">
                          <div className="flex items-end gap-1"> <span className="text-3xl font-bold"> R$ {displayData.price.toFixed(2).replace(".", ",")} </span> <span className="text-gray-400 mb-1 text-sm">{isSubscription ? "/mês" : ""}</span> </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm"> <CreditCard className="h-4 w-4 text-purple-400" /> <span> {displayData.credits} créditos {isSubscription ? "iniciais" : ""} </span> </div>
                            {isSubscription && displayData.renewalCredits && ( <div className="flex items-center gap-2 text-sm"> <RefreshCw className="h-4 w-4 text-purple-400" /> <span>{displayData.renewalCredits} créditos/mês</span> </div> )}
                            {!isSubscription && displayData.credits > 0 && ( <div className="flex items-center gap-2 text-sm text-gray-400"> <Tags className="h-4 w-4" /> <span> R$ {(displayData.price / displayData.credits).toFixed(3).replace(".", ",")} por crédito </span> </div> )}
                          </div>
                        </div>
                        <ul className="space-y-2 mb-8 text-sm"> {plan.features.map((feature, i) => ( <li key={i} className="flex items-start gap-2"> <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> <span className="text-gray-300">{feature}</span> </li> ))} </ul>
                        <div className="mt-auto">
                          <Button className={cn("w-full font-semibold bg-gradient-to-r text-white hover:opacity-90", plan.gradient)} onClick={() => handleCheckout(plan.name)} disabled={loadingPriceId === checkoutPriceId}>
                            {loadingPriceId === checkoutPriceId ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguarde... </> ) : ( isSubscription ? "Assinar Agora" : "Comprar Créditos" )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="max-w-3xl mx-auto mt-20"> <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2> <div className="space-y-4"> <details className="bg-gray-800/50 p-4 rounded-lg"><summary className="font-semibold cursor-pointer hover:text-purple-400">Como os créditos funcionam?</summary><p className="text-sm text-gray-400 mt-2">Cada geração de imagem consome um certo número de créditos. Diferentes modelos ou qualidades podem ter custos variados. Você pode comprar mais créditos a qualquer momento.</p></details> <details className="bg-gray-800/50 p-4 rounded-lg"><summary className="font-semibold cursor-pointer hover:text-purple-400">Posso cancelar minha assinatura?</summary><p className="text-sm text-gray-400 mt-2">Sim, você pode cancelar sua assinatura a qualquer momento através do painel de gerenciamento de pagamentos do Stripe. Seu acesso continuará até o fim do período de faturamento atual.</p></details> </div> </div>
              <div className="max-w-3xl mx-auto mt-12 text-center"> <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 md:p-8"> <h2 className="text-xl md:text-2xl font-bold mb-3">Precisa de um Plano Maior?</h2> <p className="text-gray-300 mb-6 max-w-xl mx-auto"> Para planos empresariais, uso intensivo ou funcionalidades personalizadas, entre em contato conosco.</p> <div className="flex items-center justify-center gap-2 text-blue-300"> <Mail className="h-5 w-5" /> <a href="mailto:contato@seusite.com" className="hover:underline"> contato@seusite.com </a> </div> </div> </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}