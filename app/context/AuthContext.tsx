// app/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { createClient, SupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

console.log("[AuthContext.tsx] Arquivo sendo PARSEADO (Versão com getSession)");

interface AuthContextType {
  isLoading: boolean;
  user: User | null;
  supabase: SupabaseClient;
  credits: number | null;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  isRegisterModalOpen: boolean;
  closeRegisterModal: () => void;
  refreshCredits: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log("--- [AuthProvider] RENDER/MOUNT (Versão com getSession) ---");
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const fetchCredits = useCallback(async (currentUser: User | null) => {
    console.log("[AuthProvider] fetchCredits INICIADO para usuário:", currentUser?.id);
    if (currentUser) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', currentUser.id)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.error("[AuthProvider] Erro ao buscar créditos:", error.message);
          setCredits(0);
        } else if (data) {
          console.log("[AuthProvider] Créditos recebidos:", data.credits);
          setCredits(data.credits);
        } else {
          console.log("[AuthProvider] Perfil não encontrado para créditos, definindo créditos como 0.");
          setCredits(0);
        }
      } catch (e: any) {
        console.error("[AuthProvider] Exceção em fetchCredits:", e.message);
        setCredits(0);
      }
    } else {
      console.log("[AuthProvider] fetchCredits: Nenhum usuário, definindo créditos como null.");
      setCredits(null);
    }
  }, [supabase]);

  useEffect(() => {
    console.log("--- [AuthProvider] useEffect PRINCIPAL (com getSession e onAuthStateChange) EXECUTADO ---");
    setIsLoading(true);

    const initializeSession = async () => {
      try {
        console.log("[AuthProvider] initializeSession: Chamando supabase.auth.getSession()...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[AuthProvider] initializeSession: Erro em getSession():", sessionError.message);
          setUser(null); await fetchCredits(null); return;
        }
        const currentUser = session?.user ?? null;
        console.log("[AuthProvider] initializeSession: Sessão obtida. User ID:", currentUser?.id ?? 'Nenhuma sessão');
        setUser(currentUser);
        await fetchCredits(currentUser);
      } catch (e: any) {
        console.error("[AuthProvider] initializeSession: Exceção:", e.message);
        setUser(null); await fetchCredits(null);
      } finally {
        console.log("[AuthProvider] initializeSession: Bloco finally - Definindo isLoading para false.");
        setIsLoading(false);
      }
    };
    initializeSession();

    console.log("[AuthProvider] Configurando listener onAuthStateChange...");
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] onAuthStateChange: Evento: ${event}, User ID: ${session?.user?.id ?? 'Nenhum'}`);
      // setIsLoading(true); // Pode ser útil para mostrar loading durante transições de auth
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchCredits(currentUser);
      // setIsLoading(false);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') { closeLoginModal(); closeRegisterModal(); }
      if (event === 'SIGNED_OUT') { setCredits(null); }
    });

    return () => {
      console.log("[AuthProvider] Limpando listener onAuthStateChange.");
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, fetchCredits]); // Adicionado fetchCredits como dependência, pois é usado no listener.

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);
  const openRegisterModal = useCallback(() => setIsRegisterModalOpen(true), []);
  const closeRegisterModal = useCallback(() => setIsRegisterModalOpen(false), []);
  const refreshCreditsHandler = useCallback(async () => { if (user) await fetchCredits(user); }, [user, fetchCredits]);
  const handleLogoutHandler = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro no Supabase signOut:", error);
  }, [supabase]);

  const value: AuthContextType = {
    isLoading, user, supabase, credits, isLoginModalOpen, openLoginModal, closeLoginModal,
    isRegisterModalOpen, openRegisterModal, closeRegisterModal, refreshCredits: refreshCreditsHandler, handleLogout: handleLogoutHandler,
  };
  console.log("--- [AuthProvider] ANTES DE RETORNAR Provider. isLoading:", isLoading, "User:", user?.id);
  return (<AuthContext.Provider value={value}>{children}</AuthContext.Provider>);
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Este erro SÓ deve acontecer se useAuth for chamado em um componente
    // que NÃO é descendente de AuthProvider.
    console.error("!!! ERRO CRÍTICO: useAuth foi chamado fora de um AuthProvider !!!");
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};