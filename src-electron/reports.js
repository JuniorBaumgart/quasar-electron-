const db = require('./database')

async function getReports() {
  console.log(`Relatorios Encontrados: `)
  const result = await db.query(`SELECT CODIGO, NOME FROM RELATORIOS`)
  console.log(`Resultado da Consulta: `, result)
  return result
}

async function getReportParams(reportId) {
  console.log(`Acessando a função parametros para relatorios ${reportId}`)

  const params = await db.query(
    `SELECT NOME, TIPO FROM PARAMRELATORIOS WHERE CODRELATORIO = ? ORDER BY CODIGO`,
    [reportId],
  )

  console.log(`Parâmetros encontrados: `, params)

  return params.length > 0 ? params : []
}

async function executeReport(reportId, params) {
  const queryResult = await db.query(`SELECT SQL FROM RELATORIOS WHERE CODIGO = ?`, [reportId])

  console.log(queryResult)
  console.log(queryResult.length)
  console.log(queryResult[0].sql)

  if (!queryResult || queryResult.length === 0 || !queryResult[0].sql) {
    throw new Error(`Nenhuma query encontrada para o relatorio ${reportId}`)
  }

  let query = queryResult[0].sql.trim()
  console.log(`Query original: `, query)

  Object.keys(params).forEach((paramName) => {
    const paramValue = params[paramName]
    query = query.replace(new RegExp(`:${paramName}`, 'g'), `'${paramValue}`)
  })

  console.log(`Query final a ser executada: `, query)

  try {
    const result = await db.query(query)
    console.log(`Resultado da execução da query: `, result)
    return result
  } catch (error) {
    console.error(`Erro ao executar a query: `, error)
    throw error
  }
}

module.exports = { getReports, getReportParams, executeReport }
