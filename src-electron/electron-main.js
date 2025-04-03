const { app, BrowserWindow, ipcMain } = require('electron')
const startServer = require('./server')
const path = require('path')
const fs = require('fs')

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
      contextIsolation: true, // ✅ Mantendo segurança ao expor o ipcRenderer
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  })

  // Carrega a interface do Quasar
  mainWindow.loadURL(process.env.APP_URL)
}

// ✅ Adicionamos aqui os handlers para PDF e Excel
ipcMain.handle('generatePDF', async (event, data) => {
  console.log('📄 Gerando PDF com os seguintes dados:', data)

  // Simulação de geração de PDF
  const filePath = path.join(app.getPath('desktop'), 'report.pdf')

  try {
    fs.writeFileSync(filePath, 'Conteúdo do PDF Simulado', 'utf-8')
    return { success: true, filePath }
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('generateExcel', async (event, data) => {
  console.log('📊 Gerando Excel com os seguintes dados:', data)

  const filePath = path.join(app.getPath('desktop'), 'report.xlsx')

  try {
    fs.writeFileSync(filePath, 'Conteúdo do Excel Simulado', 'utf-8')
    return { success: true, filePath }
  } catch (error) {
    console.error('❌ Erro ao gerar Excel:', error)
    return { success: false, error: error.message }
  }
})

app.whenReady().then(createWindow)
