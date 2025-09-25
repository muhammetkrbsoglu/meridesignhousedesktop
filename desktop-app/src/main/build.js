const { app, BrowserWindow } = require('electron')
const path = require('node:path')
// CommonJS ortamında Node zaten __dirname ve __filename sağlar

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
      experimentalFeatures: false,
      sandbox: false
    }
  })

  // Maximize window and then show it
  win.maximize()
  win.show()
  
  await win.loadFile(path.join(__dirname, '..', '..', 'dist', 'renderer', 'index.html'))
}

app.whenReady().then(async () => {
  await createWindow()
})
