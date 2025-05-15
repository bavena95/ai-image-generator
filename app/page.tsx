// app/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  ShoppingBag,
  Utensils,
  Cat,
  ImageIcon,
  Brush,
  Aperture,
  Lightbulb,
  Shapes,
  ChevronRight,
  X,
  ChevronLeft,
  User,
  LogIn,
  LogOut,
  Home,
  Youtube,
  Video,
  Loader2,
  Upload,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeCard } from "@/components/mode-card";
import { ImageCanvas } from "@/components/image-canvas";
import { useRouter } from "next/navigation";
import { AspectRatioSelector, type AspectRatio } from "@/components/aspect-ratio-selector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from './context/AuthContext'; // CONFIRA ESTE CAMINHO! Se context está na raiz: '@/context/AuthContext'
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Tipos ---
type CreativeMode =
  | "general" | "branding" | "photo-effects" | "decoration" | "animals"
  | "food" | "enhance" | "art-style" | "background" | "product" | "thumbnails";

interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
}

// --- Componentes Auxiliares (Modais e Botões) ---
const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl bg-gray-800 p-6 text-white"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">Central de Ajuda</h2>
            <p className="text-sm">Bem-vindo à Central de Ajuda! Aqui você encontrará informações sobre como usar o gerador de imagens, dicas para prompts e soluções para problemas comuns.</p>
            {/* Adicionar mais conteúdo de ajuda aqui */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ClientLogoutButton = () => {
  const { handleLogout: contextLogout, user: authUser } = useAuth();
  const [isLoggingOut, setIsLoggingOutState] = useState(false);

  if (!authUser) return null;

  const performLogout = async () => {
    setIsLoggingOutState(true);
    try {
      await contextLogout();
      toast({ title: "Desconectado", description: "Você foi desconectado com sucesso." });
    } catch (error) {
      toast({ title: "Erro no Logout", description: "Não foi possível desconectar.", variant: "destructive" });
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOutState(false);
    }
  };
  return (
    <Button onClick={performLogout} variant="ghost" size="icon" title="Sair" disabled={isLoggingOut}>
      {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
    </Button>
  );
};

// --- Componente Principal da Página ---
export default function InnovativeImageGenerator() {
  const router = useRouter();
  const {
    user,
    credits,
    isLoading: isLoadingAuth,
    openLoginModal,
    isLoginModalOpen, // Renomeado de isAuthLoginModalOpen para consistência
    closeLoginModal,
    openRegisterModal,
    isRegisterModalOpen, // Renomeado de isAuthRegisterModalOpen
    closeRegisterModal,
    refreshCredits,
  } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"create" | "refine">("create");
  const [creativeMode, setCreativeMode] = useState<CreativeMode>("general");
  const [showModePanel, setShowModePanel] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<string>("1024x1024");
  const [creativityLevel, setCreativityLevel] = useState<number>(70);
  const [detailLevel, setDetailLevel] = useState<number>(80);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Para modo refine e preview da galeria direita
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const [thumbnailText, setThumbnailText] = useState(""); // Adicionado thumbnailText que faltava nos estados

  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const modeCardsRef = useRef<HTMLDivElement>(null);

  const handleGenerateImage = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (activeMode === 'create' && !prompt.trim()) {
      toast({ title: "Prompt Vazio", description: "Por favor, insira uma descrição.", variant: "destructive" });
      return;
    }
    if (activeMode === 'refine' && !selectedImage) {
      toast({ title: "Nenhuma Imagem Selecionada", description: "Selecione uma imagem para refinar.", variant: "destructive" });
      return;
    }
    if (isLoadingAuth || credits === null || credits < 1) {
      setShowCreditAlert(true);
      if (credits !== null && credits < 1) await refreshCredits();
      return;
    }

    setIsGeneratingImage(true);
    setImageUrl(null);
    setGenerationError(null);

    let finalPrompt = prompt;
    if (activeMode === 'create') {
        const basePrompt = prompt;
        const styles = selectedStyles.length > 0 ? `, ${selectedStyles.join(', ')}` : '';
        const thumbText = creativeMode === 'thumbnails' && thumbnailText ? `, com o texto "${thumbnailText}"` : '';
        finalPrompt = `${basePrompt}${styles}${thumbText}`;
    } else if (activeMode === 'refine' && selectedImage) {
        finalPrompt = `Refinar imagem. Modificações: ${prompt || "melhorar qualidade"}`;
    }

    const requestBody: any = { prompt: finalPrompt, aspectRatio, resolution };
     if (activeMode === 'refine' && selectedImage) {
        // requestBody.originalImage = selectedImage; // Lógica para API
        console.warn("Lógica de envio da imagem original para refino não implementada na API /api/generate");
    }
    // Lógica para attachments precisaria ser FormData se enviar arquivos, ou URLs se já estiverem no storage.
    // Por simplicidade, não incluído no JSON body aqui.

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido." }));
        if (response.status === 401) {
          toast({ title: "Não Autorizado", description: "Sessão expirada. Faça login novamente.", variant: "destructive" });
          setGenerationError("Usuário não autenticado.");
          openLoginModal();
        } else if (response.status === 402) {
          setGenerationError("Créditos insuficientes.");
          setShowCreditAlert(true);
          await refreshCredits();
        } else {
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          src: data.imageUrl,
          prompt: finalPrompt,
        };
        setGeneratedImages(prev => [newImage, ...prev].slice(0, 6));
        if (activeMode === 'refine' && selectedImage) {
             setSelectedImage(data.imageUrl);
        }
        toast({ title: "Imagem Gerada!", description: "Sua obra-prima está pronta." });
        await refreshCredits();
      } else {
        throw new Error(data.error || "A resposta da API não continha uma URL de imagem.");
      }
    } catch (err) {
      console.error("Falha ao gerar imagem:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setGenerationError(errorMessage);
      toast({ title: "Falha na Geração", description: errorMessage, variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles].slice(0, 3));
      e.target.value = "";
    }
  };

  const addStyleToPrompt = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleCreativeModeChange = (mode: CreativeMode) => {
    const flashElement = document.createElement("div");
    flashElement.className = "absolute inset-0 bg-white/10 z-50 pointer-events-none";
    document.body.appendChild(flashElement);
    setTimeout(() => {
      flashElement.style.transition = "opacity 500ms ease-out";
      flashElement.style.opacity = "0";
      setTimeout(() => flashElement.remove(), 500);
    }, 50);
    setTimeout(() => {
      setCreativeMode(mode);
      setSelectedStyles([]);
      setShowModePanel(false);
    }, 100);
  };

  const scrollModeCards = (direction: "left" | "right") => {
    if (modeCardsRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 200 : 320;
      modeCardsRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const getPlaceholderText = useCallback(() => {
    switch (creativeMode) {
      case "branding": return "Descreva sua marca, valores, e elementos visuais...";
      case "photo-effects": return "Descreva o efeito desejado para sua foto...";
      case "animals": return "Descreva o animal, pose, ambiente, e estilo...";
      case "food": return "Descreva a comida, apresentação, luz, e mood...";
      case "enhance": return "Descreva como quer melhorar sua imagem...";
      case "art-style": return "Descreva o tema e o estilo artístico...";
      case "background": return "Descreva o fundo que quer criar ou substituir...";
      case "product": return "Descreva seu produto, cenário, e estilo...";
      case "decoration": return "Descreva o estilo interior, mobília, etc...";
      case "thumbnails": return "Descreva sua thumbnail (YouTube, Insta, TikTok)...";
      default: return "Descreva sua imaginação...";
    }
  }, [creativeMode]);

  const getModeStyles = useCallback(() => {
    switch (creativeMode) {
      case "branding": return ["Minimal", "Corporate", "Bold", "Elegant", "Playful", "Modern", "Vintage", "Luxury"];
      case "photo-effects": return ["Cinematic", "Noir", "Vintage", "Glitch", "Double Exposure", "Vaporwave", "HDR", "Tilt-shift"];
      case "animals": return ["Wildlife", "Pet Portrait", "Cartoon", "Realistic", "Fantasy", "Cute", "Action", "Majestic"];
      case "food": return ["Gourmet", "Rustic", "Minimalist", "Dark Mood", "Bright", "Overhead", "Close-up", "Editorial"];
      case "enhance": return ["HD", "Professional", "Dramatic", "Natural", "Vibrant", "Soft", "Sharp", "Balanced"];
      case "art-style": return ["Impressionist", "Cubist", "Pop Art", "Watercolor", "Oil Painting", "Digital Art", "Pixel Art", "Sketch"];
      case "background": return ["Gradient", "Abstract", "Nature", "Urban", "Studio", "Minimalist", "Textured", "Dramatic"];
      case "product": return ["Lifestyle", "Studio", "Minimalist", "Luxury", "Technical", "Contextual", "Floating", "Exploded View"];
      case "decoration": return ["Modern", "Minimalist", "Scandinavian", "Industrial", "Bohemian", "Rustic", "Contemporary", "Traditional"];
      case "thumbnails": return ["YouTube", "TikTok", "Instagram", "Clickbait", "Gaming", "Tutorial", "Reaction", "Vlog"];
      default: return ["Photorealistic", "Abstract", "Cinematic", "Anime", "Watercolor", "Neon", "Vintage", "Surreal"];
    }
  }, [creativeMode]);

  const creativeModes = [
    { id: "general" as CreativeMode, name: "Geral", icon: <Sparkles className="h-5 w-5" />, gradient: "from-purple-600 to-blue-500", description: "Crie qualquer imagem" },
    { id: "branding" as CreativeMode, name: "Branding", icon: <ShoppingBag className="h-5 w-5" />, gradient: "from-pink-500 to-orange-400", description: "Logos e assets" },
    { id: "photo-effects" as CreativeMode, name: "Efeitos Foto", icon: <Aperture className="h-5 w-5" />, gradient: "from-cyan-500 to-blue-500", description: "Aplique efeitos" },
    { id: "thumbnails" as CreativeMode, name: "Thumbnails", icon: <Video className="h-5 w-5" />, gradient: "from-red-500 to-orange-400", description: "Crie thumbnails" },
    { id: "decoration" as CreativeMode, name: "Decoração", icon: <Home className="h-5 w-5" />, gradient: "from-amber-500 to-red-500", description: "Decoração de interiores" },
    { id: "animals" as CreativeMode, name: "Animais", icon: <Cat className="h-5 w-5" />, gradient: "from-green-500 to-emerald-500", description: "Gere animais" },
    { id: "food" as CreativeMode, name: "Comida", icon: <Utensils className="h-5 w-5" />, gradient: "from-yellow-500 to-orange-500", description: "Crie fotos de comida" },
    { id: "enhance" as CreativeMode, name: "Melhorar", icon: <Wand2 className="h-5 w-5" />, gradient: "from-violet-600 to-indigo-600", description: "Melhore a qualidade" },
    { id: "art-style" as CreativeMode, name: "Estilo Arte", icon: <Brush className="h-5 w-5" />, gradient: "from-rose-500 to-purple-500", description: "Aplique estilos" },
    { id: "background" as CreativeMode, name: "Fundo", icon: <ImageIcon className="h-5 w-5" />, gradient: "from-blue-500 to-teal-400", description: "Crie/troque fundos" },
    { id: "product" as CreativeMode, name: "Produto", icon: <Shapes className="h-5 w-5" />, gradient: "from-amber-500 to-pink-500", description: "Mockups de produto" },
];

  // --- JSX ---
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white overflow-hidden">
      <ImageCanvas activeMode={creativeMode} width={1920} height={1080} />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-500 opacity-5 blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-violet-600 opacity-5 blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-3 md:px-4 py-4 md:py-8 min-h-screen flex flex-col">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
              Neuromancer
            </h1>
          </div>
          <div className="flex space-x-3 md:space-x-6">
            <button
              onClick={() => setActiveMode("create")}
              className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-full text-sm font-medium transition-all duration-300", activeMode === "create" ? "bg-purple-900/40 text-purple-300 shadow-lg shadow-purple-900/20" : "text-gray-400 hover:text-white")}
            >Create</button>
            <button
              onClick={() => setActiveMode("refine")}
              className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-full text-sm font-medium transition-all duration-300", activeMode === "refine" ? "bg-purple-900/40 text-purple-300 shadow-lg shadow-purple-900/20" : "text-gray-400 hover:text-white")}
            >Refine</button>
          </div>
          <div className="flex items-center space-x-3">
            {isLoadingAuth ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-400">
                  <span className="text-purple-400 font-medium">{credits ?? 0}</span> créditos
                </div>
                <ClientLogoutButton />
                <Button variant="ghost" size="icon" onClick={() => router.push('/profile')} title="Perfil"><User className="h-5 w-5" /></Button>
              </div>
            ) : (
              <Button onClick={openLoginModal} className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 transition-colors">
                <LogIn className="h-4 w-4" /> <span>Entrar</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowHelpModal(true)} title="Ajuda"><Lightbulb className="h-5 w-5" /></Button>
            <button onClick={() => setShowModePanel(!showModePanel)} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors hidden md:block" title="Modos Criativos Painel">
              <Shapes className="h-5 w-5" />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {showModePanel && (
             <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute top-20 md:top-24 left-2 md:left-4 z-50 w-56 md:w-64 bg-gray-900/90 backdrop-blur-lg rounded-2xl border border-gray-800/50 shadow-xl shadow-purple-900/10 overflow-hidden"> <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-800/50"> <h3 className="font-medium text-sm md:text-base text-gray-200">Modos Criativos</h3> <button onClick={() => setShowModePanel(false)} className="text-gray-400 hover:text-white"> <X className="h-4 w-4" /> </button> </div> <div className="p-2 max-h-[60vh] md:max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"> {creativeModes.map((mode) => ( <button key={mode.id} onClick={() => handleCreativeModeChange(mode.id as CreativeMode)} className={cn( "w-full flex items-center space-x-3 p-2 md:p-3 rounded-xl transition-all duration-200", creativeMode === mode.id ? "bg-purple-900/30 text-purple-200" : "hover:bg-gray-800/50 text-gray-300", )}> <div className={cn( "p-1.5 md:p-2 rounded-lg", creativeMode === mode.id ? "bg-purple-800/30" : "bg-gray-800/50", )}> {mode.icon} </div> <span className="text-sm md:text-base">{mode.name}</span> {creativeMode === mode.id && <ChevronRight className="h-4 w-4 ml-auto text-purple-400" />} </button> ))} </div> </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col mt-2">
          {activeMode === "create" && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-xl font-bold mb-4 text-center md:text-left">Modos Criativos</h2>
              <div className="relative">
                <div className="absolute -left-2 md:-left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <motion.button onClick={() => scrollModeCards("left")} className="p-1.5 md:p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </motion.button>
                </div>
                <motion.div ref={modeCardsRef} className="flex space-x-2 md:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth px-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, staggerChildren: 0.1 }}>
                  {creativeModes.map((mode, index) => (
                    <motion.div key={mode.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="preserve-3d flex-shrink-0 w-40 md:w-48 h-40 md:h-60">
                      <ModeCard name={mode.name} description={mode.description} icon={mode.icon} gradient={mode.gradient} isActive={creativeMode === mode.id} onClick={() => handleCreativeModeChange(mode.id)} />
                    </motion.div>
                  ))}
                </motion.div>
                <div className="absolute -right-2 md:-right-4 top-1/2 transform -translate-y-1/2 z-10">
                  <motion.button onClick={() => scrollModeCards("right")} className="p-1.5 md:p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {activeMode === "refine" && (
                <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 mb-6">
                  <h2 className="text-xl font-bold mb-4">Imagem Selecionada para Refinamento</h2>
                  {selectedImage ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-full max-w-md mx-auto">
                        <img src={selectedImage} alt="Imagem para refinar" className="w-full rounded-lg shadow-lg object-contain max-h-[300px] md:max-h-[400px]" />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-gray-300 text-sm mb-2">Descreva como você quer refinar esta imagem no prompt abaixo.</p>
                        {/* Adicionar botões "Enhance Quality" e "Change Style" aqui se necessário */}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg mb-2">Nenhuma imagem selecionada</p>
                      <p className="text-sm text-center max-w-md mb-4">Selecione uma imagem da galeria à direita para refinar.</p>
                      <Button variant="outline" size="sm" className="text-purple-400 border-purple-500/30 hover:bg-purple-900/20" onClick={() => setActiveMode("create")}>
                        <Sparkles className="h-4 w-4 mr-2" />Criar nova imagem
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4">
                <Textarea ref={promptInputRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeMode === "refine" ? "Descreva como refinar esta imagem..." : getPlaceholderText()} className="w-full bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 resize-none min-h-[100px] md:min-h-[120px] rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500" rows={activeMode === "refine" ? 3 : 4} />
                <div className="mt-3 space-y-3">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Upload className="h-4 w-4 mr-2 text-purple-400" />
                        <span className="text-sm font-medium">Imagens de referência</span>
                      </div>
                      <div className="text-xs text-gray-400">{attachments.length}/3 imagens</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-700">
                          <img src={URL.createObjectURL(file)} alt={`Referência ${index + 1}`} className="w-full h-full object-cover" />
                          <button onClick={() => setAttachments(attachments.filter((_, i) => i !== index))} className="absolute top-0.5 right-0.5 bg-black/60 p-0.5 rounded-full"><X className="h-3 w-3 text-white" /></button>
                        </div>
                      ))}
                      {attachments.length < 3 && (
                        <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-md cursor-pointer hover:border-gray-600 hover:bg-gray-800/70 transition-colors">
                          <Plus className="h-5 w-5 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Adicionar</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={attachments.length >= 3} />
                        </label>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Faça upload de até 3 imagens de referência (opcional).</div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-base px-6 py-3" onClick={handleGenerateImage} disabled={isGeneratingImage || (activeMode === 'create' && !prompt.trim()) || (activeMode === 'refine' && !selectedImage && !prompt.trim()) || isLoadingAuth || credits === null || credits < 1}>
                      {isGeneratingImage ? (<><Loader2 className="animate-spin mr-2 h-4 w-4" />Gerando...</>) : (<><Sparkles className="mr-2 h-4 w-4" />{activeMode === "refine" ? "Refinar Imagem" : "Gerar Imagem"}</>)}
                    </Button>
                  </div>
                </div>
              </div>

              {activeMode === "create" && (
                <>
                  <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4">
                    <h3 className="text-base font-medium mb-3">Modificadores de Estilo</h3>
                    <div className="flex flex-wrap gap-2">
                      {getModeStyles().map((style) => (
                        <button key={style} onClick={() => addStyleToPrompt(style)} className={cn("px-3 py-1.5 text-sm rounded-full transition-all duration-200", selectedStyles.includes(style) ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50")}>
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4">
                      <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} mode={creativeMode}  compact={false} />
                       {creativeMode === "thumbnails" && (
                        <div className="space-y-3 pt-4">
                          <label htmlFor="thumbnail-text" className="text-sm text-gray-300">Texto da Thumbnail</label>
                          <input id="thumbnail-text" type="text" value={thumbnailText} onChange={(e) => setThumbnailText(e.target.value)} placeholder="Adicione texto..." className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4">
                      <h3 className="text-base font-medium mb-3">Resolução da Imagem</h3>
                      <div className="space-y-3">
                        <div>                        
                          <select id="resolution-select" value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg p-2 text-sm text-gray-200 focus:ring-purple-500 focus:border-purple-500">
                            <option value="512x512">512x512 (Rápido)</option>
                            <option value="1024x1024">1024x1024 (Padrão)</option>
                            <option value="1792x1024">1792x1024 (Largo)</option>
                            <option value="1024x1792">1024x1792 (Alto)</option>
                          </select>
                        </div>
                        {/* Adicionar Sliders para Creativity e Detail aqui */}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 h-full sticky top-24">
                <h3 className="text-base font-medium mb-3">Imagens Geradas Recentemente</h3>
                {generatedImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[calc(100vh-15rem)]"> {/* Ajustado max-h */}
                    {generatedImages.map((image) => (
                      <div key={image.id} className={cn("relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 group", selectedImage === image.src ? "ring-2 ring-purple-500 shadow-lg shadow-purple-700/50" : "ring-1 ring-gray-700")} onClick={() => setSelectedImage(image.src)}>
                        <img src={image.src} alt={image.prompt || `Generated ${image.id}`} className="w-full aspect-square object-cover" />
                         <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                            <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedImage(image.src); setActiveMode("refine"); setPrompt(`Refinar: ${image.prompt.substring(0,50)}...`); promptInputRef.current?.focus(); }}>Refinar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Suas imagens aparecerão aqui.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

        <AnimatePresence>
          {isLoginModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="relative w-full max-w-md rounded-2xl bg-gray-900/95 backdrop-blur-lg border border-gray-800/50 shadow-xl shadow-purple-900/10 p-6">
                <button onClick={closeLoginModal} className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"> <X className="h-4 w-4" /> </button>
                <LoginForm />
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm">Ainda não tem uma conta?{" "}
                    <button onClick={() => { closeLoginModal(); openRegisterModal(); }} className="text-purple-400 hover:text-purple-300 font-medium">Registre-se</button>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isRegisterModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="relative w-full max-w-md rounded-2xl bg-gray-900/95 backdrop-blur-lg border border-gray-800/50 shadow-xl shadow-purple-900/10 p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={closeRegisterModal} className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"> <X className="h-4 w-4" /> </button>
                <RegisterForm />
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm">Já tem uma conta?{" "}
                    <button onClick={() => { closeRegisterModal(); openLoginModal(); }} className="text-purple-400 hover:text-purple-300 font-medium">Entre aqui</button>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AlertDialog open={showCreditAlert} onOpenChange={setShowCreditAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Créditos insuficientes</AlertDialogTitle>
              <AlertDialogDescription>
                Você não tem créditos suficientes para gerar uma imagem. Compre mais créditos para continuar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCreditAlert(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={() => { setShowCreditAlert(false); router.push("/profile?tab=credits");}} className="bg-purple-600 hover:bg-purple-700">
                  Comprar créditos
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AnimatePresence>
          {(isGeneratingImage || imageUrl || generationError) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => !isGeneratingImage && (setImageUrl(null), setGenerationError(null))}>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl p-2 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-2 border-b border-gray-800/50 mb-2">
                  <h3 className="text-lg font-medium text-gray-200">{isGeneratingImage ? "Gerando Imagem..." : generationError ? "Erro na Geração" : "Imagem Gerada"}</h3>
                  <Button variant="ghost" size="icon" onClick={() => !isGeneratingImage && (setImageUrl(null), setGenerationError(null))} className="text-gray-400 hover:text-white" disabled={isGeneratingImage}><X className="h-5 w-5" /></Button>
                </div>
                <div className="flex-grow flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[400px]">
                  {isGeneratingImage ? (
                    <div className="text-center text-muted-foreground p-8"><Loader2 className="h-12 w-12 animate-spin mb-4 mx-auto text-purple-400" /><p>Aguarde, sua obra-prima está a caminho...</p></div>
                  ) : generationError ? (
                    <div className="text-center text-red-400 p-8"><p><strong>Falha na Geração</strong></p><p className="text-sm mt-2">{generationError}</p></div>
                  ) : imageUrl ? (
                    <img src={imageUrl} alt={prompt || "Imagem gerada por IA"} className="rounded-md max-h-[calc(90vh-150px)] object-contain block" onError={() => { setGenerationError("Erro ao carregar a imagem."); setImageUrl(null); toast({ title: "Erro", description: "Não foi possível carregar a imagem.", variant: "destructive" }); }} />
                  ) : null}
                </div>
                {imageUrl && !isGeneratingImage && !generationError && (
                  <div className="p-3 border-t border-gray-800/50 mt-2">
                    <p className="text-white text-sm mb-2 truncate" title={prompt}>{prompt || "Imagem gerada"}</p>
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" asChild><a href={imageUrl} download={`neuromancer_image_${Date.now()}.png`} target="_blank" rel="noopener noreferrer">Download</a></Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div> {/* Fim do container */}
    </div> // Fim do div raiz
  );
}