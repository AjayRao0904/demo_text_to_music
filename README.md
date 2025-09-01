# 🎵 Text to Music Generator

A modern web application that converts text prompts into AI-generated music using advanced machine learning models.

## ✨ Features

- **AI-Powered Music Generation**: Transform text descriptions into unique musical compositions
- **Smart Tag Extraction**: Automatically extracts musical tags (genre, mood, instruments) from your prompts
- **Vocal & Instrumental**: Supports both lyrical songs and instrumental tracks
- **Real-time Playback**: Instant audio playback with enhanced player controls
- **Secure Storage**: Automatic backup to AWS S3 with secure URL handling
- **Rate Limited**: Built-in protection against abuse (5 requests per 5 minutes)

## 🚀 Tech Stack

- **Frontend**: Next.js 15.4.2, React 19, TypeScript, Tailwind CSS
- **AI Models**: OpenAI GPT-3.5-turbo, Replicate ACE-STEP
- **Storage**: AWS S3 for backup, direct Replicate URLs for playback
- **Database**: MongoDB Atlas (optional - system works without it)
- **Security**: HMAC-SHA256 URL hashing, rate limiting

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key
- Replicate API token
- AWS S3 bucket (optional)
- MongoDB Atlas cluster (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DemoUI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys in `.env.local`:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   
   # Replicate Configuration
   REPLICATE_API_TOKEN=your-replicate-token
   
   # AWS S3 (Optional - for backup storage)
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   
   # MongoDB (Optional - for generation history)
   DATABASE_URL=your-mongodb-connection-string
   
   # Security
   URL_HASH_SECRET=your-secure-random-secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 How It Works

1. **Enter a Prompt**: Describe the music you want (e.g., "upbeat electronic dance track")
2. **Optional Lyrics**: Add custom lyrics for vocal tracks
3. **AI Processing**: 
   - OpenAI extracts 6 relevant musical tags from your prompt
   - Replicate's ACE-STEP model generates the audio
4. **Instant Playback**: Stream the generated music directly
5. **Automatic Backup**: Files are automatically stored in S3

## 📋 API Endpoints

- `POST /api/generate-music` - Generate music from text prompt
- `POST /api/extract-tags` - Extract musical tags from text
- `GET /api/generations` - List all generations (if database connected)

## 🔒 Security Features

- Rate limiting (5 requests per 5 minutes per IP)
- Secure URL hashing for audio access
- Environment variable protection
- No sensitive data logging
- CORS protection

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Set Environment Variables in Vercel**
   Add all variables from your `.env.local` file to the Vercel environment variables section.

## 📝 Usage Examples

### Basic Music Generation
```
Prompt: "relaxing jazz piano for studying"
Result: Generates ambient jazz piano music
```

### With Lyrics
```
Prompt: "upbeat pop song about friendship"
Lyrics: "Friends forever, through thick and thin..."
Result: Generates pop song with your custom lyrics
```

## 🛡️ Production Considerations

- All console logs removed for security
- Environment variables properly configured
- Rate limiting implemented
- Error handling without sensitive data exposure
- Secure URL generation for audio access

## 📄 License

This project is for demonstration purposes. Please ensure you comply with the terms of service for OpenAI, Replicate, and other services used.

## 🆘 Support

For issues or questions, please check the console for any error messages and ensure all environment variables are properly configured.

---

**Built with ❤️ using AI-powered music generation technology**
