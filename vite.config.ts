import basicSsl from '@vitejs/plugin-basic-ssl'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Safari en iOS con "Solo HTTPS" no abre http, y compartir o copiar exigen contexto seguro.
const conHttps = process.env.UBICALO_HTTPS === '1'

export default defineConfig({
  plugins: [svelte(), ...(conHttps ? [basicSsl()] : [])],
  server: {
    host: true,
  },
})
