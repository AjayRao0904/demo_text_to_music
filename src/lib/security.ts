import crypto from 'crypto'

const HASH_SECRET = process.env.URL_HASH_SECRET || 'fallback-secret-key-change-in-production'

export function hashUrl(url: string, generationId: string): string {
  // Create a hash of the URL with generationId as salt
  const hash = crypto.createHmac('sha256', HASH_SECRET)
    .update(`${url}:${generationId}`)
    .digest('hex')
  
  return hash.substring(0, 32) // Use first 32 characters
}

export function createSecureAudioUrl(generationId: string, hash: string): string {
  return `/api/audio/${generationId}/${hash}`
}

export function verifyUrlHash(url: string, generationId: string, providedHash: string): boolean {
  const expectedHash = hashUrl(url, generationId)
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(providedHash, 'hex')
  )
}

export function generateSecureId(): string {
  // Generate MongoDB-compatible ObjectID (24 hex characters = 12 bytes)
  return crypto.randomBytes(12).toString('hex')
}

// Rate limiting storage (in-memory for simplicity - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  return true
}
