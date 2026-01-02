<template>
  <UDashboardPanel id="fungsi-types">
    <template #header>
      <UDashboardNavbar title="Fungsi Types">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <!-- Remove Add Modal button -->
        <!-- <template #right>
          <FungsiTypesAddModal @created="refresh" />
        </template> -->
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="nameFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter by name or code..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <!-- Remove Delete Modal button -->
          <!--
          <FungsiTypesDeleteModal
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            @confirmed="deleteSelectedFungsiTypes"
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
          </FungsiTypesDeleteModal>
          -->
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
          <!-- Remove selected rows info -->
          <!--
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
          -->
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
import type { FungsiType } from '~/types'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
// Remove UCheckbox import
// const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'fungsi_name',
  value: ''
}])
const columnVisibility = ref()
// Remove rowSelection
// const rowSelection = ref({})

const { data, status, refresh } = await useFetch<FungsiType[]>('/api/fungsi-types', {
  lazy: true
})

// Remove deleteFungsiType and deleteSelectedFungsiTypes
/*
async function deleteFungsiType(id: number) {
  ...
}
async function deleteSelectedFungsiTypes() {
  ...
}
*/

// Remove getRowItems
/*
function getRowItems(row: Row<FungsiType>) {
  ...
}
*/

const columns: TableColumn<FungsiType>[] = [
  // Remove select column
  // {
  //   id: 'select',
  //   header: ({ table }) =>
  //     h(UCheckbox, {
  //       'modelValue': table.getIsSomePageRowsSelected()
  //         ? 'indeterminate'
  //         : table.getIsAllPageRowsSelected(),
  //       'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
  //         table.toggleAllPageRowsSelected(!!value),
  //       'ariaLabel': 'Select all'
  //     }),
  //   cell: ({ row }) =>
  //     h(UCheckbox, {
  //       'modelValue': row.getIsSelected(),
  //       'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
  //       'ariaLabel': 'Select row'
  //     })
  // },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'fungsi_name',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Fungsi Name',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.fungsi_name)
  },
  {
    accessorKey: 'fungsi_code',
    header: 'Fungsi Code',
    cell: ({ row }) => h('span', { class: 'font-mono text-muted' }, row.original.fungsi_code)
  },
  // Remove actions column
  // {
  //   id: 'actions',
  //   cell: ({ row }) => {
  //     return h(
  //       'div',
  //       { class: 'text-right' },
  //       h(
  //         UDropdownMenu,
  //         {
  //           content: {
  //             align: 'end'
  //           },
  //           items: getRowItems(row)
  //         },
  //         () =>
  //           h(UButton, {
  //             icon: 'i-lucide-ellipsis-vertical',
  //             color: 'neutral',
  //             variant: 'ghost',
  //             class: 'ml-auto'
  //           })
  //       )
  //     )
  //   }
  // }
]

const nameFilter = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('fungsi_name')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('fungsi_name')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>
