import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  // Join user_type and user_status tables to get names in one query
  const { data, error } = await supabase
    .from('ns_user_profile')
    .select(`
      id,
      full_name,
      username,
      user_type_id,
      user_status_id,
      created_at,
      ns_user_type (
        name
      ),
      ns_user_status (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  // Map the joined names to flat fields for frontend convenience
  const mapped = (data ?? []).map((row: any) => ({
    ...row,
    user_type_name: row.ns_user_type?.name ?? null,
    user_status_name: row.ns_user_status?.name ?? null
  }))

  return mapped
})
