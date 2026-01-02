import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required'
    })
  }
  const supabase = createClient(config.supabaseUrl, config.supabaseKey)
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
    .eq('id', id)
    .single()
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
  return {
    ...data,
    user_type_name: data.ns_user_type?.name ?? null,
    user_status_name: data.ns_user_status?.name ?? null
  }
})
