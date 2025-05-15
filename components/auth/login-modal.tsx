"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  rememberMe: z.boolean().optional(),
})

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenRegister: () => void
}

export function LoginModal({ isOpen, onClose, onOpenRegister }: LoginModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // For demo purposes, we'll just close the modal and simulate login
    // In a real app, you would validate credentials with your backend
    if (values.email === "user@example.com" && values.password === "password123") {
      // Simulate successful login
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("userCredits", "10")
      onClose()
      router.refresh()
    } else {
      form.setError("email", { message: "Email ou senha inválidos" })
      form.setError("password", { message: "Email ou senha inválidos" })
    }

    setIsLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl bg-gray-900/95 backdrop-blur-lg border border-gray-800/50 shadow-xl shadow-purple-900/10 p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                Bem-vindo de volta
              </h2>
              <p className="text-gray-400 mt-1">Entre para continuar criando imagens incríveis</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu.email@exemplo.com"
                          className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-me"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <label
                          htmlFor="remember-me"
                          className="text-sm font-medium text-gray-300 leading-none cursor-pointer"
                        >
                          Lembrar-me
                        </label>
                      </div>
                    )}
                  />
                  <Button variant="link" className="p-0 h-auto text-sm text-purple-400 hover:text-purple-300">
                    Esqueceu a senha?
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Ainda não tem uma conta?{" "}
                <button
                  onClick={() => {
                    onClose()
                    onOpenRegister()
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Registre-se
                </button>
              </p>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                Credenciais de demonstração: <br />
                <code className="bg-gray-800/50 px-1 py-0.5 rounded">user@example.com / password123</code>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
