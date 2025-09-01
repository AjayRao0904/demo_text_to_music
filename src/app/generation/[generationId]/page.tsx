'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Play, Pause, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Generation {
  id: string
  generationId: string
  status: string
  brand: string
  persona_description: string
  generated_audio_url?: string
  validation_score?: number
  selected_model?: string
  enhanced_prompt?: string
  image_relevance_score?: number
  created_at: string
  completed_at?: string
  ad_image?: {
    url: string
    name: string
    size: number
    mimeType: string
  } | null
  has_audio: boolean
}

export default function GenerationPage() {
  const params = useParams()
  const generationId = params.generationId as string
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchGeneration = async () => {
      try {
        const response = await fetch(`/api/generations/${generationId}/public`)
        if (!response.ok) {
          throw new Error('Generation not found or not available for sharing')
        }
        const data = await response.json()
        setGeneration(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load generation')
      } finally {
        setLoading(false)
      }
    }

    if (generationId) {
      fetchGeneration()
    }
  }, [generationId])

  const toggleAudio = () => {
    if (!generation?.generated_audio_url) return

    if (!audio) {
      const newAudio = new Audio(generation.generated_audio_url)
      newAudio.addEventListener('ended', () => setIsPlaying(false))
      setAudio(newAudio)
      newAudio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        audio.play()
        setIsPlaying(true)
      }
    }
  }

  const downloadAudio = () => {
    if (!generation?.generated_audio_url) return
    
    const link = document.createElement('a')
    link.href = `/api/generations/${generationId}/public/download`
    link.download = `${generation.brand}-music.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading generation...</p>
        </div>
      </div>
    )
  }

  if (error || !generation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Generation Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'The generation you\'re looking for doesn\'t exist or may have been removed.'}
          </p>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Shared Music Generation</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              Public Share
            </span>
          </div>
        </div>

        {/* Generation Card */}
        <div className="glass rounded-xl p-6 border border-border">
          {/* Brand and Persona */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">{generation.brand}</h2>
            <p className="text-muted-foreground">{generation.persona_description}</p>
          </div>

          {/* Status and Metadata */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                generation.status === 'COMPLETED' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {generation.status}
              </span>
            </div>
            {generation.validation_score && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Quality Score:</span>
                <span className="font-medium">{generation.validation_score}</span>
              </div>
            )}
            {generation.selected_model && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">{generation.selected_model}</span>
              </div>
            )}
            {generation.image_relevance_score && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Image Relevance:</span>
                <span className="font-medium">{generation.image_relevance_score}</span>
              </div>
            )}
          </div>

          {/* Reference Image */}
          {generation.ad_image && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Reference Image</h3>
              <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={generation.ad_image.url}
                      alt="Reference image for music generation"
                      className="w-full md:w-48 h-48 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Filename:</span>
                      <span className="font-medium">{generation.ad_image.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Type:</span>
                      <span className="font-medium">{generation.ad_image.mimeType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Size:</span>
                      <span className="font-medium">{(generation.ad_image.size / 1024).toFixed(1)} KB</span>
                    </div>
                    {generation.image_relevance_score && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Relevance Score:</span>
                        <span className="font-medium">{generation.image_relevance_score}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Prompt */}
          {generation.enhanced_prompt && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Enhanced Prompt</h3>
              <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {generation.enhanced_prompt}
                </p>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {generation.generated_audio_url && generation.status === 'COMPLETED' && (
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAudio}
                    className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div>
                    <p className="font-medium text-foreground">Generated Music</p>
                    <p className="text-sm text-muted-foreground">Ready to play</p>
                  </div>
                </div>
                <button
                  onClick={downloadAudio}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Creation Date */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground">
              <p>
                Created on {new Date(generation.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {generation.completed_at && (
                <p>
                  Completed on {new Date(generation.completed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 