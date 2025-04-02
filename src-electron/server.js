const express = require('express')
const cors = require('cors')
const { connectDatabase } = require('./database')
const { executarRelatorio } = require('./reports')

const app = express()
const PORT = 3000

app.use(express.json())
app.use(cors()) // 🔹 Permite requisições do frontend

// 🔹 Teste de status do servidor
app.get('/', (req, res) => {
  res.send('🔥 Backend rodando corretamente!')
})

// 🔹 Rota para listar relatórios
app.get('/reports', (req, res) => {
  connectDatabase((err, db) => {
    if (err) return res.status(500).json({ erro: 'Erro ao conectar ao banco' })

    db.query('SELECT codigo, nome FROM relatorios', (err, rows) => {
      db.detach()
      if (err) return res.status(500).json({ erro: err.message })
      res.json(rows)
    })
  })
})

// 🔹 Rota para obter parâmetros do relatório
app.get('/reports/:id/params', (req, res) => {
  const reportId = req.params.id

  connectDatabase((err, db) => {
    if (err) return res.status(500).json({ erro: 'Erro ao conectar ao banco' })

    db.query(
      'SELECT nome, tipo FROM paramrelatorios WHERE codrelatorio = ? ORDER BY codigo',
      [reportId],
      (err, rows) => {
        db.detach()
        if (err) return res.status(500).json({ erro: err.message })
        res.json(rows)
      },
    )
  })
})

// 🔹 Rota para executar relatório
app.post('/reports/:id/execute', (req, res) => {
  const reportId = req.params.id
  const parametros = req.body.params

  executarRelatorio(reportId, parametros, (err, resultado) => {
    if (err) return res.status(500).json({ erro: err.message })
    res.json(resultado)
  })
})

// 🔹 Função para iniciar o servidor
function startServer() {
  return new Promise((resolve, reject) => {
    app.listen(PORT, (err) => {
      if (err) {
        console.error('Erro ao iniciar o servidor:', err)
        reject(err)
      } else {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
        resolve()
      }
    })
  })
}

module.exports = startServer
