import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { file_url } = body

  if (!id || !file_url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id and file_url are required'
    })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { error } = await supabase
    .from('ns_nomor_surat')
    .update({ file_url })
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return { success: true }
})
