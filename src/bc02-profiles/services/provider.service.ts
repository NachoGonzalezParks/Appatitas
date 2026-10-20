import { supabase } from '@/lib/supabase'
import type { Database } from '@/shared/types/supabase.types'

export type Provider = Database['public']['Tables']['providers']['Row']
export type ProviderInsert = Database['public']['Tables']['providers']['Insert']

export async function registerProvider(
  input: Omit<ProviderInsert, 'id' | 'created_at' | 'updated_at' | 'rating_avg' | 'verified' | 'onboarding_status'>,
): Promise<{ data: Provider | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('providers')
    .insert({
      ...input,
      onboarding_status: 'pending',
      rating_avg: 0,
      verified: false,
    })
    .select('*')
    .single()
  return { data, error }
}

export async function getProviderByUserId(
  userId: string,
): Promise<{ data: Provider | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return { data, error }
}

export async function getProviderById(
  id: string,
): Promise<{ data: Provider | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { data, error }
}

export async function updateProvider(
  id: string,
  input: Partial<ProviderInsert>,
): Promise<{ data: Provider | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('providers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  return { data, error }
}
