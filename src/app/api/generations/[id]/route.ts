import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: generationId } = await params

    // Fetch generation with full details
    const generation = await prisma.generation.findFirst({
      where: {
        generationId,
        userId: session.user.id // Ensure user can only access their own generations
      },
      include: {
        request: true,
        response: true,
        files: true,
        errors: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Transform response to match frontend expectations
    const response = {
      generation_id: generation.generationId,
      user_id: generation.userId,
      status: generation.status,
      success: generation.response?.success,
      
      // Request data
      brand: generation.request?.brand,
      persona_description: generation.request?.personaDescription,
      image_relevance_score: generation.request?.imageRelevanceScore,
      
      // Response data
      generated_audio_url: generation.response?.generatedAudioUrl,
      validation_score: generation.response?.validationScore,
      selected_model: generation.response?.selectedModel,
      pipeline_steps: generation.response?.pipelineSteps,
      music_specs: generation.response?.musicSpecs,
      enhanced_prompt: generation.response?.enhancedPrompt,
      
      // Files
      files: generation.files.map(file => ({
        type: file.fileType,
        name: file.fileName,
        size: file.fileSize,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt
      })),
      
      // Errors
      errors: generation.errors.map(error => ({
        message: error.errorMessage,
        details: error.errorDetails,
        code: error.errorCode,
        createdAt: error.createdAt
      })),
      
      // Timestamps
      timestamp: generation.createdAt.toISOString(),
      created_at: generation.createdAt,
      updated_at: generation.updatedAt,
      completed_at: generation.completedAt,
      
      // User info
      user: generation.user,
      
      // Proxy metadata
      proxy_version: generation.response?.proxyVersion || '1.0'
    }

    return NextResponse.json(response)

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 