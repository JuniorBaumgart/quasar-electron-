const express = require('express')
const { connectDatabase } = require('./database')
const { executarRelatorio } = require('./reports')

const app = express()
app.use(express.json())

app.get('/dados', (req, res) => {
  connectDatabase((err, db) => {
    if (err) {
      return res.status(500).send('Erro ao conectar ao banco')
    }

    db.query('SELECT * FROM sua_tabela', (err, rows) => {
      db.detach()
      if (err) return res.status(500).send(err)
      res.json(rows)
    })
  })
})

// Rota para relatórios
app.post('/relatorio', (req, res) => {
  const { reportId, parametros } = req.body

  executarRelatorio(reportId, parametros, (err, resultado) => {
    if (err) return res.status(500).json({ erro: err.message })
    res.json(resultado)
  })
})

module.exports = app
