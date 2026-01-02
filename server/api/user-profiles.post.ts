import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.id || !body.full_name || !body.username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id, full_name, and username are required'
    })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { data, error } = await supabase
    .from('ns_user_profile')
    .insert({
      id: body.id,
      full_name: body.full_name,
      username: body.username,
      user_type_id: body.user_type_id ?? null,
      user_status_id: body.user_status_id ?? null
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return data
})
