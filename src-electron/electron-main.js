const { app, BrowserWindow, ipcMain } = require('electron')
const startServer = require('./server')
const path = require('path')
const fs = require('fs')
const PDFDocument = require('pdfkit-table')
const ExcelJS = require('exceljs')

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
      preload: path.join(__dirname, 'preload', 'electron-preload.cjs'),
      contextIsolation: true, // ✅ Mantendo segurança ao expor o ipcRenderer
      enableRemoteModule: false,
      nodeIntegration: true,
    },
  })

  // Carrega a interface do Quasar
  mainWindow.loadURL(process.env.APP_URL)
}

// ✅ Adicionamos aqui os handlers para PDF e Excel
ipcMain.handle('generatePDF', async (event, data) => {
  console.log('📄 Gerando PDF com os seguintes dados:', data)

  const filePath = path.join(app.getPath('desktop'), 'report.pdf')
  const doc = new PDFDocument({ margin: 30 })

  try {
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // ✅ Título do relatório
    doc.fontSize(18).text('Relatório Gerado', { align: 'center', underline: true })
    doc.moveDown(2)

    // ✅ Gerando cabeçalhos da tabela dinamicamente
    const headers = Object.keys(data[0] || {}) // Pega as chaves do primeiro item

    // ✅ Criando os dados para a tabela (array de arrays)
    const tableData = data.map((item) => headers.map((header) => item[header]))

    // ✅ Criando a tabela no PDF
    const table = {
      headers: headers,
      rows: tableData,
    }

    // ✅ Criar a tabela com pdfkit-table
    doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12),
      prepareRow: () => doc.font('Helvetica').fontSize(10),
    })

    doc.end()

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve({ success: true, filePath }))
      stream.on('error', (error) => reject({ success: false, error: error.message }))
    })
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('generateExcel', async (event, data) => {
  console.log('📊 Gerando Excel com os seguintes dados:', data)

  const filePath = path.join(app.getPath('desktop'), 'report.xlsx')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Relatório')

  // Criando cabeçalhos baseados nas chaves do primeiro item da lista
  if (data.length > 0) {
    sheet.addRow(Object.keys(data[0])) // Cabeçalhos

    // Adicionando dados
    data.forEach((item) => {
      sheet.addRow(Object.values(item))
    })
  }

  try {
    await workbook.xlsx.writeFile(filePath)
    return { success: true, filePath }
  } catch (error) {
    console.error('❌ Erro ao gerar Excel:', error)
    return { success: false, error: error.message }
  }
})

app.whenReady().then(createWindow)
