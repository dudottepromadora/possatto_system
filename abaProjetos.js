/**
 * SISTEMA POSSATTO PRO v7.0
 * Módulo: Aba Projetos
 * Versão: 7.0 - Correção Definitiva
 * 
 * Este arquivo gerencia toda a funcionalidade da aba Projetos
 * Integração completa com orçamentos aprovados e demais módulos
 */

(function () {
    'use strict';

    // ==================== VARIÁVEIS GLOBAIS ====================
    let projetosData = [];
    let projetoAtual = null;
    let filtroStatusProjeto = 'todos';
    let filtroTipoProjeto = 'todos';
    let modoVisualizacao = 'cards';
    let projetosCarregados = false;

    // Status possíveis dos projetos com configuração completa
    const STATUS_PROJETOS = {
        'aprovado': {
            nome: 'Aprovado',
            cor: 'primary',
            icon: '✅',
            proximosStatus: ['em-producao', 'cancelado']
        },
        'em-producao': {
            nome: 'Em Produção',
            cor: 'warning',
            icon: '🔨',
            proximosStatus: ['aguardando-material', 'instalacao', 'pausado', 'cancelado']
        },
        'aguardando-material': {
            nome: 'Aguardando Material',
            cor: 'info',
            icon: '📦',
            proximosStatus: ['em-producao', 'pausado', 'cancelado']
        },
        'instalacao': {
            nome: 'Instalação',
            cor: 'primary',
            icon: '🔧',
            proximosStatus: ['finalizado', 'pausado']
        },
        'finalizado': {
            nome: 'Finalizado',
            cor: 'success',
            icon: '🎉',
            proximosStatus: []
        },
        'cancelado': {
            nome: 'Cancelado',
            cor: 'danger',
            icon: '❌',
            proximosStatus: []
        },
        'pausado': {
            nome: 'Pausado',
            cor: 'secondary',
            icon: '⏸️',
            proximosStatus: ['em-producao', 'cancelado']
        }
    };

    // Etapas padrão para projetos
    const ETAPAS_PADRAO = [
        { nome: 'Aprovação do Projeto', percentual: 5 },
        { nome: 'Pedido de Materiais', percentual: 10 },
        { nome: 'Recebimento de Materiais', percentual: 15 },
        { nome: 'Corte', percentual: 20 },
        { nome: 'Usinagem', percentual: 15 },
        { nome: 'Montagem', percentual: 15 },
        { nome: 'Acabamento', percentual: 10 },
        { nome: 'Embalagem', percentual: 5 },
        { nome: 'Entrega/Instalação', percentual: 5 }
    ];

    // ==================== INICIALIZAÇÃO ====================

    /**
     * Inicializa a aba de projetos
     * Chamada quando a aba é ativada
     */
    function inicializarAbaProjetos() {
        console.log('🚀 Inicializando aba Projetos...');

        try {
            // Carregar dados salvos
            carregarProjetosSalvos();

            // Renderizar interface
            renderizarInterface();

            // Configurar filtros e eventos
            configurarEventos();

            // Atualizar estatísticas
            atualizarEstatisticas();

            // Verificar integração com orçamentos
            verificarOrcamentosAprovados();

            projetosCarregados = true;
            console.log('✅ Aba Projetos inicializada com sucesso');

        } catch (error) {
            console.error('❌ Erro ao inicializar aba Projetos:', error);
            mostrarAlerta('Erro ao carregar projetos. Recarregue a página.', 'danger');
        }
    }

    /**
     * Renderiza toda a interface de projetos
     */
    function renderizarInterface() {
        const container = document.getElementById('projetos');
        if (!container) return;

        // Verificar se a estrutura HTML já existe
        if (!container.querySelector('.projetos-container')) {
            console.warn('⚠️ Estrutura HTML da aba Projetos não encontrada');
            return;
        }

        // Renderizar lista de projetos
        renderizarListaProjetos();

        // Atualizar contadores
        atualizarContadores();
    }

    /**
     * Configura todos os eventos da interface
     */
    function configurarEventos() {
        // Filtro de status
        const selectStatus = document.getElementById('filtroStatusProjeto');
        if (selectStatus && !selectStatus.hasAttribute('data-configured')) {
            popularSelectStatus(selectStatus);
            selectStatus.addEventListener('change', function () {
                filtroStatusProjeto = this.value;
                renderizarListaProjetos();
            });
            selectStatus.setAttribute('data-configured', 'true');
        }

        // Filtro de tipo
        const selectTipo = document.getElementById('filtroTipoProjeto');
        if (selectTipo && !selectTipo.hasAttribute('data-configured')) {
            selectTipo.addEventListener('change', function () {
                filtroTipoProjeto = this.value;
                renderizarListaProjetos();
            });
            selectTipo.setAttribute('data-configured', 'true');
        }

        // Campo de busca
        const inputBusca = document.getElementById('buscarProjeto');
        if (inputBusca && !inputBusca.hasAttribute('data-configured')) {
            inputBusca.addEventListener('input', debounce(function () {
                renderizarListaProjetos();
            }, 300));
            inputBusca.setAttribute('data-configured', 'true');
        }

        // Eventos de teclado nos modais
        configurarEventosTeclado();
    }

    /**
     * Popula o select de status
     */
    function popularSelectStatus(select) {
        select.innerHTML = `
            <option value="todos">Todos os Status</option>
            ${Object.entries(STATUS_PROJETOS).map(([key, status]) =>
            `<option value="${key}">${status.icon} ${status.nome}</option>`
        ).join('')}
        `;
    }

    /**
     * Configura eventos de teclado para melhor UX
     */
    function configurarEventosTeclado() {
        // ESC para fechar modais
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const modaisAbertos = document.querySelectorAll('.modal.active');
                modaisAbertos.forEach(modal => {
                    fecharModal(modal.id);
                });
            }
        });
    }

    // ==================== PERSISTÊNCIA DE DADOS ====================

    /**
     * Carrega projetos salvos do localStorage
     */
    function carregarProjetosSalvos() {
        try {
            if (window.utils) {
                projetosData = window.utils.obterDados('projetos', []);
            } else {
                const dados = localStorage.getItem('possatto_projetos');
                projetosData = dados ? JSON.parse(dados) : [];
            }

            // Validar e corrigir estrutura dos dados se necessário
            projetosData = projetosData.map(projeto => validarEstruturaProjeto(projeto));

        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            projetosData = [];
        }
    }

    /**
     * Salva projetos no localStorage
     */
    function salvarProjetos() {
        try {
            if (window.utils) {
                window.utils.salvarDados('projetos', projetosData);
            } else {
                localStorage.setItem('possatto_projetos', JSON.stringify(projetosData));
            }

            // Disparar evento customizado para outras abas
            dispararEventoAtualizacao();

        } catch (error) {
            console.error('Erro ao salvar projetos:', error);
            mostrarAlerta('Erro ao salvar projetos', 'danger');
        }
    }

    /**
     * Valida e corrige a estrutura de um projeto
     */
    function validarEstruturaProjeto(projeto) {
        return {
            id: projeto.id || gerarIdProjeto(),
            nomeCliente: projeto.nomeCliente || '',
            cpfCliente: projeto.cpfCliente || '',
            telefoneCliente: projeto.telefoneCliente || '',
            emailCliente: projeto.emailCliente || '',
            tipo: projeto.tipo || 'residencial',
            endereco: projeto.endereco || '',
            valorContrato: projeto.valorContrato || 0,
            dataInicio: projeto.dataInicio || new Date().toISOString().split('T')[0],
            dataPrevisao: projeto.dataPrevisao || '',
            dataConclusao: projeto.dataConclusao || null,
            status: projeto.status || 'aprovado',
            progresso: projeto.progresso || 0,
            observacoes: projeto.observacoes || '',
            orcamentoVinculado: projeto.orcamentoVinculado || null,
            etapas: projeto.etapas || [],
            cronograma: projeto.cronograma || [],
            anexos: projeto.anexos || [],
            historico: projeto.historico || [],
            dataCriacao: projeto.dataCriacao || new Date().toISOString(),
            dataUltimaAtualizacao: projeto.dataUltimaAtualizacao || new Date().toISOString()
        };
    }

    // ==================== GESTÃO DE PROJETOS ====================

    /**
     * Abre modal para criar novo projeto
     */
    window.novoProjeto = function () {
        const modal = document.getElementById('modalNovoProjeto');
        if (!modal) {
            mostrarAlerta('Modal não encontrado', 'danger');
            return;
        }

        // Limpar formulário
        const form = document.getElementById('formNovoProjeto');
        if (form) form.reset();

        // Preencher data atual
        const dataInicio = document.getElementById('dataInicioProjeto');
        if (dataInicio) {
            dataInicio.value = new Date().toISOString().split('T')[0];
        }

        // Carregar orçamentos aprovados
        carregarOrcamentosAprovados();

        // Abrir modal
        abrirModal('modalNovoProjeto');

        // Focar no primeiro campo
        setTimeout(() => {
            const primeiroInput = modal.querySelector('input:not([type="hidden"])');
            if (primeiroInput) primeiroInput.focus();
        }, 300);
    };

    /**
     * Salva novo projeto
     */
    window.salvarNovoProjeto = function () {
        const form = document.getElementById('formNovoProjeto');
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        const formData = new FormData(form);

        // Criar novo projeto
        const novoProjeto = {
            id: gerarIdProjeto(),
            nomeCliente: formData.get('nomeClienteProjeto')?.trim(),
            cpfCliente: formData.get('cpfClienteProjeto') || '',
            telefoneCliente: formData.get('telefoneClienteProjeto') || '',
            emailCliente: formData.get('emailClienteProjeto') || '',
            tipo: formData.get('tipoProjetoProjeto'),
            endereco: formData.get('enderecoProjeto') || '',
            valorContrato: parseFloat(formData.get('valorContratoProjeto')) || 0,
            dataInicio: formData.get('dataInicioProjeto'),
            dataPrevisao: formData.get('dataPrevisaoProjeto') || '',
            dataConclusao: null,
            status: 'aprovado',
            progresso: 0,
            observacoes: formData.get('observacoesProjeto') || '',
            orcamentoVinculado: formData.get('orcamentoVinculado') || null,
            etapas: criarEtapasPadrao(),
            cronograma: [],
            anexos: [],
            historico: [{
                data: new Date().toISOString(),
                acao: 'Projeto criado',
                usuario: 'Sistema',
                detalhes: 'Projeto criado no sistema'
            }],
            dataCriacao: new Date().toISOString(),
            dataUltimaAtualizacao: new Date().toISOString()
        };

        // Adicionar à lista
        projetosData.unshift(novoProjeto);

        // Salvar
        salvarProjetos();

        // Atualizar interface
        renderizarListaProjetos();
        atualizarEstatisticas();

        // Fechar modal
        fecharModal('modalNovoProjeto');

        mostrarAlerta('✅ Projeto criado com sucesso!', 'success');

        // Se vinculado a orçamento, atualizar status do orçamento
        if (novoProjeto.orcamentoVinculado) {
            atualizarStatusOrcamento(novoProjeto.orcamentoVinculado, 'em-producao');
        }
    };

    /**
     * Cria etapas padrão para novo projeto
     */
    function criarEtapasPadrao() {
        return ETAPAS_PADRAO.map((etapa, index) => ({
            id: `etapa_${Date.now()}_${index}`,
            nome: etapa.nome,
            percentual: etapa.percentual,
            status: 'pendente',
            dataConclusao: null
        }));
    }

    /**
     * Gera ID único para projeto
     */
    function gerarIdProjeto() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        const sequencial = String(projetosData.length + 1).padStart(3, '0');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();

        return `PROJ-${ano}${mes}${dia}-${sequencial}-${random}`;
    }

    /**
     * Edita projeto existente
     */
    window.editarProjeto = function (projetoId) {
        const projeto = projetosData.find(p => p.id === projetoId);
        if (!projeto) {
            mostrarAlerta('Projeto não encontrado', 'danger');
            return;
        }

        projetoAtual = projeto;

        // Preencher formulário
        const campos = {
            'editProjetoId': projeto.id,
            'editProjetoCliente': projeto.nomeCliente,
            'editProjetoCpf': projeto.cpfCliente,
            'editProjetoTelefone': projeto.telefoneCliente,
            'editProjetoEmail': projeto.emailCliente,
            'editProjetoTipo': projeto.tipo,
            'editProjetoEndereco': projeto.endereco,
            'editProjetoValor': projeto.valorContrato,
            'editProjetoInicio': projeto.dataInicio,
            'editProjetoPrevisao': projeto.dataPrevisao,
            'editProjetoStatus': projeto.status,
            'editProjetoProgresso': projeto.progresso,
            'editProjetoObservacoes': projeto.observacoes
        };

        Object.entries(campos).forEach(([id, valor]) => {
            const element = document.getElementById(id);
            if (element) element.value = valor || '';
        });

        // Atualizar label do progresso
        const progressoLabel = document.getElementById('progressoLabel');
        if (progressoLabel) {
            progressoLabel.textContent = `${projeto.progresso}%`;
        }

        // Popular select de status com opções válidas
        popularSelectStatusEdicao(projeto.status);

        abrirModal('modalEditarProjeto');
    };

    /**
     * Popula select de status para edição com transições válidas
     */
    function popularSelectStatusEdicao(statusAtual) {
        const select = document.getElementById('editProjetoStatus');
        if (!select) return;

        const statusInfo = STATUS_PROJETOS[statusAtual];
        const proximosStatus = statusInfo?.proximosStatus || [];

        select.innerHTML = `
            <option value="${statusAtual}" selected>
                ${statusInfo.icon} ${statusInfo.nome} (Atual)
            </option>
            ${proximosStatus.map(status => {
            const info = STATUS_PROJETOS[status];
            return `<option value="${status}">${info.icon} ${info.nome}</option>`;
        }).join('')}
        `;
    }

    /**
     * Salva edições do projeto
     */
    window.salvarEdicaoProjeto = function () {
        if (!projetoAtual) return;

        const form = document.getElementById('formEditarProjeto');
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        const formData = new FormData(form);

        // Capturar valores anteriores para histórico
        const statusAnterior = projetoAtual.status;
        const progressoAnterior = projetoAtual.progresso;

        // Atualizar dados
        projetoAtual.nomeCliente = formData.get('editProjetoCliente')?.trim();
        projetoAtual.cpfCliente = formData.get('editProjetoCpf') || '';
        projetoAtual.telefoneCliente = formData.get('editProjetoTelefone') || '';
        projetoAtual.emailCliente = formData.get('editProjetoEmail') || '';
        projetoAtual.tipo = formData.get('editProjetoTipo');
        projetoAtual.endereco = formData.get('editProjetoEndereco') || '';
        projetoAtual.valorContrato = parseFloat(formData.get('editProjetoValor')) || 0;
        projetoAtual.dataInicio = formData.get('editProjetoInicio');
        projetoAtual.dataPrevisao = formData.get('editProjetoPrevisao') || '';
        projetoAtual.status = formData.get('editProjetoStatus');
        projetoAtual.progresso = parseInt(formData.get('editProjetoProgresso')) || 0;
        projetoAtual.observacoes = formData.get('editProjetoObservacoes') || '';
        projetoAtual.dataUltimaAtualizacao = new Date().toISOString();

        // Registrar mudanças no histórico
        if (statusAnterior !== projetoAtual.status) {
            adicionarAoHistorico(projetoAtual, 'Status alterado',
                `De "${STATUS_PROJETOS[statusAnterior].nome}" para "${STATUS_PROJETOS[projetoAtual.status].nome}"`);
        }

        if (progressoAnterior !== projetoAtual.progresso) {
            adicionarAoHistorico(projetoAtual, 'Progresso atualizado',
                `De ${progressoAnterior}% para ${projetoAtual.progresso}%`);
        }

        // Se projeto finalizado, registrar data de conclusão
        if (projetoAtual.status === 'finalizado' && !projetoAtual.dataConclusao) {
            projetoAtual.dataConclusao = new Date().toISOString();
        }

        // Salvar
        salvarProjetos();

        // Atualizar interface
        renderizarListaProjetos();
        atualizarEstatisticas();

        // Atualizar modal de detalhes se estiver aberto
        if (document.getElementById('modalDetalhesProjeto').classList.contains('active')) {
            preencherModalDetalhes(projetoAtual);
        }

        fecharModal('modalEditarProjeto');
        mostrarAlerta('✅ Projeto atualizado com sucesso!', 'success');
    };

    /**
     * Exclui projeto
     */
    window.excluirProjeto = function (projetoId) {
        const projeto = projetosData.find(p => p.id === projetoId);
        if (!projeto) return;

        const confirmar = confirm(`Deseja realmente excluir o projeto "${projeto.nomeCliente}"?\n\nEsta ação não pode ser desfeita.`);
        if (!confirmar) return;

        // Remover da lista
        projetosData = projetosData.filter(p => p.id !== projetoId);

        // Salvar
        salvarProjetos();

        // Atualizar interface
        renderizarListaProjetos();
        atualizarEstatisticas();

        // Fechar modal se estiver aberto
        fecharModal('modalDetalhesProjeto');

        mostrarAlerta('🗑️ Projeto excluído com sucesso', 'warning');
    };

    /**
     * Duplica projeto
     */
    window.duplicarProjeto = function (projetoId) {
        const projeto = projetosData.find(p => p.id === projetoId);
        if (!projeto) return;

        const novoProjeto = {
            ...JSON.parse(JSON.stringify(projeto)), // Deep clone
            id: gerarIdProjeto(),
            nomeCliente: projeto.nomeCliente + ' (Cópia)',
            status: 'aprovado',
            progresso: 0,
            dataInicio: new Date().toISOString().split('T')[0],
            dataPrevisao: '',
            dataConclusao: null,
            orcamentoVinculado: null,
            etapas: criarEtapasPadrao(),
            cronograma: [],
            anexos: [],
            historico: [{
                data: new Date().toISOString(),
                acao: 'Projeto duplicado',
                usuario: 'Sistema',
                detalhes: `Duplicado do projeto ${projeto.id}`
            }],
            dataCriacao: new Date().toISOString(),
            dataUltimaAtualizacao: new Date().toISOString()
        };

        // Adicionar à lista
        projetosData.unshift(novoProjeto);

        // Salvar
        salvarProjetos();

        // Atualizar interface
        renderizarListaProjetos();
        atualizarEstatisticas();

        mostrarAlerta('📋 Projeto duplicado com sucesso!', 'success');
    };

    // ==================== RENDERIZAÇÃO ====================

    /**
     * Renderiza lista de projetos
     */
    function renderizarListaProjetos() {
        const container = document.getElementById('listaProjetos');
        if (!container) return;

        // Aplicar filtros
        let projetosFiltrados = filtrarProjetos();

        // Atualizar contador
        atualizarContador(projetosFiltrados.length, projetosData.length);

        if (projetosFiltrados.length === 0) {
            container.innerHTML = renderizarEstadoVazio();
            return;
        }

        // Renderizar de acordo com o modo de visualização
        if (modoVisualizacao === 'cards') {
            container.className = 'projetos-grid';
            container.innerHTML = projetosFiltrados.map(projeto => renderizarCardProjeto(projeto)).join('');
        } else {
            container.className = 'projetos-lista';
            container.innerHTML = renderizarTabelaProjetos(projetosFiltrados);
        }
    }

    /**
     * Filtra projetos de acordo com os critérios selecionados
     */
    function filtrarProjetos() {
        let projetos = [...projetosData];

        // Filtro de status
        if (filtroStatusProjeto !== 'todos') {
            projetos = projetos.filter(p => p.status === filtroStatusProjeto);
        }

        // Filtro de tipo
        if (filtroTipoProjeto !== 'todos') {
            projetos = projetos.filter(p => p.tipo === filtroTipoProjeto);
        }

        // Filtro de busca
        const termoBusca = document.getElementById('buscarProjeto')?.value?.toLowerCase();
        if (termoBusca) {
            projetos = projetos.filter(p =>
                p.nomeCliente.toLowerCase().includes(termoBusca) ||
                p.id.toLowerCase().includes(termoBusca) ||
                p.endereco?.toLowerCase().includes(termoBusca) ||
                p.tipo.toLowerCase().includes(termoBusca)
            );
        }

        // Ordenar por data de criação (mais recentes primeiro)
        projetos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

        return projetos;
    }

    /**
     * Renderiza um card de projeto
     */
    function renderizarCardProjeto(projeto) {
        const statusInfo = STATUS_PROJETOS[projeto.status];
        const progressoEtapas = calcularProgressoEtapas(projeto);

        return `
            <div class="projeto-card ${projeto.status}" data-projeto-id="${projeto.id}">
                <div class="projeto-header">
                    <div class="projeto-info">
                        <h4 class="projeto-titulo">${escapeHtml(projeto.nomeCliente)}</h4>
                        <div class="projeto-meta">
                            <span class="projeto-id">${projeto.id}</span>
                            <span class="badge badge-${statusInfo.cor}">
                                ${statusInfo.icon} ${statusInfo.nome}
                            </span>
                            <span class="projeto-tipo">${capitalizar(projeto.tipo)}</span>
                        </div>
                    </div>
                    <div class="projeto-valor">
                        <div class="valor-principal">${formatarMoeda(projeto.valorContrato)}</div>
                    </div>
                </div>
                
                <div class="projeto-detalhes">
                    <div class="projeto-dados">
                        <div class="dado-item">
                            <span class="dado-label">📅 Início:</span>
                            <span class="dado-valor">${formatarData(projeto.dataInicio)}</span>
                        </div>
                        <div class="dado-item">
                            <span class="dado-label">🎯 Previsão:</span>
                            <span class="dado-valor">${projeto.dataPrevisao ? formatarData(projeto.dataPrevisao) : 'Não definida'}</span>
                        </div>
                        <div class="dado-item">
                            <span class="dado-label">📱 Telefone:</span>
                            <span class="dado-valor">${projeto.telefoneCliente || 'Não informado'}</span>
                        </div>
                        <div class="dado-item">
                            <span class="dado-label">📍 Local:</span>
                            <span class="dado-valor">${projeto.endereco || 'Não informado'}</span>
                        </div>
                    </div>
                    
                    <div class="projeto-progresso">
                        <div class="progresso-header">
                            <div class="progresso-label">
                                <span>Progresso Geral: ${projeto.progresso}%</span>
                                <span class="progresso-etapas">${progressoEtapas.concluidas}/${progressoEtapas.total} etapas</span>
                            </div>
                        </div>
                        <div class="progress">
                            <div class="progress-bar bg-${statusInfo.cor}" 
                                 style="width: ${projeto.progresso}%"
                                 role="progressbar" 
                                 aria-valuenow="${projeto.progresso}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100"></div>
                        </div>
                        ${renderizarMiniEtapas(projeto)}
                    </div>
                </div>
                
                <div class="projeto-actions">
                    <button class="btn btn-sm btn-info" onclick="visualizarProjeto('${projeto.id}')" title="Ver detalhes completos">
                        👁️ Detalhes
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editarProjeto('${projeto.id}')" title="Editar projeto">
                        ✏️ Editar
                    </button>
                    <div class="btn-group-actions">
                        <button class="btn btn-sm btn-secondary" onclick="duplicarProjeto('${projeto.id}')" title="Duplicar projeto">
                            📋
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="excluirProjeto('${projeto.id}')" title="Excluir projeto">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza mini visualização das etapas
     */
    function renderizarMiniEtapas(projeto) {
        if (!projeto.etapas || projeto.etapas.length === 0) return '';

        return `
            <div class="projeto-etapas">
                ${projeto.etapas.map(etapa => `
                    <div class="etapa-mini ${etapa.status}" 
                         title="${etapa.nome} - ${etapa.percentual}%">
                        ${etapa.status === 'concluida' ? '✓' :
                etapa.status === 'andamento' ? '◐' : '○'}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Renderiza tabela de projetos (visualização em lista)
     */
    function renderizarTabelaProjetos(projetos) {
        return `
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Progresso</th>
                        <th>Valor</th>
                        <th>Início</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${projetos.map(projeto => {
            const statusInfo = STATUS_PROJETOS[projeto.status];
            return `
                            <tr>
                                <td><small>${projeto.id}</small></td>
                                <td><strong>${escapeHtml(projeto.nomeCliente)}</strong></td>
                                <td>${capitalizar(projeto.tipo)}</td>
                                <td>
                                    <span class="badge badge-${statusInfo.cor}">
                                        ${statusInfo.icon} ${statusInfo.nome}
                                    </span>
                                </td>
                                <td>
                                    <div class="progress" style="height: 15px; min-width: 100px;">
                                        <div class="progress-bar bg-${statusInfo.cor}" 
                                             style="width: ${projeto.progresso}%">
                                            ${projeto.progresso}%
                                        </div>
                                    </div>
                                </td>
                                <td>${formatarMoeda(projeto.valorContrato)}</td>
                                <td>${formatarData(projeto.dataInicio)}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-info" 
                                                onclick="visualizarProjeto('${projeto.id}')" 
                                                title="Ver detalhes">
                                            👁️
                                        </button>
                                        <button class="btn btn-sm btn-warning" 
                                                onclick="editarProjeto('${projeto.id}')" 
                                                title="Editar">
                                            ✏️
                                        </button>
                                        <button class="btn btn-sm btn-danger" 
                                                onclick="excluirProjeto('${projeto.id}')" 
                                                title="Excluir">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Renderiza estado vazio
     */
    function renderizarEstadoVazio() {
        const temFiltros = filtroStatusProjeto !== 'todos' ||
            filtroTipoProjeto !== 'todos' ||
            document.getElementById('buscarProjeto')?.value;

        return `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>${temFiltros ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}</h3>
                <p>${temFiltros ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro projeto.'}</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="novoProjeto()">
                        ➕ Novo Projeto
                    </button>
                    ${temFiltros ? `
                        <button class="btn btn-secondary" onclick="limparFiltros()">
                            🔄 Limpar Filtros
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ==================== DETALHES DO PROJETO ====================

    /**
     * Visualiza detalhes completos do projeto
     */
    window.visualizarProjeto = function (projetoId) {
        const projeto = projetosData.find(p => p.id === projetoId);
        if (!projeto) {
            mostrarAlerta('Projeto não encontrado', 'danger');
            return;
        }

        projetoAtual = projeto;
        preencherModalDetalhes(projeto);
        abrirModal('modalDetalhesProjeto');
    };

    /**
     * Preenche modal com detalhes do projeto
     */
    function preencherModalDetalhes(projeto) {
        const statusInfo = STATUS_PROJETOS[projeto.status];

        // Título do modal
        const modalLabel = document.getElementById('modalDetalhesProjetoLabel');
        if (modalLabel) {
            modalLabel.innerHTML = `
                ${escapeHtml(projeto.nomeCliente)} 
                <span class="badge badge-${statusInfo.cor}">${statusInfo.icon} ${statusInfo.nome}</span>
            `;
        }

        // Preencher informações básicas
        const elementos = {
            'detalhesProjetoId': projeto.id,
            'detalhesProjetoTipo': capitalizar(projeto.tipo),
            'detalhesProjetoStatus': `${statusInfo.icon} ${statusInfo.nome}`,
            'detalhesProjetoCliente': projeto.nomeCliente,
            'detalhesProjetoTelefone': projeto.telefoneCliente || 'Não informado',
            'detalhesProjetoEmail': projeto.emailCliente || 'Não informado',
            'detalhesProjetoEndereco': projeto.endereco || 'Não informado',
            'detalhesProjetoValor': formatarMoeda(projeto.valorContrato),
            'detalhesProjetoInicio': formatarData(projeto.dataInicio),
            'detalhesProjetoPrevisao': projeto.dataPrevisao ? formatarData(projeto.dataPrevisao) : 'Não definida',
            'detalhesProjetoProgresso': `${projeto.progresso}%`,
            'detalhesProjetoObservacoes': projeto.observacoes || 'Nenhuma observação'
        };

        // Preencher elementos
        Object.entries(elementos).forEach(([id, valor]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = valor;
        });

        // Atualizar barra de progresso
        const progressBar = document.querySelector('#modalDetalhesProjeto .progress-bar');
        if (progressBar) {
            progressBar.style.width = `${projeto.progresso}%`;
            progressBar.className = `progress-bar bg-${statusInfo.cor}`;
            progressBar.setAttribute('aria-valuenow', projeto.progresso);
        }

        // Renderizar abas
        renderizarCronogramaProjeto(projeto);
        renderizarEtapasProjeto(projeto);
        renderizarAnexosProjeto(projeto);
        renderizarHistoricoProjeto(projeto);

        // Ativar primeira aba
        mostrarAba('informacoes');
    }

    /**
     * Edita projeto atual (do modal de detalhes)
     */
    window.editarProjetoAtual = function () {
        if (!projetoAtual) return;

        fecharModal('modalDetalhesProjeto');
        setTimeout(() => {
            editarProjeto(projetoAtual.id);
        }, 300);
    };

    // ==================== GESTÃO DE ETAPAS ====================

    /**
     * Renderiza etapas do projeto
     */
    function renderizarEtapasProjeto(projeto) {
        const container = document.getElementById('etapasProjeto');
        if (!container) return;

        if (!projeto.etapas || projeto.etapas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📊 Nenhuma etapa cadastrada.</p>
                    <button class="btn btn-sm btn-primary" onclick="criarEtapasPadraoProjeto()">
                        ➕ Criar Etapas Padrão
                    </button>
                </div>
            `;
            return;
        }

        const etapasHtml = projeto.etapas.map((etapa, index) => {
            const statusClass = etapa.status === 'concluida' ? 'etapa-concluida' :
                etapa.status === 'andamento' ? 'etapa-andamento' :
                    'etapa-pendente';

            return `
                <div class="etapa-item-detalhe ${statusClass}">
                    <div class="etapa-content">
                        <div class="etapa-header">
                            <span class="etapa-nome">${etapa.nome}</span>
                            <span class="etapa-percentual">${etapa.percentual}%</span>
                        </div>
                        <div class="etapa-actions">
                            <select class="form-control form-control-sm" 
                                    onchange="alterarStatusEtapa(${index}, this.value)">
                                <option value="pendente" ${etapa.status === 'pendente' ? 'selected' : ''}>
                                    ○ Pendente
                                </option>
                                <option value="andamento" ${etapa.status === 'andamento' ? 'selected' : ''}>
                                    ◐ Em Andamento
                                </option>
                                <option value="concluida" ${etapa.status === 'concluida' ? 'selected' : ''}>
                                    ✓ Concluída
                                </option>
                            </select>
                        </div>
                    </div>
                    ${etapa.dataConclusao ? `
                        <small class="text-success">
                            Concluída em ${formatarData(etapa.dataConclusao)}
                        </small>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="etapas-header">
                <h5>Etapas de Produção</h5>
                <button class="btn btn-sm btn-secondary" onclick="recalcularProgressoProjeto()">
                    🔄 Recalcular Progresso
                </button>
            </div>
            <div class="etapas-grid-detalhes">
                ${etapasHtml}
            </div>
        `;
    }

    /**
     * Altera status de uma etapa
     */
    window.alterarStatusEtapa = function (index, novoStatus) {
        if (!projetoAtual || !projetoAtual.etapas[index]) return;

        const etapa = projetoAtual.etapas[index];
        const statusAnterior = etapa.status;

        // Atualizar status
        etapa.status = novoStatus;

        // Registrar data de conclusão se aplicável
        if (novoStatus === 'concluida' && !etapa.dataConclusao) {
            etapa.dataConclusao = new Date().toISOString();
        } else if (novoStatus !== 'concluida') {
            etapa.dataConclusao = null;
        }

        // Adicionar ao histórico
        adicionarAoHistorico(projetoAtual, 'Etapa atualizada',
            `Etapa "${etapa.nome}" alterada de "${statusAnterior}" para "${novoStatus}"`);

        // Recalcular progresso automaticamente
        recalcularProgressoProjeto();

        // Salvar
        salvarProjetos();

        // Atualizar visualização
        renderizarEtapasProjeto(projetoAtual);
        renderizarListaProjetos();
    };

    /**
     * Cria etapas padrão para projeto existente
     */
    window.criarEtapasPadraoProjeto = function () {
        if (!projetoAtual) return;

        if (!confirm('Isso criará as etapas padrão do sistema. Continuar?')) return;

        projetoAtual.etapas = criarEtapasPadrao();

        adicionarAoHistorico(projetoAtual, 'Etapas criadas',
            'Etapas padrão do sistema foram criadas');

        salvarProjetos();
        renderizarEtapasProjeto(projetoAtual);

        mostrarAlerta('✅ Etapas padrão criadas com sucesso!', 'success');
    };

    /**
     * Recalcula progresso do projeto baseado nas etapas
     */
    window.recalcularProgressoProjeto = function () {
        if (!projetoAtual || !projetoAtual.etapas || projetoAtual.etapas.length === 0) return;

        let progressoTotal = 0;

        projetoAtual.etapas.forEach(etapa => {
            if (etapa.status === 'concluida') {
                progressoTotal += etapa.percentual;
            } else if (etapa.status === 'andamento') {
                progressoTotal += etapa.percentual * 0.5; // 50% do valor se em andamento
            }
        });

        const novoProgresso = Math.round(progressoTotal);

        if (novoProgresso !== projetoAtual.progresso) {
            projetoAtual.progresso = novoProgresso;
            projetoAtual.dataUltimaAtualizacao = new Date().toISOString();

            adicionarAoHistorico(projetoAtual, 'Progresso recalculado',
                `Progresso atualizado para ${novoProgresso}% baseado nas etapas`);

            // Atualizar elementos visuais
            const progressBar = document.querySelector('#modalDetalhesProjeto .progress-bar');
            if (progressBar) {
                progressBar.style.width = `${novoProgresso}%`;
                document.getElementById('detalhesProjetoProgresso').textContent = `${novoProgresso}%`;
            }

            salvarProjetos();
            renderizarListaProjetos();

            mostrarAlerta(`📊 Progresso atualizado para ${novoProgresso}%`, 'info');
        }
    };

    // ==================== CRONOGRAMA ====================

    /**
     * Renderiza cronograma do projeto
     */
    function renderizarCronogramaProjeto(projeto) {
        const container = document.getElementById('cronogramaProjeto');
        if (!container) return;

        if (!projeto.cronograma || projeto.cronograma.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📅 Nenhuma etapa no cronograma.</p>
                    <button class="btn btn-sm btn-primary" onclick="adicionarEtapaCronograma()">
                        ➕ Adicionar Etapa
                    </button>
                </div>
            `;
            return;
        }

        const cronogramaHtml = projeto.cronograma.map((etapa, index) => `
            <div class="cronograma-item ${etapa.concluida ? 'concluida' : ''}">
                <div class="cronograma-info">
                    <div class="cronograma-checkbox">
                        <input type="checkbox" 
                               id="etapaCronograma${index}"
                               ${etapa.concluida ? 'checked' : ''} 
                               onchange="toggleEtapaCronograma(${index})">
                    </div>
                    <div class="cronograma-dados">
                        <strong>${escapeHtml(etapa.titulo)}</strong>
                        <div class="cronograma-meta">
                            <span>📅 ${formatarData(etapa.dataPrevisao)}</span>
                            ${etapa.responsavel ? `<span>👤 ${escapeHtml(etapa.responsavel)}</span>` : ''}
                            ${etapa.concluida && etapa.dataConclusao ?
                `<span class="text-success">✅ Concluída em ${formatarData(etapa.dataConclusao)}</span>` :
                ''}
                        </div>
                        ${etapa.descricao ? `<p class="cronograma-descricao">${escapeHtml(etapa.descricao)}</p>` : ''}
                    </div>
                </div>
                <div class="cronograma-actions">
                    <button class="btn btn-sm btn-warning" onclick="editarEtapaCronograma(${index})">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removerEtapaCronograma(${index})">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="cronograma-header">
                <h5>Cronograma do Projeto</h5>
                <button class="btn btn-sm btn-primary" onclick="adicionarEtapaCronograma()">
                    ➕ Adicionar Etapa
                </button>
            </div>
            <div class="cronograma-lista">
                ${cronogramaHtml}
            </div>
        `;
    }

    /**
     * Adiciona etapa ao cronograma
     */
    window.adicionarEtapaCronograma = function () {
        if (!projetoAtual) return;

        const form = document.getElementById('formEtapaCronograma');
        if (form) form.reset();

        const modal = document.getElementById('modalEtapaCronograma');
        if (modal) {
            modal.dataset.acao = 'adicionar';
            document.getElementById('modalEtapaCronogramaLabel').textContent = 'Adicionar Etapa';
        }

        abrirModal('modalEtapaCronograma');
    };

    /**
     * Edita etapa do cronograma
     */
    window.editarEtapaCronograma = function (index) {
        if (!projetoAtual || !projetoAtual.cronograma[index]) return;

        const etapa = projetoAtual.cronograma[index];

        // Preencher formulário
        document.getElementById('etapaTitulo').value = etapa.titulo;
        document.getElementById('etapaDescricao').value = etapa.descricao || '';
        document.getElementById('etapaDataPrevisao').value = etapa.dataPrevisao;
        document.getElementById('etapaResponsavel').value = etapa.responsavel || '';

        const modal = document.getElementById('modalEtapaCronograma');
        if (modal) {
            modal.dataset.acao = 'editar';
            modal.dataset.index = index;
            document.getElementById('modalEtapaCronogramaLabel').textContent = 'Editar Etapa';
        }

        abrirModal('modalEtapaCronograma');
    };

    /**
     * Salva etapa do cronograma
     */
    window.salvarEtapaCronograma = function () {
        if (!projetoAtual) return;

        const form = document.getElementById('formEtapaCronograma');
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const modal = document.getElementById('modalEtapaCronograma');

        const etapa = {
            titulo: formData.get('etapaTitulo')?.trim(),
            descricao: formData.get('etapaDescricao') || '',
            dataPrevisao: formData.get('etapaDataPrevisao'),
            responsavel: formData.get('etapaResponsavel') || '',
            concluida: false,
            dataConclusao: null
        };

        if (!projetoAtual.cronograma) {
            projetoAtual.cronograma = [];
        }

        if (modal.dataset.acao === 'adicionar') {
            projetoAtual.cronograma.push(etapa);
            adicionarAoHistorico(projetoAtual, 'Etapa adicionada ao cronograma',
                `Etapa "${etapa.titulo}" foi adicionada`);
        } else if (modal.dataset.acao === 'editar') {
            const index = parseInt(modal.dataset.index);
            if (!isNaN(index) && projetoAtual.cronograma[index]) {
                // Preservar status de conclusão
                etapa.concluida = projetoAtual.cronograma[index].concluida;
                etapa.dataConclusao = projetoAtual.cronograma[index].dataConclusao;

                projetoAtual.cronograma[index] = etapa;
                adicionarAoHistorico(projetoAtual, 'Etapa do cronograma editada',
                    `Etapa "${etapa.titulo}" foi modificada`);
            }
        }

        projetoAtual.dataUltimaAtualizacao = new Date().toISOString();
        salvarProjetos();
        renderizarCronogramaProjeto(projetoAtual);

        fecharModal('modalEtapaCronograma');
        mostrarAlerta('✅ Etapa salva com sucesso!', 'success');
    };

    /**
     * Alterna status de conclusão da etapa do cronograma
     */
    window.toggleEtapaCronograma = function (index) {
        if (!projetoAtual || !projetoAtual.cronograma[index]) return;

        const etapa = projetoAtual.cronograma[index];
        etapa.concluida = !etapa.concluida;

        if (etapa.concluida) {
            etapa.dataConclusao = new Date().toISOString();
            adicionarAoHistorico(projetoAtual, 'Etapa concluída',
                `Etapa "${etapa.titulo}" foi marcada como concluída`);
        } else {
            etapa.dataConclusao = null;
            adicionarAoHistorico(projetoAtual, 'Etapa reaberta',
                `Etapa "${etapa.titulo}" foi reaberta`);
        }

        salvarProjetos();
        renderizarCronogramaProjeto(projetoAtual);
    };

    /**
     * Remove etapa do cronograma
     */
    window.removerEtapaCronograma = function (index) {
        if (!projetoAtual || !projetoAtual.cronograma[index]) return;

        const etapa = projetoAtual.cronograma[index];

        if (!confirm(`Remover a etapa "${etapa.titulo}"?`)) return;

        projetoAtual.cronograma.splice(index, 1);

        adicionarAoHistorico(projetoAtual, 'Etapa removida',
            `Etapa "${etapa.titulo}" foi removida do cronograma`);

        salvarProjetos();
        renderizarCronogramaProjeto(projetoAtual);

        mostrarAlerta('🗑️ Etapa removida', 'warning');
    };

    // ==================== ANEXOS ====================

    /**
     * Renderiza anexos do projeto
     */
    function renderizarAnexosProjeto(projeto) {
        const container = document.getElementById('anexosProjeto');
        if (!container) return;

        if (!projeto.anexos || projeto.anexos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📎 Nenhum anexo adicionado.</p>
                    <button class="btn btn-sm btn-primary" onclick="adicionarAnexo()">
                        ➕ Adicionar Anexo
                    </button>
                </div>
            `;
            return;
        }

        const anexosHtml = projeto.anexos.map((anexo, index) => `
            <div class="anexo-item">
                <div class="anexo-info">
                    <div class="anexo-icon">📄</div>
                    <div class="anexo-dados">
                        <strong>${escapeHtml(anexo.nome)}</strong>
                        <div class="anexo-meta">
                            <span>📅 ${formatarData(anexo.dataUpload)}</span>
                            <span>👤 ${escapeHtml(anexo.usuario)}</span>
                            <span>📏 ${formatarTamanhoArquivo(anexo.tamanho)}</span>
                        </div>
                        ${anexo.descricao ? `<p class="anexo-descricao">${escapeHtml(anexo.descricao)}</p>` : ''}
                    </div>
                </div>
                <div class="anexo-actions">
                    <button class="btn btn-sm btn-info" onclick="visualizarAnexo(${index})">
                        👁️ Ver
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removerAnexo(${index})">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="anexos-header">
                <h5>Anexos do Projeto</h5>
                <button class="btn btn-sm btn-primary" onclick="adicionarAnexo()">
                    ➕ Adicionar Anexo
                </button>
            </div>
            <div class="anexos-lista">
                ${anexosHtml}
            </div>
        `;
    }

    /**
     * Adiciona anexo ao projeto
     */
    window.adicionarAnexo = function () {
        if (!projetoAtual) return;

        const form = document.getElementById('formAnexo');
        if (form) form.reset();

        abrirModal('modalAnexo');
    };

    /**
     * Salva anexo
     */
    window.salvarAnexo = function () {
        if (!projetoAtual) return;

        const form = document.getElementById('formAnexo');
        const fileInput = document.getElementById('arquivoAnexo');

        if (!fileInput.files || fileInput.files.length === 0) {
            mostrarAlerta('Selecione um arquivo', 'warning');
            return;
        }

        const arquivo = fileInput.files[0];
        const formData = new FormData(form);

        const anexo = {
            nome: formData.get('nomeAnexo') || arquivo.name,
            descricao: formData.get('descricaoAnexo') || '',
            arquivo: arquivo.name,
            tamanho: arquivo.size,
            tipo: arquivo.type,
            dataUpload: new Date().toISOString(),
            usuario: 'Usuário Atual'
        };

        if (!projetoAtual.anexos) {
            projetoAtual.anexos = [];
        }

        projetoAtual.anexos.push(anexo);

        adicionarAoHistorico(projetoAtual, 'Anexo adicionado',
            `Arquivo "${anexo.nome}" foi anexado ao projeto`);

        salvarProjetos();
        renderizarAnexosProjeto(projetoAtual);

        fecharModal('modalAnexo');
        mostrarAlerta('✅ Anexo adicionado com sucesso!', 'success');
    };

    /**
     * Visualiza anexo
     */
    window.visualizarAnexo = function (index) {
        if (!projetoAtual || !projetoAtual.anexos[index]) return;

        const anexo = projetoAtual.anexos[index];
        mostrarAlerta(`📄 Visualizando: ${anexo.nome}`, 'info');

        // Aqui você pode implementar a lógica real de visualização
        // Por exemplo, abrir em nova aba, modal de preview, etc.
    };

    /**
     * Remove anexo
     */
    window.removerAnexo = function (index) {
        if (!projetoAtual || !projetoAtual.anexos[index]) return;

        const anexo = projetoAtual.anexos[index];

        if (!confirm(`Remover o anexo "${anexo.nome}"?`)) return;

        projetoAtual.anexos.splice(index, 1);

        adicionarAoHistorico(projetoAtual, 'Anexo removido',
            `Arquivo "${anexo.nome}" foi removido`);

        salvarProjetos();
        renderizarAnexosProjeto(projetoAtual);

        mostrarAlerta('🗑️ Anexo removido', 'warning');
    };

    // ==================== HISTÓRICO ====================

    /**
     * Renderiza histórico do projeto
     */
    function renderizarHistoricoProjeto(projeto) {
        const container = document.getElementById('historicoProjeto');
        if (!container) return;

        if (!projeto.historico || projeto.historico.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📋 Nenhum registro no histórico.</p>
                </div>
            `;
            return;
        }

        const historicoHtml = projeto.historico.map(item => `
            <div class="historico-item">
                <div class="historico-timestamp">
                    ${new Date(item.data).toLocaleString('pt-BR')}
                </div>
                <div class="historico-content">
                    <strong>${escapeHtml(item.acao)}</strong>
                    <span class="historico-usuario">por ${escapeHtml(item.usuario)}</span>
                    ${item.detalhes ? `<p class="historico-detalhes">${escapeHtml(item.detalhes)}</p>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="historico-header">
                <h5>Histórico de Alterações</h5>
            </div>
            <div class="historico-lista">
                ${historicoHtml}
            </div>
        `;
    }

    /**
     * Adiciona registro ao histórico
     */
    function adicionarAoHistorico(projeto, acao, detalhes = '') {
        if (!projeto.historico) {
            projeto.historico = [];
        }

        projeto.historico.unshift({
            data: new Date().toISOString(),
            acao: acao,
            usuario: 'Usuário Atual',
            detalhes: detalhes
        });

        // Limitar a 100 registros
        if (projeto.historico.length > 100) {
            projeto.historico = projeto.historico.slice(0, 100);
        }

        projeto.dataUltimaAtualizacao = new Date().toISOString();
    }

    // ==================== INTEGRAÇÃO COM ORÇAMENTOS ====================

    /**
     * Carrega orçamentos aprovados para vinculação
     */
    function carregarOrcamentosAprovados() {
        const select = document.getElementById('orcamentoVinculado');
        if (!select) return;

        let orcamentos = [];

        if (window.utils) {
            orcamentos = window.utils.obterDados('orcamentos', []);
        } else {
            const dados = localStorage.getItem('possatto_orcamentos');
            if (dados) {
                try {
                    orcamentos = JSON.parse(dados);
                } catch (e) {
                    orcamentos = [];
                }
            }
        }

        // Filtrar apenas orçamentos aprovados
        const aprovados = orcamentos.filter(orc => orc.status === 'aprovado');

        select.innerHTML = `
            <option value="">Sem vínculo</option>
            ${aprovados.map(orc => `
                <option value="${orc.id}">
                    ${orc.numero} - ${orc.cliente} - ${formatarMoeda(orc.valorTotal || 0)}
                </option>
            `).join('')}
        `;
    }

    /**
     * Verifica orçamentos aprovados para criar projetos automaticamente
     */
    function verificarOrcamentosAprovados() {
        // Esta função pode ser expandida para criar projetos automaticamente
        // quando um orçamento é aprovado
        console.log('Verificando orçamentos aprovados...');
    }

    /**
     * Importa dados de orçamento aprovado
     */
    window.importarOrcamento = function () {
        mostrarAlerta('🚧 Funcionalidade em desenvolvimento', 'info');
        // TODO: Implementar importação automática de orçamento
    };

    /**
     * Atualiza status do orçamento vinculado
     */
    function atualizarStatusOrcamento(orcamentoId, novoStatus) {
        if (!orcamentoId) return;

        // Disparar evento para a aba de orçamentos atualizar
        if (window.utils?.dispararEvento) {
            window.utils.dispararEvento('orcamento-status-update', {
                orcamentoId: orcamentoId,
                status: novoStatus
            });
        }
    }

    // ==================== ESTATÍSTICAS E CONTADORES ====================

    /**
     * Atualiza estatísticas gerais
     */
    function atualizarEstatisticas() {
        // Total de projetos
        const total = projetosData.length;
        const totalElement = document.getElementById('totalProjetos');
        if (totalElement) totalElement.textContent = total;

        // Em andamento
        const emAndamento = projetosData.filter(p =>
            ['em-producao', 'aguardando-material', 'instalacao'].includes(p.status)
        ).length;
        const andamentoElement = document.getElementById('projetosAndamento');
        if (andamentoElement) andamentoElement.textContent = emAndamento;

        // Concluídos
        const concluidos = projetosData.filter(p => p.status === 'finalizado').length;
        const concluidosElement = document.getElementById('projetosConcluidos');
        if (concluidosElement) concluidosElement.textContent = concluidos;

        // Valor total
        const valorTotal = projetosData.reduce((sum, p) => sum + (p.valorContrato || 0), 0);
        const valorElement = document.getElementById('valorTotalProjetos');
        if (valorElement) valorElement.textContent = formatarMoeda(valorTotal);
    }

    /**
     * Atualiza contador de projetos filtrados
     */
    function atualizarContador(filtrados, total) {
        const contador = document.getElementById('contadorProjetos');
        if (contador) {
            contador.textContent = filtrados === total ?
                `${total} projeto(s)` :
                `${filtrados} de ${total} projeto(s)`;
        }
    }

    /**
     * Atualiza contadores gerais
     */
    function atualizarContadores() {
        atualizarEstatisticas();
    }

    /**
     * Calcula progresso baseado nas etapas
     */
    function calcularProgressoEtapas(projeto) {
        if (!projeto.etapas || projeto.etapas.length === 0) {
            return { concluidas: 0, total: 0 };
        }

        const concluidas = projeto.etapas.filter(e => e.status === 'concluida').length;
        return { concluidas, total: projeto.etapas.length };
    }

    // ==================== RELATÓRIOS E EXPORTAÇÃO ====================

    /**
     * Gera relatório do projeto em PDF
     */
    window.gerarRelatorioProjeto = function (projetoId) {
        const projeto = projetosData.find(p => p.id === projetoId);
        if (!projeto) {
            mostrarAlerta('Projeto não encontrado', 'danger');
            return;
        }

        // Verificar se o módulo de PDF está disponível
        if (!window.gerarPDF || !window.gerarPDF.gerarPDFProjeto) {
            mostrarAlerta('Módulo de geração de PDF não disponível', 'warning');
            return;
        }

        try {
            window.gerarPDF.gerarPDFProjeto(projeto);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarAlerta('Erro ao gerar relatório PDF', 'danger');
        }
    };

    /**
     * Gera relatório geral de projetos
     */
    window.gerarRelatorioGeral = function () {
        mostrarAlerta('🚧 Funcionalidade em desenvolvimento', 'info');
        // TODO: Implementar relatório geral
    };

    // ==================== UTILITÁRIOS ====================

    /**
     * Alterna visualização entre cards e lista
     */
    window.alterarVisualizacao = function (modo) {
        modoVisualizacao = modo;

        // Atualizar botões
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.remove('active');
        });

        const btnAtivo = document.querySelector(`.btn-view[onclick*="${modo}"]`);
        if (btnAtivo) btnAtivo.classList.add('active');

        // Re-renderizar lista
        renderizarListaProjetos();
    };

    /**
     * Mostra/oculta aba no modal de detalhes
     */
    window.mostrarAba = function (aba) {
        // Ocultar todas as abas
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Desativar todos os botões
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar aba selecionada
        const abaElement = document.getElementById(`aba${capitalizar(aba)}`);
        if (abaElement) abaElement.classList.add('active');

        // Ativar botão correspondente
        const btnElement = document.querySelector(`.tab-btn[onclick*="${aba}"]`);
        if (btnElement) btnElement.classList.add('active');
    };

    /**
     * Limpa filtros de busca
     */
    window.limparFiltros = function () {
        filtroStatusProjeto = 'todos';
        filtroTipoProjeto = 'todos';

        const selectStatus = document.getElementById('filtroStatusProjeto');
        if (selectStatus) selectStatus.value = 'todos';

        const selectTipo = document.getElementById('filtroTipoProjeto');
        if (selectTipo) selectTipo.value = 'todos';

        const inputBusca = document.getElementById('buscarProjeto');
        if (inputBusca) inputBusca.value = '';

        renderizarListaProjetos();
    };

    /**
     * Formata documento (CPF/CNPJ)
     */
    window.formatarDocumento = function (input) {
        if (!input || !input.value) return;

        const valor = input.value.replace(/\D/g, '');

        if (valor.length === 11) {
            input.value = window.utils?.formatarCPF(valor) || valor;
        } else if (valor.length === 14) {
            input.value = window.utils?.formatarCNPJ(valor) || valor;
        }
    };

    /**
     * Formata telefone
     */
    window.formatarTelefone = function (input) {
        if (!input || !input.value) return;

        input.value = window.utils?.formatarTelefone(input.value) || input.value;
    };

    /**
     * Capitaliza primeira letra
     */
    function capitalizar(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Formata data
     */
    function formatarData(data) {
        if (!data) return '';

        if (window.utils?.formatarData) {
            return window.utils.formatarData(data);
        }

        try {
            const date = new Date(data);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            return data;
        }
    }

    /**
     * Formata moeda
     */
    function formatarMoeda(valor) {
        if (window.utils?.formatarMoeda) {
            return window.utils.formatarMoeda(valor);
        }

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    }

    /**
     * Formata tamanho de arquivo
     */
    function formatarTamanhoArquivo(bytes) {
        if (!bytes) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    function escapeHtml(text) {
        if (!text) return '';

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Debounce para otimizar eventos
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Mostra alerta
     */
    function mostrarAlerta(mensagem, tipo = 'info') {
        if (window.utils?.mostrarAlerta) {
            window.utils.mostrarAlerta(mensagem, tipo);
        } else {
            alert(mensagem);
        }
    }

    /**
     * Abre modal
     */
    function abrirModal(modalId) {
        if (window.abrirModal) {
            window.abrirModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex';
            }
        }
    }

    /**
     * Fecha modal
     */
    function fecharModal(modalId) {
        if (window.fecharModal) {
            window.fecharModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        }
    }

    /**
     * Dispara evento de atualização
     */
    function dispararEventoAtualizacao() {
        if (window.utils?.dispararEvento) {
            window.utils.dispararEvento('projetos-atualizados', {
                total: projetosData.length,
                timestamp: new Date().toISOString()
            });
        }
    }

    // ==================== EXPORTAÇÃO DO MÓDULO ====================

    // Registrar função de inicialização globalmente
    window.inicializarAbaProjetos = inicializarAbaProjetos;

    // Log de carregamento
    console.log('📁 Módulo abaProjetos.js carregado com sucesso');

})();