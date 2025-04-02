const { connectDatabase } = require('./database')

// 🔹 Função para executar um relatório
function executarRelatorio(reportId, parametros, callback) {
  connectDatabase((err, db) => {
    if (err) return callback(err, null)

    // 🔹 Recupera a query do relatório
    db.query('SELECT SQL FROM relatorios WHERE id = ?', [reportId], (err, rows) => {
      if (err) {
        db.detach()
        return callback(err, null)
      }

      if (rows.length === 0) {
        db.detach()
        return callback(new Error('Relatório não encontrado'), null)
      }

      let sql = rows[0].SQL

      // 🔹 Substitui os placeholders pelos valores reais
      Object.keys(parametros).forEach((param) => {
        const valor = parametros[param]
        sql = sql.replace(`:${param}`, `'${valor}'`)
      })

      // 🔹 Executa a query final
      db.query(sql, (err, resultado) => {
        db.detach()
        if (err) return callback(err, null)
        callback(null, resultado)
      })
    })
  })
}

module.exports = { executarRelatorio }
