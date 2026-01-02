<script setup lang="ts">
const emit = defineEmits<{
  created: []
}>()

const toast = useToast()
const open = ref(false)
const loading = ref(false)
const name = ref('')

async function onSubmit() {
  if (!name.value.trim()) {
    toast.add({
      title: 'Error',
      description: 'Name is required',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/user-types', {
      method: 'POST',
      body: { name: name.value.trim() }
    })
    toast.add({
      title: 'Success',
      description: 'User type created successfully'
    })
    name.value = ''
    open.value = false
    emit('created')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to create user type',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <UButton label="Add User Type" icon="i-lucide-plus" />

    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Add User Type</h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="open = false"
            />
          </div>
        </template>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <UFormField label="Name" required>
            <UInput v-model="name" placeholder="Enter user type name" class="w-full" />
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
