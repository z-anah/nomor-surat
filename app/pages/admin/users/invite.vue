<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserType, UserStatus } from '~/types'

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name is required'),
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  user_type_name: z.string().min(1, 'User type is required'),
  user_status_name: z.string().min(1, 'User status is required')
})

type InviteSchema = z.output<typeof inviteSchema>

const { data: userTypes } = await useFetch<UserType[]>('/api/user-types')
const { data: userStatuses } = await useFetch<UserStatus[]>('/api/user-statuses')

// Only allow user_type_id=3 and user_status_id=1
const allowedUserType = computed(() => userTypes.value?.find(t => t.id === 3))
const allowedUserStatus = computed(() => userStatuses.value?.find(s => s.id === 1))

const inviteForm = reactive<Partial<InviteSchema>>({
  email: '',
  full_name: '',
  username: '',
  password: '',
  user_type_name: allowedUserType.value?.name || '',
  user_status_name: allowedUserStatus.value?.name || ''
})

const submitting = ref(false)
const showConfirmModal = ref(false)
const registeredEmail = ref('')
const loading = computed(() => !userTypes.value || !userStatuses.value || !allowedUserType.value || !allowedUserStatus.value)

async function onSubmit(event: FormSubmitEvent<InviteSchema>) {
  submitting.value = true

  const type = allowedUserType.value
  const status = allowedUserStatus.value

  if (!type || !status) {
    toast.add({
      title: 'Error',
      description: 'Invalid user type or status.',
      color: 'error'
    })
    submitting.value = false
    return
  }

  // Step 1: Signup in Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: inviteForm.email!,
    password: inviteForm.password!,
    options: {
      data: {
        full_name: inviteForm.full_name,
        username: inviteForm.username
      }
    }
  })

  if (signUpError) {
    toast.add({
      title: 'Signup Error',
      description: signUpError.message,
      color: 'error'
    })
    submitting.value = false
    return
  }

  const userId = signUpData?.user?.id
  if (!userId) {
    toast.add({
      title: 'Error',
      description: 'Failed to create user account.',
      color: 'error'
    })
    submitting.value = false
    return
  }

  // Step 2: Insert user profile
  const { error: profileError } = await useFetch('/api/user-profiles', {
    method: 'POST',
    body: {
      id: userId,
      full_name: inviteForm.full_name,
      username: inviteForm.username,
      user_type_id: type.id,
      user_status_id: status.id,
        email: inviteForm.email
    }
  })

  submitting.value = false

  if (profileError.value) {
    toast.add({
      title: 'Profile Error',
      description: profileError.value.data?.statusMessage || 'Failed to create user profile.',
      color: 'error'
    })
    return
  }

  // Step 3: Show confirmation modal
  registeredEmail.value = inviteForm.email!
  showConfirmModal.value = true
}

function onConfirmOk() {
  showConfirmModal.value = false
  router.push('/admin/users/manage')
}
</script>

<template>
  <UForm
    v-if="!loading"
    :schema="inviteSchema"
    :state="inviteForm"
    @submit="onSubmit"
  >
    <UPageCard
      title="Invite User"
      description="Create a new user account."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Create User"
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
        name="email"
        label="Email"
        description="The email address for the new user"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="inviteForm.email"
          type="email"
          placeholder="user@example.com"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="password"
        label="Password"
        description="Minimum 6 characters"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="inviteForm.password"
          type="password"
          placeholder="Enter password"
          autocomplete="new-password"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="full_name"
        label="Full Name"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="inviteForm.full_name"
          placeholder="John Doe"
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
          v-model="inviteForm.username"
          placeholder="johndoe"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <!-- Show user type as readonly text -->
      <UFormField
        name="user_type_name"
        label="User Type"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="inviteForm.user_type_name"
          :readonly="true"
          :disabled="true"
        />
      </UFormField>
      <USeparator />
      <!-- Show user status as readonly text -->
      <UFormField
        name="user_status_name"
        label="User Status"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="inviteForm.user_status_name"
          :readonly="true"
          :disabled="true"
        />
      </UFormField>
    </UPageCard>
  </UForm>
  <div v-else class="flex justify-center items-center min-h-[200px]">
    <ULoader size="lg" />
  </div>

  <!-- Confirmation Modal -->
  <UModal v-model:open="showConfirmModal">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-mail-check" class="text-primary w-6 h-6" />
            <span class="font-semibold text-lg">User Created Successfully</span>
          </div>
        </template>
        <p class="text-muted">
          <strong>{{ registeredEmail }}</strong> should check their email to verify their account.
        </p>
        <template #footer>
          <div class="flex justify-end">
            <UButton label="OK" color="primary" @click="onConfirmOk" />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>