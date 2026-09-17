import basicSsl from '@vitejs/plugin-basic-ssl'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// Safari en iOS con "Solo HTTPS" no abre http, y compartir o copiar exigen contexto seguro.
const conHttps = process.env.UBICALO_HTTPS === '1'

export default defineConfig({
  plugins: [svelte(), ...(conHttps ? [basicSsl()] : [])],
  server: {
    host: true,
  },
  // La proyección compuesta se publica como ESM con imports sin extensión, que Node no resuelve.
  test: {
    server: { deps: { inline: ['d3-composite-projections'] } },
  },
})
