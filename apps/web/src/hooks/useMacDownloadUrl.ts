import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

const envDownloadUrl = import.meta.env.VITE_MAC_DOWNLOAD_URL?.trim() || ''

/**
 * Resolves the macOS download URL from env (Vercel) or Supabase `app_releases` (latest macOS).
 */
export function useMacDownloadUrl(): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(envDownloadUrl || null)
  const [loading, setLoading] = useState(!envDownloadUrl && isSupabaseConfigured())

  useEffect(() => {
    if (envDownloadUrl) {
      setUrl(envDownloadUrl)
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false

    void (async () => {
      const { data, error } = await supabase
        .from('app_releases')
        .select('download_url')
        .eq('platform', 'macos')
        .eq('is_latest', true)
        .maybeSingle()

      if (cancelled) {
        return
      }

      if (!error && data?.download_url) {
        setUrl(data.download_url)
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { url, loading }
}
