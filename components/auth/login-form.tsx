"use client"

// Garante que React está importado se usar JSX complexo ou hooks como useEffect
import React, { useEffect } from 'react';
// Importa o hook useFormStatus para verificar o estado de envio do formulário
import { useFormStatus } from 'react-dom';
// Importa o hook useSearchParams para ler parâmetros da URL (para mensagens de erro)
import { useSearchParams } from 'next/navigation';
import { Loader2 } from "lucide-react";

// Importa a Server Action de login
import { login } from '@/app/auth/actions';

// Importa componentes da UI (Shadcn)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

// Componente interno para o botão de submit, para poder usar useFormStatus
function SubmitButton() {
  // Obtém o status de pendência do formulário pai
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" aria-disabled={pending} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Entrando...
        </>
      ) : (
        "Entrar"
      )}
    </Button>
  );
}

export function LoginForm() {
  // Hook para ler parâmetros da URL
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const messageType = searchParams.get('type'); // Pega o tipo da mensagem

  // Efeito para mostrar o toast se houver uma mensagem na URL
  useEffect(() => {
    // Usa o message como chave para re-executar o toast se a mensagem mudar
    // (embora searchParams já faça isso na dependência)
    if (message) {
      toast({
        key: message, // Adiciona uma chave para ajudar o React
        title: messageType === 'error' ? "Erro no Login" : messageType === 'warning' ? "Aviso" : "Informação",
        description: message,
        variant: messageType === 'error' ? "destructive" : "default",
      });
      // Idealmente, limparíamos os searchParams após mostrar o toast,
      // mas isso requer `router.replace` que complica com Server Actions.
    }
  }, [message, messageType]); // Executa quando message ou messageType mudam

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Entre com suas credenciais para acessar sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        {/* O formulário agora chama a Server Action diretamente */}
        {/* Adicionado role="form" para semântica */}
        <form action={login} className="space-y-4" role="form">
          {/* Campo de Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email" // O atributo 'name' é crucial para Server Actions
              type="email"
              placeholder="seu.email@exemplo.com"
              autoComplete="email" // Ajuda o preenchimento automático do navegador
              required // Validação básica HTML
            />
          </div>

          {/* Campo de Senha */}
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password" // O atributo 'name' é crucial
              type="password"
              placeholder="••••••••"
              autoComplete="current-password" // Ajuda o preenchimento automático
              required
              minLength={6} // Validação básica HTML (Supabase exige mínimo 6)
            />
          </div>

          {/* Link de Esqueci a Senha */}
          <div className="flex items-center justify-end">
             <Button variant="link" className="p-0 h-auto text-sm" type="button">
               Esqueceu a senha?
             </Button>
           </div>

          {/* Botão de Submit que usa useFormStatus */}
          <SubmitButton />

        </form>
      </CardContent>
      {/* Footer removido */}
    </Card>
  );
}
