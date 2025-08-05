/**
 * ========================================
 * POSSATTO PRO v7.0 - gerarPDF.js
 * Módulo de Geração de PDFs - VERSÃO REFINADA
 * ========================================
 * 
 * REFINAMENTOS VISUAIS APLICADOS:
 * - Design profissional seguindo modelos de referência
 * - Hierarquia visual clara com tamanhos de fonte apropriados
 * - Espaçamento generoso e layout limpo
 * - Tabelas com cabeçalhos destacados
 * - Tratamento robusto de dados ausentes
 * - Compatibilidade total com impressão A4
 * 
 * DEPENDÊNCIAS:
 * - jsPDF (biblioteca externa)
 * - utils.js
 * - abaEmpresa.js
 * - abaOrcamentos.js
 */

(function () {
    'use strict';

    // ==================== CONFIGURAÇÕES VISUAIS REFINADAS ====================
    const CONFIG = {
        // Margens e dimensões
        margemEsquerda: 20,
        margemDireita: 20,
        margemSuperior: 20,
        margemInferior: 20,
        larguraPagina: 210, // A4
        alturaPagina: 297, // A4
        larguraUtil: 170, // larguraPagina - margemEsquerda - margemDireita

        // Fontes e tamanhos (hierarquia visual)
        fontePadrao: 'helvetica',
        fonteTitulo: 22,
        fonteSubtitulo: 16,
        fonteCorpo: 13,
        fontePequena: 11,
        fonteRodape: 9,

        // Cores do tema
        corPrimaria: [44, 62, 80], // Azul escuro profissional
        corSecundaria: [52, 73, 94], // Azul médio
        corDestaque: [41, 128, 185], // Azul institucional
        corCinzaClaro: [240, 240, 240], // Fundo de tabelas
        corCinzaMedio: [200, 200, 200], // Linhas
        corCinzaEscuro: [100, 100, 100], // Textos secundários
        corPreto: [0, 0, 0], // Texto principal

        // Espaçamentos
        espacoEntreLinha: 7,
        espacoEntreSecoes: 15,
        espacoEntreParagrafos: 10,

        versao: '7.0'
    };

    // Configurações do contrato pré-cadastradas
    let configContrato = {
        titulo: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
        subtitulo: "IDENTIFICAÇÃO DAS PARTES CONTRATANTES",
        contratada: "Mateus Pinheiro da Silva, portador do número de CPF: 080.791.959-43, RG: 13.311.902-7, residente e domiciliado na Rua 448, n° 868, bairro Morretes, no município de Itapema/SC. Representante da empresa POSSATTO MOVEIS SOB MEDIDA, inscrita no número de CNPJ: 51.297.130/0001-79, domiciliada na Rua 444, n° 1097, bairro Morretes, no município de Itapema/SC.",
        acordoObjeto: `As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de serviços, que se regerá pelas cláusulas seguintes e pelas condições de preço, forma de pagamento e termo de pagamento descritas no presente contrato.

DO OBJETO DO CONTRATO
Cláusula 1ª. É objeto do presente contrato a prestação do serviço de produção e instalação de móveis planejados, além da instalação da elétrica para nas seguintes especificações: Móveis sob medida, elétricas dos móveis como interruptores, led e tomadas, espelhos e vidros, serralherias como no projeto.`,
        obrigacoes: `OBRIGAÇÕES DO CONTRATANTE
Cláusula 2ª. O CONTRATANTE deverá fornecer ao CONTRATADO todas as informações necessárias à realização do serviço, devendo especificar os detalhes necessários à perfeita consecução do mesmo, e a forma de como ele deve ser entregue.
Cláusula 3ª. O CONTRATANTE deverá efetuar o pagamento na forma e condições estabelecidas na cláusula 6ª.

OBRIGAÇÕES DO CONTRATADO
Cláusula 4ª. É dever do CONTRATADO oferecer ao contratante a cópia do presente instrumento, contendo todas as especificidades da prestação de serviço contratada.
Cláusula 5ª. O CONTRATADO deverá fornecer recibos, referente ao(s) pagamento(s) efetuado(s) pelo CONTRATANTE.

DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO
Cláusula 6ª. O presente serviço será remunerado pela quantia de`,
        clausulasFinais: `DO INADIMPLEMENTO
Cláusula 7ª. Em caso de inadimplemento por parte do CONTRATANTE quanto ao pagamento do serviço prestado, deverá incidir sobre o valor do presente instrumento, multa pecuniária de 10% (dez por cento), juros de moral de 1% (um por cento) ao mês e correção monetária.

DA RESCISÃO IMOTIVADA
Cláusula 8ª. Caso o CONTRATANTE queira rescindir o presente instrumento, sem que haja qualquer tipo de motivo relevante, não obstante, a outra parte deverá ser restituída das despesas que possa ter ocorrido pela compra de materiais, dentre outras necessárias para execução do projeto, acrescida de multa de 10% (dez por cento) do valor total do serviço.
Cláusula 9ª Em caso de inadimplência da entrega do serviço de fabricação e instalação de móveis sob medida por parte do CONTRATADO, deverá incidir sobre o valor do presente instrumento, multa de 10% (dez por cento) sobre o valor total do contrato.

DO PRAZO
Cláusula 10ª. O CONTRATADO assume o compromisso de realizar o serviço dentro do prazo de em média 60 dias corridos após a entrada, de acordo com a forma estabelecida no presente contrato, podendo o mesmo ser alterado desde que acordado previamente entre as partes.

DO FORO
Cláusula 11ª. Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro da comarca de Itapema/SC.

Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor de igual forma e teor.`,
        precoCondicoes: ""
    };

    // ==================== FUNÇÕES AUXILIARES DE DESIGN ====================

    /**
     * Adiciona cabeçalho profissional ao PDF
     * @param {jsPDF} doc - Instância do documento PDF
     * @param {Object} dadosEmpresa - Dados da empresa
     * @param {string} titulo - Título do documento
     * @returns {number} Posição Y após o cabeçalho
     */
    function adicionarCabecalhoProfissional(doc, dadosEmpresa, titulo) {
        let yPos = CONFIG.margemSuperior;

        // Container do cabeçalho com fundo sutil
        doc.setFillColor(...CONFIG.corCinzaClaro);
        doc.roundedRect(CONFIG.margemEsquerda - 5, yPos - 5, CONFIG.larguraUtil + 10, 45, 3, 3, 'F');

        // Logo da empresa (se disponível)
        if (dadosEmpresa.logo) {
            try {
                doc.addImage(dadosEmpresa.logo, 'JPEG', CONFIG.margemEsquerda, yPos, 50, 25);
            } catch (e) {
                console.warn('Logo não carregada:', e);
            }
        }

        // Nome da empresa
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...CONFIG.corPrimaria);
        const nomeEmpresa = dadosEmpresa.nome || 'POSSATTO MÓVEIS SOB MEDIDA LTDA';
        doc.text(nomeEmpresa.toUpperCase(), CONFIG.larguraPagina / 2, yPos + 5, { align: 'center' });

        // Dados da empresa
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...CONFIG.corCinzaEscuro);

        const cnpj = dadosEmpresa.cnpj || '51.297.130/0001-79';
        const endereco = dadosEmpresa.endereco || 'Rua 444, nº 1097, bairro Morretes, Itapema/SC, CEP 88220-000';
        const contato = `${dadosEmpresa.telefone || '(47) 99999-8888'} | ${dadosEmpresa.email || 'contato@possattomoveis.com.br'}`;

        doc.text(`CNPJ: ${cnpj}`, CONFIG.larguraPagina / 2, yPos + 12, { align: 'center' });
        doc.text(endereco, CONFIG.larguraPagina / 2, yPos + 18, { align: 'center' });
        doc.text(contato, CONFIG.larguraPagina / 2, yPos + 24, { align: 'center' });

        yPos += 50;

        // Título do documento
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(CONFIG.fonteTitulo);
        doc.setTextColor(...CONFIG.corPrimaria);

        // Quebrar título longo em duas linhas se necessário
        const palavrasTitulo = titulo.split(' ');
        if (palavrasTitulo.length > 3) {
            const metade = Math.ceil(palavrasTitulo.length / 2);
            const linha1 = palavrasTitulo.slice(0, metade).join(' ');
            const linha2 = palavrasTitulo.slice(metade).join(' ');
            doc.text(linha1, CONFIG.larguraPagina / 2, yPos, { align: 'center' });
            doc.text(linha2, CONFIG.larguraPagina / 2, yPos + 8, { align: 'center' });
            yPos += 15;
        } else {
            doc.text(titulo, CONFIG.larguraPagina / 2, yPos, { align: 'center' });
            yPos += 10;
        }

        // Linha decorativa
        doc.setDrawColor(...CONFIG.corDestaque);
        doc.setLineWidth(2);
        doc.line(CONFIG.larguraPagina / 2 - 30, yPos, CONFIG.larguraPagina / 2 + 30, yPos);

        return yPos + 15;
    }

    /**
     * Adiciona caixa de dados do cliente com design moderno
     * @param {jsPDF} doc - Instância do documento PDF
     * @param {Object} orcamento - Dados do orçamento
     * @param {number} yPos - Posição Y inicial
     * @returns {number} Nova posição Y
     */
    function adicionarDadosCliente(doc, orcamento, yPos) {
        // Título da seção
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(CONFIG.fonteSubtitulo);
        doc.setTextColor(...CONFIG.corPrimaria);
        doc.text('DADOS DO CLIENTE', CONFIG.margemEsquerda, yPos);
        yPos += 10;

        // Container com borda
        doc.setDrawColor(...CONFIG.corDestaque);
        doc.setLineWidth(0.5);
        doc.roundedRect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 45, 2, 2);

        // Dados formatados em grid
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.setFontSize(CONFIG.fontePequena);
        doc.setTextColor(...CONFIG.corPreto);

        // Coluna esquerda
        const xCol1 = CONFIG.margemEsquerda + 5;
        const xCol2 = CONFIG.margemEsquerda + CONFIG.larguraUtil / 2 + 5;

        // Cliente
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.text('Cliente:', xCol1, yPos + 8);
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.text(orcamento.cliente || 'Não informado', xCol1 + 20, yPos + 8);

        // Telefone
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.text('Telefone:', xCol2, yPos + 8);
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.text(orcamento.telefone || 'Não informado', xCol2 + 25, yPos + 8);

        // CPF
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.text('CPF:', xCol1, yPos + 16);
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.text(orcamento.cpfCliente || 'Não informado', xCol1 + 15, yPos + 16);

        // Data
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.text('Data:', xCol2, yPos + 16);
        doc.setFont(CONFIG.fontePadrao, 'normal');
        const dataFormatada = window.utils?.formatarData(orcamento.data) || new Date().toLocaleDateString('pt-BR');
        doc.text(dataFormatada, xCol2 + 15, yPos + 16);

        // Endereço (linha completa)
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.text('Endereço:', xCol1, yPos + 24);
        doc.setFont(CONFIG.fontePadrao, 'normal');
        const enderecoCompleto = orcamento.enderecoEntrega || 'Não informado';
        const enderecoTruncado = enderecoCompleto.length > 70 ?
            enderecoCompleto.substring(0, 67) + '...' : enderecoCompleto;
        doc.text(enderecoTruncado, xCol1 + 25, yPos + 24);

        // Email (linha completa)
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.text('E-mail:', xCol1, yPos + 32);
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.text(orcamento.email || 'Não informado', xCol1 + 20, yPos + 32);

        return yPos + 50;
    }

    /**
     * Cria tabela profissional de itens
     * @param {jsPDF} doc - Instância do documento PDF
     * @param {Object} orcamento - Dados do orçamento
     * @param {number} yPos - Posição Y inicial
     * @returns {number} Nova posição Y
     */
    function criarTabelaItens(doc, orcamento, yPos) {
        // Título da seção
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(CONFIG.fonteSubtitulo);
        doc.setTextColor(...CONFIG.corPrimaria);
        doc.text('AMBIENTES E MÓVEIS', CONFIG.margemEsquerda, yPos);
        yPos += 10;

        // Configuração das colunas da tabela
        const colunas = {
            item: { x: CONFIG.margemEsquerda, largura: 20, titulo: 'ITEM' },
            descricao: { x: CONFIG.margemEsquerda + 20, largura: CONFIG.larguraUtil - 50, titulo: 'DESCRIÇÃO' },
            valor: { x: CONFIG.margemEsquerda + CONFIG.larguraUtil - 30, largura: 30, titulo: 'VALOR' }
        };

        // Cabeçalho da tabela com fundo colorido
        const alturaHeader = 10;
        doc.setFillColor(...CONFIG.corDestaque);
        doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, alturaHeader, 'F');

        // Textos do cabeçalho
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(CONFIG.fontePequena);
        doc.setTextColor(255, 255, 255);

        doc.text(colunas.item.titulo, colunas.item.x + 5, yPos + 7);
        doc.text(colunas.descricao.titulo, colunas.descricao.x + 5, yPos + 7);
        doc.text(colunas.valor.titulo, colunas.valor.x + 5, yPos + 7);

        yPos += alturaHeader + 5;

        // Reset cores para conteúdo
        doc.setTextColor(...CONFIG.corPreto);
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.setFontSize(CONFIG.fonteRodape);

        let itemNumero = 1;
        let subtotal = 0;

        // Processar ambientes e móveis
        if (orcamento.ambientes && orcamento.ambientes.length > 0) {
            orcamento.ambientes.forEach((ambiente, indexAmbiente) => {
                // Verificar espaço para nova página
                if (yPos > CONFIG.alturaPagina - 60) {
                    doc.addPage();
                    yPos = CONFIG.margemSuperior;

                    // Recriar cabeçalho da tabela na nova página
                    doc.setFillColor(...CONFIG.corDestaque);
                    doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, alturaHeader, 'F');

                    doc.setFont(CONFIG.fontePadrao, 'bold');
                    doc.setFontSize(CONFIG.fontePequena);
                    doc.setTextColor(255, 255, 255);

                    doc.text(colunas.item.titulo, colunas.item.x + 5, yPos + 7);
                    doc.text(colunas.descricao.titulo, colunas.descricao.x + 5, yPos + 7);
                    doc.text(colunas.valor.titulo, colunas.valor.x + 5, yPos + 7);

                    yPos += alturaHeader + 5;
                    doc.setTextColor(...CONFIG.corPreto);
                }

                // Nome do ambiente como categoria
                doc.setFont(CONFIG.fontePadrao, 'bold');
                doc.setFontSize(CONFIG.fontePequena);
                doc.setTextColor(...CONFIG.corSecundaria);

                // Fundo alternado para ambiente
                if (indexAmbiente % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(CONFIG.margemEsquerda, yPos - 3, CONFIG.larguraUtil, 8, 'F');
                }

                doc.text(ambiente.nome?.toUpperCase() || 'AMBIENTE', colunas.descricao.x + 5, yPos + 2);

                // Calcular subtotal do ambiente
                const subtotalAmbiente = ambiente.moveis?.reduce((sum, movel) =>
                    sum + (parseFloat(movel.valorVenda) || 0), 0) || 0;

                doc.text(window.utils?.formatarMoeda(subtotalAmbiente) || `R$ ${subtotalAmbiente.toFixed(2)}`,
                    colunas.valor.x + colunas.valor.largura - 5, yPos + 2, { align: 'right' });

                yPos += 10;

                // Listar móveis do ambiente
                doc.setFont(CONFIG.fontePadrao, 'normal');
                doc.setFontSize(CONFIG.fonteRodape);
                doc.setTextColor(...CONFIG.corPreto);

                if (ambiente.moveis && ambiente.moveis.length > 0) {
                    ambiente.moveis.forEach(movel => {
                        // Verificar espaço
                        if (yPos > CONFIG.alturaPagina - 30) {
                            doc.addPage();
                            yPos = CONFIG.margemSuperior;
                        }

                        // Número do item
                        doc.text(itemNumero.toString(), colunas.item.x + 8, yPos);

                        // Descrição do móvel
                        const descricao = movel.nome || 'Móvel sem descrição';
                        const descricaoLinhas = doc.splitTextToSize(descricao, colunas.descricao.largura - 10);
                        doc.text(descricaoLinhas[0], colunas.descricao.x + 10, yPos);

                        // Valor
                        const valorFormatado = window.utils?.formatarMoeda(movel.valorVenda || 0) ||
                            `R$ ${(movel.valorVenda || 0).toFixed(2)}`;
                        doc.text(valorFormatado, colunas.valor.x + colunas.valor.largura - 5, yPos, { align: 'right' });

                        // Adicionar linhas extras da descrição se houver
                        for (let i = 1; i < descricaoLinhas.length; i++) {
                            yPos += 5;
                            doc.text(descricaoLinhas[i], colunas.descricao.x + 10, yPos);
                        }

                        subtotal += parseFloat(movel.valorVenda) || 0;
                        yPos += 7;
                        itemNumero++;
                    });
                } else {
                    // Ambiente sem móveis
                    doc.setTextColor(...CONFIG.corCinzaEscuro);
                    doc.setFont(CONFIG.fontePadrao, 'italic');
                    doc.text('Sem móveis cadastrados', colunas.descricao.x + 10, yPos);
                    yPos += 7;
                }
            });
        } else {
            // Sem ambientes cadastrados
            doc.setTextColor(...CONFIG.corCinzaEscuro);
            doc.setFont(CONFIG.fontePadrao, 'italic');
            doc.text('Nenhum ambiente cadastrado', CONFIG.larguraPagina / 2, yPos, { align: 'center' });
            yPos += 10;
        }

        // Linha de total
        yPos += 5;
        doc.setDrawColor(...CONFIG.corDestaque);
        doc.setLineWidth(2);
        doc.line(CONFIG.margemEsquerda, yPos, CONFIG.margemEsquerda + CONFIG.larguraUtil, yPos);
        yPos += 10;

        // Total geral
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(CONFIG.fonteSubtitulo);
        doc.setTextColor(...CONFIG.corPrimaria);
        doc.text('VALOR TOTAL', CONFIG.margemEsquerda + CONFIG.larguraUtil - 60, yPos);

        doc.setTextColor(...CONFIG.corDestaque);
        doc.setFontSize(18);
        const totalFormatado = window.utils?.formatarMoeda(orcamento.valorTotal || subtotal) ||
            `R$ ${(orcamento.valorTotal || subtotal).toFixed(2)}`;
        doc.text(totalFormatado, CONFIG.margemEsquerda + CONFIG.larguraUtil - 5, yPos, { align: 'right' });

        return yPos + 15;
    }

    /**
     * Adiciona seção de condições comerciais com design profissional
     * @param {jsPDF} doc - Instância do documento PDF
     * @param {Object} orcamento - Dados do orçamento
     * @param {number} yPos - Posição Y inicial
     * @returns {number} Nova posição Y
     */
    function adicionarCondicoesComerciais(doc, orcamento, yPos) {
        // Verificar espaço disponível
        if (yPos > CONFIG.alturaPagina - 100) {
            doc.addPage();
            yPos = CONFIG.margemSuperior;
        }

        // Título da seção
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(CONFIG.fonteSubtitulo);
        doc.setTextColor(...CONFIG.corPrimaria);
        doc.text('CONDIÇÕES COMERCIAIS', CONFIG.larguraPagina / 2, yPos, { align: 'center' });
        yPos += 15;

        // Container com fundo sutil
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(CONFIG.margemEsquerda, yPos - 5, CONFIG.larguraUtil, 120, 3, 3, 'F');

        // Lista de condições
        const condicoes = [
            {
                titulo: '1. Formas de Pagamento',
                itens: [
                    '• À vista: 5% de desconto',
                    '• 50% na assinatura do contrato e 50% na entrega',
                    '• Cartão de crédito em até 10x com taxa da operadora'
                ]
            },
            {
                titulo: '2. Prazo de Entrega',
                itens: [`• ${orcamento.prazoEntregaObs || '60 dias úteis após aprovação do projeto'}`]
            },
            {
                titulo: '3. Matéria-Prima',
                itens: [`• ${orcamento.materiaPrima || '100% MDF dupla face de alta qualidade'}`]
            },
            {
                titulo: '4. Ferragens e Acessórios',
                itens: [
                    '• Dobradiças com amortecedor soft-close',
                    '• Corrediças telescópicas com rolamento',
                    '• Puxadores conforme projeto aprovado'
                ]
            },
            {
                titulo: '5. Garantia',
                itens: [`• ${orcamento.tempoGarantia || 'Garantia de 3 anos contra defeitos de fabricação'}`]
            }
        ];

        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.setFontSize(CONFIG.fontePequena);

        condicoes.forEach(condicao => {
            // Verificar espaço
            if (yPos > CONFIG.alturaPagina - 40) {
                doc.addPage();
                yPos = CONFIG.margemSuperior;
            }

            // Título da condição
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setTextColor(...CONFIG.corSecundaria);
            doc.text(condicao.titulo, CONFIG.margemEsquerda + 5, yPos);
            yPos += 7;

            // Itens da condição
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setTextColor(...CONFIG.corPreto);
            condicao.itens.forEach(item => {
                const linhas = doc.splitTextToSize(item, CONFIG.larguraUtil - 15);
                linhas.forEach(linha => {
                    doc.text(linha, CONFIG.margemEsquerda + 10, yPos);
                    yPos += 5;
                });
            });

            yPos += 5;
        });

        // Validade da proposta
        yPos += 10;
        doc.setFont(CONFIG.fontePadrao, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...CONFIG.corDestaque);
        doc.text('VALIDADE DA PROPOSTA: 15 DIAS', CONFIG.larguraPagina / 2, yPos, { align: 'center' });

        return yPos + 15;
    }

    /**
     * Adiciona rodapé profissional
     * @param {jsPDF} doc - Instância do documento PDF
     * @param {number} numeroPagina - Número da página atual
     */
    function adicionarRodapeProfissional(doc, numeroPagina) {
        const yRodape = CONFIG.alturaPagina - 15;

        // Linha separadora
        doc.setDrawColor(...CONFIG.corCinzaMedio);
        doc.setLineWidth(0.5);
        doc.line(CONFIG.margemEsquerda, yRodape - 5, CONFIG.larguraPagina - CONFIG.margemDireita, yRodape - 5);

        // Texto do rodapé
        doc.setFont(CONFIG.fontePadrao, 'normal');
        doc.setFontSize(CONFIG.fonteRodape);
        doc.setTextColor(...CONFIG.corCinzaEscuro);

        // Informações da empresa
        const textoEsquerda = 'Possatto Móveis Sob Medida Ltda | CNPJ: 51.297.130/0001-79';
        const textoCentro = '(47) 99999-8888 | contato@possattomoveis.com.br | www.possattomoveis.com.br';
        const textoDireita = `Página ${numeroPagina}`;

        doc.text(textoEsquerda, CONFIG.margemEsquerda, yRodape);
        doc.text(textoCentro, CONFIG.larguraPagina / 2, yRodape, { align: 'center' });
        doc.text(textoDireita, CONFIG.larguraPagina - CONFIG.margemDireita, yRodape, { align: 'right' });
    }

    /**
     * Adiciona área de assinaturas com design elegante
     * @param {jsPDF} doc - Instância do documento PDF
     * @param {string[]} nomes - Array com nomes dos signatários
     * @param {number} yPos - Posição Y inicial
     */
    function adicionarAssinaturas(doc, nomes, yPos) {
        // Verificar se precisa nova página
        if (yPos > CONFIG.alturaPagina - 80) {
            doc.addPage();
            yPos = CONFIG.alturaPagina - 100;
        } else {
            yPos = CONFIG.alturaPagina - 80;
        }

        const larguraAssinatura = 70;
        const espacamento = 20;
        const totalLargura = nomes.length * larguraAssinatura + (nomes.length - 1) * espacamento;
        const xInicial = (CONFIG.larguraPagina - totalLargura) / 2;

        // Linhas de assinatura
        doc.setDrawColor(...CONFIG.corPreto);
        doc.setLineWidth(0.5);

        nomes.forEach((nome, index) => {
            const xPos = xInicial + index * (larguraAssinatura + espacamento);

            // Linha
            doc.line(xPos, yPos, xPos + larguraAssinatura, yPos);

            // Nome
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fonteRodape);
            doc.setTextColor(...CONFIG.corPreto);

            // Truncar nome se muito longo
            const nomeTruncado = nome.length > 25 ? nome.substring(0, 22) + '...' : nome;
            doc.text(nomeTruncado, xPos + larguraAssinatura / 2, yPos + 7, { align: 'center' });

            // Rótulo
            doc.setTextColor(...CONFIG.corCinzaEscuro);
            const rotulo = index === 0 ? '(Contratado)' : '(Contratante)';
            doc.text(rotulo, xPos + larguraAssinatura / 2, yPos + 13, { align: 'center' });
        });

        // Local e data
        yPos += 30;
        doc.setFont(CONFIG.fontePadrao, 'italic');
        doc.setFontSize(CONFIG.fontePequena);
        doc.setTextColor(...CONFIG.corCinzaEscuro);
        doc.text('Itapema/SC, _____ de _______________ de 2025', CONFIG.larguraPagina / 2, yPos, { align: 'center' });
    }

    // ==================== FUNÇÕES PRINCIPAIS REFINADAS ====================

    /**
     * Gera PDF do Orçamento com design profissional
     */
    function gerarPDFOrcamento() {
        try {
            const orcamentoId = document.getElementById('orcamentoParaPDF')?.value;
            if (!orcamentoId) {
                if (window.utils) window.utils.mostrarAlerta('⚠️ Selecione um orçamento', 'warning');
                return;
            }

            // Obter dados do orçamento
            const orcamentos = window.utils?.obterDados('orcamentos') || [];
            const orcamento = orcamentos.find(o => o.id == orcamentoId);

            if (!orcamento) {
                if (window.utils) window.utils.mostrarAlerta('❌ Orçamento não encontrado', 'danger');
                return;
            }

            // Obter dados da empresa
            const dadosEmpresa = window.utils?.obterDados('dadosEmpresa') || {};

            // Criar PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Adicionar cabeçalho profissional
            let yPos = adicionarCabecalhoProfissional(doc, dadosEmpresa, 'ORÇAMENTO DE MÓVEIS SOB MEDIDA');

            // Número do orçamento e data
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corCinzaEscuro);
            doc.text(`Nº ${orcamento.numero || 'N/A'} | ${window.utils?.formatarData(orcamento.data) || new Date().toLocaleDateString('pt-BR')}`,
                CONFIG.larguraPagina / 2, yPos - 5, { align: 'center' });
            yPos += 5;

            // Dados do cliente
            yPos = adicionarDadosCliente(doc, orcamento, yPos);

            // Tabela de itens
            yPos = criarTabelaItens(doc, orcamento, yPos);

            // Observações (se houver)
            if (orcamento.observacoesGerais) {
                yPos += 10;

                // Verificar espaço
                if (yPos > CONFIG.alturaPagina - 50) {
                    doc.addPage();
                    yPos = CONFIG.margemSuperior;
                }

                doc.setFont(CONFIG.fontePadrao, 'bold');
                doc.setFontSize(CONFIG.fontePequena);
                doc.setTextColor(...CONFIG.corSecundaria);
                doc.text('OBSERVAÇÕES:', CONFIG.margemEsquerda, yPos);
                yPos += 7;

                doc.setFont(CONFIG.fontePadrao, 'italic');
                doc.setFontSize(CONFIG.fonteRodape);
                doc.setTextColor(...CONFIG.corPreto);

                const obsLinhas = doc.splitTextToSize(orcamento.observacoesGerais, CONFIG.larguraUtil);
                obsLinhas.forEach(linha => {
                    doc.text(linha, CONFIG.margemEsquerda, yPos);
                    yPos += 5;
                });
            }

            // Condições comerciais
            yPos = adicionarCondicoesComerciais(doc, orcamento, yPos);

            // Adicionar rodapé em todas as páginas
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                adicionarRodapeProfissional(doc, i);
            }

            // Salvar PDF - robusto (nome limpo e catch de erro de download)
            try {
                // Garante nome limpo, sem espaços nem caracteres inválidos
                let numero = orcamento.numero || orcamento.id || 'SN';
                let cliente = (orcamento.cliente || 'Cliente').replace(/[^a-z0-9]/gi, '_');
                let nomeArquivo = `Orcamento_${numero}_${cliente}.pdf`;

                doc.save(nomeArquivo);

                if (window.utils) window.utils.mostrarAlerta('✅ PDF do orçamento gerado e baixado!', 'success');
            } catch (e) {
                if (window.utils) window.utils.mostrarAlerta('❌ Erro ao baixar PDF: ' + e.message, 'danger');
                else alert('Erro ao baixar PDF: ' + e.message);
            }

        } catch (error) {
            console.error('Erro ao gerar PDF do orçamento:', error);
            if (window.utils) window.utils.mostrarAlerta('❌ Erro ao gerar PDF do orçamento', 'danger');
        }
    }

    /**
     * Gera PDF do Contrato com design profissional
     */
    function gerarPDFContrato() {
        try {
            const orcamentoId = document.getElementById('orcamentoParaPDF')?.value;
            if (!orcamentoId) {
                if (window.utils) window.utils.mostrarAlerta('⚠️ Selecione um orçamento', 'warning');
                return;
            }

            // Obter dados
            const orcamentos = window.utils?.obterDados('orcamentos') || [];
            const orcamento = orcamentos.find(o => o.id == orcamentoId);
            const dadosEmpresa = window.utils?.obterDados('dadosEmpresa') || {};

            if (!orcamento) {
                if (window.utils) window.utils.mostrarAlerta('❌ Orçamento não encontrado', 'danger');
                return;
            }

            // Verificar se há configuração de preço
            if (!configContrato.precoCondicoes) {
                abrirModalConfigContrato();
                return;
            }

            // Criar PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Adicionar cabeçalho profissional
            let yPos = adicionarCabecalhoProfissional(doc, dadosEmpresa, configContrato.titulo);

            // Subtítulo
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setFontSize(CONFIG.fonteSubtitulo);
            doc.setTextColor(...CONFIG.corSecundaria);
            doc.text(configContrato.subtitulo, CONFIG.larguraPagina / 2, yPos, { align: 'center' });
            yPos += 15;

            // CONTRATANTE
            doc.setFillColor(...CONFIG.corDestaque);
            doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 8, 'F');
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(255, 255, 255);
            doc.text('CONTRATANTE', CONFIG.margemEsquerda + 5, yPos + 6);
            yPos += 12;

            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPreto);

            const textoContratante = `${orcamento.cliente || 'Nome não informado'}, portador do número de CPF: ${orcamento.cpfCliente || 'Não informado'}, residente e domiciliado ${orcamento.enderecoEntrega ? 'na ' + orcamento.enderecoEntrega : 'endereço não informado'}.`;
            const contratanteLinhas = doc.splitTextToSize(textoContratante, CONFIG.larguraUtil - 10);
            contratanteLinhas.forEach(linha => {
                doc.text(linha, CONFIG.margemEsquerda + 5, yPos);
                yPos += 6;
            });
            yPos += 10;

            // CONTRATADO
            doc.setFillColor(...CONFIG.corDestaque);
            doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 8, 'F');
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(255, 255, 255);
            doc.text('CONTRATADO', CONFIG.margemEsquerda + 5, yPos + 6);
            yPos += 12;

            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPreto);

            const contratadaLinhas = doc.splitTextToSize(configContrato.contratada, CONFIG.larguraUtil - 10);
            contratadaLinhas.forEach(linha => {
                if (yPos > CONFIG.alturaPagina - 30) {
                    doc.addPage();
                    yPos = CONFIG.margemSuperior;
                }
                doc.text(linha, CONFIG.margemEsquerda + 5, yPos);
                yPos += 6;
            });
            yPos += 10;

            // DO OBJETO DO CONTRATO
            const textoObjeto = configContrato.acordoObjeto;
            const acordoLinhas = doc.splitTextToSize(textoObjeto, CONFIG.larguraUtil - 10);

            acordoLinhas.forEach(linha => {
                if (yPos > CONFIG.alturaPagina - 30) {
                    doc.addPage();
                    yPos = CONFIG.margemSuperior;
                }

                // Destacar títulos e cláusulas
                if (linha.includes('DO OBJETO') || linha.includes('Cláusula')) {
                    doc.setFont(CONFIG.fontePadrao, 'bold');
                    doc.setTextColor(...CONFIG.corSecundaria);
                } else {
                    doc.setFont(CONFIG.fontePadrao, 'normal');
                    doc.setTextColor(...CONFIG.corPreto);
                }

                // Justificar texto
                if (!linha.includes('DO OBJETO') && !linha.includes('Cláusula')) {
                    doc.text(linha, CONFIG.margemEsquerda, yPos, { maxWidth: CONFIG.larguraUtil, align: 'justify' });
                } else {
                    doc.text(linha, CONFIG.margemEsquerda, yPos);
                }

                yPos += 7;
            });
            yPos += 10;

            // MATERIAIS
            if (yPos > CONFIG.alturaPagina - 50) {
                doc.addPage();
                yPos = CONFIG.margemSuperior;
            }

            doc.setFillColor(...CONFIG.corCinzaClaro);
            doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 8, 'F');
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPrimaria);
            doc.text('MATERIAIS', CONFIG.margemEsquerda + 5, yPos + 6);
            yPos += 12;

            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPreto);

            doc.text(`Matéria-prima: ${orcamento.materiaPrima || '100% MDF dupla face'}`, CONFIG.margemEsquerda + 5, yPos);
            yPos += 7;
            doc.text(`Garantia: ${orcamento.tempoGarantia || '3 anos'}`, CONFIG.margemEsquerda + 5, yPos);
            yPos += 15;

            // AMBIENTES E MÓVEIS
            if (yPos > CONFIG.alturaPagina - 50) {
                doc.addPage();
                yPos = CONFIG.margemSuperior;
            }

            doc.setFillColor(...CONFIG.corCinzaClaro);
            doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 8, 'F');
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPrimaria);
            doc.text('AMBIENTES E MÓVEIS', CONFIG.margemEsquerda + 5, yPos + 6);
            yPos += 12;

            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPreto);

            if (orcamento.ambientes && orcamento.ambientes.length > 0) {
                let itemNum = 1;
                orcamento.ambientes.forEach(ambiente => {
                    if (yPos > CONFIG.alturaPagina - 30) {
                        doc.addPage();
                        yPos = CONFIG.margemSuperior;
                    }

                    // Nome do ambiente
                    doc.setFont(CONFIG.fontePadrao, 'bold');
                    doc.setTextColor(...CONFIG.corSecundaria);
                    doc.text(`• ${ambiente.nome}`, CONFIG.margemEsquerda + 5, yPos);
                    yPos += 7;

                    doc.setFont(CONFIG.fontePadrao, 'normal');
                    doc.setTextColor(...CONFIG.corPreto);

                    if (ambiente.moveis && ambiente.moveis.length > 0) {
                        ambiente.moveis.forEach(movel => {
                            if (yPos > CONFIG.alturaPagina - 20) {
                                doc.addPage();
                                yPos = CONFIG.margemSuperior;
                            }
                            doc.text(`  ${itemNum}. ${movel.nome || 'Móvel sem nome'}`, CONFIG.margemEsquerda + 10, yPos);
                            yPos += 6;
                            itemNum++;
                        });
                    }
                });
            } else {
                doc.setTextColor(...CONFIG.corCinzaEscuro);
                doc.setFont(CONFIG.fontePadrao, 'italic');
                doc.text('Nenhum ambiente cadastrado', CONFIG.margemEsquerda + 5, yPos);
                yPos += 7;
            }
            yPos += 10;

            // OBRIGAÇÕES E CLÁUSULAS
            const textoCompleto = configContrato.obrigacoes + '\n\n' +
                configContrato.precoCondicoes + '\n\n' +
                configContrato.clausulasFinais;

            const clausulasLinhas = doc.splitTextToSize(textoCompleto, CONFIG.larguraUtil - 10);

            clausulasLinhas.forEach(linha => {
                if (yPos > CONFIG.alturaPagina - 30) {
                    doc.addPage();
                    yPos = CONFIG.margemSuperior;
                }

                // Destacar títulos e cláusulas
                if (linha.includes('OBRIGAÇÕES') || linha.includes('DO ') || linha.includes('DA ') || linha.includes('Cláusula')) {
                    doc.setFont(CONFIG.fontePadrao, 'bold');
                    doc.setTextColor(...CONFIG.corSecundaria);
                } else {
                    doc.setFont(CONFIG.fontePadrao, 'normal');
                    doc.setTextColor(...CONFIG.corPreto);
                }

                // Justificar texto
                if (!linha.includes('OBRIGAÇÕES') && !linha.includes('DO ') && !linha.includes('DA ') && !linha.includes('Cláusula')) {
                    doc.text(linha, CONFIG.margemEsquerda, yPos, { maxWidth: CONFIG.larguraUtil, align: 'justify' });
                } else {
                    doc.text(linha, CONFIG.margemEsquerda, yPos);
                }

                yPos += 7;
            });

            // Adicionar rodapé em todas as páginas
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                adicionarRodapeProfissional(doc, i);

                // Adicionar marca d'água sutil
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.05 }));
                doc.setFontSize(50);
                doc.setTextColor(200, 200, 200);
                doc.text('POSSATTO', CONFIG.larguraPagina / 2, CONFIG.alturaPagina / 2, {
                    angle: 45,
                    align: 'center'
                });
                doc.restoreGraphicsState();
            }

            // Nova página para assinaturas
            doc.addPage();

            // Assinaturas
            const nomes = ['Mateus Pinheiro da Silva', orcamento.cliente || 'Cliente'];
            adicionarAssinaturas(doc, nomes, 0);

            // Salvar PDF
            doc.save(`Contrato_${orcamento.numero}_${orcamento.cliente?.replace(/\s+/g, '_')}.pdf`);

            // Limpar configuração temporária
            configContrato.precoCondicoes = '';

            if (window.utils) window.utils.mostrarAlerta('✅ PDF do contrato gerado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao gerar PDF do contrato:', error);
            if (window.utils) window.utils.mostrarAlerta('❌ Erro ao gerar PDF do contrato', 'danger');
        }
    }

    /**
     * Gera PDF da Lista de Materiais com design profissional
     */
    function gerarListaMateriais() {
        try {
            const orcamentoId = document.getElementById('orcamentoParaPDF')?.value;
            if (!orcamentoId) {
                if (window.utils) window.utils.mostrarAlerta('⚠️ Selecione um orçamento', 'warning');
                return;
            }

            // Obter dados
            const orcamentos = window.utils?.obterDados('orcamentos') || [];
            const orcamento = orcamentos.find(o => o.id == orcamentoId);
            const dadosEmpresa = window.utils?.obterDados('dadosEmpresa') || {};

            if (!orcamento) {
                if (window.utils) window.utils.mostrarAlerta('❌ Orçamento não encontrado', 'danger');
                return;
            }

            // Criar PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Adicionar cabeçalho profissional
            let yPos = adicionarCabecalhoProfissional(doc, dadosEmpresa, 'LISTA DE MATERIAIS CONSOLIDADA');

            // Informações do orçamento
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corCinzaEscuro);
            doc.text(`Orçamento Nº ${orcamento.numero || 'N/A'} - ${orcamento.cliente || 'Cliente'}`,
                CONFIG.larguraPagina / 2, yPos - 5, { align: 'center' });
            yPos += 10;

            // Seção de informações do projeto
            doc.setFillColor(...CONFIG.corDestaque);
            doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 10, 'F');
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(255, 255, 255);
            doc.text('INFORMAÇÕES DO PROJETO', CONFIG.margemEsquerda + 5, yPos + 7);
            yPos += 15;

            // Grid de informações
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPreto);

            const col1 = CONFIG.margemEsquerda + 5;
            const col2 = CONFIG.larguraPagina / 2;

            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.text('Cliente:', col1, yPos);
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.text(orcamento.cliente || 'Não informado', col1 + 20, yPos);

            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.text('Ambientes:', col2, yPos);
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.text((orcamento.ambientes?.length || 0).toString(), col2 + 30, yPos);

            yPos += 7;

            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.text('Data:', col1, yPos);
            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.text(window.utils?.formatarData(orcamento.data) || new Date().toLocaleDateString('pt-BR'), col1 + 15, yPos);

            yPos += 15;

            // Coletar todos os materiais com tratamento de dados ausentes
            const materiaisPorCategoria = {
                materiais: [],
                ferragens: [],
                acessorios: [],
                especiais: []
            };

            // Percorrer ambientes e móveis para coletar materiais
            if (orcamento.ambientes && Array.isArray(orcamento.ambientes)) {
                orcamento.ambientes.forEach(ambiente => {
                    if (ambiente && ambiente.moveis && Array.isArray(ambiente.moveis)) {
                        ambiente.moveis.forEach(movel => {
                            if (!movel) return;

                            // Adicionar materiais de cada categoria com verificação robusta
                            ['materiais', 'ferragens', 'acessorios', 'especiais'].forEach(categoria => {
                                if (movel[categoria] && Array.isArray(movel[categoria])) {
                                    movel[categoria].forEach(item => {
                                        if (item && item.nome && item.quantidade > 0) {
                                            materiaisPorCategoria[categoria].push({
                                                codigo: item.codigo || 'N/A',
                                                nome: item.nome,
                                                quantidade: parseFloat(item.quantidade) || 0,
                                                unidade: item.unidade || 'un',
                                                ambiente: ambiente.nome || 'Ambiente',
                                                movel: movel.nome || 'Móvel'
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            }

            // Renderizar materiais por categoria
            const categorias = [
                { key: 'materiais', titulo: 'MATERIAIS', cor: CONFIG.corDestaque },
                { key: 'ferragens', titulo: 'FERRAGENS', cor: CONFIG.corSecundaria },
                { key: 'acessorios', titulo: 'ACESSÓRIOS', cor: CONFIG.corDestaque },
                { key: 'especiais', titulo: 'ESPECIAIS', cor: CONFIG.corSecundaria }
            ];

            let totalItens = 0;
            let categoriasComItens = 0;

            categorias.forEach(cat => {
                const itens = materiaisPorCategoria[cat.key];

                if (itens && itens.length > 0) {
                    categoriasComItens++;

                    // Verificar espaço
                    if (yPos > CONFIG.alturaPagina - 60) {
                        doc.addPage();
                        yPos = CONFIG.margemSuperior;
                    }

                    // Título da categoria com fundo colorido
                    doc.setFillColor(...cat.cor);
                    doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 10, 'F');
                    doc.setFont(CONFIG.fontePadrao, 'bold');
                    doc.setFontSize(CONFIG.fontePequena);
                    doc.setTextColor(255, 255, 255);
                    doc.text(cat.titulo, CONFIG.margemEsquerda + 5, yPos + 7);
                    yPos += 15;

                    // Cabeçalho da tabela
                    doc.setFillColor(...CONFIG.corCinzaClaro);
                    doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 8, 'F');

                    doc.setFont(CONFIG.fontePadrao, 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(...CONFIG.corPreto);

                    doc.text('CÓDIGO', CONFIG.margemEsquerda + 5, yPos + 6);
                    doc.text('DESCRIÇÃO', CONFIG.margemEsquerda + 30, yPos + 6);
                    doc.text('QTDE', CONFIG.margemEsquerda + 130, yPos + 6);
                    doc.text('UN', CONFIG.margemEsquerda + 150, yPos + 6);

                    yPos += 12;

                    // Agrupar itens iguais
                    const itensAgrupados = {};
                    itens.forEach(item => {
                        const chave = `${item.codigo}_${item.nome}`;
                        if (!itensAgrupados[chave]) {
                            itensAgrupados[chave] = {
                                codigo: item.codigo,
                                nome: item.nome,
                                quantidade: 0,
                                unidade: item.unidade,
                                locais: new Set()
                            };
                        }
                        itensAgrupados[chave].quantidade += item.quantidade;
                        itensAgrupados[chave].locais.add(`${item.ambiente}/${item.movel}`);
                    });

                    // Renderizar itens agrupados
                    doc.setFont(CONFIG.fontePadrao, 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(...CONFIG.corPreto);

                    let linhaPar = false;
                    Object.values(itensAgrupados).forEach(item => {
                        if (yPos > CONFIG.alturaPagina - 20) {
                            doc.addPage();
                            yPos = CONFIG.margemSuperior;
                        }

                        // Fundo alternado
                        if (linhaPar) {
                            doc.setFillColor(250, 250, 250);
                            doc.rect(CONFIG.margemEsquerda, yPos - 4, CONFIG.larguraUtil, 7, 'F');
                        }
                        linhaPar = !linhaPar;

                        doc.text(item.codigo, CONFIG.margemEsquerda + 5, yPos);

                        // Truncar nome se muito longo
                        const nomeTruncado = item.nome.length > 50 ?
                            item.nome.substring(0, 47) + '...' : item.nome;
                        doc.text(nomeTruncado, CONFIG.margemEsquerda + 30, yPos);

                        doc.setFont(CONFIG.fontePadrao, 'bold');
                        doc.text(item.quantidade.toFixed(2), CONFIG.margemEsquerda + 130, yPos);
                        doc.setFont(CONFIG.fontePadrao, 'normal');
                        doc.text(item.unidade, CONFIG.margemEsquerda + 150, yPos);

                        totalItens++;
                        yPos += 7;
                    });

                    yPos += 10;
                }
            });

            // Se não houver materiais cadastrados
            if (categoriasComItens === 0) {
                doc.setFont(CONFIG.fontePadrao, 'italic');
                doc.setFontSize(CONFIG.fonteCorpo);
                doc.setTextColor(...CONFIG.corCinzaEscuro);
                doc.text('Sem materiais cadastrados para este orçamento', CONFIG.larguraPagina / 2, yPos, { align: 'center' });
                yPos += 20;
            }

            // Resumo final
            if (yPos > CONFIG.alturaPagina - 60) {
                doc.addPage();
                yPos = CONFIG.margemSuperior;
            }

            // Caixa de resumo
            doc.setFillColor(...CONFIG.corPrimaria);
            doc.rect(CONFIG.margemEsquerda, yPos, CONFIG.larguraUtil, 10, 'F');
            doc.setFont(CONFIG.fontePadrao, 'bold');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(255, 255, 255);
            doc.text('RESUMO', CONFIG.margemEsquerda + 5, yPos + 7);
            yPos += 15;

            doc.setFont(CONFIG.fontePadrao, 'normal');
            doc.setFontSize(CONFIG.fontePequena);
            doc.setTextColor(...CONFIG.corPreto);

            doc.text(`Total de Itens Únicos: ${totalItens}`, CONFIG.margemEsquerda + 5, yPos);
            yPos += 7;
            doc.text(`Categorias: ${categoriasComItens}`, CONFIG.margemEsquerda + 5, yPos);

            // Adicionar rodapé em todas as páginas
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                adicionarRodapeProfissional(doc, i);
            }

            // Salvar PDF
            doc.save(`Lista_Materiais_${orcamento.numero}_${orcamento.cliente?.replace(/\s+/g, '_')}.pdf`);

            if (window.utils) window.utils.mostrarAlerta('✅ Lista de materiais gerada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao gerar lista de materiais:', error);
            if (window.utils) window.utils.mostrarAlerta('❌ Erro ao gerar lista de materiais', 'danger');
        }
    }

    /**
     * Abre modal de configuração do contrato com design moderno
     */
    function abrirModalConfigContrato() {
        const orcamentoId = document.getElementById('orcamentoParaPDF')?.value;
        if (!orcamentoId) {
            if (window.utils) window.utils.mostrarAlerta('⚠️ Selecione um orçamento para configurar o contrato', 'warning');
            return;
        }

        const orcamentos = window.utils?.obterDados('orcamentos') || [];
        const orcamento = orcamentos.find(o => o.id == orcamentoId);

        if (!orcamento) {
            if (window.utils) window.utils.mostrarAlerta('❌ Orçamento não encontrado', 'danger');
            return;
        }

        // Criar modal
        const modalExistente = document.getElementById('modalConfigurarContrato');
        if (modalExistente) {
            modalExistente.remove();
        }

        const modalHtml = `
            <div class="modal" id="modalConfigurarContrato" style="display: none;">
                <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                    <div class="modal-header" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                        <h3 class="modal-title" style="margin: 0; font-size: 24px;">⚙️ Configurar Contrato</h3>
                        <button type="button" class="close-btn" onclick="window.gerarPDF.fecharModalConfigContrato()" style="background: none; border: none; color: white; font-size: 30px; cursor: pointer;">&times;</button>
                    </div>
                    
                    <div class="modal-body" style="padding: 30px;">
                        <div class="alert alert-info" style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                            <strong style="color: #1976d2;">📋 Orçamento Selecionado:</strong> 
                            <span style="color: #424242;">${orcamento.numero} - ${orcamento.cliente}</span>
                        </div>
                        
                        <div class="config-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                                Dados do Contrato
                            </h4>
                            
                            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: #555; margin-bottom: 5px; display: block;">
                                        <i style="color: #3498db;">👤</i> Cliente:
                                    </label>
                                    <p style="margin: 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;">
                                        ${orcamento.cliente || 'Não informado'}
                                    </p>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: #555; margin-bottom: 5px; display: block;">
                                        <i style="color: #3498db;">📄</i> CPF:
                                    </label>
                                    <p style="margin: 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;">
                                        ${orcamento.cpfCliente || 'Não informado'}
                                    </p>
                                </div>
                                
                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label class="form-label" style="font-weight: 600; color: #555; margin-bottom: 5px; display: block;">
                                        <i style="color: #3498db;">📍</i> Endereço:
                                    </label>
                                    <p style="margin: 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;">
                                        ${orcamento.enderecoEntrega || 'Não informado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="config-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                                Informações do Projeto
                            </h4>
                            
                            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: #555; margin-bottom: 5px; display: block;">
                                        <i style="color: #3498db;">🔨</i> Matéria-prima:
                                    </label>
                                    <p style="margin: 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;">
                                        ${orcamento.materiaPrima || '100% MDF dupla face'}
                                    </p>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: #555; margin-bottom: 5px; display: block;">
                                        <i style="color: #3498db;">🛡️</i> Garantia:
                                    </label>
                                    <p style="margin: 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;">
                                        ${orcamento.tempoGarantia || '3 anos'}
                                    </p>
                                </div>
                                
                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label class="form-label" style="font-weight: 600; color: #555; margin-bottom: 5px; display: block;">
                                        <i style="color: #3498db;">📝</i> Observações:
                                    </label>
                                    <p style="margin: 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd; min-height: 60px;">
                                        ${orcamento.observacoesGerais || 'Ferragens, puxadores e elétrica conforme projeto'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="config-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 2px solid #ffc107;">
                            <h4 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                                💰 Configuração de Pagamento (Obrigatório)
                            </h4>
                            
                            <div class="form-group">
                                <label class="form-label" for="campoPrecoCondicoes" style="font-weight: 600; color: #555; margin-bottom: 10px; display: block;">
                                    Digite as condições específicas de pagamento para este contrato:
                                </label>
                                <textarea 
                                    class="form-control" 
                                    id="campoPrecoCondicoes" 
                                    rows="6" 
                                    style="width: 100%; padding: 12px; border: 2px solid #ffc107; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical;"
                                    placeholder="Ex: R$ 50.000,00 (cinquenta mil reais), sendo 50% de entrada e 50% na entrega..."
                                >R$ ${(orcamento.valorTotal || 0).toFixed(2).replace('.', ',')} (${numeroExtenso(orcamento.valorTotal || 0)}), divididos em parcelas conforme acordado entre as partes.</textarea>
                                <small style="color: #6c757d; display: block; margin-top: 5px;">
                                    ⚠️ Este campo será inserido após a Cláusula 6ª do contrato
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="padding: 20px; background: #f8f9fa; border-radius: 0 0 12px 12px; display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="btn btn-secondary" onclick="window.gerarPDF.fecharModalConfigContrato()" 
                            style="padding: 10px 20px; border: none; border-radius: 6px; background: #6c757d; color: white; cursor: pointer; font-size: 16px;">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="window.gerarPDF.gerarPDFContratoConfigurado()"
                            style="padding: 10px 20px; border: none; border-radius: 6px; background: linear-gradient(135deg, #3498db, #2980b9); color: white; cursor: pointer; font-size: 16px; font-weight: 600;">
                            📄 Gerar PDF do Contrato
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Abrir modal com animação
        const modal = document.getElementById('modalConfigurarContrato');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.zIndex = '9999';

            setTimeout(() => {
                modal.classList.add('active');
                const textarea = document.getElementById('campoPrecoCondicoes');
                if (textarea) {
                    textarea.focus();
                    textarea.select();
                }
            }, 100);
        }
    }

    /**
     * Fecha modal de configuração do contrato
     */
    function fecharModalConfigContrato() {
        const modal = document.getElementById('modalConfigurarContrato');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Gera PDF do contrato após configuração
     */
    function gerarPDFContratoConfigurado() {
        // Capturar valor do campo
        const campoPreco = document.getElementById('campoPrecoCondicoes');
        if (campoPreco) {
            configContrato.precoCondicoes = campoPreco.value.trim();

            if (!configContrato.precoCondicoes) {
                if (window.utils) {
                    window.utils.mostrarAlerta('⚠️ Por favor, preencha as condições de pagamento', 'warning');
                }
                return;
            }
        }

        // Fechar modal
        fecharModalConfigContrato();

        // Gerar PDF
        gerarPDFContrato();
    }

    // ==================== FUNÇÕES AUXILIARES ADICIONAIS ====================

    /**
     * Converte número em extenso (implementação melhorada)
     */
    function numeroExtenso(valor) {
        if (!valor || valor === 0) return 'zero reais';

        const partes = valor.toFixed(2).split('.');
        const reais = parseInt(partes[0]);
        const centavos = parseInt(partes[1]);

        // Implementação simplificada - idealmente usar biblioteca específica
        let extenso = '';

        // Para valores grandes, usar formato simplificado
        if (reais >= 1000000) {
            const milhoes = Math.floor(reais / 1000000);
            const resto = reais % 1000000;
            extenso = `${milhoes} ${milhoes === 1 ? 'milhão' : 'milhões'}`;
            if (resto > 0) {
                extenso += ` e ${resto.toLocaleString('pt-BR')}`;
            }
        } else if (reais >= 1000) {
            extenso = reais.toLocaleString('pt-BR');
        } else {
            extenso = reais.toString();
        }

        extenso += ` ${reais === 1 ? 'real' : 'reais'}`;

        if (centavos > 0) {
            extenso += ` e ${centavos} ${centavos === 1 ? 'centavo' : 'centavos'}`;
        }

        return extenso;
    }

    /**
     * Atualiza selector de orçamentos no painel de PDFs
     */
    function atualizarSeletorOrcamentoPDF() {
        const selector = document.getElementById('orcamentoParaPDF');
        if (!selector) return;

        const orcamentos = window.utils?.obterDados('orcamentos') || [];

        // Limpar e adicionar opção padrão
        selector.innerHTML = '<option value="">Selecione um orçamento salvo</option>';

        // Ordenar orçamentos por data (mais recentes primeiro)
        const orcamentosOrdenados = orcamentos.sort((a, b) => {
            const dataA = new Date(a.data || 0);
            const dataB = new Date(b.data || 0);
            return dataB - dataA;
        });

        // Adicionar orçamentos ao selector
        orcamentosOrdenados.forEach(orc => {
            const option = document.createElement('option');
            option.value = orc.id;

            // Formatação melhorada do texto da opção
            const numero = orc.numero || 'S/N';
            const cliente = orc.cliente || 'Cliente não informado';
            const valor = window.utils?.formatarMoeda(orc.valorTotal || 0) || `R$ ${(orc.valorTotal || 0).toFixed(2)}`;
            const data = window.utils?.formatarData(orc.data) || new Date(orc.data).toLocaleDateString('pt-BR');

            option.textContent = `${numero} - ${cliente} - ${valor} (${data})`;

            // Adicionar classe se orçamento estiver vencido (mais de 15 dias)
            const diasDesdeOrcamento = Math.floor((new Date() - new Date(orc.data)) / (1000 * 60 * 60 * 24));
            if (diasDesdeOrcamento > 15) {
                option.style.color = '#dc3545';
                option.textContent += ' [VENCIDO]';
            }

            selector.appendChild(option);
        });

        // Se houver apenas um orçamento, selecioná-lo automaticamente
        if (orcamentosOrdenados.length === 1) {
            selector.value = orcamentosOrdenados[0].id;
        }
    }

    // ==================== INICIALIZAÇÃO DO MÓDULO ====================

    /**
     * Inicializa módulo de geração de PDF
     */
    function inicializarModulo() {
        console.log('📄 Inicializando módulo de geração de PDF v7.0 REFINADO...');

        // Aguardar carregamento completo do DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inicializarModulo);
            return;
        }

        // Adicionar estilos CSS para melhorar visual dos modais
        if (!document.getElementById('pdf-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'pdf-modal-styles';
            style.textContent = `
                .modal {
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                .modal.active .modal-content {
                    animation: slideIn 0.3s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }
                
                .form-control:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
                }
            `;
            document.head.appendChild(style);
        }

        // Atualizar selector quando aba PDF for ativada
        const tabPDF = document.querySelector('[data-tab="pdf"]');
        if (tabPDF) {
            tabPDF.addEventListener('click', function () {
                setTimeout(atualizarSeletorOrcamentoPDF, 100);
            });
        }

        // Escutar eventos de atualização de orçamentos
        document.addEventListener('possattoUpdate', function (event) {
            if (event.detail && event.detail.modulo === 'orcamentos') {
                setTimeout(atualizarSeletorOrcamentoPDF, 100);
            }
        });

        // Atualizar selector inicialmente se a aba estiver ativa
        const abaPDFAtiva = document.querySelector('.tab-content[data-tab-content="pdf"]');
        if (abaPDFAtiva && abaPDFAtiva.classList.contains('active')) {
            atualizarSeletorOrcamentoPDF();
        }

        console.log('✅ Módulo gerarPDF.js v7.0 REFINADO inicializado com sucesso!');
        console.log('📊 Configurações visuais aplicadas:');
        console.log('  - Hierarquia de fontes: 22px/16px/13px');
        console.log('  - Margens generosas: 20mm');
        console.log('  - Cores profissionais aplicadas');
        console.log('  - Tratamento robusto de dados ausentes');
        console.log('  - Design moderno e limpo');
    }

    // ==================== API PÚBLICA DO MÓDULO ====================

    const gerarPDFAPI = {
        // Funções principais
        gerarPDFOrcamento,
        gerarPDFContrato,
        gerarListaMateriais,

        // Modal de configuração
        abrirModalConfigContrato,
        fecharModalConfigContrato,
        gerarPDFContratoConfigurado,

        // Utilitários
        atualizarSeletorOrcamentoPDF,

        // Configurações públicas
        config: CONFIG,
        configContrato: configContrato,

        // Versão
        versao: CONFIG.versao
    };

    // Exportar para window (compatibilidade com sistema existente)
    window.gerarPDF = gerarPDFAPI;

    // Exportar funções individuais para uso global (retrocompatibilidade)
    window.gerarPDFOrcamento = gerarPDFOrcamento;
    window.gerarPDFContrato = gerarPDFContrato;
    window.gerarListaMateriais = gerarListaMateriais;
    window.abrirConfigurarContrato = abrirModalConfigContrato;
    window.abrirModalContrato = abrirModalConfigContrato; // Alias para compatibilidade

    // Inicializar módulo
    inicializarModulo();

    // Log de sucesso
    console.log('🎨 Módulo de PDF refinado carregado com sucesso!');

})();
