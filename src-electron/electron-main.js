const { app, BrowserWindow } = require('electron')
const startServer = require('./server')

let mainWindow

async function createWindow() {
  try {
    await startServer() // Aguarda o servidor iniciar antes de abrir a janela
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error)
    return
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  // Carrega a interface do Quasar
  mainWindow.loadURL(process.env.APP_URL)
}

app.whenReady().then(createWindow)
