<script setup lang="ts">
const emit = defineEmits<{
  created: []
}>()

const toast = useToast()
const open = ref(false)
const loading = ref(false)
const fungsi_name = ref('')
const fungsi_code = ref('')

async function onSubmit() {
  if (!fungsi_name.value.trim() || !fungsi_code.value.trim()) {
    toast.add({
      title: 'Error',
      description: 'Fungsi name and code are required',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/fungsi-types', {
      method: 'POST',
      body: { fungsi_name: fungsi_name.value.trim(), fungsi_code: fungsi_code.value.trim() }
    })
    toast.add({
      title: 'Success',
      description: 'Fungsi type created successfully'
    })
    fungsi_name.value = ''
    fungsi_code.value = ''
    open.value = false
    emit('created')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to create fungsi type',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <UButton label="Add Fungsi Type" icon="i-lucide-plus" />

    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Add Fungsi Type</h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="open = false"
            />
          </div>
        </template>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <UFormField label="Fungsi Name" required>
            <UInput v-model="fungsi_name" placeholder="Enter fungsi name" class="w-full" />
          </UFormField>
          <UFormField label="Fungsi Code" required>
            <UInput v-model="fungsi_code" placeholder="Enter unique code" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              @click="open = false"
            />
            <UButton
              type="submit"
              label="Create"
              :loading="loading"
            />
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>
