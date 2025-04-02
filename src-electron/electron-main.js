const { app, BrowserWindow } = require('electron')
//import path from 'path'
require('./server')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreference: {
      nodeIntegration: true,
    },
  })

  //Carrega a interface do Quasar
  mainWindow.loadURL(process.env.APP_URL)
}

app.whenReady().then(createWindow)
