<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useSupabaseUser, useSupabaseClient, useRouter } from '#imports'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const supabaseUser = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()

const user = computed(() => {
  const name = supabaseUser.value?.user_metadata?.name || supabaseUser.value?.email || 'User'
  return {
    name,
    avatar: {
      // Use the first letter of the user's name or email as the initial
      initial: name.charAt(0).toUpperCase(),
      alt: name
    }
  }
})

const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
    await router.push('/login')
  }
}

const items = computed<DropdownMenuItem[][]>(() => [[{
  type: 'label',
  label: user.value.name,
  // Use avatar with initial
  avatar: {
    // UAvatar from Nuxt UI supports 'initial' prop for initials
    initial: user.value.avatar.initial,
    alt: user.value.avatar.alt
  }
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out',
  onSelect: handleLogout
}]])
</script>



<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
