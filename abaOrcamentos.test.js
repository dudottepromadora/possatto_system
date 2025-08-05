// Mock dos helpers necessários (ajuste conforme suas funções)
const utils = {
  formatarMoeda: v => 
    'R$ ' + Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})
};

const orcamentoTeste = {
  nomeCliente: "Rodrigo Rodrigues Freitas",
  cpfCliente: "889.264.781-49",
  telefoneCliente: "47996065173",
  tipoProjeto: "Quarto",
  nomeArquiteto: "Andressa",
  prazoEntrega: "2025-09-17",
  enderecoEntrega: "Rua 280, n°138, no bairro Castelo Branco, município de Itapema/SC.",
  ambientes: [
    {
      nome: "quarto",
      moveis: [
        {
          nome: "Roupeiro 3 portas",
          dimensoes: { largura: 200, altura: 200, profundidade: 75 },
          materiais: [
            { nome: "MDF Branco TX 6mm", quantidade: 2, preco: 150, total: 300 },
            { nome: "MDF Branco TX 15 mm", quantidade: 4, preco: 200, total: 800 },
            { nome: "MDF Colorido TX 18 mm", quantidade: 2, preco: 350, total: 700 },
            { nome: "Fita 22mm Rolo", quantidade: 2, preco: 80, total: 160 },
            { nome: "Corrediça Invisível com amortecedor", quantidade: 4, preco: 35, total: 140 }
          ],
          ferragens: [
            { nome: "Trilho Sup/Inf – Aéreo/Balcão", quantidade: 1, preco: 100, total: 100 },
            { nome: "Puxador - Perfil Slim", quantidade: 1, preco: 135, total: 135 },
            { nome: "KIT – Porta de Correr – RO-47", quantidade: 2, preco: 35, total: 70 }
          ],
          acessorios: [],
          especiais: []
        }
      ]
    }
  ],
  fatorMultiplicador: 3,
  percentRT: 10,
  percentAdicional: 10
};

// Função de cálculo corrigida conforme seu sistema ideal
function calcularOrcamento(orc) {
  let totalMateriais = 0, totalFerragens = 0, totalAcessorios = 0, totalEspeciais = 0;
  orc.ambientes.forEach(amb => {
    amb.moveis.forEach(movel => {
      totalMateriais += movel.materiais.reduce((s, m) => s + (m.total || m.preco * m.quantidade), 0);
      totalFerragens += movel.ferragens.reduce((s, f) => s + (f.total || f.preco * f.quantidade), 0);
      totalAcessorios += movel.acessorios.reduce((s, a) => s + (a.total || a.preco * a.quantidade), 0);
      totalEspeciais += movel.especiais.reduce((s, e) => s + (e.total || e.preco * e.quantidade), 0);
    });
  });
  const totalComFator = totalMateriais * orc.fatorMultiplicador;
  const subtotal = totalComFator + totalFerragens + totalAcessorios + totalEspeciais;
  const valorRT = subtotal * (orc.percentRT / 100);
  // AJUSTE: Adicional calculado só sobre o subtotal
  const valorAdicional = subtotal * (orc.percentAdicional / 100);
  const valorFinal = subtotal + valorRT + valorAdicional;
  return {
    totalMateriais,
    totalComFator,
    totalFerragens,
    totalAcessorios,
    totalEspeciais,
    subtotal,
    valorRT,
    valorAdicional,
    valorFinal
  };
}

// Teste Jest
describe('Cálculo de orçamento - Orçamentos.js', () => {
  it('deve calcular todos os valores corretamente', () => {
    const resultado = calcularOrcamento(orcamentoTeste);

    expect(resultado.totalMateriais).toBe(2100);
    expect(resultado.totalComFator).toBe(6300);
    expect(resultado.totalFerragens).toBe(305);
    expect(resultado.totalAcessorios).toBe(0);
    expect(resultado.totalEspeciais).toBe(0);
    expect(resultado.subtotal).toBe(6605);
    expect(resultado.valorRT).toBeCloseTo(660.5, 1);
    expect(resultado.valorAdicional).toBeCloseTo(660.5, 1);
    expect(resultado.valorFinal).toBeCloseTo(7926, 1);
    expect(utils.formatarMoeda(resultado.valorFinal)).toBe('R$ 7.926,00');
  });

  it('deve calcular o valor final com uma lógica diferente para o valor adicional', () => {
    // Esta função simula a lógica de cálculo de `calcularAnalisePrecos` em abaOrcamentos.js
    function calcularComLogicaDoSistema(orc) {
      // No sistema, o cálculo é baseado em `valorCusto` e `valorVenda` por móvel,
      // não em materiais individuais. Vamos simular isso.
      let custoTotal = 0;
      let vendaBase = 0;

      orc.ambientes.forEach(amb => {
        amb.moveis.forEach(movel => {
          // Simula o valorCusto como a soma de todos os itens
          const custoMateriais = movel.materiais?.reduce((s, i) => s + i.total, 0) || 0;
          const custoFerragens = movel.ferragens?.reduce((s, i) => s + i.total, 0) || 0;
          const custoAcessorios = movel.acessorios?.reduce((s, i) => s + i.total, 0) || 0;
          const custoEspeciais = movel.especiais?.reduce((s, i) => s + i.total, 0) || 0;
          
          custoTotal += custoMateriais + custoFerragens + custoAcessorios + custoEspeciais;

          // Simula o valorVenda baseado no custo e fator, como o sistema faria se a venda não fosse manual
          // O fator multiplicador se aplica apenas aos materiais.
          vendaBase += (custoMateriais * orc.fatorMultiplicador) + custoFerragens + custoAcessorios + custoEspeciais;
        });
      });
      
      // Lógica de cálculo de `calcularAnalisePrecos`
      const valorRT = vendaBase * (orc.percentRT / 100);
      // A diferença principal está aqui: o adicional é calculado sobre (venda + RT)
      const valorAdicional = (vendaBase + valorRT) * (orc.percentAdicional / 100);
      const valorFinal = vendaBase + valorRT + valorAdicional;

      return {
        custoTotal,
        vendaBase,
        valorRT,
        valorAdicional,
        valorFinal
      };
    }

    const resultadoSistema = calcularComLogicaDoSistema(orcamentoTeste);

    // O custo total é a soma de materiais e ferragens
    const custoTotalEsperado = 2100 + 305; // 2405
    // A venda base é (materiais * fator) + ferragens
    const vendaBaseEsperada = (2100 * orcamentoTeste.fatorMultiplicador) + 305; // (2100 * 3) + 305 = 6605
    const valorRTEsperado = vendaBaseEsperada * (orcamentoTeste.percentRT / 100); // 6605 * 0.10 = 660.5
    const valorAdicionalEsperado = (vendaBaseEsperada + valorRTEsperado) * (orcamentoTeste.percentAdicional / 100); // (6605 + 660.5) * 0.10 = 726.55
    const valorFinalEsperado = vendaBaseEsperada + valorRTEsperado + valorAdicionalEsperado; // 6605 + 660.5 + 726.55 = 7992.05

    expect(resultadoSistema.custoTotal).toBe(custoTotalEsperado);
    expect(resultadoSistema.vendaBase).toBe(vendaBaseEsperada);
    expect(resultadoSistema.valorRT).toBeCloseTo(valorRTEsperado, 2);
    expect(resultadoSistema.valorAdicional).toBeCloseTo(valorAdicionalEsperado, 2);
    expect(resultadoSistema.valorFinal).toBeCloseTo(valorFinalEsperado, 2);
    expect(utils.formatarMoeda(resultadoSistema.valorFinal)).toBe('R$ 7.992,05');
  });
});
