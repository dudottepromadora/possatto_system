/**
 * SISTEMA POSSATTO PRO v7.0 - abaFluxo.js
 * Módulo: Fluxo de Caixa - VERSÃO CORRIGIDA E REFINADA
 * 
 * PARTE 1: CORREÇÕES ESTRUTURAIS E INTEGRAÇÃO
 * 
 * Correções aplicadas:
 * - Integração completa com módulos (Gestão, Folha, Orçamentos, Projetos)
 * - Persistência de dados otimizada
 * - Validações e tratamento de erros aprimorados
 * - Estrutura de dados padronizada
 */

(function () {
    'use strict';

    // ==================== CONFIGURAÇÕES E CONSTANTES ====================

    const CONFIG = {
        CHAVE_STORAGE: 'fluxoCaixaData',
        CHAVE_SALDO_INICIAL: 'saldoInicialCaixa',
        CHAVE_LANCAMENTOS_PENDENTES: 'lancamentosPendentes',
        VERSAO_MODULO: '7.0',
        AUTO_SAVE_DELAY: 2000,
        CATEGORIAS_ENTRADA: [
            'Orçamento',
            'Aluguel de Bancada',
            'Pontuais',
            'Vendas',
            'Serviços',
            'Outros'
        ],
        CATEGORIAS_SAIDA: [
            'Material',
            'Mão de Obra',
            'Aluguel',
            'Energia',
            'Água',
            'Internet',
            'Impostos',
            'Folha de Pagamento',
            'Despesas Gerais',
            'Despesas Fixas',
            'Despesas Livres',
            'Outros'
        ],
        TIPOS_ORIGEM: [
            'Manual',
            'Gestão Financeira',
            'Folha de Pagamento',
            'Orçamento',
            'Projeto',
            'Importação CSV',
            'Importação Excel',
            'Sistema'
        ]
    };

    const STATUS_MOVIMENTACAO = {
        'pago': { nome: 'Pago/Recebido', cor: 'success', icone: '✅' },
        'pendente': { nome: 'Pendente', cor: 'warning', icone: '⏳' },
        'atrasado': { nome: 'Atrasado', cor: 'danger', icone: '⚠️' },
        'cancelado': { nome: 'Cancelado', cor: 'secondary', icone: '❌' }
    };

    // ==================== VARIÁVEIS GLOBAIS ====================

    let movimentacoes = [];
    let saldoInicial = 0;
    let lancamentosPendentes = [];
    let filtroAtivo = {
        periodo: 'mes-atual',
        tipo: 'todos',
        categoria: 'todas',
        status: 'todos',
        busca: ''
    };
    let chartInstance = null;
    let moduloInicializado = false;

    // ==================== INICIALIZAÇÃO CORRIGIDA ====================

    function inicializarAbaFluxo() {
        try {
            // Evitar múltiplas inicializações
            if (moduloInicializado) {
                console.log('⚠️ Módulo abaFluxo já inicializado');
                return;
            }

            console.log('🚀 Inicializando módulo abaFluxo.js v7.0 CORRIGIDO...');

            // Carregar dados salvos
            carregarDados();

            // Renderizar interface apenas se a aba estiver ativa
            const abaAtiva = document.querySelector('.tab-content#fluxocaixa.active');
            if (abaAtiva) {
                renderizarInterface();

                // Configurar event listeners após renderização
                setTimeout(() => {
                    configurarEventListeners();
                    verificarIntegracoes();
                }, 100);
            }

            // Marcar como inicializado
            moduloInicializado = true;

            // Registrar no window para acesso global
            window.abaFluxo = API_PUBLICA;

            console.log('✅ Módulo abaFluxo.js inicializado com sucesso!');

            // Disparar evento de inicialização
            dispararEventoSistema('fluxoCaixa', 'inicializado', {
                totalMovimentacoes: movimentacoes.length,
                saldoAtual: calcularSaldoAtual()
            });

        } catch (error) {
            console.error('❌ Erro ao inicializar módulo abaFluxo.js:', error);
            mostrarAlerta('Erro ao inicializar fluxo de caixa', 'danger');
        }
    }

    // ==================== CARREGAMENTO DE DADOS CORRIGIDO ====================

    function carregarDados() {
        try {
            if (typeof window.utils !== 'undefined' && window.utils.obterDados) {
                // Usar utils.js se disponível
                movimentacoes = window.utils.obterDados(CONFIG.CHAVE_STORAGE, []);
                saldoInicial = parseFloat(window.utils.obterDados(CONFIG.CHAVE_SALDO_INICIAL, 0)) || 0;
                lancamentosPendentes = window.utils.obterDados(CONFIG.CHAVE_LANCAMENTOS_PENDENTES, []);
            } else {
                // Fallback para localStorage direto
                const prefix = 'possatto_';

                const dadosMovimentacoes = localStorage.getItem(prefix + CONFIG.CHAVE_STORAGE);
                movimentacoes = dadosMovimentacoes ? JSON.parse(dadosMovimentacoes) : [];

                const dadosSaldo = localStorage.getItem(prefix + CONFIG.CHAVE_SALDO_INICIAL);
                saldoInicial = dadosSaldo ? parseFloat(dadosSaldo) : 0;

                const dadosPendentes = localStorage.getItem(prefix + CONFIG.CHAVE_LANCAMENTOS_PENDENTES);
                lancamentosPendentes = dadosPendentes ? JSON.parse(dadosPendentes) : [];
            }

            // Validar e migrar dados se necessário
            movimentacoes = validarEMigrarMovimentacoes(movimentacoes);
            lancamentosPendentes = validarLancamentosPendentes(lancamentosPendentes);

            // Verificar integridade dos dados
            verificarIntegridadeDados();

            console.log(`📁 Dados carregados: ${movimentacoes.length} movimentação(ões), Saldo inicial: ${formatarMoeda(saldoInicial)}`);

        } catch (error) {
            console.error('❌ Erro ao carregar dados do fluxo de caixa:', error);
            movimentacoes = [];
            saldoInicial = 0;
            lancamentosPendentes = [];
        }
    }

    function validarEMigrarMovimentacoes(dados) {
        try {
            if (!Array.isArray(dados)) {
                return [];
            }

            return dados.map(mov => {
                // Estrutura completa e validada
                return {
                    id: mov.id || gerarId(),
                    tipo: ['entrada', 'saida'].includes(mov.tipo) ? mov.tipo : 'saida',
                    data: validarData(mov.data) || new Date().toISOString().split('T')[0],
                    hora: validarHora(mov.hora) || '12:00',
                    descricao: String(mov.descricao || '').trim() || 'Sem descrição',
                    valor: Math.abs(parseFloat(mov.valor) || 0),
                    categoria: validarCategoria(mov.categoria, mov.tipo) || 'Outros',
                    status: Object.keys(STATUS_MOVIMENTACAO).includes(mov.status) ? mov.status : 'pendente',
                    observacoes: String(mov.observacoes || '').trim(),
                    origem: CONFIG.TIPOS_ORIGEM.includes(mov.origem) ? mov.origem : 'Manual',
                    origemId: mov.origemId || null,
                    conciliado: Boolean(mov.conciliado),
                    tags: Array.isArray(mov.tags) ? mov.tags : [],
                    anexos: Array.isArray(mov.anexos) ? mov.anexos : [],
                    dataRegistro: mov.dataRegistro || new Date().toISOString(),
                    dataUltimaAtualizacao: mov.dataUltimaAtualizacao || new Date().toISOString(),
                    usuarioRegistro: mov.usuarioRegistro || 'Sistema',
                    usuarioAtualizacao: mov.usuarioAtualizacao || 'Sistema'
                };
            });

        } catch (error) {
            console.error('❌ Erro ao validar/migrar movimentações:', error);
            return [];
        }
    }

    function validarLancamentosPendentes(dados) {
        try {
            if (!Array.isArray(dados)) {
                return [];
            }

            return dados.map(lanc => ({
                id: lanc.id || gerarId(),
                tipo: ['entrada', 'saida'].includes(lanc.tipo) ? lanc.tipo : 'saida',
                origemId: lanc.origemId || null,
                origem: CONFIG.TIPOS_ORIGEM.includes(lanc.origem) ? lanc.origem : 'Sistema',
                data: validarData(lanc.data) || new Date().toISOString().split('T')[0],
                descricao: String(lanc.descricao || '').trim() || 'Lançamento pendente',
                valor: Math.abs(parseFloat(lanc.valor) || 0),
                categoria: validarCategoria(lanc.categoria, lanc.tipo) || 'Outros',
                selecionado: Boolean(lanc.selecionado),
                processado: Boolean(lanc.processado),
                dataImportacao: lanc.dataImportacao || new Date().toISOString()
            }));

        } catch (error) {
            console.error('❌ Erro ao validar lançamentos pendentes:', error);
            return [];
        }
    }

    function salvarDados(mostrarNotificacao = false) {
        try {
            if (typeof window.utils !== 'undefined' && window.utils.salvarDados) {
                window.utils.salvarDados(CONFIG.CHAVE_STORAGE, movimentacoes);
                window.utils.salvarDados(CONFIG.CHAVE_SALDO_INICIAL, saldoInicial);
                window.utils.salvarDados(CONFIG.CHAVE_LANCAMENTOS_PENDENTES, lancamentosPendentes);
            } else {
                const prefix = 'possatto_';
                localStorage.setItem(prefix + CONFIG.CHAVE_STORAGE, JSON.stringify(movimentacoes));
                localStorage.setItem(prefix + CONFIG.CHAVE_SALDO_INICIAL, saldoInicial.toString());
                localStorage.setItem(prefix + CONFIG.CHAVE_LANCAMENTOS_PENDENTES, JSON.stringify(lancamentosPendentes));
            }

            // Disparar evento de atualização
            dispararEventoSistema('fluxoCaixa', 'dados_salvos', {
                totalMovimentacoes: movimentacoes.length,
                saldoAtual: calcularSaldoAtual()
            });

            if (mostrarNotificacao) {
                mostrarAlerta('💾 Dados salvos com sucesso!', 'success', 2000);
            }

            return true;

        } catch (error) {
            console.error('❌ Erro ao salvar dados do fluxo de caixa:', error);
            mostrarAlerta('Erro ao salvar dados do fluxo de caixa', 'danger');
            return false;
        }
    }

    // ==================== INTEGRAÇÃO COM OUTROS MÓDULOS ====================

    function verificarIntegracoes() {
        try {
            console.log('🔄 Verificando integrações com outros módulos...');

            // Verificar e processar lançamentos pendentes
            verificarLancamentosGestao();
            verificarLancamentosFolha();
            verificarLancamentosOrcamentos();
            verificarLancamentosProjetos();

            // Atualizar contador de pendentes
            atualizarContadorPendentes();

            console.log(`📝 ${lancamentosPendentes.length} lançamento(s) pendente(s) encontrado(s)`);

        } catch (error) {
            console.error('❌ Erro ao verificar integrações:', error);
        }
    }

    function verificarLancamentosGestao() {
        try {
            if (!window.utils || !window.utils.obterDados) return;

            // Verificar receitas da gestão
            const receitas = window.utils.obterDados('receitas', []);
            receitas.forEach(receita => {
                if (receita.status === 'recebida' && !existeMovimentacao('Gestão Financeira', receita.id)) {
                    adicionarLancamentoPendente({
                        tipo: 'entrada',
                        origemId: receita.id,
                        origem: 'Gestão Financeira',
                        data: receita.data,
                        descricao: receita.descricao,
                        valor: receita.valor,
                        categoria: receita.categoria || 'Outros'
                    });
                }
            });

            // Verificar despesas fixas
            const despesasFixas = window.utils.obterDados('despesasFixas', []);
            despesasFixas.forEach(despesa => {
                if (despesa.status === 'pago' && !existeMovimentacao('Gestão Financeira', despesa.id)) {
                    adicionarLancamentoPendente({
                        tipo: 'saida',
                        origemId: despesa.id,
                        origem: 'Gestão Financeira',
                        data: despesa.data,
                        descricao: despesa.descricao,
                        valor: despesa.valor,
                        categoria: 'Despesas Fixas'
                    });
                }
            });

            // Verificar despesas livres
            const despesasLivres = window.utils.obterDados('despesasLivres', []);
            despesasLivres.forEach(despesa => {
                if (despesa.status === 'pago' && !existeMovimentacao('Gestão Financeira', despesa.id)) {
                    adicionarLancamentoPendente({
                        tipo: 'saida',
                        origemId: despesa.id,
                        origem: 'Gestão Financeira',
                        data: despesa.data,
                        descricao: despesa.descricao,
                        valor: despesa.valor,
                        categoria: 'Despesas Livres'
                    });
                }
            });

        } catch (error) {
            console.error('❌ Erro ao verificar lançamentos da gestão:', error);
        }
    }

    function verificarLancamentosFolha() {
        try {
            if (!window.utils || !window.utils.obterDados) return;

            const folhaFechamentos = window.utils.obterDados('folhaFechamentos', []);

            folhaFechamentos.forEach(fechamento => {
                if (fechamento.status === 'processado' && fechamento.funcionarios) {
                    fechamento.funcionarios.forEach(func => {
                        const lancamentoId = `folha-${fechamento.id}-${func.id}`;

                        if (!existeMovimentacao('Folha de Pagamento', lancamentoId)) {
                            adicionarLancamentoPendente({
                                tipo: 'saida',
                                origemId: lancamentoId,
                                origem: 'Folha de Pagamento',
                                data: fechamento.dataFechamento,
                                descricao: `Salário - ${func.nome} (${fechamento.periodo})`,
                                valor: func.custoTotal || func.salarioLiquido || 0,
                                categoria: 'Folha de Pagamento'
                            });
                        }
                    });
                }
            });

        } catch (error) {
            console.error('❌ Erro ao verificar lançamentos da folha:', error);
        }
    }

    function verificarLancamentosOrcamentos() {
        try {
            if (!window.utils || !window.utils.obterDados) return;

            const orcamentos = window.utils.obterDados('orcamentos', []);

            orcamentos.forEach(orcamento => {
                if (orcamento.status === 'aprovado' && orcamento.formaPagamentoDefinida) {
                    const lancamentoId = `orc-${orcamento.id}`;

                    if (!existeMovimentacao('Orçamento', lancamentoId)) {
                        // Verificar tipo de pagamento
                        const pagamento = orcamento.formaPagamentoDefinida;

                        if (pagamento.tipo === 'avista') {
                            // Pagamento à vista
                            adicionarLancamentoPendente({
                                tipo: 'entrada',
                                origemId: lancamentoId,
                                origem: 'Orçamento',
                                data: orcamento.dataAprovacao || orcamento.data,
                                descricao: `Orçamento ${orcamento.numero} - ${orcamento.cliente} (À vista)`,
                                valor: pagamento.valorTotal || orcamento.valorTotal,
                                categoria: 'Orçamento'
                            });
                        } else if (pagamento.tipo === 'entrada_parcelas') {
                            // Entrada
                            if (pagamento.valorEntrada > 0) {
                                adicionarLancamentoPendente({
                                    tipo: 'entrada',
                                    origemId: `${lancamentoId}-entrada`,
                                    origem: 'Orçamento',
                                    data: orcamento.dataAprovacao || orcamento.data,
                                    descricao: `Orçamento ${orcamento.numero} - ${orcamento.cliente} (Entrada)`,
                                    valor: pagamento.valorEntrada,
                                    categoria: 'Orçamento'
                                });
                            }

                            // Parcelas
                            for (let i = 1; i <= (pagamento.numeroParcelas || 0); i++) {
                                const dataParcela = calcularDataParcela(orcamento.dataAprovacao || orcamento.data, i);
                                adicionarLancamentoPendente({
                                    tipo: 'entrada',
                                    origemId: `${lancamentoId}-parcela-${i}`,
                                    origem: 'Orçamento',
                                    data: dataParcela,
                                    descricao: `Orçamento ${orcamento.numero} - ${orcamento.cliente} (Parcela ${i}/${pagamento.numeroParcelas})`,
                                    valor: pagamento.valorParcela,
                                    categoria: 'Orçamento'
                                });
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('❌ Erro ao verificar lançamentos de orçamentos:', error);
        }
    }

    function verificarLancamentosProjetos() {
        try {
            if (!window.utils || !window.utils.obterDados) return;

            const projetos = window.utils.obterDados('projetos', []);

            projetos.forEach(projeto => {
                if (projeto.status === 'finalizado' && projeto.valorContrato > 0) {
                    const lancamentoId = `proj-${projeto.id}`;

                    if (!existeMovimentacao('Projeto', lancamentoId)) {
                        adicionarLancamentoPendente({
                            tipo: 'entrada',
                            origemId: lancamentoId,
                            origem: 'Projeto',
                            data: projeto.dataConclusao || projeto.dataPrevisao,
                            descricao: `Projeto ${projeto.id} - ${projeto.nomeCliente} (Finalizado)`,
                            valor: projeto.valorContrato,
                            categoria: 'Orçamento'
                        });
                    }
                }
            });

        } catch (error) {
            console.error('❌ Erro ao verificar lançamentos de projetos:', error);
        }
    }

    // ==================== FUNÇÕES AUXILIARES DE INTEGRAÇÃO ====================

    function existeMovimentacao(origem, origemId) {
        return movimentacoes.some(m => m.origem === origem && m.origemId === origemId);
    }

    function adicionarLancamentoPendente(dados) {
        try {
            // Verificar se já existe
            const jaExiste = lancamentosPendentes.some(l =>
                l.origem === dados.origem && l.origemId === dados.origemId
            );

            if (!jaExiste) {
                lancamentosPendentes.push({
                    id: gerarId(),
                    ...dados,
                    selecionado: false,
                    processado: false,
                    dataImportacao: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('❌ Erro ao adicionar lançamento pendente:', error);
        }
    }

    function atualizarContadorPendentes() {
        try {
            const contador = lancamentosPendentes.filter(l => !l.processado).length;
            const elemento = document.querySelector('.btn-info[onclick*="abrirLancamentosPendentes"]');

            if (elemento) {
                elemento.innerHTML = `📝 Lançamentos Pendentes (${contador})`;
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar contador de pendentes:', error);
        }
    }

    // ==================== VALIDAÇÕES E UTILITÁRIOS ====================

    function validarData(data) {
        try {
            if (!data) return null;

            const d = new Date(data);
            if (isNaN(d.getTime())) return null;

            return d.toISOString().split('T')[0];
        } catch {
            return null;
        }
    }

    function validarHora(hora) {
        try {
            if (!hora) return '12:00';

            const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return regex.test(hora) ? hora : '12:00';
        } catch {
            return '12:00';
        }
    }

    function validarCategoria(categoria, tipo) {
        const categorias = tipo === 'entrada' ? CONFIG.CATEGORIAS_ENTRADA : CONFIG.CATEGORIAS_SAIDA;
        return categorias.includes(categoria) ? categoria : 'Outros';
    }

    function verificarIntegridadeDados() {
        try {
            // Verificar duplicatas
            const ids = movimentacoes.map(m => m.id);
            const idsUnicos = [...new Set(ids)];

            if (ids.length !== idsUnicos.length) {
                console.warn('⚠️ Duplicatas encontradas, removendo...');
                const movimentacoesUnicas = [];
                const idsProcessados = new Set();

                movimentacoes.forEach(mov => {
                    if (!idsProcessados.has(mov.id)) {
                        movimentacoesUnicas.push(mov);
                        idsProcessados.add(mov.id);
                    }
                });

                movimentacoes = movimentacoesUnicas;
            }

            // Verificar datas inválidas
            movimentacoes.forEach(mov => {
                if (!validarData(mov.data)) {
                    mov.data = new Date().toISOString().split('T')[0];
                    console.warn(`⚠️ Data corrigida para movimentação ${mov.id}`);
                }
            });

            // Ordenar por data/hora
            movimentacoes.sort((a, b) => {
                const dataA = new Date(a.data + ' ' + a.hora);
                const dataB = new Date(b.data + ' ' + b.hora);
                return dataB - dataA;
            });

        } catch (error) {
            console.error('❌ Erro ao verificar integridade dos dados:', error);
        }
    }

    function calcularDataParcela(dataInicial, numeroParcela) {
        try {
            const data = new Date(dataInicial);
            data.setMonth(data.getMonth() + numeroParcela);
            return data.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    }

    function gerarId() {
        return 'flux_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function formatarMoeda(valor) {
        if (window.utils && window.utils.formatarMoeda) {
            return window.utils.formatarMoeda(valor);
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    }

    function mostrarAlerta(mensagem, tipo = 'info', duracao = 5000) {
        if (window.utils && window.utils.mostrarAlerta) {
            window.utils.mostrarAlerta(mensagem, tipo, duracao);
        } else {
            console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
        }
    }

    function dispararEventoSistema(modulo, acao, dados = {}) {
        try {
            if (window.utils && window.utils.dispararEvento) {
                window.utils.dispararEvento('possattoUpdate', {
                    modulo,
                    acao,
                    dados,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ Erro ao disparar evento:', error);
        }
    }

    // ==================== CONFIGURAÇÃO DE EVENT LISTENERS ====================

    function configurarEventListeners() {
        try {
            // Remover listeners antigos para evitar duplicação
            document.removeEventListener('possattoUpdate', handlePossattoUpdate);

            // Adicionar listener para integração com outros módulos
            document.addEventListener('possattoUpdate', handlePossattoUpdate);

            // Listener para mudança de aba
            const tabButtons = document.querySelectorAll('.nav-tab[data-tab="fluxocaixa"]');
            tabButtons.forEach(btn => {
                btn.removeEventListener('click', handleTabChange);
                btn.addEventListener('click', handleTabChange);
            });

            console.log('✅ Event listeners configurados');

        } catch (error) {
            console.error('❌ Erro ao configurar event listeners:', error);
        }
    }

    function handlePossattoUpdate(event) {
        try {
            const { modulo, acao, dados } = event.detail;

            // Ignorar eventos do próprio módulo
            if (modulo === 'fluxoCaixa') return;

            console.log(`📨 Evento recebido: ${modulo}/${acao}`);

            // Processar eventos de outros módulos
            switch (modulo) {
                case 'gestao':
                case 'gestaoFinanceira':
                    handleEventoGestao(acao, dados);
                    break;

                case 'folha':
                case 'folhaPagamento':
                    handleEventoFolha(acao, dados);
                    break;

                case 'orcamentos':
                    handleEventoOrcamento(acao, dados);
                    break;

                case 'projetos':
                    handleEventoProjeto(acao, dados);
                    break;
            }

        } catch (error) {
            console.error('❌ Erro ao processar evento:', error);
        }
    }

    function handleTabChange() {
        setTimeout(() => {
            if (!moduloInicializado) {
                inicializarAbaFluxo();
            } else {
                renderizarInterface();
                verificarIntegracoes();
            }
        }, 100);
    }

    function handleEventoGestao(acao, dados) {
        switch (acao) {
            case 'receita_paga':
            case 'receita_recebida':
                adicionarMovimentacaoAutomatica({
                    tipo: 'entrada',
                    origemId: dados.id,
                    origem: 'Gestão Financeira',
                    data: dados.data,
                    descricao: dados.descricao,
                    valor: dados.valor,
                    categoria: dados.categoria || 'Outros',
                    status: 'pago'
                });
                break;

            case 'despesa_paga':
                adicionarMovimentacaoAutomatica({
                    tipo: 'saida',
                    origemId: dados.id,
                    origem: 'Gestão Financeira',
                    data: dados.data,
                    descricao: dados.descricao,
                    valor: dados.valor,
                    categoria: dados.categoria || 'Despesas Gerais',
                    status: 'pago'
                });
                break;
        }
    }

    function handleEventoFolha(acao, dados) {
        if (acao === 'folha_fechada' && dados.funcionarios) {
            dados.funcionarios.forEach(func => {
                adicionarMovimentacaoAutomatica({
                    tipo: 'saida',
                    origemId: `folha-${dados.id}-${func.id}`,
                    origem: 'Folha de Pagamento',
                    data: dados.dataFechamento,
                    descricao: `Salário - ${func.nome} (${dados.periodo})`,
                    valor: func.custoTotal || func.salarioLiquido,
                    categoria: 'Folha de Pagamento',
                    status: 'pago'
                });
            });
        }
    }

    function handleEventoOrcamento(acao, dados) {
        if (acao === 'orcamento_aprovado' && dados.valorTotal > 0) {
            adicionarLancamentoPendente({
                tipo: 'entrada',
                origemId: `orc-${dados.id}`,
                origem: 'Orçamento',
                data: dados.dataAprovacao || dados.data,
                descricao: `Orçamento ${dados.numero} - ${dados.cliente}`,
                valor: dados.valorTotal,
                categoria: 'Orçamento'
            });

            atualizarContadorPendentes();
        }
    }

    function handleEventoProjeto(acao, dados) {
        if (acao === 'projeto_finalizado' && dados.valorContrato > 0) {
            adicionarMovimentacaoAutomatica({
                tipo: 'entrada',
                origemId: `proj-${dados.id}`,
                origem: 'Projeto',
                data: dados.dataConclusao,
                descricao: `Projeto ${dados.id} - ${dados.nomeCliente}`,
                valor: dados.valorContrato,
                categoria: 'Orçamento',
                status: 'pago'
            });
        }
    }

    function adicionarMovimentacaoAutomatica(dados) {
        try {
            // Verificar se já existe
            if (existeMovimentacao(dados.origem, dados.origemId)) {
                console.log(`⚠️ Movimentação já existe: ${dados.origem}/${dados.origemId}`);
                return null;
            }

            const novaMovimentacao = {
                id: gerarId(),
                tipo: dados.tipo,
                data: dados.data || new Date().toISOString().split('T')[0],
                hora: dados.hora || new Date().toTimeString().slice(0, 5),
                descricao: dados.descricao,
                valor: Math.abs(dados.valor),
                categoria: dados.categoria,
                status: dados.status || 'pago',
                observacoes: dados.observacoes || `Lançamento automático de: ${dados.origem}`,
                origem: dados.origem,
                origemId: dados.origemId,
                conciliado: false,
                tags: [],
                anexos: [],
                dataRegistro: new Date().toISOString(),
                dataUltimaAtualizacao: new Date().toISOString(),
                usuarioRegistro: 'Sistema',
                usuarioAtualizacao: 'Sistema'
            };

            movimentacoes.unshift(novaMovimentacao);
            salvarDados();

            // Atualizar interface se visível
            const abaAtiva = document.querySelector('.tab-content#fluxocaixa.active');
            if (abaAtiva) {
                renderizarInterface();
            }

            mostrarAlerta(`✅ Movimentação adicionada automaticamente: ${dados.descricao}`, 'success', 3000);

            return novaMovimentacao;

        } catch (error) {
            console.error('❌ Erro ao adicionar movimentação automática:', error);
            return null;
        }
    }

    // ==================== CÁLCULOS FINANCEIROS CORRIGIDOS ====================

    function calcularSaldoAtual() {
        try {
            // Considerar apenas movimentações com status pago/recebido
            const movimentacoesPagas = movimentacoes.filter(m => m.status === 'pago');

            const entradas = movimentacoesPagas
                .filter(m => m.tipo === 'entrada')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            const saidas = movimentacoesPagas
                .filter(m => m.tipo === 'saida')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            return saldoInicial + entradas - saidas;

        } catch (error) {
            console.error('❌ Erro ao calcular saldo atual:', error);
            return saldoInicial;
        }
    }

    function calcularMovimentacoesPeriodo(periodo = 'mes-atual') {
        try {
            const { inicio, fim } = obterPeriodo(periodo);

            const movimentacoesPeriodo = movimentacoes.filter(m => {
                const dataMovimentacao = new Date(m.data);
                return dataMovimentacao >= inicio && dataMovimentacao <= fim;
            });

            const entradas = movimentacoesPeriodo
                .filter(m => m.tipo === 'entrada')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            const saidas = movimentacoesPeriodo
                .filter(m => m.tipo === 'saida')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            const entradasPagas = movimentacoesPeriodo
                .filter(m => m.tipo === 'entrada' && m.status === 'pago')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            const saidasPagas = movimentacoesPeriodo
                .filter(m => m.tipo === 'saida' && m.status === 'pago')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            return {
                entradas,
                saidas,
                saldo: entradas - saidas,
                entradasPagas,
                saidasPagas,
                saldoPago: entradasPagas - saidasPagas,
                totalMovimentacoes: movimentacoesPeriodo.length
            };

        } catch (error) {
            console.error('❌ Erro ao calcular movimentações do período:', error);
            return {
                entradas: 0,
                saidas: 0,
                saldo: 0,
                entradasPagas: 0,
                saidasPagas: 0,
                saldoPago: 0,
                totalMovimentacoes: 0
            };
        }
    }

    function calcularProjecao() {
        try {
            const saldoAtual = calcularSaldoAtual();

            // Considerar movimentações pendentes futuras
            const hoje = new Date();
            const movimentacoesFuturas = movimentacoes.filter(m =>
                m.status === 'pendente' && new Date(m.data) > hoje
            );

            const entradasFuturas = movimentacoesFuturas
                .filter(m => m.tipo === 'entrada')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            const saidasFuturas = movimentacoesFuturas
                .filter(m => m.tipo === 'saida')
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            return saldoAtual + entradasFuturas - saidasFuturas;

        } catch (error) {
            console.error('❌ Erro ao calcular projeção:', error);
            return calcularSaldoAtual();
        }
    }

    function obterPeriodo(tipo) {
        const hoje = new Date();
        let inicio, fim;

        switch (tipo) {
            case 'mes-atual':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                break;

            case 'mes-anterior':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
                break;

            case 'trimestre':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                break;

            case 'semestre':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                break;

            case 'ano':
                inicio = new Date(hoje.getFullYear(), 0, 1);
                fim = new Date(hoje.getFullYear(), 11, 31);
                break;

            case 'personalizado':
                return filtroAtivo.periodoPersonalizado || {
                    inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
                    fim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
                };

            default:
                inicio = new Date(2000, 0, 1);
                fim = new Date(2100, 11, 31);
        }

        return { inicio, fim };
    }

    // ==================== RENDERIZAÇÃO DA INTERFACE CORRIGIDA ====================

    function renderizarInterface() {
        try {
            const container = document.getElementById('fluxoCaixaContent') || document.getElementById('fluxocaixa');
            if (!container) {
                console.error('❌ Container do fluxo de caixa não encontrado');
                return;
            }

            container.innerHTML = `
                <div class="fluxo-caixa-container">
                    <!-- Header -->
                    <div class="fluxo-header">
                        <div class="header-left">
                            <h2>💳 Fluxo de Caixa</h2>
                            <p class="subtitle">Controle completo de entradas e saídas</p>
                        </div>
                        <div class="header-right">
                            <div class="header-stats">
                                <div class="stat-mini">
                                    <span class="stat-value">${movimentacoes.length}</span>
                                    <span class="stat-label">Total</span>
                                </div>
                                <div class="stat-mini">
                                    <span class="stat-value text-success">${movimentacoes.filter(m => m.tipo === 'entrada').length}</span>
                                    <span class="stat-label">Entradas</span>
                                </div>
                                <div class="stat-mini">
                                    <span class="stat-value text-danger">${movimentacoes.filter(m => m.tipo === 'saida').length}</span>
                                    <span class="stat-label">Saídas</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Dashboard de Saldo -->
                    <div class="dashboard-saldo">
                        ${renderizarDashboardSaldo()}
                    </div>

                    <!-- Filtros -->
                    <div class="filtros-container card">
                        ${renderizarFiltros()}
                    </div>

                    <!-- Resumo do Período -->
                    <div class="resumo-periodo">
                        ${renderizarResumoPeriodo()}
                    </div>

                    <!-- Tabela de Movimentações -->
                    <div class="movimentacoes-container card">
                        ${renderizarTabelaMovimentacoes()}
                    </div>

                    <!-- Gráfico de Fluxo -->
                    <div class="grafico-container card">
                        <div class="card-header">
                            <h4>📊 Evolução do Fluxo de Caixa</h4>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="window.abaFluxo.alterarPeriodoGrafico('6meses')">6 Meses</button>
                                <button class="btn btn-outline-primary" onclick="window.abaFluxo.alterarPeriodoGrafico('12meses')">12 Meses</button>
                                <button class="btn btn-outline-primary" onclick="window.abaFluxo.alterarPeriodoGrafico('ano')">Ano</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <canvas id="graficoFluxoCaixa" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                ${renderizarModais()}
            `;

            // Inicializar componentes após renderização
            setTimeout(() => {
                inicializarGrafico();
                atualizarContadorPendentes();
                aplicarMascaras();
            }, 100);

        } catch (error) {
            console.error('❌ Erro ao renderizar interface:', error);
        }
    }

    function renderizarDashboardSaldo() {
        const saldoAtual = calcularSaldoAtual();
        const projecao = calcularProjecao();
        const periodo = calcularMovimentacoesPeriodo(filtroAtivo.periodo);

        return `
            <div class="saldo-cards">
                <div class="saldo-card principal">
                    <div class="saldo-icone">💰</div>
                    <div class="saldo-info">
                        <h3>Saldo Atual</h3>
                        <div class="saldo-valor ${saldoAtual >= 0 ? 'positivo' : 'negativo'}">
                            ${formatarMoeda(saldoAtual)}
                        </div>
                        <small>Considerando movimentações pagas</small>
                    </div>
                </div>

                <div class="saldo-card">
                    <div class="saldo-icone">📈</div>
                    <div class="saldo-info">
                        <h4>Entradas do Período</h4>
                        <div class="saldo-valor positivo">
                            ${formatarMoeda(periodo.entradas)}
                        </div>
                        <small>${periodo.entradasPagas === periodo.entradas ? 'Todas recebidas' :
                `${formatarMoeda(periodo.entradasPagas)} recebido`}</small>
                    </div>
                </div>

                <div class="saldo-card">
                    <div class="saldo-icone">📉</div>
                    <div class="saldo-info">
                        <h4>Saídas do Período</h4>
                        <div class="saldo-valor negativo">
                            ${formatarMoeda(periodo.saidas)}
                        </div>
                        <small>${periodo.saidasPagas === periodo.saidas ? 'Todas pagas' :
                `${formatarMoeda(periodo.saidasPagas)} pago`}</small>
                    </div>
                </div>

                <div class="saldo-card">
                    <div class="saldo-icone">🔮</div>
                    <div class="saldo-info">
                        <h4>Projeção</h4>
                        <div class="saldo-valor ${projecao >= 0 ? 'positivo' : 'negativo'}">
                            ${formatarMoeda(projecao)}
                        </div>
                        <small>Incluindo pendências futuras</small>
                    </div>
                </div>
            </div>

            <div class="acoes-rapidas">
                <button class="btn btn-primary" onclick="window.abaFluxo.configurarSaldoInicial()">
                    ⚙️ Saldo Inicial
                </button>
                <button class="btn btn-success" onclick="window.abaFluxo.novaEntrada()">
                    ⬆️ Nova Entrada
                </button>
                <button class="btn btn-danger" onclick="window.abaFluxo.novaSaida()">
                    ⬇️ Nova Saída
                </button>
                <button class="btn btn-info" onclick="window.abaFluxo.abrirLancamentosPendentes()">
                    📝 Lançamentos Pendentes (${lancamentosPendentes.filter(l => !l.processado).length})
                </button>
                <button class="btn btn-warning" onclick="window.abaFluxo.conciliarMovimentacoes()">
                    ✅ Conciliar
                </button>
                <button class="btn btn-secondary" onclick="window.abaFluxo.importarDados()">
                    📥 Importar
                </button>
            </div>
        `;
    }

    function renderizarFiltros() {
        return `
            <div class="filtros-fluxo">
                <div class="filtro-item">
                    <label>Período:</label>
                    <select id="filtroPeriodo" class="form-control" onchange="window.abaFluxo.aplicarFiltro('periodo', this.value)">
                        <option value="mes-atual" ${filtroAtivo.periodo === 'mes-atual' ? 'selected' : ''}>Mês Atual</option>
                        <option value="mes-anterior" ${filtroAtivo.periodo === 'mes-anterior' ? 'selected' : ''}>Mês Anterior</option>
                        <option value="trimestre" ${filtroAtivo.periodo === 'trimestre' ? 'selected' : ''}>Último Trimestre</option>
                        <option value="semestre" ${filtroAtivo.periodo === 'semestre' ? 'selected' : ''}>Último Semestre</option>
                        <option value="ano" ${filtroAtivo.periodo === 'ano' ? 'selected' : ''}>Ano Atual</option>
                        <option value="todos" ${filtroAtivo.periodo === 'todos' ? 'selected' : ''}>Todos</option>
                        <option value="personalizado" ${filtroAtivo.periodo === 'personalizado' ? 'selected' : ''}>Personalizado</option>
                    </select>
                </div>

                <div class="filtro-item">
                    <label>Tipo:</label>
                    <select id="filtroTipo" class="form-control" onchange="window.abaFluxo.aplicarFiltro('tipo', this.value)">
                        <option value="todos" ${filtroAtivo.tipo === 'todos' ? 'selected' : ''}>Todos</option>
                        <option value="entrada" ${filtroAtivo.tipo === 'entrada' ? 'selected' : ''}>Entradas</option>
                        <option value="saida" ${filtroAtivo.tipo === 'saida' ? 'selected' : ''}>Saídas</option>
                    </select>
                </div>

                <div class="filtro-item">
                    <label>Categoria:</label>
                    <select id="filtroCategoria" class="form-control" onchange="window.abaFluxo.aplicarFiltro('categoria', this.value)">
                        <option value="todas" ${filtroAtivo.categoria === 'todas' ? 'selected' : ''}>Todas</option>
                        ${renderizarOpcoesCategoria()}
                    </select>
                </div>

                <div class="filtro-item">
                    <label>Status:</label>
                    <select id="filtroStatus" class="form-control" onchange="window.abaFluxo.aplicarFiltro('status', this.value)">
                        <option value="todos" ${filtroAtivo.status === 'todos' ? 'selected' : ''}>Todos</option>
                        ${Object.entries(STATUS_MOVIMENTACAO).map(([key, status]) =>
            `<option value="${key}" ${filtroAtivo.status === key ? 'selected' : ''}>
                                ${status.icone} ${status.nome}
                            </option>`
        ).join('')}
                    </select>
                </div>

                <div class="filtro-item busca">
                    <label>&nbsp;</label>
                    <input type="text" id="filtroDescricao" class="form-control" 
                        placeholder="🔍 Buscar descrição..." 
                        value="${filtroAtivo.busca || ''}"
                        onkeyup="window.abaFluxo.buscarMovimentacao(this.value)">
                </div>
            </div>
        `;
    }

    function renderizarOpcoesCategoria() {
        let html = '<optgroup label="Entradas">';
        CONFIG.CATEGORIAS_ENTRADA.forEach(cat => {
            const selected = filtroAtivo.categoria === `entrada-${cat}` ? 'selected' : '';
            html += `<option value="entrada-${cat}" ${selected}>🟢 ${cat}</option>`;
        });
        html += '</optgroup>';

        html += '<optgroup label="Saídas">';
        CONFIG.CATEGORIAS_SAIDA.forEach(cat => {
            const selected = filtroAtivo.categoria === `saida-${cat}` ? 'selected' : '';
            html += `<option value="saida-${cat}" ${selected}>🔴 ${cat}</option>`;
        });
        html += '</optgroup>';

        return html;
    }

    function renderizarResumoPeriodo() {
        const movimentacoesFiltradas = obterMovimentacoesFiltradas();

        const entradas = movimentacoesFiltradas
            .filter(m => m.tipo === 'entrada')
            .reduce((sum, m) => sum + (m.valor || 0), 0);

        const saidas = movimentacoesFiltradas
            .filter(m => m.tipo === 'saida')
            .reduce((sum, m) => sum + (m.valor || 0), 0);

        const saldo = entradas - saidas;

        const pendentes = movimentacoesFiltradas.filter(m => m.status === 'pendente').length;
        const atrasadas = movimentacoesFiltradas.filter(m => m.status === 'atrasado').length;

        return `
            <div class="resumo-cards">
                <div class="resumo-card entrada">
                    <div class="resumo-icone">⬆️</div>
                    <div class="resumo-info">
                        <h4>Entradas</h4>
                        <div class="resumo-valor positivo">
                            ${formatarMoeda(entradas)}
                        </div>
                        <small>${movimentacoesFiltradas.filter(m => m.tipo === 'entrada').length} movimentação(ões)</small>
                    </div>
                </div>

                <div class="resumo-card saida">
                    <div class="resumo-icone">⬇️</div>
                    <div class="resumo-info">
                        <h4>Saídas</h4>
                        <div class="resumo-valor negativo">
                            ${formatarMoeda(saidas)}
                        </div>
                        <small>${movimentacoesFiltradas.filter(m => m.tipo === 'saida').length} movimentação(ões)</small>
                    </div>
                </div>

                <div class="resumo-card saldo">
                    <div class="resumo-icone">⚖️</div>
                    <div class="resumo-info">
                        <h4>Saldo do Período</h4>
                        <div class="resumo-valor ${saldo >= 0 ? 'positivo' : 'negativo'}">
                            ${formatarMoeda(saldo)}
                        </div>
                        <small>${saldo >= 0 ? 'Lucro' : 'Prejuízo'} no período</small>
                    </div>
                </div>

                ${pendentes > 0 || atrasadas > 0 ? `
                    <div class="resumo-card alerta">
                        <div class="resumo-icone">⚠️</div>
                        <div class="resumo-info">
                            <h4>Atenção</h4>
                            <div class="resumo-alertas">
                                ${pendentes > 0 ? `<span class="badge badge-warning">${pendentes} pendente(s)</span>` : ''}
                                ${atrasadas > 0 ? `<span class="badge badge-danger">${atrasadas} atrasada(s)</span>` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function renderizarTabelaMovimentacoes() {
        const movimentacoesFiltradas = obterMovimentacoesFiltradas();

        if (movimentacoesFiltradas.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h3>Nenhuma movimentação encontrada</h3>
                    <p>${filtroAtivo.busca || filtroAtivo.periodo !== 'mes-atual' ?
                    'Tente ajustar os filtros de busca' :
                    'Comece adicionando entradas e saídas'}</p>
                    <div class="empty-actions">
                        <button class="btn btn-success" onclick="window.abaFluxo.novaEntrada()">
                            ⬆️ Nova Entrada
                        </button>
                        <button class="btn btn-danger" onclick="window.abaFluxo.novaSaida()">
                            ⬇️ Nova Saída
                        </button>
                        ${filtroAtivo.busca || filtroAtivo.periodo !== 'mes-atual' ? `
                            <button class="btn btn-secondary" onclick="window.abaFluxo.limparFiltros()">
                                🔄 Limpar Filtros
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="tabela-header">
                <h4>📋 Movimentações (${movimentacoesFiltradas.length})</h4>
                <div class="tabela-actions">
                    <button class="btn btn-sm btn-success" onclick="window.abaFluxo.novaEntrada()">
                        ⬆️ Entrada
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.abaFluxo.novaSaida()">
                        ⬇️ Saída
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.abaFluxo.exportarMovimentacoes()">
                        📤 Exportar
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th width="100">Data</th>
                            <th>Descrição</th>
                            <th width="120">Categoria</th>
                            <th width="80">Tipo</th>
                            <th width="120">Valor</th>
                            <th width="110">Status</th>
                            <th width="140">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movimentacoesFiltradas.map(mov => renderizarLinhaMovimentacao(mov)).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="table-summary">
                            <td colspan="4" class="text-end"><strong>Totais:</strong></td>
                            <td>
                                <div class="text-success">⬆️ ${formatarMoeda(
            movimentacoesFiltradas
                .filter(m => m.tipo === 'entrada')
                .reduce((sum, m) => sum + m.valor, 0)
        )}</div>
                                <div class="text-danger">⬇️ ${formatarMoeda(
            movimentacoesFiltradas
                .filter(m => m.tipo === 'saida')
                .reduce((sum, m) => sum + m.valor, 0)
        )}</div>
                            </td>
                            <td colspan="2">
                                <strong class="${movimentacoesFiltradas.reduce((sum, m) =>
            sum + (m.tipo === 'entrada' ? m.valor : -m.valor), 0
        ) >= 0 ? 'text-success' : 'text-danger'
            }">
                                    Saldo: ${formatarMoeda(
                movimentacoesFiltradas.reduce((sum, m) =>
                    sum + (m.tipo === 'entrada' ? m.valor : -m.valor), 0
                )
            )}
                                </strong>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    function renderizarLinhaMovimentacao(mov) {
        const statusInfo = STATUS_MOVIMENTACAO[mov.status] || STATUS_MOVIMENTACAO.pendente;
        const tipoClasse = mov.tipo === 'entrada' ? 'text-success' : 'text-danger';
        const tipoIcone = mov.tipo === 'entrada' ? '⬆️' : '⬇️';

        // Verificar se está atrasada
        const hoje = new Date();
        const dataMovimentacao = new Date(mov.data);
        const estaAtrasada = mov.status === 'pendente' && dataMovimentacao < hoje;

        return `
            <tr data-movimentacao-id="${mov.id}" class="${estaAtrasada ? 'table-warning' : ''}">
                <td>
                    <div>${formatarData(mov.data)}</div>
                    <small class="text-muted">${mov.hora}</small>
                </td>
                <td>
                    <strong>${mov.descricao}</strong>
                    ${mov.observacoes ? `<br><small class="text-muted">${mov.observacoes}</small>` : ''}
                    ${mov.origem !== 'Manual' ? `<br><span class="badge badge-info">${mov.origem}</span>` : ''}
                    ${mov.conciliado ? '<span class="badge badge-success">✓ Conciliado</span>' : ''}
                </td>
                <td>${mov.categoria}</td>
                <td>
                    <span class="${tipoClasse}">
                        ${tipoIcone} ${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                </td>
                <td class="${tipoClasse}">
                    <strong>${formatarMoeda(mov.valor)}</strong>
                </td>
                <td>
                    <span class="badge badge-${estaAtrasada ? 'danger' : statusInfo.cor}">
                        ${estaAtrasada ? '⚠️ Atrasado' : `${statusInfo.icone} ${statusInfo.nome}`}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="window.abaFluxo.editarMovimentacao('${mov.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-warning" onclick="window.abaFluxo.duplicarMovimentacao('${mov.id}')" title="Duplicar">
                            📋
                        </button>
                        <button class="btn btn-${mov.status === 'pago' ? 'secondary' : 'success'}" 
                                onclick="window.abaFluxo.alterarStatus('${mov.id}')" 
                                title="${mov.status === 'pago' ? 'Marcar como Pendente' : 'Marcar como Pago'}">
                            ${mov.status === 'pago' ? '⏳' : '✅'}
                        </button>
                        <button class="btn btn-danger" onclick="window.abaFluxo.excluirMovimentacao('${mov.id}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function obterMovimentacoesFiltradas() {
        try {
            let movimentacoesFiltradas = [...movimentacoes];

            // Filtro por período
            if (filtroAtivo.periodo !== 'todos') {
                const { inicio, fim } = obterPeriodo(filtroAtivo.periodo);
                movimentacoesFiltradas = movimentacoesFiltradas.filter(mov => {
                    const dataMovimentacao = new Date(mov.data);
                    return dataMovimentacao >= inicio && dataMovimentacao <= fim;
                });
            }

            // Filtro por tipo
            if (filtroAtivo.tipo !== 'todos') {
                movimentacoesFiltradas = movimentacoesFiltradas.filter(mov => mov.tipo === filtroAtivo.tipo);
            }

            // Filtro por categoria
            if (filtroAtivo.categoria !== 'todas') {
                if (filtroAtivo.categoria.includes('-')) {
                    const [tipo, categoria] = filtroAtivo.categoria.split('-');
                    movimentacoesFiltradas = movimentacoesFiltradas.filter(mov =>
                        mov.tipo === tipo && mov.categoria === categoria
                    );
                }
            }

            // Filtro por status
            if (filtroAtivo.status !== 'todos') {
                movimentacoesFiltradas = movimentacoesFiltradas.filter(mov => mov.status === filtroAtivo.status);
            }

            // Filtro por busca
            if (filtroAtivo.busca) {
                const termo = filtroAtivo.busca.toLowerCase();
                movimentacoesFiltradas = movimentacoesFiltradas.filter(mov =>
                    mov.descricao.toLowerCase().includes(termo) ||
                    (mov.observacoes && mov.observacoes.toLowerCase().includes(termo)) ||
                    mov.categoria.toLowerCase().includes(termo) ||
                    mov.origem.toLowerCase().includes(termo)
                );
            }

            // Ordenar por data/hora decrescente
            movimentacoesFiltradas.sort((a, b) => {
                const dataA = new Date(a.data + ' ' + a.hora);
                const dataB = new Date(b.data + ' ' + b.hora);
                return dataB - dataA;
            });

            return movimentacoesFiltradas;

        } catch (error) {
            console.error('❌ Erro ao filtrar movimentações:', error);
            return [];
        }
    }

    function formatarData(data) {
        if (window.utils && window.utils.formatarData) {
            return window.utils.formatarData(data);
        }
        try {
            const d = new Date(data);
            return d.toLocaleDateString('pt-BR');
        } catch {
            return data;
        }
    }

    // ==================== MODAIS CORRIGIDOS ====================

    function renderizarModais() {
        return `
            <!-- Modal Movimentação -->
            <div id="modalMovimentacao" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title" id="modalMovimentacaoTitulo">Nova Movimentação</h3>
                        <button class="close-btn" onclick="window.abaFluxo.fecharModal('modalMovimentacao')">&times;</button>
                    </div>
                    <form id="formMovimentacao" onsubmit="window.abaFluxo.salvarMovimentacao(event)">
                        <div class="modal-body" id="modalMovimentacaoBody">
                            <!-- Conteúdo será preenchido dinamicamente -->
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary">💾 Salvar</button>
                            <button type="button" class="btn btn-secondary" onclick="window.abaFluxo.fecharModal('modalMovimentacao')">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal Lançamentos Pendentes -->
            <div id="modalLancamentosPendentes" class="modal">
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">📝 Lançamentos Pendentes</h3>
                        <button class="close-btn" onclick="window.abaFluxo.fecharModal('modalLancamentosPendentes')">&times;</button>
                    </div>
                    <div class="modal-body" id="modalLancamentosPendentesBody">
                        <!-- Conteúdo será preenchido dinamicamente -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" onclick="window.abaFluxo.processarLancamentosPendentes()">✅ Processar Selecionados</button>
                        <button class="btn btn-warning" onclick="window.abaFluxo.limparPendentes()">🗑️ Limpar Processados</button>
                        <button class="btn btn-secondary" onclick="window.abaFluxo.fecharModal('modalLancamentosPendentes')">Fechar</button>
                    </div>
                </div>
            </div>

            <!-- Modal Importação -->
            <div id="modalImportacao" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">📥 Importar Dados</h3>
                        <button class="close-btn" onclick="window.abaFluxo.fecharModal('modalImportacao')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>📋 Formato aceito:</strong> CSV ou Excel<br>
                            <strong>Colunas necessárias:</strong> Data, Descrição, Categoria, Tipo (entrada/saida), Valor
                        </div>
                        <div class="form-group">
                            <label>Arquivo:</label>
                            <input type="file" id="arquivoImportacao" class="form-control" accept=".csv,.xlsx,.xls">
                        </div>
                        <div class="form-group">
                            <label>Tipo padrão (se não especificado):</label>
                            <select id="tipoImportacaoPadrao" class="form-control">
                                <option value="entrada">Entrada</option>
                                <option value="saida">Saída</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Status padrão:</label>
                            <select id="statusImportacaoPadrao" class="form-control">
                                <option value="pago">Pago/Recebido</option>
                                <option value="pendente">Pendente</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="window.abaFluxo.processarImportacao()">📥 Importar</button>
                        <button class="btn btn-secondary" onclick="window.abaFluxo.fecharModal('modalImportacao')">Cancelar</button>
                    </div>
                </div>
            </div>

            <!-- Modal Saldo Inicial -->
            <div id="modalSaldoInicial" class="modal">
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <h3 class="modal-title">⚙️ Configurar Saldo Inicial</h3>
                        <button class="close-btn" onclick="window.abaFluxo.fecharModal('modalSaldoInicial')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Saldo Inicial (R$):</label>
                            <input type="number" id="inputSaldoInicial" class="form-control" 
                                step="0.01" value="${saldoInicial.toFixed(2)}">
                        </div>
                        <div class="alert alert-warning">
                            <small>⚠️ O saldo inicial é o valor base do caixa antes de qualquer movimentação.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="window.abaFluxo.salvarSaldoInicial()">💾 Salvar</button>
                        <button class="btn btn-secondary" onclick="window.abaFluxo.fecharModal('modalSaldoInicial')">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== CRUD DE MOVIMENTAÇÕES CORRIGIDO ====================

    function novaEntrada() {
        abrirModalMovimentacao('entrada');
    }

    function novaSaida() {
        abrirModalMovimentacao('saida');
    }

    function abrirModalMovimentacao(tipo, movimentacao = null) {
        try {
            const modal = document.getElementById('modalMovimentacao');
            const titulo = document.getElementById('modalMovimentacaoTitulo');
            const body = document.getElementById('modalMovimentacaoBody');

            if (!modal || !titulo || !body) return;

            // Configurar título
            titulo.textContent = movimentacao ?
                `Editar ${movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}` :
                `Nova ${tipo === 'entrada' ? 'Entrada' : 'Saída'}`;

            // Renderizar formulário
            body.innerHTML = renderizarFormularioMovimentacao(tipo, movimentacao);

            // Configurar valores padrão se nova movimentação
            if (!movimentacao) {
                document.getElementById('dataMovimentacao').value = new Date().toISOString().split('T')[0];
                document.getElementById('horaMovimentacao').value = new Date().toTimeString().slice(0, 5);
                document.getElementById('statusMovimentacao').value = 'pago';
            }

            // Configurar data attributes
            const form = document.getElementById('formMovimentacao');
            form.dataset.tipo = tipo;
            form.dataset.movimentacaoId = movimentacao ? movimentacao.id : '';

            // Aplicar máscaras
            aplicarMascaras();

            // Abrir modal
            abrirModal('modalMovimentacao');

            // Focar no primeiro campo
            setTimeout(() => {
                document.getElementById('descricaoMovimentacao')?.focus();
            }, 300);

        } catch (error) {
            console.error('❌ Erro ao abrir modal de movimentação:', error);
        }
    }

    function renderizarFormularioMovimentacao(tipo, movimentacao = null) {
        const categorias = tipo === 'entrada' ? CONFIG.CATEGORIAS_ENTRADA : CONFIG.CATEGORIAS_SAIDA;

        return `
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Data <span class="required">*</span></label>
                    <input type="date" id="dataMovimentacao" class="form-control" 
                        value="${movimentacao ? movimentacao.data : ''}" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Hora</label>
                    <input type="time" id="horaMovimentacao" class="form-control" 
                        value="${movimentacao ? movimentacao.hora : ''}">
                </div>
            </div>

            <div class="form-group">
                <label>Descrição <span class="required">*</span></label>
                <input type="text" id="descricaoMovimentacao" class="form-control" 
                    placeholder="Descrição da movimentação" 
                    value="${movimentacao ? movimentacao.descricao : ''}" 
                    maxlength="100" required>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Valor (R$) <span class="required">*</span></label>
                    <input type="number" id="valorMovimentacao" class="form-control money-input" 
                        step="0.01" min="0.01" placeholder="0,00" 
                        value="${movimentacao ? movimentacao.valor : ''}" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Categoria <span class="required">*</span></label>
                    <select id="categoriaMovimentacao" class="form-control" required>
                        <option value="">Selecione...</option>
                        ${categorias.map(cat =>
            `<option value="${cat}" ${movimentacao && movimentacao.categoria === cat ? 'selected' : ''}>${cat}</option>`
        ).join('')}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Status <span class="required">*</span></label>
                    <select id="statusMovimentacao" class="form-control" required>
                        <option value="pago" ${movimentacao && movimentacao.status === 'pago' ? 'selected' : ''}>
                            ${tipo === 'entrada' ? 'Recebido' : 'Pago'}
                        </option>
                        <option value="pendente" ${movimentacao && movimentacao.status === 'pendente' ? 'selected' : ''}>
                            Pendente
                        </option>
                        <option value="atrasado" ${movimentacao && movimentacao.status === 'atrasado' ? 'selected' : ''}>
                            Atrasado
                        </option>
                        <option value="cancelado" ${movimentacao && movimentacao.status === 'cancelado' ? 'selected' : ''}>
                            Cancelado
                        </option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Tags (opcional)</label>
                    <input type="text" id="tagsMovimentacao" class="form-control" 
                        placeholder="Ex: cliente, projeto, urgente" 
                        value="${movimentacao && movimentacao.tags ? movimentacao.tags.join(', ') : ''}">
                </div>
            </div>

            <div class="form-group">
                <label>Observações</label>
                <textarea id="observacoesMovimentacao" class="form-control" rows="3" 
                        placeholder="Observações adicionais..." 
                        maxlength="500">${movimentacao ? movimentacao.observacoes : ''}</textarea>
            </div>

            <div class="form-group">
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input" id="conciliadoMovimentacao" 
                        ${movimentacao && movimentacao.conciliado ? 'checked' : ''}>
                    <label class="custom-control-label" for="conciliadoMovimentacao">
                        Movimentação conciliada
                    </label>
                </div>
            </div>
        `;
    }

    function salvarMovimentacao(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const movimentacaoId = form.dataset.movimentacaoId;
            const tipo = form.dataset.tipo;

            // Validar formulário
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Coletar dados
            const dados = {
                tipo: tipo,
                data: document.getElementById('dataMovimentacao').value,
                hora: document.getElementById('horaMovimentacao').value || '12:00',
                descricao: document.getElementById('descricaoMovimentacao').value.trim(),
                valor: parseFloat(document.getElementById('valorMovimentacao').value),
                categoria: document.getElementById('categoriaMovimentacao').value,
                status: document.getElementById('statusMovimentacao').value,
                observacoes: document.getElementById('observacoesMovimentacao').value.trim(),
                conciliado: document.getElementById('conciliadoMovimentacao').checked,
                tags: document.getElementById('tagsMovimentacao').value
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t),
                origem: 'Manual',
                dataUltimaAtualizacao: new Date().toISOString(),
                usuarioAtualizacao: 'Usuário'
            };

            // Validações adicionais
            if (dados.valor <= 0) {
                mostrarAlerta('O valor deve ser maior que zero', 'warning');
                return;
            }

            if (movimentacaoId) {
                // Editar movimentação existente
                const index = movimentacoes.findIndex(m => m.id === movimentacaoId);
                if (index !== -1) {
                    movimentacoes[index] = {
                        ...movimentacoes[index],
                        ...dados
                    };
                }
            } else {
                // Criar nova movimentação
                const novaMovimentacao = {
                    id: gerarId(),
                    dataRegistro: new Date().toISOString(),
                    usuarioRegistro: 'Usuário',
                    origemId: null,
                    anexos: [],
                    ...dados
                };
                movimentacoes.unshift(novaMovimentacao);
            }

            // Salvar e atualizar interface
            salvarDados(true);
            fecharModal('modalMovimentacao');
            renderizarInterface();

            mostrarAlerta(
                `✅ ${tipo === 'entrada' ? 'Entrada' : 'Saída'} ${movimentacaoId ? 'atualizada' : 'adicionada'} com sucesso!`,
                'success'
            );

        } catch (error) {
            console.error('❌ Erro ao salvar movimentação:', error);
            mostrarAlerta('Erro ao salvar movimentação', 'danger');
        }
    }

    function editarMovimentacao(id) {
        const movimentacao = movimentacoes.find(m => m.id === id);
        if (!movimentacao) {
            mostrarAlerta('Movimentação não encontrada', 'warning');
            return;
        }

        abrirModalMovimentacao(movimentacao.tipo, movimentacao);
    }

    function duplicarMovimentacao(id) {
        const movimentacao = movimentacoes.find(m => m.id === id);
        if (!movimentacao) return;

        const duplicada = {
            ...movimentacao,
            id: gerarId(),
            descricao: movimentacao.descricao + ' (Cópia)',
            data: new Date().toISOString().split('T')[0],
            hora: new Date().toTimeString().slice(0, 5),
            status: 'pendente',
            conciliado: false,
            dataRegistro: new Date().toISOString(),
            dataUltimaAtualizacao: new Date().toISOString(),
            usuarioRegistro: 'Usuário',
            usuarioAtualizacao: 'Usuário'
        };

        movimentacoes.unshift(duplicada);
        salvarDados();
        renderizarInterface();

        mostrarAlerta('📋 Movimentação duplicada!', 'success');
    }

    function excluirMovimentacao(id) {
        const movimentacao = movimentacoes.find(m => m.id === id);
        if (!movimentacao) return;

        if (!confirm(`Deseja realmente excluir a movimentação "${movimentacao.descricao}"?`)) {
            return;
        }

        movimentacoes = movimentacoes.filter(m => m.id !== id);
        salvarDados();
        renderizarInterface();

        mostrarAlerta('🗑️ Movimentação excluída!', 'warning');
    }

    function alterarStatus(id) {
        const movimentacao = movimentacoes.find(m => m.id === id);
        if (!movimentacao) return;

        // Alternar entre pago e pendente
        movimentacao.status = movimentacao.status === 'pago' ? 'pendente' : 'pago';
        movimentacao.dataUltimaAtualizacao = new Date().toISOString();

        salvarDados();
        renderizarInterface();
    }

    // ==================== FILTROS E BUSCA ====================

    function aplicarFiltro(tipo, valor) {
        filtroAtivo[tipo] = valor;

        // Se for período personalizado, abrir configuração
        if (tipo === 'periodo' && valor === 'personalizado') {
            configurarPeriodoPersonalizado();
        } else {
            renderizarInterface();
        }
    }

    function buscarMovimentacao(termo) {
        filtroAtivo.busca = termo.toLowerCase();

        // Aplicar debounce para não renderizar a cada tecla
        clearTimeout(window.fluxoBuscaTimeout);
        window.fluxoBuscaTimeout = setTimeout(() => {
            renderizarInterface();
        }, 300);
    }

    function limparFiltros() {
        filtroAtivo = {
            periodo: 'mes-atual',
            tipo: 'todos',
            categoria: 'todas',
            status: 'todos',
            busca: ''
        };
        renderizarInterface();
    }

    function configurarPeriodoPersonalizado() {
        const dataInicio = prompt('Data inicial (DD/MM/AAAA):');
        const dataFim = prompt('Data final (DD/MM/AAAA):');

        if (dataInicio && dataFim) {
            // Converter para formato ISO
            const [diaI, mesI, anoI] = dataInicio.split('/');
            const [diaF, mesF, anoF] = dataFim.split('/');

            filtroAtivo.periodoPersonalizado = {
                inicio: new Date(anoI, mesI - 1, diaI),
                fim: new Date(anoF, mesF - 1, diaF)
            };

            renderizarInterface();
        }
    }

    // ==================== LANÇAMENTOS PENDENTES ====================

    function abrirLancamentosPendentes() {
        verificarIntegracoes();

        const modal = document.getElementById('modalLancamentosPendentes');
        const body = document.getElementById('modalLancamentosPendentesBody');

        if (!modal || !body) return;

        const pendentesNaoProcessados = lancamentosPendentes.filter(l => !l.processado);

        if (pendentesNaoProcessados.length === 0) {
            body.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h4>Nenhum lançamento pendente</h4>
                    <p>Todos os lançamentos estão em dia!</p>
                </div>
            `;
        } else {
            body.innerHTML = `
                <div class="alert alert-info">
                    <strong>📝 ${pendentesNaoProcessados.length} Lançamento(s) Pendente(s)</strong><br>
                    Selecione os lançamentos que deseja processar no fluxo de caixa.
                </div>

                <div class="form-group">
                    <div class="custom-control custom-checkbox">
                        <input type="checkbox" class="custom-control-input" id="selecionarTodosLancamentos" 
                            onchange="window.abaFluxo.selecionarTodosLancamentos(this.checked)">
                        <label class="custom-control-label" for="selecionarTodosLancamentos">
                            Selecionar todos
                        </label>
                    </div>
                </div>

                <div class="lancamentos-pendentes table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th width="40">✓</th>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Origem</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendentesNaoProcessados.map(lanc => `
                                <tr>
                                    <td>
                                        <input type="checkbox" class="lancamento-checkbox"
                                            data-lancamento-id="${lanc.id}" 
                                            ${lanc.selecionado ? 'checked' : ''}
                                            onchange="window.abaFluxo.alterarSelecaoLancamento('${lanc.id}', this.checked)">
                                    </td>
                                    <td>${formatarData(lanc.data)}</td>
                                    <td>${lanc.descricao}</td>
                                    <td><span class="badge badge-info">${lanc.origem}</span></td>
                                    <td>
                                        <span class="${lanc.tipo === 'entrada' ? 'text-success' : 'text-danger'}">
                                            ${lanc.tipo === 'entrada' ? '⬆️ Entrada' : '⬇️ Saída'}
                                        </span>
                                    </td>
                                    <td class="${lanc.tipo === 'entrada' ? 'text-success' : 'text-danger'}">
                                        <strong>${formatarMoeda(lanc.valor)}</strong>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        abrirModal('modalLancamentosPendentes');
    }

    function selecionarTodosLancamentos(selecionado) {
        lancamentosPendentes.forEach(lanc => {
            if (!lanc.processado) {
                lanc.selecionado = selecionado;
            }
        });

        document.querySelectorAll('.lancamento-checkbox').forEach(checkbox => {
            checkbox.checked = selecionado;
        });
    }

    function alterarSelecaoLancamento(id, selecionado) {
        const lancamento = lancamentosPendentes.find(l => l.id === id);
        if (lancamento) {
            lancamento.selecionado = selecionado;
        }
    }

    function processarLancamentosPendentes() {
        const selecionados = lancamentosPendentes.filter(l => l.selecionado && !l.processado);

        if (selecionados.length === 0) {
            mostrarAlerta('Selecione pelo menos um lançamento', 'warning');
            return;
        }

        // Processar lançamentos selecionados
        selecionados.forEach(lancamento => {
            const novaMovimentacao = {
                id: gerarId(),
                tipo: lancamento.tipo,
                data: lancamento.data,
                hora: '12:00',
                descricao: lancamento.descricao,
                valor: lancamento.valor,
                categoria: lancamento.categoria,
                status: 'pago',
                observacoes: `Importado de: ${lancamento.origem}`,
                origem: lancamento.origem,
                origemId: lancamento.origemId,
                conciliado: false,
                tags: [],
                anexos: [],
                dataRegistro: new Date().toISOString(),
                dataUltimaAtualizacao: new Date().toISOString(),
                usuarioRegistro: 'Sistema',
                usuarioAtualizacao: 'Sistema'
            };

            movimentacoes.unshift(novaMovimentacao);
            lancamento.processado = true;
        });

        salvarDados();
        fecharModal('modalLancamentosPendentes');
        renderizarInterface();

        mostrarAlerta(`✅ ${selecionados.length} lançamento(s) processado(s)!`, 'success');
    }

    function limparPendentes() {
        const processados = lancamentosPendentes.filter(l => l.processado).length;

        if (processados === 0) {
            mostrarAlerta('Não há lançamentos processados para limpar', 'info');
            return;
        }

        if (confirm(`Remover ${processados} lançamento(s) processado(s)?`)) {
            lancamentosPendentes = lancamentosPendentes.filter(l => !l.processado);
            salvarDados();
            abrirLancamentosPendentes();
            mostrarAlerta(`🗑️ ${processados} lançamento(s) removido(s)`, 'success');
        }
    }

    // ==================== IMPORTAÇÃO/EXPORTAÇÃO ====================

    function importarDados() {
        abrirModal('modalImportacao');
    }

    function processarImportacao() {
        const arquivo = document.getElementById('arquivoImportacao').files[0];
        const tipoPadrao = document.getElementById('tipoImportacaoPadrao').value;
        const statusPadrao = document.getElementById('statusImportacaoPadrao').value;

        if (!arquivo) {
            mostrarAlerta('Selecione um arquivo', 'warning');
            return;
        }

        const leitor = new FileReader();

        leitor.onload = function (e) {
            try {
                let movimentacoesImportadas = [];

                if (arquivo.name.endsWith('.csv')) {
                    movimentacoesImportadas = processarCSV(e.target.result, tipoPadrao, statusPadrao);
                } else if (arquivo.name.endsWith('.xlsx') || arquivo.name.endsWith('.xls')) {
                    if (typeof XLSX === 'undefined') {
                        mostrarAlerta('Biblioteca XLSX não encontrada', 'danger');
                        return;
                    }
                    movimentacoesImportadas = processarExcel(e.target.result, tipoPadrao, statusPadrao);
                }

                if (movimentacoesImportadas.length > 0) {
                    movimentacoes.unshift(...movimentacoesImportadas);
                    salvarDados();
                    fecharModal('modalImportacao');
                    renderizarInterface();
                    mostrarAlerta(`📥 ${movimentacoesImportadas.length} movimentação(ões) importada(s)!`, 'success');
                } else {
                    mostrarAlerta('Nenhuma movimentação válida encontrada no arquivo', 'warning');
                }

            } catch (error) {
                console.error('❌ Erro ao processar importação:', error);
                mostrarAlerta('Erro ao processar arquivo', 'danger');
            }
        };

        if (arquivo.name.endsWith('.csv')) {
            leitor.readAsText(arquivo);
        } else {
            leitor.readAsArrayBuffer(arquivo);
        }
    }

    function processarCSV(dados, tipoPadrao, statusPadrao) {
        const linhas = dados.split('\n').filter(l => l.trim());
        const cabecalho = linhas[0].split(',').map(c => c.trim().toLowerCase());
        const movimentacoesImportadas = [];

        for (let i = 1; i < linhas.length; i++) {
            const valores = linhas[i].split(',');
            if (valores.length < cabecalho.length) continue;

            const item = {};
            cabecalho.forEach((col, index) => {
                item[col] = valores[index]?.trim() || '';
            });

            const movimentacao = {
                id: gerarId(),
                tipo: item.tipo || tipoPadrao,
                data: validarData(item.data) || new Date().toISOString().split('T')[0],
                hora: item.hora || '12:00',
                descricao: item.descricao || item.descrição || 'Movimentação importada',
                valor: Math.abs(parseFloat(item.valor?.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0),
                categoria: item.categoria || 'Outros',
                status: item.status || statusPadrao,
                observacoes: item.observacoes || item.observações || 'Importado via CSV',
                origem: 'Importação CSV',
                origemId: null,
                conciliado: false,
                tags: [],
                anexos: [],
                dataRegistro: new Date().toISOString(),
                dataUltimaAtualizacao: new Date().toISOString(),
                usuarioRegistro: 'Importação',
                usuarioAtualizacao: 'Importação'
            };

            if (movimentacao.valor > 0) {
                movimentacoesImportadas.push(movimentacao);
            }
        }

        return movimentacoesImportadas;
    }

    function processarExcel(dados, tipoPadrao, statusPadrao) {
        const workbook = XLSX.read(dados, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const movimentacoesImportadas = [];

        jsonData.forEach(item => {
            const movimentacao = {
                id: gerarId(),
                tipo: item.Tipo || item.tipo || tipoPadrao,
                data: validarData(item.Data || item.data) || new Date().toISOString().split('T')[0],
                hora: item.Hora || item.hora || '12:00',
                descricao: item.Descrição || item.Descricao || item.descricao || 'Movimentação importada',
                valor: Math.abs(parseFloat(item.Valor || item.valor || 0)),
                categoria: item.Categoria || item.categoria || 'Outros',
                status: item.Status || item.status || statusPadrao,
                observacoes: item.Observações || item.Observacoes || item.observacoes || 'Importado via Excel',
                origem: 'Importação Excel',
                origemId: null,
                conciliado: false,
                tags: [],
                anexos: [],
                dataRegistro: new Date().toISOString(),
                dataUltimaAtualizacao: new Date().toISOString(),
                usuarioRegistro: 'Importação',
                usuarioAtualizacao: 'Importação'
            };

            if (movimentacao.valor > 0) {
                movimentacoesImportadas.push(movimentacao);
            }
        });

        return movimentacoesImportadas;
    }

    function exportarMovimentacoes() {
        const movimentacoesFiltradas = obterMovimentacoesFiltradas();

        if (movimentacoesFiltradas.length === 0) {
            mostrarAlerta('Nenhuma movimentação para exportar', 'warning');
            return;
        }

        // Preparar dados para exportação
        const dadosExportacao = movimentacoesFiltradas.map(mov => ({
            Data: mov.data,
            Hora: mov.hora,
            Tipo: mov.tipo === 'entrada' ? 'Entrada' : 'Saída',
            Descrição: mov.descricao,
            Categoria: mov.categoria,
            Valor: mov.valor,
            Status: STATUS_MOVIMENTACAO[mov.status]?.nome || mov.status,
            Observações: mov.observacoes,
            Origem: mov.origem,
            Conciliado: mov.conciliado ? 'Sim' : 'Não',
            Tags: mov.tags.join(', ')
        }));

        if (typeof XLSX !== 'undefined') {
            // Exportar como Excel
            const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentações');

            const dataAtual = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `fluxo-caixa-${dataAtual}.xlsx`);
        } else {
            // Exportar como CSV
            const csv = converterParaCSV(dadosExportacao);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fluxo-caixa-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        }

        mostrarAlerta('📤 Movimentações exportadas!', 'success');
    }

    function converterParaCSV(dados) {
        if (!dados || dados.length === 0) return '';

        const headers = Object.keys(dados[0]);
        const csvHeaders = headers.join(',');

        const csvRows = dados.map(row =>
            headers.map(header => {
                const valor = row[header];
                return typeof valor === 'string' && valor.includes(',') ?
                    `"${valor}"` : valor;
            }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    }

    // ==================== FUNCIONALIDADES EXTRAS ====================

    function configurarSaldoInicial() {
        abrirModal('modalSaldoInicial');
    }

    function salvarSaldoInicial() {
        const novoSaldo = parseFloat(document.getElementById('inputSaldoInicial').value);

        if (isNaN(novoSaldo)) {
            mostrarAlerta('Digite um valor válido', 'warning');
            return;
        }

        saldoInicial = novoSaldo;
        salvarDados();
        fecharModal('modalSaldoInicial');
        renderizarInterface();

        mostrarAlerta('⚙️ Saldo inicial atualizado!', 'success');
    }

    function conciliarMovimentacoes() {
        const naoCocinliadas = movimentacoes.filter(m => !m.conciliado && m.status === 'pago');

        if (naoCocinliadas.length === 0) {
            mostrarAlerta('✅ Todas as movimentações já estão conciliadas!', 'info');
            return;
        }

        if (confirm(`Marcar ${naoCocinliadas.length} movimentação(ões) como conciliada(s)?`)) {
            naoCocinliadas.forEach(mov => {
                mov.conciliado = true;
                mov.dataUltimaAtualizacao = new Date().toISOString();
            });

            salvarDados();
            renderizarInterface();

            mostrarAlerta(`✅ ${naoCocinliadas.length} movimentação(ões) conciliada(s)!`, 'success');
        }
    }

    // ==================== GRÁFICOS ====================

    function inicializarGrafico() {
        try {
            if (typeof Chart === 'undefined') {
                console.warn('⚠️ Chart.js não encontrado');
                return;
            }

            const canvas = document.getElementById('graficoFluxoCaixa');
            if (!canvas) return;

            // Destruir gráfico anterior se existir
            if (chartInstance) {
                chartInstance.destroy();
            }

            const dadosGrafico = prepararDadosGrafico();

            chartInstance = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: dadosGrafico.labels,
                    datasets: [
                        {
                            label: 'Entradas',
                            data: dadosGrafico.entradas,
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.3,
                            fill: false
                        },
                        {
                            label: 'Saídas',
                            data: dadosGrafico.saidas,
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            tension: 0.3,
                            fill: false
                        },
                        {
                            label: 'Saldo Acumulado',
                            data: dadosGrafico.saldoAcumulado,
                            borderColor: '#007bff',
                            backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.dataset.label}: ${formatarMoeda(context.parsed.y)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return formatarMoeda(value);
                                }
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('❌ Erro ao inicializar gráfico:', error);
        }
    }

    function prepararDadosGrafico(periodo = '6meses') {
        const meses = [];
        const entradas = [];
        const saidas = [];
        const saldoAcumulado = [];
        let saldoAtual = saldoInicial;

        const numeroMeses = periodo === '12meses' ? 12 : periodo === 'ano' ? 12 : 6;

        for (let i = numeroMeses - 1; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);

            const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
            const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);

            const movimentacoesMes = movimentacoes.filter(m => {
                const dataMovimentacao = new Date(m.data);
                return dataMovimentacao >= inicioMes &&
                    dataMovimentacao <= fimMes &&
                    m.status === 'pago';
            });

            const entradasMes = movimentacoesMes
                .filter(m => m.tipo === 'entrada')
                .reduce((sum, m) => sum + m.valor, 0);

            const saidasMes = movimentacoesMes
                .filter(m => m.tipo === 'saida')
                .reduce((sum, m) => sum + m.valor, 0);

            saldoAtual += entradasMes - saidasMes;

            meses.push(data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
            entradas.push(entradasMes);
            saidas.push(saidasMes);
            saldoAcumulado.push(saldoAtual);
        }

        return { labels: meses, entradas, saidas, saldoAcumulado };
    }

    function alterarPeriodoGrafico(periodo) {
        const dadosGrafico = prepararDadosGrafico(periodo);

        if (chartInstance) {
            chartInstance.data.labels = dadosGrafico.labels;
            chartInstance.data.datasets[0].data = dadosGrafico.entradas;
            chartInstance.data.datasets[1].data = dadosGrafico.saidas;
            chartInstance.data.datasets[2].data = dadosGrafico.saldoAcumulado;
            chartInstance.update();
        }
    }

    // ==================== UTILITÁRIOS ====================

    function abrirModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    function aplicarMascaras() {
        // Aplicar máscara monetária
        const camposMoeda = document.querySelectorAll('.money-input');
        camposMoeda.forEach(campo => {
            campo.addEventListener('blur', function () {
                const valor = parseFloat(this.value);
                if (!isNaN(valor)) {
                    this.value = valor.toFixed(2);
                }
            });
        });
    }

    // ==================== API PÚBLICA ====================

    const API_PUBLICA = {
        // Inicialização
        inicializar: inicializarAbaFluxo,

        // CRUD
        novaEntrada,
        novaSaida,
        editarMovimentacao,
        duplicarMovimentacao,
        excluirMovimentacao,
        alterarStatus,
        salvarMovimentacao,

        // Filtros
        aplicarFiltro,
        buscarMovimentacao,
        limparFiltros,

        // Lançamentos pendentes
        abrirLancamentosPendentes,
        selecionarTodosLancamentos,
        alterarSelecaoLancamento,
        processarLancamentosPendentes,
        limparPendentes,

        // Importação/Exportação
        importarDados,
        processarImportacao,
        exportarMovimentacoes,

        // Funcionalidades extras
        configurarSaldoInicial,
        salvarSaldoInicial,
        conciliarMovimentacoes,
        configurarPeriodoPersonalizado,

        // Gráficos
        alterarPeriodoGrafico,

        // Modal
        fecharModal,

        // Integração
        adicionarLancamentoAutomatico: adicionarMovimentacaoAutomatica,
        verificarIntegracoes,

        // Consultas
        obterMovimentacoes: () => [...movimentacoes],
        obterSaldoAtual: calcularSaldoAtual,
        obterProjecao: calcularProjecao,
        obterMovimentacoesFiltradas,

        // Dados
        salvarDados,
        renderizarInterface,

        // Metadados
        versao: CONFIG.VERSAO_MODULO,
        config: CONFIG
    };

    // ==================== EXPORTAÇÃO GLOBAL ====================

    window.abaFluxo = API_PUBLICA;

    // Auto-inicializar se a aba estiver ativa
    document.addEventListener('DOMContentLoaded', function () {
        const abaFluxoAtiva = document.querySelector('.tab-content#fluxocaixa.active');
        if (abaFluxoAtiva) {
            setTimeout(inicializarAbaFluxo, 500);
        }
    });

    console.log('📦 Módulo abaFluxo.js v7.0 CORRIGIDO carregado com sucesso!');

})();