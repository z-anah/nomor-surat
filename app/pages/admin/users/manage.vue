<template>
  <UDashboardPanel id="user-profiles">
    <template #header>
      <UDashboardNavbar title="User Profiles">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UserProfilesAddModal @created="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="nameFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter by name or username..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UserProfilesDeleteModal
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            @confirmed="deleteSelectedUserProfiles"
          >
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </UserProfilesDeleteModal>

          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { UserProfile } from '~/types'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const UBadge = resolveComponent('UBadge')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([
  { id: 'full_name', value: '' },
  { id: 'username', value: '' }
])
const columnVisibility = ref()
const rowSelection = ref({})

const { data, status, refresh } = await useFetch<UserProfile[]>('/api/user-profiles', {
  lazy: true
})

async function deleteUserProfile(id: string) {
  try {
    await $fetch(`/api/user-profiles/${id}`, { method: 'DELETE' })
    toast.add({
      title: 'User profile deleted',
      description: 'The user profile has been deleted.'
    })
    refresh()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to delete user profile',
      color: 'error'
    })
  }
}

async function deleteSelectedUserProfiles() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  for (const row of selectedRows) {
    await deleteUserProfile(row.original.id)
  }
  rowSelection.value = {}
}

function getRowItems(row: Row<UserProfile>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: 'User profile ID copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete user profile',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        deleteUserProfile(row.original.id)
      }
    }
  ]
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString()
}

// Optionally, define color mappings for user type and status
const userTypeColors: Record<string, string> = {
  admin: 'primary',
  staff: 'success',
  guest: 'warning'
  // Add more as needed
}
const userStatusColors: Record<string, string> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error'
  // Add more as needed
}

const columns: TableColumn<UserProfile>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'full_name',
    header: 'Full Name',
    cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.full_name)
  },
  {
    accessorKey: 'username',
    header: 'Username'
  },
  {
    accessorKey: 'user_type_name',
    header: 'User Type',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          class: 'capitalize',
          variant: 'subtle',
          color: userTypeColors[(row.original.user_type_name || '').toLowerCase()] || 'primary'
        },
        () => row.original.user_type_name || '-'
      )
  },
  {
    accessorKey: 'user_status_name',
    header: 'User Status',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          class: 'capitalize',
          variant: 'subtle',
          color: userStatusColors[(row.original.user_status_name || '').toLowerCase()] || 'neutral'
        },
        () => row.original.user_status_name || '-'
      )
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => h('span', {}, formatDate(row.original.created_at))
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const nameFilter = computed({
  get: (): string => {
    return (
      (table.value?.tableApi?.getColumn('full_name')?.getFilterValue() as string) ||
      (table.value?.tableApi?.getColumn('username')?.getFilterValue() as string) ||
      ''
    )
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('full_name')?.setFilterValue(value || undefined)
    table.value?.tableApi?.getColumn('username')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>
