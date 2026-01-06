<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [
[
  {
    label: 'Types Management',
    icon: 'i-lucide-layers',
    type: 'trigger',
    children: [
      {
        label: 'User Types',
        to: '/admin/types/user',
        onSelect: () => { open.value = false }
      },
      {
        label: 'Fungsi Types',
        to: '/admin/types/fungsi',
        onSelect: () => { open.value = false }
      },
      {
        label: 'SK Types',
        to: '/admin/types/sk',
        onSelect: () => { open.value = false }
      }
    ]
  },
  {
    label: 'Users',
    icon: 'i-lucide-users',
    type: 'trigger',
    children: [
      {
        label: 'Manage Users',
        to: '/admin/users/manage',
        onSelect: () => { open.value = false }
      },
      {
        label: 'Invite Editors',
        to: '/admin/users/invite',
        onSelect: () => { open.value = false }
      },
      {
        label: 'User Status',
        to: '/admin/users/status',
        onSelect: () => { open.value = false }
      }
    ]
  },
  {
    label: 'Nomor Surat',
    icon: 'i-lucide-file-text',
    type: 'trigger',
    children: [
      {
        label: 'Personalized Nomor Surat',
        to: '/admin/ns/create-personalized',
        onSelect: () => { open.value = false }
      },
      {
        label: 'Nomor Surat List',
        to: '/admin/ns/list',
        onSelect: () => { open.value = false }
      },
      {
        label: 'Request Nomor Surat',
        to: '/admin/ns/request',
        onSelect: () => { open.value = false }
      }
    ]
  }
]
] satisfies NavigationMenuItem[][]

const links_editor = [
[
  {
    label: 'Nomor Surat List',
    to: '/admin/ns/list',
    onSelect: () => { open.value = false }
  },
  {
    label: 'Request Nomor Surat',
    to: '/admin/ns/request',
    onSelect: () => { open.value = false }
  }
]
] satisfies NavigationMenuItem[][]

const userTypeId = ref<number | null>(null)

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: (userTypeId.value === 1 ? links : links_editor).flat()
}])

const sidebarLinks = computed(() => userTypeId.value === 1 ? links[0] : links_editor[0])

onMounted(async () => {
  // Fetch user profile and set userTypeId
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  if (user.value) {
    const { data, error } = await supabase
      .from('ns_user_profile')
      .select('user_type_id')
      .eq('id', user.value.sub)
      .single()
    if (!error && data) {
      userTypeId.value = data.user_type_id
    }
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }">
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />
        <UNavigationMenu :collapsed="collapsed" :items="sidebarLinks" orientation="vertical" tooltip popover />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
