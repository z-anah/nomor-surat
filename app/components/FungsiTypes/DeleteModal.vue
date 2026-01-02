<script setup lang="ts">
const props = defineProps<{
  count?: number
}>()

const emit = defineEmits<{
  confirmed: []
}>()

const open = ref(false)

function onConfirm() {
  emit('confirmed')
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open">
    <slot />

    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Delete Fungsi Types</h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="open = false"
            />
          </div>
        </template>

        <p>
          Are you sure you want to delete {{ count }} fungsi type(s)? This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              @click="open = false"
            />
            <UButton
              label="Delete"
              color="error"
              @click="onConfirm"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
