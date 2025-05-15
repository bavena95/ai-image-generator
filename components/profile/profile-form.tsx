// components/profile/profile-form.tsx
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save, Camera } from "lucide-react"; // Usando Camera para avatar
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from '@supabase/supabase-js';
import { createClient, SupabaseClient } from '@/lib/supabase/client'; // Importado SupabaseClient
import { cn } from "@/lib/utils";

// Schema do formulário - mantém os campos desejados na UI
const profileFormSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres").max(100).optional().or(z.literal("")),
  username: z.string().min(3, "Mínimo 3 caracteres").max(50, "Máximo 50 caracteres").regex(/^[a-zA-Z0-9_.-]+$/, "Apenas letras, números, '.', '_', '-'").optional().or(z.literal("")),
  bio: z.string().max(250, "Máximo 250 caracteres").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: User | null;
}

export function ProfileForm({ user: authUser }: ProfileFormProps) {
  const supabase: SupabaseClient = createClient(); // Tipagem explícita
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      username: "",
      bio: "",
      website: "",
    },
  });

  useEffect(() => {
    if (authUser) {
      const uMetaData = authUser.user_metadata;
      setAvatarPreview(uMetaData?.avatar_url || null);

      const fetchAndSetProfileData = async () => {
        // Primeiro, preenche com o que temos do auth.user_metadata
        form.reset({
          full_name: uMetaData?.full_name || "",
          // Supabase Auth usa 'user_name' para o nome de usuário nos metadados em alguns SDKs,
          // ou pode estar em 'username' dependendo de como foi setado.
          username: uMetaData?.user_name || uMetaData?.username || authUser.email?.split('@')[0] || "",
          bio: uMetaData?.bio || "", // Se você armazenar bio em metadata
          website: uMetaData?.website || "", // Se você armazenar website em metadata
        });

        // Tenta buscar da tabela 'profiles' para sobrescrever se houver dados mais específicos
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('username, full_name, website_url, avatar_url') // Removido 'bio' do select de profiles
            .eq('id', authUser.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.warn("Erro ao buscar dados da tabela 'profiles':", error.message);
          }

          if (profileData) {
            form.reset(prev => ({
              ...prev, // Mantém o que já foi setado do metadata
              full_name: profileData.full_name || prev.full_name,
              username: profileData.username || prev.username,
              website: profileData.website_url || prev.website, // Assumindo que a coluna é website_url
            }));
            if (profileData.avatar_url) {
              setAvatarPreview(profileData.avatar_url);
            }
          }
        } catch (e: any) {
          console.warn("Catch ao buscar dados da tabela 'profiles':", e.message);
        }
      };

      fetchAndSetProfileData();
    }
  }, [authUser, supabase, form.reset]); // form.reset como dependência

  async function onSubmit(values: ProfileFormValues) {
    if (!authUser) return;
    setIsSaving(true);

    try {
      // 1. Atualizar user_metadata no Supabase Auth
      const metadataToUpdate: any = {};
      if (values.full_name !== undefined) metadataToUpdate.full_name = values.full_name;
      if (values.username !== undefined) metadataToUpdate.user_name = values.username; // ou 'username'
      if (values.bio !== undefined) metadataToUpdate.bio = values.bio; // Armazenando bio no metadata
      if (values.website !== undefined) metadataToUpdate.website = values.website; // Armazenando website no metadata

      if (Object.keys(metadataToUpdate).length > 0) {
        const { error: userUpdateError } = await supabase.auth.updateUser({
          data: metadataToUpdate
        });
        if (userUpdateError) throw userUpdateError;
      }

      // 2. Atualizar/Inserir na tabela 'profiles'
      // Inclua APENAS as colunas que existem na sua tabela 'profiles'.
      const profileDataToUpsert: any = {
        id: authUser.id,
        updated_at: new Date().toISOString(),
      };
      // Adicione campos à `profileDataToUpsert` SE as colunas existirem em `profiles`
      if (values.username !== undefined) { // Exemplo: se 'username' existe em profiles
         // profileDataToUpsert.username = values.username;
      }
      if (values.full_name !== undefined) { // Exemplo: se 'full_name' existe em profiles
         // profileDataToUpsert.full_name = values.full_name;
      }
      if (values.website !== undefined) {
        // profileDataToUpsert.website = values.website; 
      }// }


      // Só faz o upsert se houver algo além de id e updated_at,
      // ou se você sempre quiser garantir que o registro 'profiles' exista/seja tocado.
      if (Object.keys(profileDataToUpsert).length > 2) {
          const { error: profileUpsertError } = await supabase
            .from('profiles')
            .upsert(profileDataToUpsert)
            .select() // Adicionar .select() para evitar erro de "no primary key" se a linha já existe
            .single(); // Se você espera um único registro
        if (profileUpsertError) throw profileUpsertError;
      }


      toast({ title: "Perfil Atualizado!", description: "Suas informações foram salvas." });
      // O AuthContext deve pegar a mudança no user_metadata automaticamente.
      // Se você atualizou 'profiles' e precisa que o AuthContext reflita (ex: créditos), chame refreshCredits().

    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!authUser) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `${authUser.id}/${fileName}`; // Salva na pasta do usuário no bucket

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Certifique-se que o bucket 'avatars' existe
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = urlData?.publicUrl;
      if (!newAvatarUrl) throw new Error("Não foi possível obter a URL pública do avatar.");

      // Atualizar avatar_url no user_metadata do Supabase Auth (PRIORIDADE)
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      });
      if (userUpdateError) throw userUpdateError;

      // TENTAR atualizar avatar_url na tabela 'profiles' SE A COLUNA EXISTIR
      try {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
          .eq('id', authUser.id)
          .select(); // Adicionar select para evitar erro se a linha não existir e RLS impedir update sem select

        if (profileUpdateError) {
          // Verifica se o erro é "column ... does not exist"
          if (profileUpdateError.message.includes("column") && profileUpdateError.message.includes("does not exist")) {
            console.warn("Coluna 'avatar_url' não existe na tabela 'profiles'. Avatar salvo apenas no Auth user_metadata.");
          } else {
            throw profileUpdateError; // Outro erro ao atualizar 'profiles'
          }
        }
      } catch (profileTableError: any) {
         // Se a tabela profiles não existir ou a coluna avatar_url não existir, isso pode falhar.
         // Se o erro for sobre a coluna não existir, podemos ignorá-lo ou logar.
        if (profileTableError.message.includes("column") && profileTableError.message.includes("does not exist")) {
            console.warn("Coluna 'avatar_url' não existe na tabela 'profiles' (verificado no catch). Avatar salvo apenas no Auth user_metadata.");
        } else {
            console.error("Erro ao tentar atualizar avatar_url na tabela 'profiles':", profileTableError.message);
            // Não relançar o erro aqui necessariamente, pois o avatar já foi salvo no user_metadata
        }
      }

      setAvatarPreview(newAvatarUrl);
      toast({ title: "Avatar Atualizado!", description: "Sua nova foto de perfil foi salva." });

    } catch (error: any) {
      console.error("Erro no upload do avatar:", error);
      toast({ title: "Erro no Upload", description: error.message || "Não foi possível enviar seu avatar.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };


  if (!authUser) {
    return (
      <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader>
        <CardContent><Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-visible">
        <CardHeader className="flex flex-col items-center text-center pt-8 pb-6">
          <div className="relative mb-4">
            <Avatar className="h-28 w-28 md:h-32 md:w-32 border-2 border-purple-500/50 shadow-lg">
              <AvatarImage src={avatarPreview || undefined} alt={form.getValues('full_name') || authUser.email} />
              <AvatarFallback className="text-3xl md:text-4xl bg-gray-700 text-gray-300">
                {(form.getValues('full_name') || authUser.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className={cn(
                "absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4",
                "flex items-center justify-center cursor-pointer rounded-full bg-purple-600 p-2 text-white shadow-md transition hover:bg-purple-700 focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-2 focus-within:ring-offset-gray-800"
              )}
              title="Mudar avatar"
            >
              {isUploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              <input id="avatar-upload" type="file" accept="image/png, image/jpeg, image/webp" className="sr-only" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </label>
          </div>
          <CardTitle className="text-2xl font-semibold">
            {form.watch('full_name') || authUser.user_metadata?.full_name || authUser.email}
          </CardTitle>
          <CardDescription className="text-sm text-gray-400">
            @{form.watch('username') || authUser.user_metadata?.user_name || authUser.user_metadata?.username || authUser.email?.split('@')[0]}
          </CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="full_name" render={({ field }) => ( <FormItem> <FormLabel>Nome Completo</FormLabel> <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField control={form.control} name="username" render={({ field }) => ( <FormItem> <FormLabel>Nome de Usuário</FormLabel> <FormControl><Input placeholder="Seu nome de usuário (único)" {...field} /></FormControl> <FormDescription>Este será seu nome de exibição público.</FormDescription> <FormMessage /> </FormItem>)} />
              <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem> <FormLabel>Bio</FormLabel> <FormControl><Textarea placeholder="Conte um pouco sobre você..." className="resize-none min-h-[100px]" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField control={form.control} name="website" render={({ field }) => ( <FormItem> <FormLabel>Website</FormLabel> <FormControl><Input placeholder="https://seusite.com" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving || isUploadingAvatar} className="bg-purple-600 hover:bg-purple-700">
                {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : (<><Save className="mr-2 h-4 w-4" />Salvar Alterações</>)}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}