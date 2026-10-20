import { supabase } from '@/lib/supabase'

const MAX_PHOTOS = 10

// Sube una foto a Storage y agrega su URL al array gallery_urls del proveedor (RN-018).
export async function uploadGalleryPhoto(
  providerId: string,
  file: File,
  currentCount: number,
): Promise<{ url: string | null; error: Error | null }> {
  if (currentCount >= MAX_PHOTOS) {
    return { url: null, error: new Error(`Límite de ${MAX_PHOTOS} fotos alcanzado`) }
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${providerId}/gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('providers')
    .upload(path, file, { contentType: file.type })
  if (uploadError) return { url: null, error: uploadError }

  const { data } = supabase.storage.from('providers').getPublicUrl(path)
  const url = data.publicUrl

  const { error: updateError } = await supabase.rpc('append_gallery_url' as never, {
    p_provider_id: providerId,
    p_url: url,
  } as never)

  if (updateError) {
    // Fallback: UPDATE directo si la RPC no existe aún
    const { data: provider } = await supabase
      .from('providers')
      .select('gallery_urls')
      .eq('id', providerId)
      .single()
    const urls = [...(provider?.gallery_urls ?? []), url]
    const { error: fallbackError } = await supabase
      .from('providers')
      .update({ gallery_urls: urls, updated_at: new Date().toISOString() })
      .eq('id', providerId)
    if (fallbackError) return { url: null, error: fallbackError }
  }

  return { url, error: null }
}

// Elimina una foto de Storage y la remueve del array gallery_urls.
export async function deleteGalleryPhoto(
  providerId: string,
  url: string,
  currentUrls: string[],
): Promise<{ error: Error | null }> {
  // Extraer el path relativo de la URL pública.
  const path = url.split('/providers/')[1]
  if (path) {
    await supabase.storage.from('providers').remove([path])
  }

  const updatedUrls = currentUrls.filter((u) => u !== url)
  const { error } = await supabase
    .from('providers')
    .update({ gallery_urls: updatedUrls, updated_at: new Date().toISOString() })
    .eq('id', providerId)
  return { error }
}

// Guarda el orden nuevo de las fotos (drag & drop).
export async function reorderGallery(
  providerId: string,
  orderedUrls: string[],
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('providers')
    .update({ gallery_urls: orderedUrls, updated_at: new Date().toISOString() })
    .eq('id', providerId)
  return { error }
}
