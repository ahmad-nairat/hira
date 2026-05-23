import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Docker bind mounts on WSL2 don't reliably propagate inotify; poll instead.
    watch: { usePolling: true, interval: 300 },
  },
  preview: { port: 5173, host: true },
})
