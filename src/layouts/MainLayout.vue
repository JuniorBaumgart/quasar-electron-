<template>
  <q-layout view="hHh lpR fFf">
    <!-- Barra Lateral -->
    <q-drawer show-if-above bordered class="sidebar">
      <q-toolbar>
        <q-toolbar-title>
          <q-img src="../assets/quasar-logo-vertical.svg" width="25px" class="q-mr-sm" /> Relatórios
        </q-toolbar-title>
      </q-toolbar>

      <q-select
        v-model="selectedReport"
        :options="reportOptions"
        label="Selecione um relatório"
        option-value="codigo"
        option-label="nome"
        @update:model-value="onReportSelected"
      />

      <div v-if="params.length > 0">
        <q-input
          v-for="(param, index) in params"
          :key="index"
          v-model="param.value"
          :label="param.nome"
          :type="getInputType(param.tipo)"
          class="q-mb-md"
        />
      </div>

      <q-btn
        label="Gerar Relatório"
        icon="article"
        color="primary"
        class="full-width q-mb-md"
        @click="generateReport"
      />

      <q-btn
        label="Gerar PDF"
        icon="picture_as_pdf"
        color="red"
        class="full-width q-mb-md"
        :disable="!reportData.length"
        @click="generatePDF"
      />

      <q-btn
        label="Gerar Excel"
        icon="table_chart"
        color="green"
        class="full-width"
        :disable="!reportData.length"
        @click="generateExcel"
      />
    </q-drawer>

    <!-- Área Principal -->
    <q-page-container>
      <q-page class="content">
        <h1>Resultados</h1>
        <div v-if="reportData.length > 0">
          <q-markup-table>
            <thead>
              <tr>
                <th v-for="(key, index) in Object.keys(reportData[0])" :key="index">{{ key }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in reportData" :key="rowIndex">
                <td v-for="(value, keyIndex) in row" :key="keyIndex">{{ value }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
        <p v-else>Nenhum dado encontrado.</p>
      </q-page>
    </q-page-container>

    <!-- Overlay de Carregamento -->
    <q-dialog v-model="loading">
      <q-card>
        <q-card-section class="text-center">
          <q-spinner color="primary" size="3em" />
          <p>Carregando...</p>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

// 🔹 Verifica se está rodando no Electron antes de importar ipcRenderer
const isElectron = typeof window !== 'undefined' && window.process && window.process.type
const ipcRenderer = isElectron ? window.require('electron').ipcRenderer : null

export default {
  setup() {
    const $q = useQuasar()

    const selectedReport = ref('')
    const reportOptions = ref([])
    const params = ref([])
    const reportData = ref([])
    const loading = ref(false)

    // Testa a comunicação com o Electron
    function testElectron() {
      if (isElectron && window.electron) {
        const fullPath = window.electron.joinPath('C:', 'Users', 'Suporte_06', 'Desktop')
        console.log('Caminho completo:', fullPath)
      } else {
        console.log('Rodando no navegador, Electron não disponível.')
      }
    }

    // Carregar lista de relatórios
    async function loadReports() {
      try {
        const response = await fetch('http://localhost:3000/reports')
        const data = await response.json()

        console.log('🔹 API Retornou:', data) // Debugando a resposta

        if (!Array.isArray(data)) {
          console.error('❌ API retornou um objeto, mas deveria ser um array:', data)
          return
        }

        // Convertendo os dados para o formato correto
        reportOptions.value = data.map((r) => ({
          codigo: r.codigo, // Nome visível no dropdown
          nome: r.nome, // Codigo usado no v-model
        }))
      } catch (error) {
        console.error('❌ Erro ao carregar relatórios:', error)
      }
    }

    function onReportSelected(newValue) {
      console.log('📌 Novo relatório selecionado:', newValue)

      if (!newValue) {
        console.warn('⚠ Nenhum relatório selecionado')
        return
      }

      // Agora `selectedReport` é um objeto, então extraímos o código
      selectedReport.value = newValue

      console.log('✅ selectedReport atualizado:', selectedReport.value)
      console.log('✅ tentando acessar as variaveis do objeto: ', selectedReport.value.codigo)
      console.log('✅ tentando acessar as variaveis do objeto: ', selectedReport.value.nome)

      loadParams()
    }

    async function loadParams() {
      console.log(`✅ Buscando parâmetros para o relatório ID: ${selectedReport.value.codigo}`)

      if (!selectedReport.value.codigo || isNaN(selectedReport.value.codigo)) {
        console.error('❌ selectedReport não é um número válido:', selectedReport.value.codigo)
        return
      }

      try {
        const response = await fetch(
          `http://localhost:3000/reports/${selectedReport.value.codigo}/params`,
        )
        const data = await response.json()

        console.log('📌 Parâmetros carregados:', data)

        if (!Array.isArray(data)) {
          console.error('❌ A API retornou um formato inválido:', data)
          return
        }

        // Atualizando `params` com os parâmetros recebidos, incluindo o tipo
        params.value = data.map((param) => ({
          nome: param.nome,
          tipo: param.tipo, // Supondo que a API retorna o tipo do parâmetro
          value: '', // Inicia o campo vazio para o usuário preencher
        }))
      } catch (error) {
        console.error('❌ Erro ao carregar parâmetros:', error)
      }
    }

    function getInputType(tipo) {
      switch (tipo) {
        case 'string':
          return 'text'
        case 'integer':
        case 'float':
        case 'double':
          return 'number'
        case 'date':
          return 'date'
        case 'boolean':
          return 'checkbox'
        default:
          return 'text'
      }
    }

    // Gerar relatório
    async function generateReport() {
      if (!selectedReport.value) return

      const paramsObj = {}
      params.value.forEach((param) => {
        paramsObj[param.nome] = param.value
      })

      console.log('📌 Enviando parâmetros para o backend:', paramsObj)

      loading.value = true
      try {
        const response = await fetch(
          `http://localhost:3000/reports/${selectedReport.value.codigo}/execute`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: paramsObj }),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.erro || 'Erro desconhecido no backend')
        }

        reportData.value = await response.json()
        console.log('✅ Resposta da API:', reportData.value)
      } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error.message)
        $q.notify({ type: 'negative', message: error.message })
      } finally {
        loading.value = false
      }
    }

    // Gerar PDF
    async function generatePDF() {
      if (!isElectron || !ipcRenderer) {
        console.warn('Electron não está disponível!')
        return
      }

      if (reportData.value.length === 0) {
        $q.notify({ type: 'warning', message: 'Impossível gerar relatório vazio' })
        return
      }

      loading.value = true
      try {
        const filePath = await ipcRenderer.invoke('generatePDF', reportData.value)
        $q.notify({ type: 'positive', message: `PDF gerado: ${filePath}` })
      } catch (error) {
        console.error('Erro ao gerar PDF:', error)
        $q.notify({ type: 'negative', message: 'Erro ao gerar PDF' })
      } finally {
        loading.value = false
      }
    }

    // Gerar Excel
    async function generateExcel() {
      if (!isElectron || !ipcRenderer) {
        console.warn('Electron não está disponível!')
        return
      }

      if (reportData.value.length === 0) {
        $q.notify({ type: 'warning', message: 'Impossível gerar relatório vazio' })
        return
      }

      loading.value = true
      try {
        const filePath = await ipcRenderer.invoke('generateExcel', reportData.value)
        $q.notify({ type: 'positive', message: `Excel gerado: ${filePath}` })
      } catch (error) {
        console.error('Erro ao gerar Excel:', error)
        $q.notify({ type: 'negative', message: 'Erro ao gerar Excel' })
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadReports()
      testElectron() // Testa a comunicação com Electron ao iniciar
    })

    return {
      selectedReport,
      reportOptions,
      params,
      reportData,
      loading,
      loadParams,
      generateReport,
      generatePDF,
      generateExcel,
      onReportSelected,
      getInputType,
    }
  },
}
</script>
