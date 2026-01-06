export default defineNuxtConfig({
  // GitHub Pages = SPA only
  ssr: false,

  // Required for GitHub Pages subpath
  app: {
    baseURL: '/nomor-surat/',
  },

  // Static preset for GitHub Pages
  nitro: {
    preset: 'github_pages',
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  // ✅ Supabase SPA auth configuration
  supabase: {
    redirect: false,
    clientOptions: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  },

  css: [
    '~/assets/css/main.css',
  ],

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },

  // Public runtime config only (SPA)
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
})
