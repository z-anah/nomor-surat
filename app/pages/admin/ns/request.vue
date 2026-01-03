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
      <div class="max-w-2xl mx-auto space-y-6">
        <!-- Request Form -->
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

        <!-- Result Display -->
        <UCard v-if="result">
          <template #header>
            <h3 class="text-lg font-semibold text-green-600">Request Successful</h3>
          </template>

          <div class="space-y-4">
            <div>
              <p class="text-sm text-muted">Generated Nomor Surat:</p>
              <p class="text-xl font-mono font-bold text-highlighted">
                {{ result.nomor_surat.generated_nomor_surat }}
              </p>
            </div>

            <USeparator />

            <div>
              <p class="text-sm text-muted mb-2">SK Number Temp Status:</p>
              <div class="bg-muted/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between">
                  <span class="text-muted">SK Type:</span>
                  <span class="font-medium">{{ result.sk_number_temp.sk_type_name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Last Number:</span>
                  <span class="font-mono font-bold">{{ result.sk_number_temp.last_number }}</span>
                </div>
                <div v-if="result.sk_number_temp.year" class="flex justify-between">
                  <span class="text-muted">Year:</span>
                  <span class="font-medium">{{ result.sk_number_temp.year }}</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- SK Number Temp Table -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">SK Number Temp Overview</h3>
              <UButton
                label="Refresh"
                icon="i-lucide-refresh-cw"
                variant="ghost"
                size="sm"
                :loading="skNumberTempStatus === 'pending'"
                @click="refreshSkNumberTemp"
              />
            </div>
          </template>

          <UTable
            :data="skNumberTempData || []"
            :columns="skNumberTempColumns"
            :loading="skNumberTempStatus === 'pending'"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FungsiType, SkType, SkNumberTemp } from '~/types'

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
  sk_number_temp: SkNumberTemp
} | null>(null)

// Fetch Fungsi Types
const { data: fungsiTypes } = await useFetch<FungsiType[]>('/api/fungsi-types', {
  lazy: true
})

// Fetch SK Types
const { data: skTypes } = await useFetch<SkType[]>('/api/sk-types', {
  lazy: true
})

// Fetch SK Number Temp
const { data: skNumberTempData, status: skNumberTempStatus, refresh: refreshSkNumberTemp } = await useFetch<SkNumberTemp[]>('/api/sk-number-temp', {
  lazy: true
})

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

// SK Number Temp table columns
const skNumberTempColumns: TableColumn<SkNumberTemp>[] = [
  {
    accessorKey: 'sk_type_name',
    header: 'SK Type'
  },
  {
    accessorKey: 'last_number',
    header: 'Last Number',
    cell: ({ row }) => h('span', { class: 'font-mono font-bold' }, row.original.last_number)
  },
  {
    accessorKey: 'year',
    header: 'Year',
    cell: ({ row }) => row.original.year || '-'
  }
]

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

    // Refresh SK Number Temp table
    await refreshSkNumberTemp()

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