const Firebird = require('node-firebird')

const options = {
  host: '10.1.1.132',
  port: 3050,
  database: 'WAGNER',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: true,
}

// Função para conectar ao banco
function connectDatabase(callback) {
  Firebird.attach(options, (err, db) => {
    if (err) return callback(err, null)
    callback(null, db) // 🔹 Retorna a conexão para ser usada nas consultas
  })
}

module.exports = { connectDatabase }
