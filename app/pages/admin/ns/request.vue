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


                <!-- Quantity Input -->
                <UFormField label="Quantity" required hint="How many Nomor Surat to generate">
                  <UInput
                    v-model.number="form.quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity (default 1)"
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
                <div v-if="result && result.nomor_surat_list && result.nomor_surat_list.length">
                  <p class="text-green-600 font-semibold">Request Successful</p>
                  <p class="text-sm text-muted">Generated Nomor Surat:</p>
                  <ul class="space-y-1">
                    <li v-for="(item, idx) in result.nomor_surat_list" :key="idx">
                      <span class="text-xl font-mono font-bold text-highlighted">{{ item.generated_nomor_surat }}</span>
                    </li>
                  </ul>
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
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabase = useSupabaseClient()
const toast = useToast()
const user = useSupabaseUser()

// Form state
const form = ref({
  title: '',
  fungsi_type_id: null as number | null,
  sk_type_id: null as number | null,
  month: new Date().getMonth() + 1,
  quantity: 1,
  password: ''
})

const isSubmitting = ref(false)
const result = ref<{
  nomor_surat_list: Array<{ generated_nomor_surat: string }>
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
    form.value.password &&
    form.value.quantity &&
    Number.isInteger(form.value.quantity) &&
    form.value.quantity > 0
})

// Helper: Convert month number to Roman numeral
function toRomanNumeral(num: number): string {
  const romanNumerals: [number, string][] = [
    [12, 'XII'],
    [11, 'XI'],
    [10, 'X'],
    [9, 'IX'],
    [8, 'VIII'],
    [7, 'VII'],
    [6, 'VI'],
    [5, 'V'],
    [4, 'IV'],
    [3, 'III'],
    [2, 'II'],
    [1, 'I']
  ]
  for (const [value, numeral] of romanNumerals) {
    if (num === value) return numeral
  }
  return ''
}

// Submit request (all logic client-side)
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

  // 1. Authenticate with password (create a new client for password check)
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
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Invalid password. Please try again.',
      color: 'error'
    })
    isSubmitting.value = false
    return
  }

  try {
    // Fetch fungsi_code and sk_type name once
    const [{ data: fungsiData, error: fungsiError }, { data: skTypeData, error: skTypeError }] = await Promise.all([
      tempClient.from('ns_fungsi_type').select('fungsi_code').eq('id', form.value.fungsi_type_id).single(),
      tempClient.from('ns_sk_type').select('name').eq('id', form.value.sk_type_id).single()
    ])
    if (fungsiError) throw fungsiError
    if (skTypeError) throw skTypeError

    const currentYear = new Date().getFullYear()
    const monthRoman = toRomanNumeral(form.value.month)
    const quantity = form.value.quantity
    const nomorSuratList = []
    for (let i = 0; i < quantity; i++) {
      // Increment and get new number for each
      const { data: newNumber, error: rpcError } = await tempClient.rpc('increment_ns_sk_number', { p_sk_type_id: form.value.sk_type_id })
      if (rpcError) throw rpcError
      const generatedNomorSurat = `${newNumber}/${fungsiData.fungsi_code}/${skTypeData.name}/${monthRoman}/${currentYear}`
      // Insert into ns_nomor_surat
      const { data: insertedData, error: insertError } = await tempClient
        .from('ns_nomor_surat')
        .insert({
          user_id: user.value.sub,
          title: form.value.title,
          generated_nomor_surat: generatedNomorSurat,
          fungsi_type_id: form.value.fungsi_type_id,
          sk_type_id: form.value.sk_type_id
        })
        .select()
        .single()
      if (insertError) throw insertError
      nomorSuratList.push({ generated_nomor_surat: generatedNomorSurat })
    }

    result.value = {
      nomor_surat_list: nomorSuratList
    }

    toast.add({
      title: 'Success',
      description: `Generated ${quantity} Nomor Surat successfully`,
      color: 'success'
    })

    // Reset form
    form.value.title = ''
    form.value.password = ''
    form.value.quantity = 1
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to generate Nomor Surat',
      color: 'error'
    })
  } finally {
    // 8. Sign out temp session
    await tempClient.auth.signOut()
    isSubmitting.value = false
  }
}
</script>