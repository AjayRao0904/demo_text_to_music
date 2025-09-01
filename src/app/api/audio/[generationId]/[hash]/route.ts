import { NextRequest, NextResponse } from 'next/server'
import { getGenerationsCollection } from '@/lib/mongodb'
import { verifyUrlHash, checkRateLimit } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string; hash: string }> }
) {
  try {
    const { generationId, hash } = await params
    
    // Rate limiting by IP
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`audio_${clientIp}`, 20, 60000)) { // 20 requests per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    
    // Find the generation in database
    const generationsCollection = await getGenerationsCollection()
    const generation = await generationsCollection.findOne({ generationId: generationId })
    
    if (!generation || generation.status !== 'COMPLETED' || !generation.replicateUrl) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
    }
    
    // Verify the hash against the Replicate URL
    const isValidHash = verifyUrlHash(generation.replicateUrl, generationId, hash)
    
    if (!isValidHash) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 403 })
    }
    
    // Fetch the audio file from Replicate and proxy it
    const audioResponse = await fetch(generation.replicateUrl)
    
    if (!audioResponse.ok) {
      return NextResponse.json({ error: 'Audio file not accessible' }, { status: 404 })
    }
    
    // Get the audio blob
    const audioBlob = await audioResponse.blob()
    
    // Return the audio with proper headers
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBlob.size.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Accept-Ranges': 'bytes',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
