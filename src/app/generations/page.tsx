'use client'

import { useState } from 'react'
import { 
  Music,
  Send,
  Loader2,
  Download,
  Play,
  Pause,
  Volume2,
  Settings,
  Sparkles
} from 'lucide-react'

export default function GenerationsPage() {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    audioUrl?: string
    generationDetails?: any
  }>>([
    {
      role: 'assistant',
      content: 'Welcome to Aalap.ai! I\'m here to help you create amazing music for your brand. What kind of music would you like to generate today?'
    }
  ])
  const [currentInput, setCurrentInput] = useState('')
  const [lyricsInput, setLyricsInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [extractedTags, setExtractedTags] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentInput.trim() || isGenerating) return

    const userMessage = currentInput.trim()
    const userLyrics = lyricsInput.trim()
    setCurrentInput('')
    setLyricsInput('')
    setError('')
    
    // Add user message
    const userMessageContent = userLyrics 
      ? `${userMessage}\n\nLyrics:\n${userLyrics}`
      : userMessage
    setMessages(prev => [...prev, { role: 'user', content: userMessageContent }])
    setIsGenerating(true)

    try {
      // Step 1: Extract tags from the prompt using OpenAI
      const tagResponse = await fetch('/api/extract-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userMessage }),
      })

      let extractedTagsString = ''
      if (tagResponse.ok) {
        const { tags } = await tagResponse.json()
        extractedTagsString = tags
        setExtractedTags(tags)
      } else {
        // Continue without tags
      }

      // Step 2: Generate music using Replicate with extracted tags and lyrics
      const musicResponse = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tags: extractedTagsString,
          lyrics: userLyrics || undefined,
          duration: 20,
          prompt: userMessage
        }),
      })

      if (musicResponse.ok) {
        const result = await musicResponse.json()
        
        // Use the correct field names from the API response
        const audioUrl = result.audioUrl // Direct Replicate URL
        const generationId = result.generationId
        
        // Add assistant response with audio player
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `🎵 Music generated successfully!`,
          audioUrl,
          generationDetails: {
            generationId
          }
        }])
      } else {
        const errorData = await musicResponse.json()
        setError(errorData.error || 'Failed to generate music.')
      }
      
    } catch (error) {
      setError('Failed to generate music. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Music className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Aalap.ai
                </h1>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-muted-foreground">
                <span className="text-sm">•</span>
                <span className="text-sm">Music Generation Studio</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Demo Mode</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Chat Messages */}
          <div className="space-y-6 mb-8">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  
                  {/* Audio Player for Generated Music */}
                  {message.audioUrl && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Music className="h-5 w-5 text-primary" />
                          <span className="text-base font-semibold text-foreground">Generated Music</span>
                        </div>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = message.audioUrl!
                            link.download = `music-${Date.now()}.mp3`
                            link.click()
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span className="text-sm font-medium">Download</span>
                        </button>
                      </div>
                      
                      <div className="bg-background/80 rounded-lg p-6 border border-border/50">
                        <audio 
                          controls 
                          className="w-full h-16"
                          src={message.audioUrl}
                          preload="metadata"
                          style={{
                            filter: 'sepia(20%) saturate(70%) hue-rotate(15deg)'
                          }}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-card border border-border">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Generating music...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="space-y-4">
              {/* Music Prompt Input */}
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label htmlFor="music-prompt" className="block text-sm font-medium text-foreground mb-2">
                    Music Description
                  </label>
                  <div className="relative">
                    <textarea
                      id="music-prompt"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Describe the music you want to create (e.g., 'Create an upbeat commercial jingle for a tech startup')"
                      className="w-full min-h-[80px] max-h-[200px] px-4 py-3 pr-12 bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isGenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                    />
                    
                    <button
                      type="submit"
                      disabled={!currentInput.trim() || isGenerating}
                      className="absolute right-2 bottom-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lyrics Input Section */}
              <div>
                <label htmlFor="lyrics-input" className="block text-sm font-medium text-foreground mb-2">
                  Lyrics (Optional)
                </label>
                <textarea
                  id="lyrics-input"
                  value={lyricsInput}
                  onChange={(e) => setLyricsInput(e.target.value)}
                  placeholder="Enter any lyrics you'd like to include in the music..."
                  className="w-full min-h-[100px] max-h-[250px] px-4 py-3 bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isGenerating}
                />
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </div>
          </form>

          {/* Quick Suggestions */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Quick Suggestions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Create an upbeat electronic jingle for a tech startup",
                "Generate relaxing ambient music with piano and strings",
                "Make energetic rock music with electric guitar and drums",
                "Create a romantic ballad with acoustic guitar and vocals",
                "Generate funky hip-hop beat with synthesizer and bass",
                "Make classical orchestral music for a film scene"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentInput(suggestion)}
                  className="p-3 text-left bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  disabled={isGenerating}
                >
                  <p className="text-sm">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
