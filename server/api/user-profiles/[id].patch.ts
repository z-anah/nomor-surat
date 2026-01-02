import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required'
    })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  // If user_type_name or user_status_name is provided, resolve to their IDs
  let user_type_id = body.user_type_id
  let user_status_id = body.user_status_id

  if (body.user_type_name) {
    const { data: type } = await supabase
      .from('ns_user_type')
      .select('id')
      .eq('name', body.user_type_name)
      .single()
    user_type_id = type?.id
  }
  if (body.user_status_name) {
    const { data: status } = await supabase
      .from('ns_user_status')
      .select('id')
      .eq('name', body.user_status_name)
      .single()
    user_status_id = status?.id
  }

  const updateBody: any = {}
  if (body.full_name !== undefined) updateBody.full_name = body.full_name
  if (body.username !== undefined) updateBody.username = body.username
  if (user_type_id !== undefined) updateBody.user_type_id = user_type_id
  if (user_status_id !== undefined) updateBody.user_status_id = user_status_id

  const { data, error } = await supabase
    .from('ns_user_profile')
    .update(updateBody)
    .eq('id', id)
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
