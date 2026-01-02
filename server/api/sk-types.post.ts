import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
    })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { data, error } = await supabase
    .from('ns_sk_type')
    .insert({ name: body.name })
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
