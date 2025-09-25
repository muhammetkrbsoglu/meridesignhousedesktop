import { app, BrowserWindow, ipcMain, Notification } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  })

  // Maximize window and then show it
  win.maximize()
  win.show()
  
  await win.loadURL('http://localhost:5173')
}

app.whenReady().then(async () => {
  await createWindow()

  // Notification permission
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.meridesignhouse.desktop')
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// IPC handlers for notifications
ipcMain.handle('show-notification', async (event, options) => {
  try {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon || '⚠️',
      urgency: options.urgency || 'normal'
    })
    
    notification.show()
    return { success: true }
  } catch (error) {
    console.error('Error showing notification:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
