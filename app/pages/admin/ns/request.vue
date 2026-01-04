<template>
  <UDashboardPanel id="ns-request">
    <template #header>
      <UDashboardNavbar title="Request Nomor Surat">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-4xl mx-auto">
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Request Form -->
          <div class="flex-1">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Request New Nomor Surat</h3>
              </template>

              <div class="space-y-4">
                <!-- Title Input -->
                <UFormField label="Title" required>
                  <UInput
                    v-model="form.title"
                    placeholder="Enter document title"
                    class="w-full"
                  />
                </UFormField>

                <!-- Fungsi Type Select -->
                <UFormField label="Fungsi Type" required>
                  <USelectMenu
                    v-model="form.fungsi_type_id"
                    :items="fungsiTypeOptions"
                    placeholder="Select Fungsi Type"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>

                <!-- SK Type Select -->
                <UFormField label="SK Type" required>
                  <USelectMenu
                    v-model="form.sk_type_id"
                    :items="skTypeOptions"
                    placeholder="Select SK Type"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>

                <!-- Month Select -->
                <UFormField label="Month" required>
                  <USelectMenu
                    v-model="form.month"
                    :items="monthOptions"
                    placeholder="Select Month"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>

                <!-- Password Input -->
                <UFormField label="Password" required hint="Enter your account password to confirm">
                  <UInput
                    v-model="form.password"
                    type="password"
                    placeholder="Enter your password"
                    class="w-full"
                  />
                </UFormField>

                <!-- Submit Button -->
                <UButton
                  label="Request Nomor Surat"
                  icon="i-lucide-send"
                  :loading="isSubmitting"
                  :disabled="!isFormValid"
                  @click="submitRequest"
                />
              </div>
            </UCard>
          </div>

          <!-- Result Display -->
          <div class="md:w-96 w-full">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">
                  Nomor Surat Result
                </h3>
              </template>
              <div class="space-y-4">
                <div v-if="result">
                  <p class="text-green-600 font-semibold">Request Successful</p>
                  <p class="text-sm text-muted">Generated Nomor Surat:</p>
                  <p class="text-xl font-mono font-bold text-highlighted">
                    {{ result.nomor_surat.generated_nomor_surat }}
                  </p>
                </div>
                <div v-else>
                  <p class="text-sm text-muted">No Nomor Surat generated yet.</p>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { FungsiType, SkType } from '~/types'
import { supabase } from '~/utils/supabase'

const toast = useToast()
const user = useSupabaseUser()

// Form state
const form = ref({
  title: '',
  fungsi_type_id: null as number | null,
  sk_type_id: null as number | null,
  month: new Date().getMonth() + 1,
  password: ''
})

const isSubmitting = ref(false)
const result = ref<{
  nomor_surat: { generated_nomor_surat: string }
} | null>(null)

// Fetch Fungsi Types
const { data: fungsiTypes } = await supabase
    .from('ns_fungsi_type')
    .select('*')
    .order('id', { ascending: true })

// Fetch SK Types
const { data: skTypes } =  await supabase
    .from('ns_sk_type')
    .select('*')
    .order('id', { ascending: true })

// Computed options
const fungsiTypeOptions = computed(() => {
  return fungsiTypes.value?.map(f => ({
    label: `${f.fungsi_name} (${f.fungsi_code})`,
    value: f.id
  })) || []
})

const skTypeOptions = computed(() => {
  return skTypes.value?.map(s => ({
    label: s.name,
    value: s.id
  })) || []
})

const monthOptions = [
  { label: 'January (I)', value: 1 },
  { label: 'February (II)', value: 2 },
  { label: 'March (III)', value: 3 },
  { label: 'April (IV)', value: 4 },
  { label: 'May (V)', value: 5 },
  { label: 'June (VI)', value: 6 },
  { label: 'July (VII)', value: 7 },
  { label: 'August (VIII)', value: 8 },
  { label: 'September (IX)', value: 9 },
  { label: 'October (X)', value: 10 },
  { label: 'November (XI)', value: 11 },
  { label: 'December (XII)', value: 12 }
]

const isFormValid = computed(() => {
  return form.value.title &&
    form.value.fungsi_type_id &&
    form.value.sk_type_id &&
    form.value.month &&
    form.value.password
})

// Submit request
async function submitRequest() {
    
  if (!user.value?.sub || !user.value?.email) {
    toast.add({
      title: 'Error',
      description: 'You must be logged in to make a request',
      color: 'error'
    })
    return
  }

  if (!isFormValid.value) return

  isSubmitting.value = true
  result.value = null

  try {
    const response = await $fetch('/api/ns-request', {
      method: 'POST',
      body: {
        user_id: user.value.sub,
        email: user.value.email,
        password: form.value.password,
        fungsi_type_id: form.value.fungsi_type_id,
        sk_type_id: form.value.sk_type_id,
        month: form.value.month,
        title: form.value.title
      }
    })

    result.value = response as any

    toast.add({
      title: 'Success',
      description: 'Nomor Surat generated successfully',
      color: 'success'
    })

    // Reset form
    form.value.title = ''
    form.value.password = ''
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to generate Nomor Surat',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>