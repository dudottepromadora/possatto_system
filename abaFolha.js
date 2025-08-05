/**
* SISTEMA POSSATTO PRO v7.0 - abaFolha.js
* Módulo: Folha de Pagamento
* 
* Funcionalidades:
* - CRUD completo de funcionários
* - Cálculo automático de INSS, FGTS, vale transporte, vale refeição
* - Fechamento mensal de folha
* - Integração automática com fluxo de caixa e gestão financeira
* - Relatórios e exportação (PDF, Excel, CSV)
* - Histórico de folhas processadas
* - Dashboard com análise de custos
* 
* Dependências: utils.js, index.html, style.css
* Autor: Sistema Possatto PRO
* Data: 2025-07-23
*/

(function () {
    'use strict';

    // ==================== CONFIGURAÇÕES E CONSTANTES ====================

    const CONFIG = {
        CHAVE_STORAGE: 'funcionarios',
        CHAVE_FECHAMENTOS: 'folhaFechamentos',
        VERSAO_MODULO: '7.0',
        AUTO_SAVE_DELAY: 2000,

        // Tabelas de cálculo
        INSS: {
            faixas: [
                { limite: 1412.00, aliquota: 7.5 },
                { limite: 2666.68, aliquota: 9 },
                { limite: 4000.03, aliquota: 12 },
                { limite: 7786.02, aliquota: 14 }
            ],
            tetoContribuicao: 908.85 // Teto máximo de contribuição
        },

        FGTS: 8, // 8% do salário bruto

        VALE_TRANSPORTE: {
            percentualMaximo: 6 // Máximo 6% do salário
        },

        IRRF: {
            faixas: [
                { limite: 2259.20, aliquota: 0, deducao: 0 },
                { limite: 2826.65, aliquota: 7.5, deducao: 169.44 },
                { limite: 3751.05, aliquota: 15, deducao: 381.44 },
                { limite: 4664.68, aliquota: 22.5, deducao: 662.77 },
                { limite: Infinity, aliquota: 27.5, deducao: 896.00 }
            ],
            deducaoDependente: 189.59
        }
    };

    // ==================== VARIÁVEIS GLOBAIS ====================

    let funcionarios = [];
    let fechamentos = [];
    let funcionarioEditando = null;
    let mesReferencia = obterMesAtual();
    let graficoCusto = null;

    // ==================== INICIALIZAÇÃO ====================

    function inicializarAbaFolha() {
        try {
            console.log('🚀 Inicializando módulo abaFolha.js v7.0...');

            obterDados();
            configurarEventListeners();
            renderizarInterface();

            console.log('✅ Módulo abaFolha.js inicializado com sucesso!');

            // Disparar evento de inicialização
            if (typeof utils !== 'undefined' && utils.dispararEvento) {
                utils.dispararEvento('possattoUpdate', {
                    modulo: 'folha',
                    acao: 'inicializado',
                    dados: { totalFuncionarios: funcionarios.length }
                });
            }

        } catch (error) {
            console.error('❌ Erro ao inicializar módulo abaFolha.js:', error);
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Erro ao inicializar folha de pagamento', 'danger');
            }
        }
    }

    function obterDados() {
        try {
            if (typeof utils !== 'undefined' && utils.obterDados) {
                funcionarios = utils.obterDados(CONFIG.CHAVE_STORAGE, []);
                fechamentos = utils.obterDados(CONFIG.CHAVE_FECHAMENTOS, []);
            } else {
                // Fallback para localStorage direto
                const funcString = localStorage.getItem(`possatto_${CONFIG.CHAVE_STORAGE}`);
                funcionarios = funcString ? JSON.parse(funcString) : [];

                const fechString = localStorage.getItem(`possatto_${CONFIG.CHAVE_FECHAMENTOS}`);
                fechamentos = fechString ? JSON.parse(fechString) : [];
            }

            console.log(`📁 Carregados ${funcionarios.length} funcionário(s) e ${fechamentos.length} fechamento(s)`);

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            funcionarios = [];
            fechamentos = [];
        }
    }

    function salvarDados() {
        try {
            if (typeof utils !== 'undefined' && utils.salvarDados) {
                utils.salvarDados(CONFIG.CHAVE_STORAGE, funcionarios);
                utils.salvarDados(CONFIG.CHAVE_FECHAMENTOS, fechamentos);
            } else {
                // Fallback para localStorage direto
                localStorage.setItem(`possatto_${CONFIG.CHAVE_STORAGE}`, JSON.stringify(funcionarios));
                localStorage.setItem(`possatto_${CONFIG.CHAVE_FECHAMENTOS}`, JSON.stringify(fechamentos));
            }

            // Disparar evento de atualização
            if (typeof utils !== 'undefined' && utils.dispararEvento) {
                utils.dispararEvento('possattoUpdate', {
                    modulo: 'folha',
                    acao: 'dados_salvos',
                    dados: { totalFuncionarios: funcionarios.length }
                });
            }

        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Erro ao salvar dados', 'danger');
            }
        }
    }

    // ==================== RENDERIZAÇÃO DA INTERFACE ====================

    function renderizarInterface() {
        try {
            const container = document.getElementById('folha');
            if (!container) {
                console.error('❌ Container #folha não encontrado');
                return;
            }

            container.innerHTML = `
                            <div class="folha-container">
                                <!-- Análise Geral -->
                                <div class="analise-geral">
                                    ${renderizarAnaliseGeral()}
                                </div>

                                <!-- Tabela de Funcionários -->
                                <div class="funcionarios-container">
                                    <div class="section-header">
                                        <h4>👥 Funcionários Cadastrados</h4>
                                        <button class="btn btn-primary btn-sm" onclick="window.abaFolha.novoFuncionario()">
                                            ➕ Novo Funcionário
                                        </button>
                                    </div>
                                    ${renderizarTabelaFuncionarios()}
                                </div>

                                <!-- Gráfico de Distribuição -->
                                <div class="grafico-container mt-4">
                                    <h4>📊 Distribuição de Custos por Funcionário</h4>
                                    <canvas id="graficoCustosFolha" width="400" height="200"></canvas>
                                </div>

                                <!-- Histórico de Fechamentos -->
                                <div class="historico-container mt-4">
                                    <h4>📋 Histórico de Fechamentos</h4>
                                    ${renderizarHistoricoFechamentos()}
                                </div>
                            </div>

                            ${renderizarModais()}
                        `;

            // Inicializar gráfico após renderização
            setTimeout(() => {
                inicializarGrafico();
            }, 100);

        } catch (error) {
            console.error('❌ Erro ao renderizar interface:', error);
        }
    }

    function renderizarAnaliseGeral() {
        const stats = calcularEstatisticas();

        return `
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${stats.totalFuncionarios}</div>
                                <div class="stat-label">Funcionários</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(stats.totalSalarios) : `R$ ${stats.totalSalarios.toFixed(2)}`}</div>
                                <div class="stat-label">Total Salários</div>
                            </div>
                            <div class="stat-card warning">
                                <div class="stat-value">${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(stats.totalEncargos) : `R$ ${stats.totalEncargos.toFixed(2)}`}</div>
                                <div class="stat-label">Total Encargos</div>
                            </div>
                            <div class="stat-card danger">
                                <div class="stat-value">${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(stats.custoTotal) : `R$ ${stats.custoTotal.toFixed(2)}`}</div>
                                <div class="stat-label">Custo Total Folha</div>
                            </div>
                        </div>

                        <div class="mes-referencia">
                            <label>Mês de Referência:</label>
                            <input type="month" id="mesReferencia" class="form-control" 
                                    value="${mesReferencia}" 
                                    onchange="window.abaFolha.alterarMesReferencia(this.value)">
                            <button class="btn btn-success" onclick="window.abaFolha.fecharFolhaMes()">
                                ✅ Fechar Folha do Mês
                            </button>
                        </div>
                    `;
    }

    function renderizarTabelaFuncionarios() {
        if (funcionarios.length === 0) {
            return `
                            <div class="empty-state">
                                <div class="empty-icon">👥</div>
                                <h4>Nenhum funcionário cadastrado</h4>
                                <p>Comece adicionando funcionários para gerar a folha de pagamento</p>
                                <button class="btn btn-primary" onclick="window.abaFolha.novoFuncionario()">
                                    ➕ Adicionar Primeiro Funcionário
                                </button>
                            </div>
                        `;
        }

        return `
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Cargo</th>
                                        <th>CPF</th>
                                        <th>Salário Bruto</th>
                                        <th>INSS</th>
                                        <th>Benefícios</th>
                                        <th>Custo Total</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${funcionarios.map(func => renderizarLinhaFuncionario(func)).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
    }

    function renderizarLinhaFuncionario(func) {
        const calculos = calcularFolhaFuncionario(func);

        return `
                        <tr>
                            <td><strong>${func.nome}</strong></td>
                            <td>${func.cargo}</td>
                            <td>${typeof utils !== 'undefined' && utils.formatarDocumento ?
                utils.formatarDocumento(func.cpf) : func.cpf}</td>
                            <td>${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(func.salarioBruto) : `R$ ${func.salarioBruto.toFixed(2)}`}</td>
                            <td class="text-danger">${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(calculos.inss) : `R$ ${calculos.inss.toFixed(2)}`}</td>
                            <td>${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(calculos.totalBeneficios) : `R$ ${calculos.totalBeneficios.toFixed(2)}`}</td>
                            <td class="text-primary"><strong>${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(calculos.custoTotal) : `R$ ${calculos.custoTotal.toFixed(2)}`}</strong></td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-info" onclick="window.abaFolha.editarFuncionario('${func.id}')">
                                        ✏️
                                    </button>
                                    <button class="btn btn-warning" onclick="window.abaFolha.verDetalhes('${func.id}')">
                                        👁️
                                    </button>
                                    <button class="btn btn-danger" onclick="window.abaFolha.excluirFuncionario('${func.id}')">
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
    }

    function renderizarHistoricoFechamentos() {
        const fechamentosRecentes = fechamentos.slice(-6).reverse();

        if (fechamentosRecentes.length === 0) {
            return `
                            <div class="alert alert-info">
                                <strong>ℹ️</strong> Nenhum fechamento realizado ainda.
                            </div>
                        `;
        }

        return `
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Período</th>
                                        <th>Data Fechamento</th>
                                        <th>Funcionários</th>
                                        <th>Total Líquido</th>
                                        <th>Total Encargos</th>
                                        <th>Custo Total</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${fechamentosRecentes.map(fech => `
                                        <tr>
                                            <td><strong>${fech.periodo}</strong></td>
                                            <td>${typeof utils !== 'undefined' && utils.formatarData ?
                utils.formatarData(fech.dataFechamento) : fech.dataFechamento}</td>
                                            <td>${fech.totalFuncionarios}</td>
                                            <td>${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(fech.totalLiquido) : `R$ ${fech.totalLiquido.toFixed(2)}`}</td>
                                            <td>${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(fech.totalEncargos) : `R$ ${fech.totalEncargos.toFixed(2)}`}</td>
                                            <td class="text-primary"><strong>${typeof utils !== 'undefined' && utils.formatarMoeda ?
                utils.formatarMoeda(fech.custoTotal) : `R$ ${fech.custoTotal.toFixed(2)}`}</strong></td>
                                            <td>
                                                <button class="btn btn-sm btn-info" onclick="window.abaFolha.exportarFolha('${fech.id}')">
                                                    📤
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
    }

    function renderizarModais() {
        return `
                        <!-- Modal Funcionário -->
                        <div id="modalFuncionario" class="modal">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h3 class="modal-title" id="modalFuncionarioTitulo">Novo Funcionário</h3>
                                    <button class="close-btn" onclick="window.abaFolha.fecharModal('modalFuncionario')">&times;</button>
                                </div>
                                <form id="formFuncionario" onsubmit="window.abaFolha.salvarFuncionario(event)">
                                    <div class="modal-body">
                                        <div class="form-row">
                                            <div class="form-group col-md-8">
                                                <label>Nome Completo *</label>
                                                <input type="text" id="nomeFuncionario" class="form-control" required>
                                            </div>
                                            <div class="form-group col-md-4">
                                                <label>CPF *</label>
                                                <input type="text" id="cpfFuncionario" class="form-control" required>
                                            </div>
                                        </div>
                                        
                                        <div class="form-row">
                                            <div class="form-group col-md-6">
                                                <label>Cargo *</label>
                                                <input type="text" id="cargoFuncionario" class="form-control" required>
                                            </div>
                                            <div class="form-group col-md-6">
                                                <label>Salário Bruto (R$) *</label>
                                                <input type="number" id="salarioBruto" class="form-control" 
                                                        step="0.01" min="0" required>
                                            </div>
                                        </div>
                                        
                                        <div class="form-row">
                                            <div class="form-group col-md-4">
                                                <label>Vale Transporte (R$)</label>
                                                <input type="number" id="valeTransporte" class="form-control" 
                                                        step="0.01" min="0" value="0">
                                            </div>
                                            <div class="form-group col-md-4">
                                                <label>Vale Refeição (R$)</label>
                                                <input type="number" id="valeRefeicao" class="form-control" 
                                                        step="0.01" min="0" value="0">
                                            </div>
                                            <div class="form-group col-md-4">
                                                <label>Outros Benefícios (R$)</label>
                                                <input type="number" id="outrosBeneficios" class="form-control" 
                                                        step="0.01" min="0" value="0">
                                            </div>
                                        </div>
                                        
                                        <div class="form-row">
                                            <div class="form-group col-md-6">
                                                <label>Dependentes</label>
                                                <input type="number" id="dependentes" class="form-control" 
                                                        min="0" value="0">
                                            </div>
                                            <div class="form-group col-md-6">
                                                <label>Encargos Adicionais (%)</label>
                                                <input type="number" id="encargosAdicionais" class="form-control" 
                                                        step="0.1" min="0" value="0">
                                            </div>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label>Status</label>
                                            <select id="statusFuncionario" class="form-control">
                                                <option value="ativo">Ativo</option>
                                                <option value="inativo">Inativo</option>
                                                <option value="ferias">Férias</option>
                                                <option value="afastado">Afastado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="submit" class="btn btn-primary">💾 Salvar</button>
                                        <button type="button" class="btn btn-secondary" 
                                                onclick="window.abaFolha.fecharModal('modalFuncionario')">Cancelar</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <!-- Modal Detalhes -->
                        <div id="modalDetalhes" class="modal">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h3 class="modal-title">📋 Detalhes do Funcionário</h3>
                                    <button class="close-btn" onclick="window.abaFolha.fecharModal('modalDetalhes')">&times;</button>
                                </div>
                                <div class="modal-body" id="modalDetalhesBody">
                                    <!-- Conteúdo será preenchido dinamicamente -->
                                </div>
                                <div class="modal-footer">
                                    <button class="btn btn-primary" onclick="window.abaFolha.imprimirDetalhes()">🖨️ Imprimir</button>
                                    <button class="btn btn-secondary" onclick="window.abaFolha.fecharModal('modalDetalhes')">Fechar</button>
                                </div>
                            </div>
                        </div>

                        <!-- Modal Fechamento -->
                        <div id="modalFechamento" class="modal">
                            <div class="modal-content modal-lg">
                                <div class="modal-header">
                                    <h3 class="modal-title">✅ Fechamento da Folha</h3>
                                    <button class="close-btn" onclick="window.abaFolha.fecharModal('modalFechamento')">&times;</button>
                                </div>
                                <div class="modal-body" id="modalFechamentoBody">
                                    <!-- Conteúdo será preenchido dinamicamente -->
                                </div>
                                <div class="modal-footer">
                                    <button class="btn btn-success" onclick="window.abaFolha.confirmarFechamento()">
                                        ✅ Confirmar Fechamento
                                    </button>
                                    <button class="btn btn-secondary" onclick="window.abaFolha.fecharModal('modalFechamento')">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
    }

    // ==================== CRUD DE FUNCIONÁRIOS ====================

    function novoFuncionario() {
        funcionarioEditando = null;
        document.getElementById('modalFuncionarioTitulo').textContent = 'Novo Funcionário';
        document.getElementById('formFuncionario').reset();
        abrirModal('modalFuncionario');
    }

    function editarFuncionario(id) {
        const funcionario = funcionarios.find(f => f.id === id);
        if (!funcionario) return;

        funcionarioEditando = funcionario;
        document.getElementById('modalFuncionarioTitulo').textContent = 'Editar Funcionário';

        // Preencher formulário
        document.getElementById('nomeFuncionario').value = funcionario.nome;
        document.getElementById('cpfFuncionario').value = funcionario.cpf;
        document.getElementById('cargoFuncionario').value = funcionario.cargo;
        document.getElementById('salarioBruto').value = funcionario.salarioBruto;
        document.getElementById('valeTransporte').value = funcionario.valeTransporte || 0;
        document.getElementById('valeRefeicao').value = funcionario.valeRefeicao || 0;
        document.getElementById('outrosBeneficios').value = funcionario.outrosBeneficios || 0;
        document.getElementById('dependentes').value = funcionario.dependentes || 0;
        document.getElementById('encargosAdicionais').value = funcionario.encargosAdicionais || 0;
        document.getElementById('statusFuncionario').value = funcionario.status || 'ativo';

        abrirModal('modalFuncionario');
    }

    function salvarFuncionario(event) {
        event.preventDefault();

        try {
            const dados = {
                nome: document.getElementById('nomeFuncionario').value,
                cpf: document.getElementById('cpfFuncionario').value.replace(/\D/g, ''),
                cargo: document.getElementById('cargoFuncionario').value,
                salarioBruto: parseFloat(document.getElementById('salarioBruto').value),
                valeTransporte: parseFloat(document.getElementById('valeTransporte').value) || 0,
                valeRefeicao: parseFloat(document.getElementById('valeRefeicao').value) || 0,
                outrosBeneficios: parseFloat(document.getElementById('outrosBeneficios').value) || 0,
                dependentes: parseInt(document.getElementById('dependentes').value) || 0,
                encargosAdicionais: parseFloat(document.getElementById('encargosAdicionais').value) || 0,
                status: document.getElementById('statusFuncionario').value
            };

            // Validar CPF
            if (typeof utils !== 'undefined' && utils.validarCPF && !utils.validarCPF(dados.cpf)) {
                if (utils.mostrarAlerta) {
                    utils.mostrarAlerta('CPF inválido!', 'warning');
                }
                return;
            }

            if (funcionarioEditando) {
                // Editar
                const index = funcionarios.findIndex(f => f.id === funcionarioEditando.id);
                if (index !== -1) {
                    funcionarios[index] = { ...funcionarioEditando, ...dados };
                }
            } else {
                // Criar novo
                const novoFunc = {
                    id: gerarId(),
                    ...dados,
                    dataCadastro: new Date().toISOString()
                };
                funcionarios.push(novoFunc);
            }

            salvarDados();
            renderizarInterface();
            fecharModal('modalFuncionario');

            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta(
                    funcionarioEditando ? 'Funcionário atualizado!' : 'Funcionário cadastrado!',
                    'success'
                );
            }

        } catch (error) {
            console.error('❌ Erro ao salvar funcionário:', error);
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Erro ao salvar funcionário', 'danger');
            }
        }
    }

    function excluirFuncionario(id) {
        const funcionario = funcionarios.find(f => f.id === id);
        if (!funcionario) return;

        if (!confirm(`Deseja realmente excluir o funcionário "${funcionario.nome}"?`)) {
            return;
        }

        funcionarios = funcionarios.filter(f => f.id !== id);
        salvarDados();
        renderizarInterface();

        if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
            utils.mostrarAlerta('Funcionário excluído!', 'success');
        }
    }

    // ==================== CÁLCULOS DA FOLHA ====================

    function calcularFolhaFuncionario(funcionario) {
        const salarioBruto = funcionario.salarioBruto || 0;

        // Calcular INSS
        const inss = calcularINSS(salarioBruto);

        // Calcular IRRF
        const baseIRRF = salarioBruto - inss - (funcionario.dependentes * CONFIG.IRRF.deducaoDependente);
        const irrf = calcularIRRF(baseIRRF);

        // Calcular FGTS
        const fgts = salarioBruto * (CONFIG.FGTS / 100);

        // Vale transporte (desconta o menor valor entre o benefício e 6% do salário)
        const descontoVT = Math.min(
            funcionario.valeTransporte,
            salarioBruto * (CONFIG.VALE_TRANSPORTE.percentualMaximo / 100)
        );

        // Total de benefícios
        const totalBeneficios = funcionario.valeTransporte +
            funcionario.valeRefeicao +
            funcionario.outrosBeneficios;

        // Descontos
        const totalDescontos = inss + irrf + descontoVT;

        // Salário líquido
        const salarioLiquido = salarioBruto - totalDescontos;

        // Encargos da empresa
        const encargosEmpresa = fgts + (salarioBruto * (funcionario.encargosAdicionais / 100));

        // Custo total
        const custoTotal = salarioBruto + encargosEmpresa + totalBeneficios;

        return {
            salarioBruto,
            inss,
            irrf,
            fgts,
            descontoVT,
            totalBeneficios,
            totalDescontos,
            salarioLiquido,
            encargosEmpresa,
            custoTotal
        };
    }

    function calcularINSS(salarioBruto) {
        let inss = 0;
        let salarioRestante = salarioBruto;

        for (const faixa of CONFIG.INSS.faixas) {
            if (salarioRestante <= 0) break;

            const valorFaixa = Math.min(salarioRestante, faixa.limite);
            inss += valorFaixa * (faixa.aliquota / 100);
            salarioRestante -= valorFaixa;

            if (salarioRestante <= 0) break;
        }

        // Aplicar teto se necessário
        return Math.min(inss, CONFIG.INSS.tetoContribuicao);
    }

    function calcularIRRF(baseCalculo) {
        if (baseCalculo <= 0) return 0;

        for (const faixa of CONFIG.IRRF.faixas) {
            if (baseCalculo <= faixa.limite) {
                const irrf = (baseCalculo * (faixa.aliquota / 100)) - faixa.deducao;
                return Math.max(0, irrf);
            }
        }

        return 0;
    }

    function calcularEstatisticas() {
        const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');

        let totalSalarios = 0;
        let totalEncargos = 0;
        let custoTotal = 0;

        funcionariosAtivos.forEach(func => {
            const calculos = calcularFolhaFuncionario(func);
            totalSalarios += calculos.salarioBruto;
            totalEncargos += calculos.encargosEmpresa;
            custoTotal += calculos.custoTotal;
        });

        return {
            totalFuncionarios: funcionariosAtivos.length,
            totalSalarios,
            totalEncargos,
            custoTotal
        };
    }

    // ==================== FECHAMENTO DE FOLHA ====================

    function fecharFolhaMes() {
        const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');

        if (funcionariosAtivos.length === 0) {
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Não há funcionários ativos para fechar a folha', 'warning');
            }
            return;
        }

        // Verificar se já existe fechamento para o mês
        const fechamentoExistente = fechamentos.find(f => f.periodo === mesReferencia);
        if (fechamentoExistente) {
            if (!confirm(`Já existe um fechamento para ${mesReferencia}. Deseja recalcular?`)) {
                return;
            }
        }

        // Preparar resumo do fechamento
        const resumoFechamento = prepararResumoFechamento(funcionariosAtivos);

        // Mostrar modal de confirmação
        const modalBody = document.getElementById('modalFechamentoBody');
        modalBody.innerHTML = renderizarResumoFechamento(resumoFechamento);

        abrirModal('modalFechamento');
    }

    function prepararResumoFechamento(funcionariosAtivos) {
        const detalhes = funcionariosAtivos.map(func => {
            const calculos = calcularFolhaFuncionario(func);
            return {
                funcionario: func,
                calculos: calculos
            };
        });

        const totais = detalhes.reduce((acc, item) => {
            acc.salariosBrutos += item.calculos.salarioBruto;
            acc.totalINSS += item.calculos.inss;
            acc.totalIRRF += item.calculos.irrf;
            acc.totalFGTS += item.calculos.fgts;
            acc.totalBeneficios += item.calculos.totalBeneficios;
            acc.totalLiquido += item.calculos.salarioLiquido;
            acc.totalEncargos += item.calculos.encargosEmpresa;
            acc.custoTotal += item.calculos.custoTotal;
            return acc;
        }, {
            salariosBrutos: 0,
            totalINSS: 0,
            totalIRRF: 0,
            totalFGTS: 0,
            totalBeneficios: 0,
            totalLiquido: 0,
            totalEncargos: 0,
            custoTotal: 0
        });

        return {
            periodo: mesReferencia,
            dataFechamento: new Date().toISOString(),
            totalFuncionarios: funcionariosAtivos.length,
            detalhes: detalhes,
            totais: totais
        };
    }

    function renderizarResumoFechamento(resumo) {
        return `
                        <div class="resumo-fechamento">
                            <div class="alert alert-info">
                                <strong>📅 Período:</strong> ${formatarPeriodo(resumo.periodo)}<br>
                                <strong>👥 Total de Funcionários:</strong> ${resumo.totalFuncionarios}
                            </div>

                            <h5>Detalhamento por Funcionário</h5>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Funcionário</th>
                                            <th>Salário Bruto</th>
                                            <th>Descontos</th>
                                            <th>Líquido</th>
                                            <th>Encargos</th>
                                            <th>Custo Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${resumo.detalhes.map(item => `
                                            <tr>
                                                <td>${item.funcionario.nome}</td>
                                                <td>${formatarMoeda(item.calculos.salarioBruto)}</td>
                                                <td class="text-danger">${formatarMoeda(item.calculos.totalDescontos)}</td>
                                                <td class="text-success">${formatarMoeda(item.calculos.salarioLiquido)}</td>
                                                <td>${formatarMoeda(item.calculos.encargosEmpresa)}</td>
                                                <td class="text-primary"><strong>${formatarMoeda(item.calculos.custoTotal)}</strong></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                    <tfoot>
                                        <tr class="table-active">
                                            <th>TOTAIS</th>
                                            <th>${formatarMoeda(resumo.totais.salariosBrutos)}</th>
                                            <th class="text-danger">${formatarMoeda(resumo.totais.totalINSS + resumo.totais.totalIRRF)}</th>
                                            <th class="text-success">${formatarMoeda(resumo.totais.totalLiquido)}</th>
                                            <th>${formatarMoeda(resumo.totais.totalEncargos)}</th>
                                            <th class="text-primary"><strong>${formatarMoeda(resumo.totais.custoTotal)}</strong></th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div class="alert alert-warning mt-3">
                                <strong>⚠️ Atenção:</strong> Ao confirmar o fechamento, serão gerados lançamentos automáticos no Fluxo de Caixa e na Gestão Financeira.
                            </div>
                        </div>
                    `;
    }

    function confirmarFechamento() {
        try {
            const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');
            const resumo = prepararResumoFechamento(funcionariosAtivos);

            // Criar registro de fechamento
            const fechamento = {
                id: gerarId(),
                ...resumo.totais,
                periodo: resumo.periodo,
                dataFechamento: resumo.dataFechamento,
                totalFuncionarios: resumo.totalFuncionarios,
                funcionarios: resumo.detalhes.map(d => ({
                    id: d.funcionario.id,
                    nome: d.funcionario.nome,
                    cargo: d.funcionario.cargo,
                    salarioLiquido: d.calculos.salarioLiquido,
                    custoTotal: d.calculos.custoTotal
                }))
            };

            // Remover fechamento anterior do mesmo período se existir
            fechamentos = fechamentos.filter(f => f.periodo !== mesReferencia);

            // Adicionar novo fechamento
            fechamentos.push(fechamento);
            salvarDados();

            // Integrar com Fluxo de Caixa
            integrarComFluxoCaixa(fechamento);

            // Integrar com Gestão Financeira
            integrarComGestaoFinanceira(fechamento);

            fecharModal('modalFechamento');
            renderizarInterface();

            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('✅ Folha fechada com sucesso!', 'success');
            }

            // Disparar evento
            if (typeof utils !== 'undefined' && utils.dispararEvento) {
                utils.dispararEvento('possattoUpdate', {
                    modulo: 'folha',
                    acao: 'folha_fechada',
                    dados: fechamento
                });
            }

        } catch (error) {
            console.error('❌ Erro ao fechar folha:', error);
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Erro ao fechar folha', 'danger');
            }
        }
    }

    // ==================== INTEGRAÇÃO COM OUTROS MÓDULOS ====================

    function integrarComFluxoCaixa(fechamento) {
        try {
            // Disparar evento para o fluxo de caixa processar
            if (typeof utils !== 'undefined' && utils.dispararEvento) {
                utils.dispararEvento('possattoUpdate', {
                    modulo: 'folha',
                    acao: 'criar_lancamentos_fluxo',
                    dados: {
                        fechamento: fechamento,
                        lancamentos: fechamento.funcionarios.map(func => ({
                            tipo: 'saida',
                            data: fechamento.dataFechamento,
                            descricao: `Salário - ${func.nome}`,
                            valor: func.custoTotal,
                            categoria: 'Folha de Pagamento',
                            status: 'pendente',
                            origem: 'Folha de Pagamento'
                        }))
                    }
                });
            }

            // Integração direta se abaFluxo estiver disponível
            if (window.abaFluxo && typeof window.abaFluxo.adicionarLancamentoAutomatico === 'function') {
                fechamento.funcionarios.forEach(func => {
                    window.abaFluxo.adicionarLancamentoAutomatico({
                        tipo: 'saida',
                        data: fechamento.dataFechamento,
                        descricao: `Salário - ${func.nome}`,
                        valor: func.custoTotal,
                        categoria: 'Folha de Pagamento',
                        origem: 'Folha de Pagamento'
                    });
                });
            }

        } catch (error) {
            console.error('❌ Erro ao integrar com fluxo de caixa:', error);
        }
    }

    function integrarComGestaoFinanceira(fechamento) {
        try {
            // Criar despesa prevista mensal
            const despesaFolha = {
                id: gerarId(),
                tipo: 'despesa',
                data: fechamento.dataFechamento,
                descricao: `Folha de Pagamento - ${formatarPeriodo(fechamento.periodo)}`,
                valor: fechamento.custoTotal,
                categoria: 'mensal',
                status: 'prevista',
                origem: 'Folha de Pagamento',
                recorrente: true,
                frequencia: 'mensal'
            };

            // Integração direta se abaGestao estiver disponível
            if (window.abaGestao && typeof window.abaGestao.criarLancamento === 'function') {
                window.abaGestao.criarLancamento(despesaFolha);
            }

        } catch (error) {
            console.error('❌ Erro ao integrar com gestão financeira:', error);
        }
    }

    // ==================== DETALHES E RELATÓRIOS ====================

    function verDetalhes(id) {
        const funcionario = funcionarios.find(f => f.id === id);
        if (!funcionario) return;

        const calculos = calcularFolhaFuncionario(funcionario);

        const modalBody = document.getElementById('modalDetalhesBody');
        modalBody.innerHTML = `
                        <div class="detalhes-funcionario">
                            <h4>${funcionario.nome}</h4>
                            <p><strong>Cargo:</strong> ${funcionario.cargo}</p>
                            <p><strong>CPF:</strong> ${formatarDocumento(funcionario.cpf)}</p>
                            <p><strong>Status:</strong> <span class="badge badge-${funcionario.status === 'ativo' ? 'success' : 'secondary'}">${funcionario.status}</span></p>
                            
                            <hr>
                            
                            <h5>Demonstrativo de Pagamento</h5>
                            <table class="table table-sm">
                                <tbody>
                                    <tr>
                                        <td>Salário Bruto</td>
                                        <td class="text-end">${formatarMoeda(calculos.salarioBruto)}</td>
                                    </tr>
                                    <tr class="table-active">
                                        <td colspan="2"><strong>Descontos</strong></td>
                                    </tr>
                                    <tr>
                                        <td>INSS</td>
                                        <td class="text-end text-danger">- ${formatarMoeda(calculos.inss)}</td>
                                    </tr>
                                    <tr>
                                        <td>IRRF</td>
                                        <td class="text-end text-danger">- ${formatarMoeda(calculos.irrf)}</td>
                                    </tr>
                                    <tr>
                                        <td>Vale Transporte</td>
                                        <td class="text-end text-danger">- ${formatarMoeda(calculos.descontoVT)}</td>
                                    </tr>
                                    <tr class="table-active">
                                        <td><strong>Salário Líquido</strong></td>
                                        <td class="text-end"><strong class="text-success">${formatarMoeda(calculos.salarioLiquido)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <h5>Benefícios</h5>
                            <table class="table table-sm">
                                <tbody>
                                    <tr>
                                        <td>Vale Transporte</td>
                                        <td class="text-end">${formatarMoeda(funcionario.valeTransporte)}</td>
                                    </tr>
                                    <tr>
                                        <td>Vale Refeição</td>
                                        <td class="text-end">${formatarMoeda(funcionario.valeRefeicao)}</td>
                                    </tr>
                                    <tr>
                                        <td>Outros Benefícios</td>
                                        <td class="text-end">${formatarMoeda(funcionario.outrosBeneficios)}</td>
                                    </tr>
                                    <tr class="table-active">
                                        <td><strong>Total Benefícios</strong></td>
                                        <td class="text-end"><strong>${formatarMoeda(calculos.totalBeneficios)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <h5>Encargos da Empresa</h5>
                            <table class="table table-sm">
                                <tbody>
                                    <tr>
                                        <td>FGTS (${CONFIG.FGTS}%)</td>
                                        <td class="text-end">${formatarMoeda(calculos.fgts)}</td>
                                    </tr>
                                    <tr>
                                        <td>Encargos Adicionais (${funcionario.encargosAdicionais}%)</td>
                                        <td class="text-end">${formatarMoeda(calculos.salarioBruto * (funcionario.encargosAdicionais / 100))}</td>
                                    </tr>
                                    <tr class="table-active">
                                        <td><strong>Total Encargos</strong></td>
                                        <td class="text-end"><strong>${formatarMoeda(calculos.encargosEmpresa)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <div class="alert alert-info mt-3">
                                <strong>💰 Custo Total para Empresa:</strong> 
                                <span class="float-end">${formatarMoeda(calculos.custoTotal)}</span>
                            </div>
                        </div>
                    `;

        abrirModal('modalDetalhes');
    }

    function imprimirDetalhes() {
        window.print();
    }

    // ==================== EXPORTAÇÃO ====================

    function exportarFolha(fechamentoId) {
        const fechamento = fechamentos.find(f => f.id === fechamentoId);
        if (!fechamento) return;

        const formato = prompt('Escolha o formato:\n1 - PDF\n2 - Excel\n3 - CSV');

        switch (formato) {
            case '1':
                exportarPDF(fechamento);
                break;
            case '2':
                exportarExcel(fechamento);
                break;
            case '3':
                exportarCSV(fechamento);
                break;
            default:
                if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                    utils.mostrarAlerta('Formato inválido', 'warning');
                }
        }
    }

    function exportarPDF(fechamento) {
        try {
            if (!window.jsPDF) {
                if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                    utils.mostrarAlerta('Biblioteca PDF não carregada', 'danger');
                }
                return;
            }

            const doc = new window.jsPDF();

            // Cabeçalho
            doc.setFontSize(16);
            doc.text('Folha de Pagamento', 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`Período: ${formatarPeriodo(fechamento.periodo)}`, 105, 30, { align: 'center' });

            // Dados da empresa
            const dadosEmpresa = typeof utils !== 'undefined' && utils.obterDados ?
                utils.obterDados('dadosEmpresa', {}) : {};

            if (dadosEmpresa.razaoSocial) {
                doc.setFontSize(10);
                doc.text(dadosEmpresa.razaoSocial, 20, 45);
                doc.text(`CNPJ: ${dadosEmpresa.cnpj || ''}`, 20, 50);
            }

            // Tabela de funcionários
            let y = 70;
            doc.setFontSize(10);

            // Cabeçalhos
            doc.text('Funcionário', 20, y);
            doc.text('Cargo', 70, y);
            doc.text('Salário', 120, y, { align: 'right' });
            doc.text('Descontos', 150, y, { align: 'right' });
            doc.text('Líquido', 180, y, { align: 'right' });

            y += 10;

            // Dados
            fechamento.funcionarios.forEach(func => {
                doc.text(func.nome.substring(0, 25), 20, y);
                doc.text(func.cargo.substring(0, 20), 70, y);
                doc.text(formatarMoeda(func.custoTotal), 120, y, { align: 'right' });
                doc.text('-', 150, y, { align: 'right' });
                doc.text(formatarMoeda(func.salarioLiquido), 180, y, { align: 'right' });
                y += 6;

                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });

            // Totais
            y += 10;
            doc.setFont(undefined, 'bold');
            doc.text('TOTAL GERAL', 20, y);
            doc.text(formatarMoeda(fechamento.custoTotal), 180, y, { align: 'right' });

            // Salvar
            doc.save(`folha-pagamento-${fechamento.periodo}.pdf`);

            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('PDF exportado com sucesso!', 'success');
            }

        } catch (error) {
            console.error('❌ Erro ao exportar PDF:', error);
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Erro ao exportar PDF', 'danger');
            }
        }
    }

    function exportarExcel(fechamento) {
        try {
            if (!window.XLSX) {
                if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                    utils.mostrarAlerta('Biblioteca Excel não carregada', 'danger');
                }
                return;
            }

            // Preparar dados
            const dados = fechamento.funcionarios.map(func => ({
                'Nome': func.nome,
                'Cargo': func.cargo,
                'Salário Bruto': func.custoTotal,
                'Salário Líquido': func.salarioLiquido,
                'Status': 'Ativo'
            }));

            // Criar workbook
            const ws = XLSX.utils.json_to_sheet(dados);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Folha de Pagamento');

            // Adicionar resumo
            const resumo = [
                { 'Descrição': 'Total Funcionários', 'Valor': fechamento.totalFuncionarios },
                { 'Descrição': 'Total Salários', 'Valor': fechamento.salariosBrutos || 0 },
                { 'Descrição': 'Total Encargos', 'Valor': fechamento.totalEncargos },
                { 'Descrição': 'Custo Total', 'Valor': fechamento.custoTotal }
            ];

            const wsResumo = XLSX.utils.json_to_sheet(resumo);
            XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

            // Salvar
            XLSX.writeFile(wb, `folha-pagamento-${fechamento.periodo}.xlsx`);

            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Excel exportado com sucesso!', 'success');
            }

        } catch (error) {
            console.error('❌ Erro ao exportar Excel:', error);
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Erro ao exportar Excel', 'danger');
            }
        }
    }

    function exportarCSV(fechamento) {
        try {
            const headers = ['Nome', 'Cargo', 'Salário Bruto', 'Salário Líquido'];
            const rows = fechamento.funcionarios.map(func => [
                func.nome,
                func.cargo,
                func.custoTotal.toFixed(2),
                func.salarioLiquido.toFixed(2)
            ]);

            let csv = headers.join(',') + '\n';
            csv += rows.map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `folha-pagamento-${fechamento.periodo}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('CSV exportado com sucesso!', 'success');
            }

        } catch (error) {
            console.error('❌ Erro ao exportar CSV:', error);
            if (typeof utils !== 'undefined' && utils.mostrarAlerta) {
                utils.mostrarAlerta('Erro ao exportar CSV', 'danger');
            }
        }
    }

    // ==================== GRÁFICOS ====================

    function inicializarGrafico() {
        try {
            if (!window.Chart) {
                console.warn('Chart.js não está carregado');
                return;
            }

            const canvas = document.getElementById('graficoCustosFolha');
            if (!canvas) return;

            // Destruir gráfico anterior se existir
            if (graficoCusto) {
                graficoCusto.destroy();
            }

            const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');
            const dados = funcionariosAtivos.map(func => {
                const calculos = calcularFolhaFuncionario(func);
                return {
                    nome: func.nome,
                    custo: calculos.custoTotal
                };
            });

            graficoCusto = new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: dados.map(d => d.nome),
                    datasets: [{
                        data: dados.map(d => d.custo),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40',
                            '#FF6384',
                            '#36A2EB'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const valor = formatarMoeda(context.parsed);
                                    const percentual = ((context.parsed / context.dataset._meta[0].total) * 100).toFixed(1);
                                    return `${context.label}: ${valor} (${percentual}%)`;
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

    // ==================== UTILITÁRIOS ====================

    function gerarId() {
        return 'func_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function obterMesAtual() {
        const hoje = new Date();
        return hoje.toISOString().substring(0, 7);
    }

    function formatarPeriodo(periodo) {
        const [ano, mes] = periodo.split('-');
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${meses[parseInt(mes) - 1]}/${ano}`;
    }

    function formatarMoeda(valor) {
        if (typeof utils !== 'undefined' && utils.formatarMoeda) {
            return utils.formatarMoeda(valor);
        }
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    function formatarDocumento(cpf) {
        if (typeof utils !== 'undefined' && utils.formatarDocumento) {
            return utils.formatarDocumento(cpf);
        }
        return cpf;
    }

    function alterarMesReferencia(novoMes) {
        mesReferencia = novoMes;
        renderizarInterface();
    }

    function abrirModal(modalId) {
        if (typeof utils !== 'undefined' && utils.abrirModal) {
            utils.abrirModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex';
            }
        }
    }

    function fecharModal(modalId) {
        if (typeof utils !== 'undefined' && utils.fecharModal) {
            utils.fecharModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        }
    }

    // ==================== EVENT LISTENERS ====================

    function configurarEventListeners() {
        try {
            // Auto-save em formulários
            document.addEventListener('input', function (event) {
                if (event.target.closest('#modalFuncionario')) {
                    clearTimeout(window.abaFolha._autoSaveTimeout);
                    window.abaFolha._autoSaveTimeout = setTimeout(() => {
                        console.log('💾 Auto-save de funcionário...');
                    }, CONFIG.AUTO_SAVE_DELAY);
                }
            });

            // Formatação automática de CPF
            document.addEventListener('input', function (event) {
                if (event.target.id === 'cpfFuncionario') {
                    event.target.value = event.target.value.replace(/\D/g, '');
                }
            });

        } catch (error) {
            console.error('❌ Erro ao configurar event listeners:', error);
        }
    }

    // ==================== API PÚBLICA ====================

    const API_PUBLICA = {
        // Métodos principais
        inicializar: inicializarAbaFolha,
        novoFuncionario,
        editarFuncionario,
        salvarFuncionario,
        excluirFuncionario,
        verDetalhes,

        // Fechamento
        fecharFolhaMes,
        confirmarFechamento,

        // Exportação
        exportarFolha,
        imprimirDetalhes,

        // Interface
        renderizarInterface,
        alterarMesReferencia,
        fecharModal,

        // Dados
        obterFuncionarios: () => [...funcionarios],
        obterFechamentos: () => [...fechamentos],
        obterEstatisticas: calcularEstatisticas,

        // Cálculos
        calcularFolhaFuncionario,

        // Metadados
        versao: CONFIG.VERSAO_MODULO,
        _autoSaveTimeout: null,
        _inicializado: false
    };

    // ==================== EXPORTAÇÃO GLOBAL ====================

    window.abaFolha = API_PUBLICA;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API_PUBLICA;
    }

    window.abaFolha = API_PUBLICA;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API_PUBLICA;
    }

})();   