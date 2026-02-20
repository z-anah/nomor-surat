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

  <!-- Edit Modal -->
  <UModal v-model:open="showEditModal" title="Edit Nomor Surat">
    <template #body>
      <div class="space-y-4 p-4">
        <UFormField label="Title">
          <UInput v-model="editForm.title" class="w-full" required />
        </UFormField>
        <UFormField label="Replace Attachment (optional)">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            class="block w-full text-sm"
            @change="onEditFileChange"
          />
          <div v-if="editForm.currentFile" class="text-xs mt-1 text-muted">
            Current: <a :href="editForm.currentFile" target="_blank" class="text-primary underline">View file</a>
          </div>
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton color="neutral" variant="ghost" @click="showEditModal = false">Cancel</UButton>
        <UButton color="primary" :loading="editLoading" @click="handleEditSubmit">Save</UButton>
      </div>
    </template>
  </UModal>

  <!-- Delete Confirm Modal -->
  <UModal v-model:open="showDeleteModal" title="Delete Nomor Surat">
    <template #body>
      <p class="p-4">Are you sure you want to delete <strong>{{ deleteTarget?.generated_nomor_surat }}</strong>? This action cannot be undone.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton color="neutral" variant="ghost" @click="showDeleteModal = false">Cancel</UButton>
        <UButton color="error" :loading="deleteLoading" @click="handleDeleteConfirm">Delete</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { NomorSurat } from '~/types'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

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
const columnVisibility = ref({
  fungsi_name: false,
  sk_type_name: false
})

const userTypeId = ref<number | null>(null)
const userProfileId = ref<string | null>(null)
const isAdmin = ref(false)

if (user.value) {
  // Fetch user profile to get user_type_id and id
  console.log(user.value.sub);
  
  const { data: profile, error: profileError } = await supabase
    .from('ns_user_profile')
    .select('id, user_type_id, ns_user_type(name)')
    .eq('id', user.value.sub)
    .single()
  console.log(profile);
  if (!profileError && profile) {
    userTypeId.value = profile.user_type_id
    userProfileId.value = profile.id
    isAdmin.value = (profile.ns_user_type as any)?.name === 'admin'
  }
}

let query = supabase
  .from('ns_nomor_surat')
  .select(`
    *,
    ns_fungsi_type (fungsi_code),
    ns_sk_type (name),
    ns_user_profile (full_name)
  `)
  .order('created_at', { ascending: false })

if (userTypeId.value === 3 && userProfileId.value) {
  // Editor: only their own nomor surat
  query = query.eq('user_id', userProfileId.value)
}

const { data, error } = await query

const status = ref(error ? 'error' : 'success')
const refresh = async () => {
  let refreshQuery = supabase
    .from('ns_nomor_surat')
    .select(`
      *,
      ns_fungsi_type (fungsi_code),
      ns_sk_type (name),
      ns_user_profile (full_name)
    `)
    .order('created_at', { ascending: false })

  if (userTypeId.value === 3 && userProfileId.value) {
    refreshQuery = refreshQuery.eq('user_id', userProfileId.value)
  }

  const { data: newData, error: newError } = await refreshQuery
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
      const isLast = row.original.id === latestId.value
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
        // Edit button - admin only
        ...(isAdmin.value ? [
          h(UButton, {
            icon: 'i-lucide-pencil',
            color: 'neutral',
            variant: 'ghost',
            title: 'Edit title / file',
            size: 'sm',
            onClick: () => openEditModal(row.original)
          })
        ] : []),
        // Delete button - admin only, last record only
        ...(isAdmin.value ? [
          h(UButton, {
            icon: 'i-lucide-trash-2',
            color: 'error',
            variant: 'ghost',
            title: isLast ? 'Delete' : 'Can only delete the latest record first',
            size: 'sm',
            disabled: !isLast,
            onClick: () => isLast && openDeleteModal(row.original)
          })
        ] : []),
        // File view / upload
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
                size: 'sm',
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
                  size: 'sm',
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

// Latest record id (highest id = last created, must be deleted first)
const latestId = computed(() => {
  if (!data.value || !(data.value as any[]).length) return null
  return (data.value as any[]).reduce((max: number, row: any) => row.id > max ? row.id : max, (data.value as any[])[0].id)
})

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

// --- Edit modal ---
const showEditModal = ref(false)
const editLoading = ref(false)
const editForm = ref({ id: null as number | null, title: '', currentFile: '' })
const editFileObj = ref<File | null>(null)

function openEditModal(row: any) {
  editForm.value = { id: row.id, title: row.title, currentFile: row.file || '' }
  editFileObj.value = null
  showEditModal.value = true
}

function onEditFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  editFileObj.value = input.files?.[0] ?? null
}

async function handleEditSubmit() {
  if (!editForm.value.id) return
  editLoading.value = true
  let fileUrl = editForm.value.currentFile

  if (editFileObj.value) {
    const file = editFileObj.value
    const ext = file.name.split('.').pop()
    const filePath = `${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('ns')
      .upload(filePath, file, { upsert: true })
    if (uploadError) {
      toast.add({ title: 'Upload Error', description: uploadError.message, color: 'error' })
      editLoading.value = false
      return
    }
    const { data: urlData } = supabase.storage.from('ns').getPublicUrl(filePath)
    fileUrl = urlData.publicUrl
  }

  const { error: updateError } = await supabase
    .from('ns_nomor_surat')
    .update({ title: editForm.value.title, file: fileUrl })
    .eq('id', editForm.value.id)

  editLoading.value = false
  if (updateError) {
    toast.add({ title: 'Update Error', description: updateError.message, color: 'error' })
    return
  }
  toast.add({ title: 'Saved', description: 'Nomor surat updated.', color: 'success', duration: 2000 })
  showEditModal.value = false
  refresh()
}

// --- Delete modal ---
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const deleteTarget = ref<any>(null)

function openDeleteModal(row: any) {
  deleteTarget.value = row
  showDeleteModal.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  // Remove file from storage if exists
  if (deleteTarget.value.file) {
    const parts = deleteTarget.value.file.split('/')
    const fileName = parts[parts.length - 1]
    if (fileName) {
      await supabase.storage.from('ns').remove([fileName])
    }
  }
  const { error: deleteError } = await supabase
    .from('ns_nomor_surat')
    .delete()
    .eq('id', deleteTarget.value.id)
  deleteLoading.value = false
  if (deleteError) {
    toast.add({ title: 'Delete Error', description: deleteError.message, color: 'error' })
    return
  }
  toast.add({ title: 'Deleted', description: 'Nomor surat deleted.', color: 'success', duration: 2000 })
  showDeleteModal.value = false
  deleteTarget.value = null
  refresh()
}

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
