function testarModuloGerarPDF() {
    const resultados = {
        moduloCarregado: !!window.gerarPDF,
        gerarPDFOrcamento: typeof window.gerarPDF?.gerarPDFOrcamento === 'function',
        gerarPDFContrato: typeof window.gerarPDF?.gerarPDFContrato === 'function',
        gerarListaMateriais: typeof window.gerarPDF?.gerarListaMateriais === 'function',
        abrirModalConfigContrato: typeof window.gerarPDF?.abrirModalConfigContrato === 'function',
        fecharModalConfigContrato: typeof window.gerarPDF?.fecharModalConfigContrato === 'function',
        versao: window.gerarPDF?.versao || 'não disponível'
    };

    // Exibe o resultado no console
    console.table(resultados);

    // Mensagem resumida para facilitar o entendimento rápido
    if (resultados.moduloCarregado &&
        resultados.gerarPDFOrcamento &&
        resultados.gerarPDFContrato &&
        resultados.gerarListaMateriais) {
        alert('✅ Módulo gerarPDF carregado e todas as funções principais disponíveis!\nVersão: ' + resultados.versao);
    } else {
        alert('❌ Atenção: Alguma função principal do gerarPDF não está disponível! Veja o console para detalhes.');
    }
    return resultados;
}

// Use assim:
testarModuloGerarPDF();
