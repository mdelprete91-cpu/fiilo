import { transcribeAudio } from '@/lib/ai/groq'

export interface TranscribeResult {
  text: string
  language: string | null
  confidence: number | null
}

/**
 * Trascrive un audio WhatsApp (ogg/opus, mp3, m4a, wav) usando Whisper Large V3 Turbo.
 *
 * @param audioBuffer raw bytes dell'audio
 * @param mimeType es. 'audio/ogg; codecs=opus', 'audio/mpeg', 'audio/mp4'
 * @returns testo + lingua ISO + confidence (Groq Whisper non espone confidence per-segment, ritorna null per ora)
 */
export async function transcribeWhatsAppAudio(
  audioBuffer: Buffer,
  mimeType: string | null,
): Promise<TranscribeResult | null> {
  const ext = filenameExtFromMime(mimeType)
  const filename = `audio.${ext}`

  const result = await transcribeAudio(audioBuffer, filename, mimeType)
  if (!result) return null

  return {
    text: result.text,
    language: result.language,
    confidence: null, // Whisper verbose_json non espone score globale
  }
}

function filenameExtFromMime(mimeType: string | null): string {
  if (!mimeType) return 'ogg'
  const lower = mimeType.toLowerCase()
  if (lower.includes('opus') || lower.includes('ogg')) return 'ogg'
  if (lower.includes('mpeg') || lower.includes('mp3')) return 'mp3'
  if (lower.includes('mp4') || lower.includes('m4a')) return 'm4a'
  if (lower.includes('wav')) return 'wav'
  if (lower.includes('webm')) return 'webm'
  return 'ogg'
}
