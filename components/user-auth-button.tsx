"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/auth/login-modal"
import { RegisterModal } from "@/components/auth/register-modal"
import { User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function UserAuthButton() {
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [credits, setCredits] = useState(0)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    // Check if user is logged in from localStorage
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loggedIn)

    if (loggedIn) {
      setCredits(Number.parseInt(localStorage.getItem("userCredits") || "0", 10))
      setUserName(localStorage.getItem("userName") || "Usuário")
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userCredits")
    localStorage.removeItem("userName")
    setIsLoggedIn(false)
    router.refresh()
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
          {credits} créditos
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium">Olá, {userName}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>Meu Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/profile?tab=gallery")}>Minhas Imagens</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/profile?tab=credits")}>Comprar Créditos</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setIsLoginModalOpen(true)}>
          Entrar
        </Button>
        <Button onClick={() => setIsRegisterModalOpen(true)}>Registrar</Button>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenRegister={() => {
          setIsLoginModalOpen(false)
          setIsRegisterModalOpen(true)
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onOpenLogin={() => {
          setIsRegisterModalOpen(false)
          setIsLoginModalOpen(true)
        }}
      />
    </>
  )
}
