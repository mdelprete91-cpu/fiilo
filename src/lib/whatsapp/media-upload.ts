// Wrapper sopra Meta `/media`. Carica un'immagine pubblica (es. URL Supabase
// Storage) e ritorna un `media_id` riusabile per ~30 giorni.

import { uploadMedia } from './meta-client'

export interface UploadFabricImageInput {
  token: string
  phoneNumberId: string
  imageUrl: string
  mimeType?: string
}

export async function uploadFabricImage(
  input: UploadFabricImageInput,
): Promise<string> {
  const res = await uploadMedia({
    token: input.token,
    phoneNumberId: input.phoneNumberId,
    mediaUrl: input.imageUrl,
    mimeType: input.mimeType,
  })
  return res.id
}
