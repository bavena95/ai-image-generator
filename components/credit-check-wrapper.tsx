"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { LoginModal } from "@/components/auth/login-modal"
import { RegisterModal } from "@/components/auth/register-modal"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CreditCheckWrapperProps {
  children: React.ReactNode
}

export function CreditCheckWrapper({ children }: CreditCheckWrapperProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasCredits, setHasCredits] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loggedIn)

    if (loggedIn) {
      const userCredits = Number.parseInt(localStorage.getItem("userCredits") || "0", 10)
      setCredits(userCredits)
      setHasCredits(userCredits > 0)
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6">
        <Alert className="max-w-md mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>Você precisa estar logado para gerar imagens com nossa IA.</AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={() => setIsLoginModalOpen(true)}>Entrar</Button>
          <Button variant="outline" onClick={() => setIsRegisterModalOpen(true)}>
            Criar conta
          </Button>
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
      </div>
    )
  }

  if (!hasCredits) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6">
        <Alert className="max-w-md mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Créditos insuficientes</AlertTitle>
          <AlertDescription>
            Você não tem créditos suficientes para gerar imagens. Compre mais créditos para continuar.
          </AlertDescription>
        </Alert>

        <Button onClick={() => (window.location.href = "/profile?tab=credits")}>Comprar créditos</Button>
      </div>
    )
  }

  return <>{children}</>
}
