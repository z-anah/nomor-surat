import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.email || !body.full_name || !body.username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email, full_name, and username are required'
    })
  }

  // Use service role key for admin operations
  const supabase = createClient(
    config.supabaseUrl,
    config.supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('ns_user_profile')
    .select('username')
    .eq('username', body.username)
    .single()

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username already exists'
    })
  }

  // Invite user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
    body.email,
    {
      data: {
        full_name: body.full_name,
        username: body.username,
        user_type_id: body.user_type_id,
        user_status_id: body.user_status_id
      },
      redirectTo: `${config.public.siteUrl}/auth/callback`
    }
  )

  if (authError) {
    throw createError({
      statusCode: 500,
      statusMessage: authError.message
    })
  }

  // Create user profile
  const { data: profileData, error: profileError } = await supabase
    .from('ns_user_profile')
    .insert({
      id: authData.user.id,
      full_name: body.full_name,
      username: body.username,
      user_type_id: body.user_type_id,
      user_status_id: body.user_status_id
    })
    .select()
    .single()

  if (profileError) {
    // Rollback: delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    
    throw createError({
      statusCode: 500,
      statusMessage: profileError.message
    })
  }

  return {
    success: true,
    user: profileData
  }
})
