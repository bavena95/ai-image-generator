// app/auth/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
// Importa o utilitário createClient de lib/supabase/server
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const cookieStore = cookies();
  // Passa o cookieStore explicitamente
  const supabase = createClient(cookieStore);

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    // Redireciona para a página principal com erro
    return redirect('/?message=Email e senha são obrigatórios&type=error');
  }

  console.log("Attempting login for:", email);
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
      console.error('Erro no login:', error);
      if (error.message.includes('Email not confirmed')) {
          // Redireciona para a principal com aviso de verificação
          // Poderia manter o redirect para /login se quisesse mostrar o form novamente
          return redirect(`/?message=Verifique seu email para ativar sua conta.&type=warning`);
      }
      // Redireciona para a principal com erro genérico
      return redirect(`/?message=Falha no login: ${error.message}&type=error`);
  }

  console.log("Login successful for:", email);
  revalidatePath('/', 'layout');
  redirect('/'); // Sucesso -> vai para a página principal
}

export async function signup(formData: FormData) {
  const cookieStore = cookies();
   // Passa o cookieStore explicitamente
   const supabase = createClient(cookieStore);

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

   if (!email || !password) {
    // Redireciona para a principal com erro
    return redirect('/?message=Email e senha são obrigatórios&type=error');
  }
   if (password.length < 6) {
        // Redireciona para a principal com erro
        return redirect('/?message=Senha deve ter no mínimo 6 caracteres&type=error');
   }

  console.log("Attempting signup for:", email);
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Erro no signup:', error);
    if (error.message.includes('User already registered')) {
         // Redireciona para a principal com aviso
         return redirect(`/?message=Este email já está registrado. Tente fazer login.&type=warning`);
    }
    // Redireciona para a principal com erro genérico
    return redirect(`/?message=Falha no registro: ${error.message}&type=error`);
  }

  // Verifica se precisa de confirmação de email
  if (data.user && !data.session) {
       console.log("Signup requires email confirmation for:", email);
       // Redireciona para a principal com mensagem de sucesso/instrução
       return redirect('/?message=Registro quase completo! Verifique seu email para ativar a conta.&type=success');
  } else if (data.user && data.session) {
       console.log("Signup successful and auto-logged in:", email);
       revalidatePath('/', 'layout');
       return redirect('/'); // Sucesso e login automático -> vai para a principal
  } else {
       console.warn("Signup completed but user/session state is unexpected:", data);
        // Redireciona para a principal com info
       return redirect('/?message=Registro concluído. Tente fazer login.&type=info');
  }

}

 export async function logout() {
    const cookieStore = cookies();
     // Passa o cookieStore explicitamente
     const supabase = createClient(cookieStore);

    console.log("Attempting logout...");
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Erro no logout:", error);
    } else {
        console.log("Logout successful.");
    }

    revalidatePath('/', 'layout');
    // Redireciona para a página principal após logout
    redirect('/');
}
