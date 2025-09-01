'use client'

import { useState, useEffect } from 'react'
import { 
  History, 
  Music, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Download,
  Image as ImageIcon,
  Headphones,
  Calendar,
  User,
  RefreshCw,
  Plus,
  Menu,
  MoreHorizontal,
  Trash2,
  Star,
  FileMusic,
  RotateCcw,
  Edit3
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface Generation {
  id: string
  generationId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  brand: string
  personaDescription: string
  imageRelevanceScore: number
  hasAdImage: boolean
  hasAudio: boolean
  success?: boolean
  generatedAudioUrl?: string
  validationScore?: number
  selectedModel?: string
  errorMessage?: string
  errorCode?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  chainId?: string
  version?: number
  totalVersions?: number
}

interface GenerationHistoryProps {
  isOpen: boolean
  onToggle: () => void
  onSelectGeneration: (generation: any) => void
  onNewGeneration?: () => void
  onRetryGeneration?: (generation: Generation) => void
  onTweakGeneration?: (generation: Generation) => void
}

export default function GenerationHistory({ 
  isOpen, 
  onToggle, 
  onSelectGeneration,
  onNewGeneration,
  onRetryGeneration,
  onTweakGeneration 
}: GenerationHistoryProps) {
  // Always show as expanded
  const alwaysOpen = true
  const { data: session } = useSession()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    fetchGenerations()
  }, [])

  const fetchGenerations = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      params.append('limit', '50')

      const response = await fetch(`/api/generations?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        // Add version info to generations (simplified approach)
        const generationsWithVersions = data.generations.map((gen: Generation) => ({
          ...gen,
          totalVersions: gen.totalVersions || 1 // Use from API if available, fallback to 1
        }))
        setGenerations(generationsWithVersions)
      } else {
        setError('Failed to fetch generations')
      }
    } catch (err) {
      setError('Error loading generations')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectGeneration = async (generation: Generation) => {
    try {
      // Fetch full generation details
      const response = await fetch(`/api/generations/${generation.generationId}`)
      
      if (response.ok) {
        const fullGeneration = await response.json()
        onSelectGeneration(fullGeneration)
      } else {
        // Failed to fetch generation details
      }
    } catch (err) {
      // Error loading generation details
    }
  }

  const handleNewGeneration = () => {
    if (onNewGeneration) {
      onNewGeneration()
    }
    setError('')
  }

  const handleRetryGeneration = (generation: Generation) => {
    if (onRetryGeneration) {
      onRetryGeneration(generation)
    }
    setError('')
  }

  const handleTweakGeneration = (generation: Generation) => {
    if (onTweakGeneration) {
      onTweakGeneration(generation)
    }
    setError('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'PROCESSING':
        return <Clock className="w-3 h-3 text-yellow-400 animate-spin" />
      case 'FAILED':
        return <AlertCircle className="w-3 h-3 text-red-400" />
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const groupGenerationsByDate = (generations: Generation[]) => {
    const grouped: { [key: string]: Generation[] } = {}
    
    generations.forEach(generation => {
      const date = new Date(generation.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let key: string
      if (date.toDateString() === today.toDateString()) {
        key = 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday'
      } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        key = 'Previous 7 days'
      } else {
        key = 'Older'
      }
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(generation)
    })
    
    return grouped
  }

  const groupedGenerations = groupGenerationsByDate(generations)

  return (
    <>
      {/* Logo - Always Visible */}
      <div className="fixed left-4 top-4 z-50 flex items-center">
        <div className="flex items-center">
          <Image
            src="/aalap_logo.svg"
            alt="Aalap Logo"
            width={isOpen ? 80 : 120}
            height={isOpen ? 24 : 36}
            priority
            className="hover:scale-105 transition-all duration-200"
          />
        </div>
      </div>

      {/* Collapsed Sidebar - Hidden when always open */}
      <div className="hidden">
        <div className="flex flex-col items-center space-y-4 mt-16">
          {/* New Generation Button */}
          <button
            onClick={handleNewGeneration}
            className="w-10 h-10 bg-gradient-to-r from-primary to-warning text-primary-foreground rounded-lg flex items-center justify-center btn-hover-effect transition-all duration-200 hover:scale-105"
            title="New generation"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Toggle History Button */}
          <button
            onClick={onToggle}
            className="w-10 h-10 glass-hover rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            title="Toggle history"
          >
            <History className="w-5 h-5 text-foreground" />
          </button>

          {/* Recent Generations Preview */}
          <div className="flex flex-col space-y-2 mt-4">
            {generations.slice(0, 3).map((generation) => (
              <button
                key={generation.id}
                onClick={() => handleSelectGeneration(generation)}
                className="w-10 h-10 glass-hover rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 relative"
                title={generation.brand}
              >
                {getStatusIcon(generation.status)}
              </button>
            ))}
          </div>
        </div>

        {/* User Avatar */}
        <div className="mt-auto flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {session?.user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Expanded Sidebar - Always Open */}
      <div className="fixed left-0 top-0 h-full w-72 glass border-r border-border z-50">
        <div className="flex flex-col h-full w-72">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            {/* Logo */}
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                <Image
                  src="/aalap_logo.svg"
                  alt="Aalap Logo"
                  width={100}
                  height={30}
                  priority
                  className="hover:scale-105 transition-transform duration-200"
                />
              </div>
            </div>

            {/* New Generation Button */}
            <button
              onClick={handleNewGeneration}
              className="w-full flex items-center justify-center px-4 py-3 mb-4 bg-gradient-to-r from-primary to-warning text-primary-foreground rounded-lg font-medium btn-hover-effect transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              New generation
            </button>

            {/* Generation Summary */}
            <div className="text-xs text-muted-foreground">
              {generations.length > 0 && (
                <>
                  {generations.length} generation{generations.length !== 1 ? 's' : ''}
                  {generations.filter(g => g.status === 'COMPLETED').length > 0 && (
                    <span className="ml-2">
                      • {generations.filter(g => g.status === 'COMPLETED').length} completed
                    </span>
                  )}
                  {generations.filter(g => g.status === 'FAILED').length > 0 && (
                    <span className="ml-2 text-red-400">
                      • {generations.filter(g => g.status === 'FAILED').length} failed
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <button
                  onClick={fetchGenerations}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && generations.length === 0 && (
              <div className="p-6 text-center">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">No generations yet</h3>
                <p className="text-sm text-muted-foreground">Create your first music generation to get started</p>
              </div>
            )}

            {/* Grouped Generations */}
            {!loading && !error && Object.entries(groupedGenerations).map(([group, items]) => (
              <div key={group} className="mb-6">
                <h3 className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group}
                </h3>
                <div className="space-y-1">
                  {items.map((generation) => (
                    <div
                      key={generation.id}
                      onClick={() => handleSelectGeneration(generation)}
                      onMouseEnter={() => setHoveredItem(generation.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className="group mx-2 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-background/30 glass-hover relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            {getStatusIcon(generation.status)}
                            <h4 className="ml-2 text-sm font-medium text-foreground truncate">
                              {generation.brand}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-2">
                            {generation.personaDescription}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {generation.hasAdImage && (
                                <ImageIcon className="w-3 h-3 text-muted-foreground" />
                              )}
                              {generation.hasAudio && (
                                <Headphones className="w-3 h-3 text-muted-foreground" />
                              )}
                              {generation.generatedAudioUrl && (
                                <Music className="w-3 h-3 text-green-400" />
                              )}
                              {generation.totalVersions && generation.totalVersions > 1 && (
                                <span className="text-xs bg-primary/20 text-primary px-1 rounded">
                                  v{generation.version || 1} of {generation.totalVersions}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(generation.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        {/* More Options Button */}
                        {hoveredItem === generation.id && (
                          <button className="ml-2 p-1 rounded hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>

                      {/* Error indicator with retry button */}
                      {generation.status === 'FAILED' && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                          {generation.errorMessage && (
                            <div className="text-xs text-red-400 mb-2">
                              {generation.errorMessage.substring(0, 60)}...
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRetryGeneration(generation)
                            }}
                            className="flex items-center text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Retry with same data
                          </button>
                        </div>
                      )}

                      {/* Success indicator with tweak button */}
                      {generation.status === 'COMPLETED' && generation.success && (
                        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTweakGeneration(generation)
                            }}
                            className="flex items-center text-xs text-green-400 hover:text-green-300 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Tweak this generation
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                  {session?.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.user?.username || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.role || 'USER'}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchGenerations}
                disabled={loading}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
              </div>
      </>
    )
} 