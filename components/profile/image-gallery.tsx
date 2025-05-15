"use client"

import { useState } from "react"
import { Download, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// Imagens de exemplo para a galeria
const sampleImages = [
  {
    id: 1,
    src: "/Chromatic Cascade.png",
    title: "Chromatic Cascade",
    date: "2023-11-15",
    prompt: "Uma cascata de cores vibrantes em estilo abstrato",
  },
  {
    id: 2,
    src: "/neon-cityscape.png",
    title: "Neon Cityscape",
    date: "2023-11-10",
    prompt: "Paisagem urbana futurista com luzes neon",
  },
  {
    id: 3,
    src: "/gleaming-spires.png",
    title: "Gleaming Spires",
    date: "2023-11-05",
    prompt: "Torres brilhantes em um horizonte futurista",
  },
  {
    id: 4,
    src: "/cosmic-bloom.png",
    title: "Cosmic Bloom",
    date: "2023-10-28",
    prompt: "Flor cósmica em um campo de estrelas",
  },
  {
    id: 5,
    src: "/digital-dreamscape.png",
    title: "Digital Dreamscape",
    date: "2023-10-20",
    prompt: "Paisagem onírica digital com elementos surreais",
  },
  {
    id: 6,
    src: "/neural-canvas.png",
    title: "Neural Canvas",
    date: "2023-10-15",
    prompt: "Padrões neurais abstratos em uma tela digital",
  },
]

export function ImageGallery() {
  const [images, setImages] = useState(sampleImages)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const handleDelete = (id: number) => {
    setImages(images.filter((img) => img.id !== id))
    toast({
      title: "Imagem excluída",
      description: "A imagem foi removida da sua galeria.",
    })
    if (selectedImage === id) {
      setSelectedImage(null)
    }
  }

  const handleShare = (id: number) => {
    toast({
      title: "Link copiado",
      description: "Link da imagem copiado para a área de transferência.",
    })
  }

  const handleDownload = (src: string, title: string) => {
    // Em uma aplicação real, isso iniciaria o download da imagem
    toast({
      title: "Download iniciado",
      description: `Baixando ${title}.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className={`overflow-hidden cursor-pointer transition-all ${
              selectedImage === image.id ? "ring-2 ring-purple-500" : ""
            }`}
            onClick={() => setSelectedImage(image.id === selectedImage ? null : image.id)}
          >
            <div className="relative aspect-square">
              <img src={image.src || "/placeholder.svg"} alt={image.title} className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <h3 className="text-white font-medium">{image.title}</h3>
                <p className="text-white/80 text-sm">{image.date}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedImage && (
        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <img
                src={images.find((img) => img.id === selectedImage)?.src || "/placeholder.svg"}
                alt={images.find((img) => img.id === selectedImage)?.title}
                className="rounded-lg w-full object-contain max-h-[400px]"
              />
            </div>
            <div className="md:w-1/2 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{images.find((img) => img.id === selectedImage)?.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Criado em {images.find((img) => img.id === selectedImage)?.date}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Prompt</h3>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {images.find((img) => img.id === selectedImage)?.prompt}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const image = images.find((img) => img.id === selectedImage)
                    if (image) handleDownload(image.src, image.title)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectedImage && handleShare(selectedImage)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => selectedImage && handleDelete(selectedImage)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Você ainda não gerou nenhuma imagem.</p>
          <Button className="mt-4" onClick={() => (window.location.href = "/")}>
            Criar minha primeira imagem
          </Button>
        </div>
      )}
    </div>
  )
}
