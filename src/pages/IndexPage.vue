<template>
  <q-page class="q-pa-md">
    <h1>Bem-vindo ao App</h1>
    <q-btn label="Gerar Relatório" color="primary" @click="gerarRelatorio" />
  </q-page>
</template>

<script>
export default {
  methods: {
    gerarRelatorio() {
      window.electron.ipcRenderer.send('gerar-relatorio')
    },
  },
}
</script>
