const { app, BrowserWindow, ipcMain } = require('electron')
const startServer = require('./server')
const path = require('path')
const os = require('os')
const fs = require('fs')
const jsPDF = require('jspdf').jsPDF
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable')
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
ipcMain.handle('generatePDF', async (event, reportData) => {
  try {
    console.log('📥 Recebendo dados para PDF:', reportData)

    if (!reportData || !reportData.length) {
      throw new Error('Os dados do relatório estão vazios ou inválidos.')
    }

    const doc = new jsPDF()
    doc.text('Relatório Gerado', 10, 10)

    const headers = Object.keys(reportData[0])
    const rows = reportData.map((row) => Object.values(row))

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 20,
      margin: { top: 20, left: 10, right: 10 },
      pageBreak: 'auto',
      showHead: 'everyPage',
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
      },
      bodyStyles: {
        fontSize: 5,
        overflow: 'auto',
      },
      headStyles: {
        fontSize: 5,
        overflow: 'auto',
      },
      didDrawPage: function (data) {
        if (data.pageCount > 1) {
          doc.text('Relatório Gerado', 10, 10)
        }
      },
      didDrawCell: function (data) {
        const pageWidth = doc.internal.pageSize.width
        const tableWidth = data.settings.tableWidth
        const scaleFactor = (pageWidth - 20) / tableWidth
        if (scaleFactor < 1) {
          doc.setFontSize(10 * scaleFactor)
        }
      },
    })

    const downloadsPath = path.join(os.homedir(), 'Downloads')
    const filePath = path.join(downloadsPath, `relatorio-${Date.now()}.pdf`)

    // 🔍 Loga o caminho antes de salvar
    console.log('📂 Salvando PDF em:', filePath)

    doc.save(filePath)

    // ✅ Confirma se o arquivo foi realmente gerado
    if (!fs.existsSync(filePath)) {
      throw new Error('Falha ao salvar o arquivo PDF.')
    }

    console.log('✅ PDF gerado com sucesso:', filePath)
    return { success: true, filePath }
  } catch (error) {
    console.error('❌ Erro ao gerar PDF no Electron:', error)
    return { success: false, error: error.message || 'Erro desconhecido ao gerar PDF' }
  }
})

ipcMain.handle('generateExcel', async (event, data) => {
  console.log('📊 Gerando Excel com os seguintes dados:', data)

  const downloadsPath = path.join(os.homedir(), 'Downloads')
  const filePath = path.join(downloadsPath, `relatorio-${Date.now()}.xlsx`)
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
