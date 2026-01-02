import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.fungsi_name || !body.fungsi_code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Fungsi name and code are required'
    })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { data, error } = await supabase
    .from('ns_fungsi_type')
    .insert({ fungsi_name: body.fungsi_name, fungsi_code: body.fungsi_code })
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
