const { contextBridge, ipcRenderer } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const dotenv = require('dotenv')

// Load .env from project root of desktop-app
try {
  const envPath = path.join(__dirname, '..', '..', '.env')
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
} catch {}

contextBridge.exposeInMainWorld('mdh', {
  ping: () => 'pong',
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    VITE_ENVIRONMENT: process.env.VITE_ENVIRONMENT
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (options) => ipcRenderer.invoke('show-notification', options)
})
