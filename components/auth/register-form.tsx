"use client"

import * as React from 'react';
// Importa o hook useFormStatus para verificar o estado de envio do formulário
import { useFormStatus } from 'react-dom';
// Importa o hook useSearchParams para ler parâmetros da URL (para mensagens de erro/sucesso)
import { useSearchParams } from 'next/navigation';
import { Loader2 } from "lucide-react";

// Importa a Server Action de signup
import { signup } from '@/app/auth/actions';

// Importa componentes da UI (Shadcn)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Usaremos Label simples
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast"; // Para mensagens vindas da URL

// Componente interno para o botão de submit, para poder usar useFormStatus
function SubmitButton() {
  // Obtém o status de pendência do formulário pai
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" aria-disabled={pending} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Criando conta...
        </>
      ) : (
        "Criar conta"
      )}
    </Button>
  );
}

export function RegisterForm() {
  // Hook para ler parâmetros da URL
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const messageType = searchParams.get('type'); // Pega o tipo da mensagem

  // Efeito para mostrar o toast se houver uma mensagem na URL
  React.useEffect(() => {
    if (message) {
      toast({
        key: message, // Adiciona uma chave
        title: messageType === 'error' ? "Erro no Registo" : messageType === 'warning' ? "Aviso" : "Registo",
        description: message,
        variant: messageType === 'error' ? "destructive" : "default",
      });
    }
  }, [message, messageType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registar</CardTitle>
        <CardDescription>Crie uma nova conta para começar</CardDescription>
      </CardHeader>
      <CardContent>
        {/* O formulário agora chama a Server Action signup diretamente */}
        <form action={signup} className="space-y-4" role="form">

          {/* Campo de Email */}
          <div className="space-y-1">
            <Label htmlFor="email-register">Email</Label> {/* ID Único para o label/input */}
            <Input
              id="email-register"
              name="email" // O atributo 'name' é crucial para Server Actions
              type="email"
              placeholder="seu.email@exemplo.com"
              autoComplete="email"
              required // Validação básica HTML
            />
          </div>

          {/* Campo de Senha */}
          <div className="space-y-1">
            <Label htmlFor="password-register">Senha</Label> {/* ID Único */}
            <Input
              id="password-register"
              name="password" // O atributo 'name' é crucial
              type="password"
              placeholder="••••••••"
              autoComplete="new-password" // Importante para registo
              required
              minLength={6} // Validação básica HTML (Supabase exige mínimo 6)
            />
          </div>

           {/* Termos e Condições (Apenas informativo por enquanto) */}
           <div className="pt-2">
             <p className="text-xs text-muted-foreground text-center">
               Ao criar uma conta, você concorda com nossos{' '}
               <Link href="/terms" className="underline hover:text-primary">Termos de Serviço</Link> e{' '}
               <Link href="/privacy" className="underline hover:text-primary">Política de Privacidade</Link>.
             </p>
           </div>


          {/* Botão de Submit que usa useFormStatus */}
          <SubmitButton />

        </form>
      </CardContent>
    </Card>
  );
}
