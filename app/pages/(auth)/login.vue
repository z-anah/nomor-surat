<script setup lang="ts">
import { ref, reactive } from 'vue'

definePageMeta({ layout: 'empty' })

const supabase = useSupabaseClient()

const loginForm = reactive({
  email: '',
  password: ''
})

const errors = ref<string[]>([])

const loading = ref(false)

async function handleLogin(e: Event) {
  e.preventDefault()
  errors.value = []
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: loginForm.email,
    password: loginForm.password
  })
  loading.value = false
  if (error) {
    errors.value.push(error.message)
  } else {
    const router = useRouter()
    await router.push('/')
  }
}
</script>
<template>
  <div class="flex items-center justify-center min-h-screen">
    <UPageCard
      title="Login"
      description="Sign in to your account using your email and password."
      variant="subtle"
      class="max-w-xs w-full"
    >
      <UForm class="flex flex-col gap-4" @submit="handleLogin">
        <UFormField name="email">
          <UInput
            v-model="loginForm.email"
            type="email"
            placeholder="Email"
            class="w-full"
          />
        </UFormField>
        <UFormField name="password">
          <UInput
            v-model="loginForm.password"
            type="password"
            placeholder="Password"
            class="w-full"
          />
        </UFormField>
        <UButton :label="loading ? 'Logging in...' : 'Login'" class="w-fit" type="submit" :loading="loading" />
        <div v-if="errors.length" class="text-red-500 text-sm mt-2">
          <div v-for="err in errors" :key="err">{{ err }}</div>
        </div>
      </UForm>
    </UPageCard>
  </div>  
</template>
