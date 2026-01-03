import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { user_id, email, password, fungsi_type_id, sk_type_id, month, title } = body

  if (!user_id || !email || !password || !fungsi_type_id || !sk_type_id || !month || !title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'user_id, email, password, fungsi_type_id, sk_type_id, month, and title are required'
    })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  // Verify password by attempting to sign in
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password. Please try again.'
    })
  }

  // Sign out immediately after verification (we only needed to verify the password)
  await supabase.auth.signOut()

  // Call the stored function to increment and get the new number
  const { data: newNumber, error: rpcError } = await supabase
    .rpc('increment_ns_sk_number', { p_sk_type_id: sk_type_id })

  if (rpcError) {
    throw createError({
      statusCode: 500,
      statusMessage: rpcError.message
    })
  }

  // Fetch fungsi_code for generating nomor surat
  const { data: fungsiData, error: fungsiError } = await supabase
    .from('ns_fungsi_type')
    .select('fungsi_code')
    .eq('id', fungsi_type_id)
    .single()

  if (fungsiError) {
    throw createError({
      statusCode: 500,
      statusMessage: fungsiError.message
    })
  }

  // Fetch sk_type name
  const { data: skTypeData, error: skTypeError } = await supabase
    .from('ns_sk_type')
    .select('name')
    .eq('id', sk_type_id)
    .single()

  if (skTypeError) {
    throw createError({
      statusCode: 500,
      statusMessage: skTypeError.message
    })
  }

  const currentYear = new Date().getFullYear()
  const monthRoman = toRomanNumeral(month)
  
  // Format: {number}/{fungsi_code}/{sk_type}/{month_roman}/{year}
  const generatedNomorSurat = `${newNumber}/${fungsiData.fungsi_code}/${skTypeData.name}/${monthRoman}/${currentYear}`

  // Insert into ns_nomor_surat
  const { data: insertedData, error: insertError } = await supabase
    .from('ns_nomor_surat')
    .insert({
      user_id,
      title,
      generated_nomor_surat: generatedNomorSurat,
      fungsi_type_id,
      sk_type_id
    })
    .select()
    .single()

  if (insertError) {
    throw createError({
      statusCode: 500,
      statusMessage: insertError.message
    })
  }

  // Fetch updated sk_number_temp
  const { data: skNumberTemp, error: tempError } = await supabase
    .from('ns_sk_number_temp')
    .select(`
      *,
      ns_sk_type (name)
    `)
    .eq('sk_type_id', sk_type_id)
    .single()

  if (tempError) {
    throw createError({
      statusCode: 500,
      statusMessage: tempError.message
    })
  }

  return {
    nomor_surat: insertedData,
    sk_number_temp: {
      id: skNumberTemp.id,
      sk_type_id: skNumberTemp.sk_type_id,
      last_number: skNumberTemp.last_number,
      year: skNumberTemp.year,
      sk_type_name: skNumberTemp.ns_sk_type?.name || null
    }
  }
})

function toRomanNumeral(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ]
  
  let result = ''
  let remaining = num
  
  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }
  
  return result
}
