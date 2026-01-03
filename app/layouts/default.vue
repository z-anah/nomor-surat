<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Inbox',
  icon: 'i-lucide-inbox',
  to: '/inbox',
  badge: '4',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Customers',
  icon: 'i-lucide-users',
  to: '/customers',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Settings',
  to: '/settings',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'General',
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Members',
    to: '/settings/members',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Notifications',
    to: '/settings/notifications',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Security',
    to: '/settings/security',
    onSelect: () => {
      open.value = false
    }
  }]
}], [{
  label: 'Feedback',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}, {
  label: 'Help & Support',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}],
[
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/admin/dashboard',
    onSelect: () => {
      open.value = false
    }
  },
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
        label: 'Create Personalized Nomor Surat',
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

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
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
        <UNavigationMenu :collapsed="collapsed" :items="links[2]" orientation="vertical" tooltip popover />
        
        <USeparator orientation="horizontal" />

        <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover />

        <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
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
