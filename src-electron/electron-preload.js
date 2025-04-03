const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
  generatePDF: (data) => ipcRenderer.invoke('generatePDF', data),
  generateExcel: (data) => ipcRenderer.invoke('generateExcel', data),
  joinPath: (...args) => path.join(...args),
})
