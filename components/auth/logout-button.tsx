// Importa a Server Action de logout
import { logout } from '@/app/auth/actions';
// Importa o componente Button da UI (Shadcn)
import { Button } from '@/components/ui/button';
// Opcional: Importa um ícone para o botão
import { LogOut } from 'lucide-react';

/**
 * Componente LogoutButton
 *
 * Renderiza um formulário com um botão que, ao ser clicado,
 * aciona a Server Action `logout` para desconectar o utilizador.
 */
export function LogoutButton() {
  return (
    // O formulário envolve o botão e aponta para a Server Action 'logout'
    <form action={logout}>
      {/* Botão de submit que aciona a action do formulário */}
      {/* Pode personalizar a aparência (variant, size) conforme necessário */}
      <Button type="submit" variant="outline" size="sm">
         {/* Opcional: Adiciona um ícone ao lado do texto */}
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>

      {/* Alternativa: Botão apenas com ícone (ajuste o 'size' e adicione texto acessível) */}
      {/*
      <Button type="submit" variant="outline" size="icon">
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Sair</span> {}
      </Button>
      */}
    </form>
  );
}
