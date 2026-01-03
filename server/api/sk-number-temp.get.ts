import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const skTypeId = query.sk_type_id

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  let queryBuilder = supabase
    .from('ns_sk_number_temp')
    .select(`
      *,
      ns_sk_type (name)
    `)

  if (skTypeId) {
    queryBuilder = queryBuilder.eq('sk_type_id', skTypeId)
  }

  const { data, error } = await queryBuilder.order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  // Transform data to flatten sk_type_name
  const transformed = data?.map((item: any) => ({
    id: item.id,
    sk_type_id: item.sk_type_id,
    last_number: item.last_number,
    year: item.year,
    sk_type_name: item.ns_sk_type?.name || null
  }))

  return transformed
})
