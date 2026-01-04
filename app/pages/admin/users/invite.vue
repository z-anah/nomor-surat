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

const { data: userTypes } = await supabase
  .from('ns_user_type')
  .select('*')
  .order('name', { ascending: true })

const { data: userStatuses } = await supabase
  .from('ns_user_status')
  .select('*')
  .order('name', { ascending: true })

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

  // Step 2: Insert user profile directly with Supabase
  const { error: profileError } = await supabase
    .from('ns_user_profile')
    .insert({
      id: userId,
      full_name: inviteForm.full_name,
      username: inviteForm.username,
      user_type_id: type.id,
      user_status_id: status.id,
      email: inviteForm.email
    })

  submitting.value = false

  if (profileError) {
    toast.add({
      title: 'Profile Error',
      description: profileError.message || 'Failed to create user profile.',
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
  <UDashboardPanel id="invite-user">
    <template #header>
      <UDashboardNavbar title="Invite User">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-3xl mx-auto">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Invite New User</h3>
          </template>
          <div class="space-y-4">
            <UForm
              v-if="!loading"
              :schema="inviteSchema"
              :state="inviteForm"
              @submit="onSubmit"
            >
              <!-- Email & Password -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField
                  name="email"
                  label="Email"
                  description="The email address for the new user"
                  required
                  class="mb-4"
                >
                  <UInput
                    v-model="inviteForm.email"
                    type="email"
                    placeholder="user@example.com"
                    autocomplete="off"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  name="password"
                  label="Password"
                  description="Minimum 6 characters"
                  required
                >
                  <UInput
                    v-model="inviteForm.password"
                    type="password"
                    placeholder="Enter password"
                    autocomplete="new-password"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <!-- Full Name & Username -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField
                  name="full_name"
                  label="Full Name"
                  required
                  class="mb-4"
                >
                  <UInput
                    v-model="inviteForm.full_name"
                    placeholder="John Doe"
                    autocomplete="off"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  name="username"
                  label="Username"
                  required
                >
                  <UInput
                    v-model="inviteForm.username"
                    placeholder="johndoe"
                    autocomplete="off"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <!-- User Type & User Status -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField
                  name="user_type_name"
                  label="User Type"
                  required
                  class="mb-4"
                >
                  <UInput
                    v-model="inviteForm.user_type_name"
                    :readonly="true"
                    :disabled="true"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  name="user_status_name"
                  label="User Status"
                  required
                >
                  <UInput
                    v-model="inviteForm.user_status_name"
                    :readonly="true"
                    :disabled="true"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <!-- Submit & Cancel Buttons -->
              <div class="flex gap-2 pt-2">
                <UButton
                  label="Create User"
                  color="primary"
                  type="submit"
                  :loading="submitting"
                  :disabled="submitting"
                  icon="i-lucide-user-plus"
                />
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="ghost"
                  @click="router.push('/admin/users/manage')"
                />
              </div>
            </UForm>
            <div v-else class="flex justify-center items-center min-h-[200px]">
              <ULoader size="lg" />
            </div>
          </div>
        </UCard>
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
  </UDashboardPanel>
</template>