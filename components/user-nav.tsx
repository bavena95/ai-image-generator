"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

export function UserNav() {
  const router = useRouter()
  const [userName, setUserName] = useState("Usuário")
  const [userEmail, setUserEmail] = useState("usuario@exemplo.com")

  useEffect(() => {
    // Get user info from localStorage
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setUserName(storedName)
    }
  }, [])

  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userCredits")
    localStorage.removeItem("userName")
    
    toast({
      title: "Desconectado",
      description: "Você foi desconectado com sucesso.",
    })
    
    router.push("/studio")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/mystical-forest-spirit.png" alt="User avatar" />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground"\
