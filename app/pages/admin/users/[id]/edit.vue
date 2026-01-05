<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()

const route = useRoute()
const router = useRouter()
const toast = useToast()

const id = route.params.id as string

const profileSchema = z.object({
  full_name: z.string().min(2, 'Too short'),
  username: z.string().min(2, 'Too short'),
  user_type_name: z.string().min(1, 'Required'),
  user_status_name: z.string().min(1, 'Required')
})

type ProfileSchema = z.output<typeof profileSchema>

const { data: user } = await supabase
  .from('ns_user_profile')
  .select(`
    *,
    ns_user_type (name),
    ns_user_status (name)
  `)
  .eq('id', id)
  .single()

const { data: userTypes } = await supabase
  .from('ns_user_type')
  .select('*')
  .order('name', { ascending: true })

const { data: userStatuses } = await supabase
  .from('ns_user_status')
  .select('*')
  .order('name', { ascending: true })

const profile = reactive<Partial<ProfileSchema>>({
  full_name: user.value?.full_name,
  username: user.value?.username,
  user_type_name: user.value?.user_type_name ?? '',
  user_status_name: user.value?.user_status_name ?? ''
})

const submitting = ref(false)

// Wait for userTypes and userStatuses to be loaded before rendering the form
const loading = computed(() => !user.value || !userTypes.value || !userStatuses.value)

const userTypeOptions = computed(() => {
  if (!userTypes.value) return []
  const options = userTypes.value.map(t => t.name)
  if (profile.user_type_name && !options.includes(profile.user_type_name)) {
    options.push(profile.user_type_name)
  }
  return options
})
const userStatusOptions = computed(() => {
  if (!userStatuses.value) return []
  const options = userStatuses.value.map(s => s.name)
  if (profile.user_status_name && !options.includes(profile.user_status_name)) {
    options.push(profile.user_status_name)
  }
  return options
})

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  submitting.value = true
  const type = userTypes.value?.find(t => t.name === profile.user_type_name)
  const status = userStatuses.value?.find(s => s.name === profile.user_status_name)
  if (!type || !status) {
    toast.add({
      title: 'Error',
      description: 'Invalid user type or status.',
      color: 'error'
    })
    submitting.value = false
    return
  }
  const { error } = await supabase
    .from('ns_user_profile')
    .update({
      full_name: profile.full_name,
      username: profile.username,
      user_type_id: type.id,
      user_status_id: status.id
    })
    .eq('id', id)

  submitting.value = false
  if (!error) {
    toast.add({
      title: 'Success',
      description: 'User profile updated.',
      color: 'success'
    })
    router.push('/admin/users/manage')
  }
}
</script>

<template>
  <UForm
    v-if="!loading"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      title="Edit User Profile"
      description="Update user information."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <!-- Move Save changes button inside the form and bind loading state -->
      <UButton
        label="Save changes"
        color="primary"
        type="submit"
        class="w-fit lg:ms-auto"
        :loading="submitting"
      />
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        class="ml-2"
        @click="router.push('/admin/users/manage')"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="full_name"
        label="Full Name"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.full_name"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="username"
        label="Username"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.username"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="user_type_name"
        label="User Type"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <USelect
          v-model="profile.user_type_name"
          :items="userTypeOptions"
          placeholder="Select user type"
          :disabled="true"
          color="neutral"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="user_status_name"
        label="User Status"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <USelect
          v-model="profile.user_status_name"
          :items="userStatusOptions"
          placeholder="Select user status"
          :disabled="userStatusOptions.length === 0"
          color="neutral"
        />
      </UFormField>
    </UPageCard>
  </UForm>
  <div v-else class="flex justify-center items-center min-h-[200px]">
    <ULoader size="lg" />
  </div>
</template>
