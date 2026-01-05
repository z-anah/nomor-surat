<template>
  <UDashboardPanel id="nomor-surat-list">
    <template #header>
      <UDashboardNavbar title="Nomor Surat List">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="searchFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by title or nomor surat..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
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
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} total records
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
import type { NomorSurat } from '~/types'

const supabase = useSupabaseClient()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

const table = useTemplateRef('table')
const router = useRouter()
const toast = useToast()

const columnFilters = ref([{
  id: 'title',
  value: ''
}])
const columnVisibility = ref()

const { data, error } = await supabase
  .from('ns_nomor_surat')
  .select(`
    *,
    ns_fungsi_type (fungsi_code),
    ns_sk_type (name),
    ns_user_profile (full_name)
  `)
  .order('created_at', { ascending: false })

const status = ref(error ? 'error' : 'success')
const refresh = async () => {
  const { data: newData, error: newError } = await supabase
    .from('ns_nomor_surat')
    .select(`
      *,
      ns_fungsi_type (fungsi_code),
      ns_sk_type (name),
      ns_user_profile (full_name)
    `)
    .order('created_at', { ascending: false })
  data.value = newData
  status.value = newError ? 'error' : 'success'
}

const columns: TableColumn<NomorSurat>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60
  },
  {
    accessorKey: 'generated_nomor_surat',
    header: 'Nomor Surat',
    cell: ({ row }) => h('span', { class: 'font-mono text-sm font-semibold text-highlighted' }, row.original.generated_nomor_surat)
  },
  {
    accessorKey: 'title',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Title',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.title)
  },
  {
    accessorKey: 'fungsi_name',
    header: 'Fungsi',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.ns_fungsi_type?.fungsi_code || '-')
  },
  {
    accessorKey: 'sk_type_name',
    header: 'SK Type',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.ns_sk_type?.name || '-')
  },
  {
    accessorKey: 'user_name',
    header: 'Created By',
    cell: ({ row }) => {
      const userName = row.original.ns_user_profile?.full_name || '-'
      if (userName === '-') return h('span', { class: 'text-sm text-muted' }, '-')
      
      return h(UTooltip, { text: userName }, {
        default: () => h(UAvatar, { alt: userName, size: 'md' })
      })
    }
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Created At',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return h('span', { class: 'text-sm text-muted' }, date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
  },
  // Actions column
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const fileUrl = row.original.file
      const progress = uploadProgress.value[row.original.id]
      // Set a fixed width for the actions cell
      return h('div', { style: { width: '100px', display: 'flex', justifyContent: 'center' } }, [
        progress !== undefined && progress < 100
          ? h(
              resolveComponent('UProgress'),
              {
                value: progress,
                max: 100,
                color: 'primary',
                size: 'sm',
                class: 'w-10'
              }
            )
          : fileUrl
          ? h(
              UButton,
              {
                icon: 'i-lucide-eye',
                color: 'primary',
                variant: 'ghost',
                title: 'See file',
                onClick: () => {
                  window.open(fileUrl, '_blank')
                }
              }
            )
          : [
              h(
                UButton,
                {
                  icon: 'i-lucide-upload',
                  color: 'primary',
                  variant: 'ghost',
                  title: 'Upload file',
                  onClick: () => {
                    fileInputRefs.value[row.original.id]?.click()
                  }
                }
              ),
              h('input', {
                type: 'file',
                accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
                style: { display: 'none' },
                ref: (el: any) => { fileInputRefs.value[row.original.id] = el },
                onChange: (e: Event) => handleFileUpload(row.original.id, e)
              })
            ]
      ])
    }
  }
]

const searchFilter = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('title')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('title')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// For file input dialog
const fileInputRefs = ref<{ [key: number]: HTMLInputElement | null }>({})
// Track upload progress per row
const uploadProgress = ref<{ [key: number]: number }>({})

// Handle file upload
async function handleFileUpload(nomorSuratId: number, event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const ext = file.name.split('.').pop()
  const filePath = `${Date.now()}.${ext}`

  // Reset progress
  uploadProgress.value[nomorSuratId] = 0

  // Upload to Supabase Storage with progress
  const { error: uploadError } = await supabase.storage
    .from('ns')
    .upload(filePath, file, {
      upsert: true,
      onUploadProgress: (event: ProgressEvent) => {
        if (event.lengthComputable) {
          uploadProgress.value[nomorSuratId] = Math.round((event.loaded / event.total) * 100)
        }
      }
    })

  // Remove progress bar after upload
  uploadProgress.value[nomorSuratId] = undefined

  if (uploadError) {
    console.error('Upload Error:', uploadError)
    toast.add({
      title: 'Upload Error',
      description: uploadError.message,
      color: 'error'
    })
    return
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('ns').getPublicUrl(filePath)
  const publicUrl = publicUrlData.publicUrl

  // Update file URL directly in Supabase
  const { error: updateError } = await supabase
    .from('ns_nomor_surat')
    .update({ file: publicUrl })
    .eq('id', nomorSuratId)

  if (updateError) {
    toast.add({
      title: 'Update Error',
      description: updateError.message || 'Failed to update file URL.',
      color: 'error'
    })
    return
  }

  toast.add({
    title: 'Success',
    description: 'File uploaded successfully.',
    color: 'success',
    duration: 2500,
  })

  refresh()
}
</script>
