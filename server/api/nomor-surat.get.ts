import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { data, error } = await supabase
    .from('ns_nomor_surat')
    .select(`
      *,
      ns_fungsi_type (fungsi_name),
      ns_sk_type (name),
      ns_user_profile (full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  // Transform data to flatten related fields
  const transformed = data?.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    title: item.title,
    file: item.file,
    generated_nomor_surat: item.generated_nomor_surat,
    fungsi_type_id: item.fungsi_type_id,
    sk_type_id: item.sk_type_id,
    created_at: item.created_at,
    fungsi_name: item.ns_fungsi_type?.fungsi_name || null,
    sk_type_name: item.ns_sk_type?.name || null,
    user_name: item.ns_user_profile?.full_name || null
  }))

  return transformed
})
