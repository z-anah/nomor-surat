<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '#imports'

const emit = defineEmits<{
  created: []
}>()

const toast = useToast()
const open = ref(false)
const loading = ref(false)
const id = ref('')
const full_name = ref('')
const username = ref('')
const user_type_id = ref<number | null>(null)
const user_status_id = ref<number | null>(null)

async function onSubmit() {
  if (!id.value.trim() || !full_name.value.trim() || !username.value.trim()) {
    toast.add({
      title: 'Error',
      description: 'id, full name, and username are required',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/user-profiles', {
      method: 'POST',
      body: {
        id: id.value.trim(),
        full_name: full_name.value.trim(),
        username: username.value.trim(),
        user_type_id: user_type_id.value,
        user_status_id: user_status_id.value
      }
    })
    toast.add({
      title: 'Success',
      description: 'User profile created successfully'
    })
    id.value = ''
    full_name.value = ''
    username.value = ''
    user_type_id.value = null
    user_status_id.value = null
    open.value = false
    emit('created')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to create user profile',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <UButton label="Add User Profile" icon="i-lucide-plus" />

    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Add User Profile</h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="open = false"
            />
          </div>
        </template>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <UFormField label="ID (UUID)" required>
            <UInput v-model="id" placeholder="Enter user id (uuid)" class="w-full" />
          </UFormField>
          <UFormField label="Full Name" required>
            <UInput v-model="full_name" placeholder="Enter full name" class="w-full" />
          </UFormField>
          <UFormField label="Username" required>
            <UInput v-model="username" placeholder="Enter username" class="w-full" />
          </UFormField>
          <UFormField label="User Type ID">
            <UInput v-model="user_type_id" type="number" placeholder="User type id" class="w-full" />
          </UFormField>
          <UFormField label="User Status ID">
            <UInput v-model="user_status_id" type="number" placeholder="User status id" class="w-full" />
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
