<template>
  <UDashboardPanel id="ns-create-personalized">
    <template #header>
      <UDashboardNavbar title="Create Personalized Nomor Surat">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        <!-- Form -->
        <div class="flex-1">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Personalized Nomor Surat Form</h3>
            </template>
            <div class="space-y-4">
              <UFormField label="Title" required>
                <UInput v-model="form.title" placeholder="Enter title" class="w-full" />
              </UFormField>
              <UFormField label="Fungsi Type" required>
                <USelectMenu
                  v-model="form.fungsi_type_id"
                  :items="fungsiTypeOptions"
                  placeholder="Select Fungsi Type"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="SK Type" required>
                <USelectMenu
                  v-model="form.sk_type_id"
                  :items="skTypeOptions"
                  placeholder="Select SK Type"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Number" required>
                <UInput v-model="form.number" placeholder="Enter number" class="w-full" />
              </UFormField>
              <UFormField label="Date" required>
                <UInput v-model="form.date" type="date" class="w-full" />
              </UFormField>
              <UFormField label="Custom Numbering Format" required hint="You can use placeholders: {number}, {fungsi}, {sk}, {date}, {year}">
                <UInput v-model="form.generated_nomor_surat" placeholder="e.g. {number}/{fungsi}/{sk}/{date}/{year}" class="w-full" />
              </UFormField>
              <UFormField label="Password" required hint="Enter your account password to confirm">
                <UInput v-model="form.password" type="password" placeholder="Enter your password" class="w-full" />
              </UFormField>
              <UButton
                label="Save Personalized Nomor Surat"
                icon="i-lucide-save"
                :loading="isSubmitting"
                :disabled="!isFormValid"
                @click="submitPersonalized"
              />
            </div>
          </UCard>
        </div>
        <!-- Preview -->
        <div class="md:w-96 w-full">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Live Preview</h3>
            </template>
            <div class="space-y-4">
              <p class="text-sm text-muted">Preview of Nomor Surat:</p>
              <p class="text-xl font-mono font-bold text-highlighted">
                {{ previewNomorSurat }}
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

const supabase = useSupabaseClient()
const toast = useToast()
const user = useSupabaseUser()
const router = useRouter()

const form = ref({
  title: '',
  fungsi_type_id: null as number | null,
  sk_type_id: null as number | null,
  number: '',
  date: '',
  generated_nomor_surat: '{number}/{fungsi}/{sk}/{date}/{year}',
  password: '' // added
})

const isSubmitting = ref(false)

// Fetch Fungsi Types
const { data: fungsiTypes } = await supabase
  .from('ns_fungsi_type')
  .select('*')
  .order('id', { ascending: true })

// Fetch SK Types
const { data: skTypes } = await supabase
  .from('ns_sk_type')
  .select('*')
  .order('id', { ascending: true })

const fungsiTypeOptions = computed(() => {
  return (fungsiTypes ?? []).map(f => ({
    label: `${f.fungsi_code} (${f.fungsi_name})`,
    value: f.id
  }))
})

const skTypeOptions = computed(() => {
  return (skTypes ?? []).map(s => ({
    label: s.name,
    value: s.id
  }))
})

const isFormValid = computed(() => {
  return form.value.title &&
    form.value.fungsi_type_id &&
    form.value.sk_type_id &&
    form.value.number &&
    form.value.date &&
    form.value.generated_nomor_surat &&
    form.value.password // added
})

// Helper: Convert month number to Roman numeral
function monthToRoman(month: number): string {
  const romans = [
    '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
  ]
  return romans[month]
}

// Helper: Format preview
const previewNomorSurat = computed(() => {
  const year = form.value.date ? new Date(form.value.date).getFullYear() : new Date().getFullYear()
  const month = form.value.date ? new Date(form.value.date).getMonth() + 1 : new Date().getMonth() + 1
  const romanMonth = monthToRoman(month)
  const fungsi = fungsiTypes?.find(f => f.id === form.value.fungsi_type_id)?.fungsi_code || ''
  const sk = skTypes?.find(s => s.id === form.value.sk_type_id)?.name || ''
  const number = form.value.number || ''
  return form.value.generated_nomor_surat
    .replace('{number}', number)
    .replace('{fungsi}', fungsi)
    .replace('{sk}', sk)
    .replace('{date}', romanMonth)
    .replace('{year}', year.toString())
})

// Submission
async function submitPersonalized() {
  console.log('user.value:', JSON.stringify(user, null, 2))
  if (!user.value?.sub || !user.value?.email) {
    toast.add({
      title: 'Error',
      description: 'You must be logged in to submit',
      color: 'error'
    })
    return
  }
  if (!isFormValid.value) return

  isSubmitting.value = true

  // Authenticate with password
  const tempClient = createSupabaseClient(
    supabase.supabaseUrl,
    supabase.supabaseKey
  )
  let tempSession
  try {
    const { data, error } = await tempClient.auth.signInWithPassword({
      email: user.value.email,
      password: form.value.password
    })
    if (error) throw error
    tempSession = data.session
    if (!tempSession) throw new Error('Authentication failed')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: 'Invalid password. Please try again.',
      color: 'error'
    })
    isSubmitting.value = false
    return
  }

  try {
    const { error } = await tempClient
      .from('ns_nomor_surat')
      .insert({
        user_id: user.value.sub,
        title: form.value.title,
        generated_nomor_surat: previewNomorSurat.value,
        fungsi_type_id: form.value.fungsi_type_id,
        sk_type_id: form.value.sk_type_id,
        file: '',
      })
    if (error) throw error
    toast.add({
      title: 'Success',
      description: 'Personalized Nomor Surat saved successfully',
      color: 'success'
    })
    // Reset form
    form.value.title = ''
    form.value.number = ''
    form.value.date = ''
    form.value.generated_nomor_surat = '{number}/{fungsi}/{sk}/{date}/{year}'
    form.value.fungsi_type_id = null
    form.value.sk_type_id = null
    form.value.password = ''
    // Redirect to list
    router.push('/admin/ns/list')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to save Nomor Surat',
      color: 'error'
    })
  } finally {
    await tempClient.auth.signOut()
    isSubmitting.value = false
  }
}
</script>