const { connectDatabase } = require('./database')

// 🔹 Função para executar um relatório
function executarRelatorio(reportId, parametros, callback) {
  connectDatabase((err, db) => {
    if (err) {
      console.error('🔥 Erro ao conectar ao banco de dados:', err)
      return callback(err, null)
    }

    console.log('📌 Buscando SQL do relatório ID:', reportId)

    db.query('SELECT SQL FROM relatorios WHERE codigo = ?', [reportId], (err, sql) => {
      if (err) {
        console.error('🔥 Erro ao buscar SQL do relatório:', err)
        db.detach()
        return callback(err, null)
      }
      console.log('resultado do sql: ', sql)

      if (sql.length === 0) {
        console.warn('⚠ Relatório não encontrado para o ID:', reportId)
        db.detach()
        return callback(new Error('Relatório não encontrado'), null)
      }
      let sqlString = sql[0].sql // Pegando a string SQL correta
      console.log('✅ SQL carregado:', sqlString)

      // 🔹 Substituir os placeholders pelos valores reais
      try {
        Object.keys(parametros).forEach((param) => {
          const valor = parametros[param]
          console.log(`🔄 Substituindo parâmetro: :${param} → '${valor}'`)
          sqlString = sqlString.replace(new RegExp(`:${param}`, 'g'), `'${valor}'`)
        })
      } catch (err) {
        console.error('🔥 Erro ao substituir parâmetros:', err)
        db.detach()
        return callback(err, null)
      }

      console.log('📌 Executando SQL:', sqlString)

      db.query(sqlString, (err, resultado) => {
        db.detach()
        if (err) {
          console.error('🔥 Erro ao executar SQL:', err)
          return callback(err, null)
        }
        console.log('✅ Relatório executado com sucesso!')
        callback(null, resultado)
      })
    })
  })
}

module.exports = { executarRelatorio }
