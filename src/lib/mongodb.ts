import { MongoClient, Db, Collection, ObjectId } from 'mongodb'

let client: MongoClient
let db: Db

export async function connectToDatabase() {
  if (!client) {
    try {
      client = new MongoClient(process.env.DATABASE_URL!, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      })
      await client.connect()
      db = client.db('texttomusic')
      // Silent success
    } catch (error) {
      // Silent error - system works without DB
      throw error
    }
  }
  return { client, db }
}

export async function getGenerationsCollection(): Promise<Collection> {
  try {
    const { db } = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    return db.collection('generations')
  } catch (error) {
    // Silent error - system works without DB
    throw error
  }
}

export { ObjectId }
