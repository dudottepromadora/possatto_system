/**
 * ========================================
 * SISTEMA POSSATTO PRO v7.0 - utils.js
 * ARQUIVO UTILITÁRIO CENTRAL FINALIZADO
 * ========================================
 * 
 * Este módulo contém todas as funções utilitárias essenciais para o sistema,
 * incluindo persistência de dados, formatação, validação, alertas e backups.
 * 
 * FUNÇÕES IMPLEMENTADAS:
 * - Persistência: salvarDados, obterDados, limparDados, removerDados
 * - Formatação: formatarMoeda, formatarData, formatarCNPJ, formatarCPF, formatarTelefone
 * - Validação: validarCNPJ, validarCPF, validarEmail
 * - Alertas: mostrarAlerta, mostrarAlertaSeguro
 * - Backup: exportarBackup, importarBackup
 * - Utilitários: gerarIdUnico, aplicarMascara, dispararEvento
 * - Modal: criarModal, fecharModal
 * - Diagnóstico: checkUtilsHealth, verificarCarregamentoCompleto
 * 
 * COMPATIBILIDADE TOTAL com todos os módulos existentes.
 * 
 * @version 7.0
 * @author Sistema Possatto PRO
 * @date 2025-01-23
 */

(function () {
    'use strict';

    // ==================== CONFIGURAÇÕES GLOBAIS ====================

    const CONFIG = {
        VERSION: '7.0',
        PREFIX: 'possatto_',
        ALERT_DURATION: 4000,
        BACKUP_VERSION: '7.0',
        DEBUG: false,

        // Configurações de formatação
        LOCALE: 'pt-BR',
        CURRENCY: 'BRL',

        // Configurações de validação
        CNPJ_REGEX: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
        CPF_REGEX: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        TELEFONE_REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    };

    // Controle de estado do sistema
    let systemState = {
        initialized: false,
        modules: {},
        eventListeners: new Map(),
        alertQueue: [],
        debugMode: CONFIG.DEBUG
    };

    window.fecharModalSeguro = function (modalId) {
        try {
            // Se existir função utilitária global, use-a!
            if (window.utils && typeof window.utils.fecharModal === 'function') {
                window.utils.fecharModal(modalId);
                return;
            }
            if (modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('active', 'show');
                    document.body.style.overflow = 'auto';
                    return;
                }
            }
            // Fallback: fecha todos modais
            document.querySelectorAll('.modal.active, .modal.show').forEach(m => {
                m.style.display = 'none';
                m.classList.remove('active', 'show');
            });
            document.body.style.overflow = 'auto';
        } catch (e) {
            console.error('Erro ao fechar modal:', e);
        }
    };
    window.fecharModal = window.fecharModalSeguro;

    document.addEventListener('keydown', function (event) {
        if (event.key === "Escape") {
            window.fecharModalSeguro(); // Fecha qualquer modal aberto
        }
    });

    // ==================== INICIALIZAÇÃO DO MÓDULO ====================

    /**
     * Inicializa o módulo utils.js
     */
    function inicializarUtils() {
        try {
            console.log(`🚀 Inicializando utils.js v${CONFIG.VERSION}...`);

            // Verificar se já foi inicializado
            if (systemState.initialized) {
                console.log('⚠️ Utils.js já foi inicializado');
                return true;
            }

            // Configurar manipulador global de erros
            configurarGlobalErrorHandler();

            // Configurar eventos customizados
            configurarEventosCustomizados();

            // Marcar como inicializado
            systemState.initialized = true;

            console.log('✅ Utils.js inicializado com sucesso!');
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar utils.js:', error);
            return false;
        }
    }

    // ==================== PERSISTÊNCIA DE DADOS ====================

    /**
     * Salva dados no localStorage com tratamento de erro robusto
     * @param {string} chave - Chave para armazenar os dados
     * @param {*} dados - Dados a serem salvos (serão convertidos para JSON)
     * @returns {boolean} - true se salvou com sucesso, false caso contrário
     */
    function salvarDados(chave, dados) {
        try {
            if (!chave || chave.trim() === '') {
                console.error('❌ Chave inválida para salvar dados');
                return false;
            }

            const chaveCompleta = CONFIG.PREFIX + chave;
            const dadosJson = JSON.stringify(dados);

            // Verificar limite de armazenamento
            if (verificarLimiteArmazenamento(dadosJson)) {
                localStorage.setItem(chaveCompleta, dadosJson);

                if (CONFIG.DEBUG) {
                    console.log(`💾 Dados salvos: ${chave}`, dados);
                }

                // Disparar evento de salvamento
                dispararEvento('dados:salvos', { chave, dados });
                return true;
            } else {
                console.error('❌ Limite de armazenamento excedido');
                mostrarAlerta('Limite de armazenamento excedido', 'danger');
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            mostrarAlerta('Erro ao salvar dados', 'danger');
            return false;
        }
    }

    /**
     * Obtém dados do localStorage com valor padrão
     * @param {string} chave - Chave dos dados
     * @param {*} padrao - Valor padrão se não encontrar
     * @returns {*} - Dados encontrados ou valor padrão
     */
    function obterDados(chave, padrao = null) {
        try {
            if (!chave || chave.trim() === '') {
                console.error('❌ Chave inválida para obter dados');
                return padrao;
            }

            const chaveCompleta = CONFIG.PREFIX + chave;
            const dadosJson = localStorage.getItem(chaveCompleta);

            if (dadosJson === null) {
                if (CONFIG.DEBUG) {
                    console.log(`📋 Dados não encontrados: ${chave}, retornando padrão:`, padrao);
                }
                return padrao;
            }

            const dados = JSON.parse(dadosJson);

            if (CONFIG.DEBUG) {
                console.log(`📋 Dados carregados: ${chave}`, dados);
            }

            return dados;

        } catch (error) {
            console.error('❌ Erro ao obter dados:', error);
            return padrao;
        }
    }

    /**
     * Remove dados específicos do localStorage
     * @param {string} chave - Chave dos dados a serem removidos
     * @returns {boolean} - true se removeu com sucesso
     */
    function removerDados(chave) {
        try {
            if (!chave || chave.trim() === '') {
                console.error('❌ Chave inválida para remover dados');
                return false;
            }

            const chaveCompleta = CONFIG.PREFIX + chave;
            localStorage.removeItem(chaveCompleta);

            if (CONFIG.DEBUG) {
                console.log(`🗑️ Dados removidos: ${chave}`);
            }

            // Disparar evento de remoção
            dispararEvento('dados:removidos', { chave });
            return true;

        } catch (error) {
            console.error('❌ Erro ao remover dados:', error);
            return false;
        }
    }

    /**
     * Limpa todos os dados do sistema
     * @returns {boolean} - true se limpou com sucesso
     */
    function limparDados() {
        try {
            const chaves = Object.keys(localStorage).filter(chave =>
                chave.startsWith(CONFIG.PREFIX)
            );

            chaves.forEach(chave => localStorage.removeItem(chave));

            console.log(`🧹 Limpeza completa: ${chaves.length} itens removidos`);
            mostrarAlerta('Todos os dados foram limpos', 'warning');

            // Disparar evento de limpeza
            dispararEvento('dados:limpeza-completa', { chavesRemovidas: chaves.length });
            return true;

        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            mostrarAlerta('Erro ao limpar dados', 'danger');
            return false;
        }
    }

    /**
     * Verifica se há espaço suficiente no localStorage
     * @param {string} dados - String JSON a ser armazenada
     * @returns {boolean} - true se há espaço suficiente
     */
    function verificarLimiteArmazenamento(dados) {
        try {
            const tamanhoAtual = JSON.stringify(localStorage).length;
            const tamanhoNovo = dados.length;
            const limite = 10 * 1024 * 1024; // 10MB (limite aproximado)

            if (tamanhoAtual + tamanhoNovo > limite) {
                console.warn('⚠️ Aproximando do limite de armazenamento');
                return false;
            }

            return true;

        } catch (error) {
            console.error('❌ Erro ao verificar limite:', error);
            return true; // Permitir tentativa mesmo com erro
        }
    }

    // ==================== FORMATAÇÃO DE DADOS ====================

    /**
     * Formata valor monetário para exibição
     * @param {number|string} valor - Valor a ser formatado
     * @returns {string} - Valor formatado (ex: "R$ 1.234,56")
     */
    function formatarMoeda(valor) {
        try {
            const numero = parseFloat(valor) || 0;
            return new Intl.NumberFormat(CONFIG.LOCALE, {
                style: 'currency',
                currency: CONFIG.CURRENCY,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numero);
        } catch (error) {
            console.error('❌ Erro ao formatar moeda:', error);
            return 'R$ 0,00';
        }
    }

    /**
     * Formata data para exibição brasileira
     * @param {string|Date} data - Data a ser formatada
     * @returns {string} - Data formatada (ex: "23/01/2025")
     */
    function formatarData(data) {
        try {
            if (!data) return '';

            const dataObj = typeof data === 'string' ? new Date(data) : data;

            if (isNaN(dataObj.getTime())) {
                return '';
            }

            return dataObj.toLocaleDateString(CONFIG.LOCALE);

        } catch (error) {
            console.error('❌ Erro ao formatar data:', error);
            return '';
        }
    }

    /**
     * Formata CNPJ com máscara
     * @param {string} cnpj - CNPJ sem formatação
     * @returns {string} - CNPJ formatado (ex: "12.345.678/0001-90")
     */
    function formatarCNPJ(cnpj) {
        try {
            if (!cnpj) return '';

            // Remove caracteres não numéricos
            const numeros = cnpj.replace(/\D/g, '');

            // Limita a 14 dígitos
            const limitado = numeros.substring(0, 14);

            // Aplica máscara conforme o comprimento
            if (limitado.length <= 2) return limitado;
            if (limitado.length <= 5) return limitado.replace(/(\d{2})(\d{0,3})/, '$1.$2');
            if (limitado.length <= 8) return limitado.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
            if (limitado.length <= 12) return limitado.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
            return limitado.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');

        } catch (error) {
            console.error('❌ Erro ao formatar CNPJ:', error);
            return cnpj;
        }
    }

    /**
     * Formata CPF com máscara
     * @param {string} cpf - CPF sem formatação
     * @returns {string} - CPF formatado (ex: "123.456.789-01")
     */
    function formatarCPF(cpf) {
        try {
            if (!cpf) return '';

            // Remove caracteres não numéricos
            const numeros = cpf.replace(/\D/g, '');

            // Limita a 11 dígitos
            const limitado = numeros.substring(0, 11);

            // Aplica máscara conforme o comprimento
            if (limitado.length <= 3) return limitado;
            if (limitado.length <= 6) return limitado.replace(/(\d{3})(\d{0,3})/, '$1.$2');
            if (limitado.length <= 9) return limitado.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
            return limitado.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');

        } catch (error) {
            console.error('❌ Erro ao formatar CPF:', error);
            return cpf;
        }
    }

    /**
     * Formata telefone com máscara
     * @param {string} telefone - Telefone sem formatação
     * @returns {string} - Telefone formatado (ex: "(47) 99999-8888")
     */
    function formatarTelefone(telefone) {
        try {
            if (!telefone) return '';

            // Remove caracteres não numéricos
            const numeros = telefone.replace(/\D/g, '');

            // Limita a 11 dígitos
            const limitado = numeros.substring(0, 11);

            // Aplica máscara conforme o comprimento
            if (limitado.length <= 2) return limitado;
            if (limitado.length <= 6) return limitado.replace(/(\d{2})(\d{0,4})/, '($1) $2');
            if (limitado.length <= 10) return limitado.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            return limitado.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');

        } catch (error) {
            console.error('❌ Erro ao formatar telefone:', error);
            return telefone;
        }
    }

    /**
     * Aplica máscara genérica a um campo
     * @param {string} valor - Valor a ser mascarado
     * @param {string} mascara - Máscara a ser aplicada (ex: "###.###.###-##")
     * @returns {string} - Valor mascarado
     */
    function aplicarMascara(valor, mascara) {
        try {
            if (!valor || !mascara) return valor || '';

            let valorLimpo = valor.toString().replace(/\D/g, '');
            let resultado = '';
            let indexValor = 0;

            for (let i = 0; i < mascara.length && indexValor < valorLimpo.length; i++) {
                if (mascara[i] === '#') {
                    resultado += valorLimpo[indexValor++];
                } else {
                    resultado += mascara[i];
                }
            }

            return resultado;

        } catch (error) {
            console.error('❌ Erro ao aplicar máscara:', error);
            return valor;
        }
    }

    // ==================== VALIDAÇÃO ====================

    /**
     * Valida CNPJ
     * @param {string} cnpj - CNPJ a ser validado
     * @returns {boolean} - true se válido
     */
    function validarCNPJ(cnpj) {
        try {
            if (!cnpj) return false;

            // Remove formatação
            const numeros = cnpj.replace(/\D/g, '');

            // Verifica se tem 14 dígitos
            if (numeros.length !== 14) return false;

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1+$/.test(numeros)) return false;

            // Validação dos dígitos verificadores
            let soma = 0;
            let peso = 2;

            // Primeiro dígito verificador
            for (let i = 11; i >= 0; i--) {
                soma += parseInt(numeros[i]) * peso;
                peso = peso === 9 ? 2 : peso + 1;
            }

            let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

            if (parseInt(numeros[12]) !== digito1) return false;

            // Segundo dígito verificador
            soma = 0;
            peso = 2;

            for (let i = 12; i >= 0; i--) {
                soma += parseInt(numeros[i]) * peso;
                peso = peso === 9 ? 2 : peso + 1;
            }

            let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

            return parseInt(numeros[13]) === digito2;

        } catch (error) {
            console.error('❌ Erro ao validar CNPJ:', error);
            return false;
        }
    }

    /**
     * Valida CPF
     * @param {string} cpf - CPF a ser validado
     * @returns {boolean} - true se válido
     */
    function validarCPF(cpf) {
        try {
            if (!cpf) return false;

            // Remove formatação
            const numeros = cpf.replace(/\D/g, '');

            // Verifica se tem 11 dígitos
            if (numeros.length !== 11) return false;

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1+$/.test(numeros)) return false;

            // Validação dos dígitos verificadores
            let soma = 0;

            // Primeiro dígito verificador
            for (let i = 0; i < 9; i++) {
                soma += parseInt(numeros[i]) * (10 - i);
            }

            let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

            if (parseInt(numeros[9]) !== digito1) return false;

            // Segundo dígito verificador
            soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += parseInt(numeros[i]) * (11 - i);
            }

            let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

            return parseInt(numeros[10]) === digito2;

        } catch (error) {
            console.error('❌ Erro ao validar CPF:', error);
            return false;
        }
    }

    /**
     * Valida e-mail
     * @param {string} email - E-mail a ser validado
     * @returns {boolean} - true se válido
     */
    function validarEmail(email) {
        try {
            if (!email) return false;
            return CONFIG.EMAIL_REGEX.test(email.trim());
        } catch (error) {
            console.error('❌ Erro ao validar email:', error);
            return false;
        }
    }

    // ==================== SISTEMA DE ALERTAS ====================

    /**
     * Mostra alerta visual para o usuário
     * @param {string} mensagem - Mensagem do alerta
     * @param {string} tipo - Tipo do alerta (success, warning, danger, info)
     * @param {number} duracao - Duração em milissegundos (opcional)
     */
    function mostrarAlerta(mensagem, tipo = 'info', duracao = CONFIG.ALERT_DURATION) {
        try {
            // Adicionar à fila de alertas
            systemState.alertQueue.push({ mensagem, tipo, duracao, timestamp: Date.now() });

            // Processar fila
            processarFilaAlertas();

        } catch (error) {
            console.error('❌ Erro ao mostrar alerta:', error);
            // Fallback para alert nativo
            alert(mensagem);
        }
    }

    /**
     * Versão segura do mostrarAlerta com fallbacks
     * @param {string} mensagem - Mensagem do alerta
     * @param {string} tipo - Tipo do alerta
     */
    function mostrarAlertaSeguro(mensagem, tipo = 'info') {
        try {
            mostrarAlerta(mensagem, tipo);
        } catch (error) {
            console.error('❌ Erro ao mostrar alerta seguro:', error);
            alert(mensagem);
        }
    }

    /**
     * Processa a fila de alertas
     */
    function processarFilaAlertas() {
        try {
            if (systemState.alertQueue.length === 0) return;

            const alerta = systemState.alertQueue.shift();
            exibirAlertaVisual(alerta);

        } catch (error) {
            console.error('❌ Erro ao processar fila de alertas:', error);
        }
    }

    /**
     * Exibe alerta visual na tela
     * @param {Object} alerta - Objeto do alerta
     */
    function exibirAlertaVisual(alerta) {
        try {
            let alertContainer = document.getElementById('alertFlutuante');

            if (!alertContainer) {
                // Criar container se não existir
                alertContainer = document.createElement('div');
                alertContainer.id = 'alertFlutuante';
                alertContainer.className = 'alert-flutuante';
                alertContainer.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 9999;
                    transition: all 0.3s ease;
                    max-width: 350px;
                    font-weight: 500;
                    display: none;
                `;
                document.body.appendChild(alertContainer);
            }

            // Definir cor baseada no tipo
            const cores = {
                success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
                warning: { bg: '#fff3cd', border: '#ffeeba', text: '#856404' },
                danger: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
                info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
            };

            const cor = cores[alerta.tipo] || cores.info;

            // Aplicar estilos e conteúdo
            alertContainer.style.backgroundColor = cor.bg;
            alertContainer.style.borderLeft = `4px solid ${cor.border}`;
            alertContainer.style.color = cor.text;
            alertContainer.textContent = alerta.mensagem;
            alertContainer.style.display = 'block';

            // Auto-ocultar
            setTimeout(() => {
                if (alertContainer) {
                    alertContainer.style.opacity = '0';
                    alertContainer.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        alertContainer.style.display = 'none';
                        alertContainer.style.opacity = '1';
                        alertContainer.style.transform = 'translateY(0)';

                        // Processar próximo alerta da fila
                        if (systemState.alertQueue.length > 0) {
                            setTimeout(() => processarFilaAlertas(), 500);
                        }
                    }, 300);
                }
            }, alerta.duracao);

        } catch (error) {
            console.error('❌ Erro ao exibir alerta visual:', error);
        }
    }

    // ==================== SISTEMA DE MODAIS ====================

    /**
     * Cria um modal dinamicamente
     * @param {Object} config - Configuração do modal
     */
    function criarModal(config) {
        try {
            const {
                titulo = 'Modal',
                conteudo = '',
                botoes = [{ texto: 'Fechar', classe: 'btn-secondary' }],
                id = 'modalDinamico' + Date.now(),
                tamanho = 'md' // sm, md, lg, xl
            } = config;

            // Remover modal existente se houver
            const modalExistente = document.getElementById(id);
            if (modalExistente) {
                modalExistente.remove();
            }

            // Criar HTML do modal
            const modalHtml = `
                <div class="modal" id="${id}" style="display: none;">
                    <div class="modal-content modal-${tamanho}">
                        <div class="modal-header">
                            <h3 class="modal-title">${titulo}</h3>
                            <button type="button" class="close-btn" onclick="window.utils.fecharModal('${id}')">&times;</button>
                        </div>
                        <div class="modal-body">
                            ${conteudo}
                        </div>
                        <div class="modal-footer">
                            ${botoes.map(botao => `
                                <button type="button" class="btn ${botao.classe || 'btn-secondary'}" 
                                        onclick="${botao.acao ? botao.acao.toString() + '()' : `window.utils.fecharModal('${id}')`}">
                                    ${botao.texto}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Adicionar ao DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Abrir modal
            const modal = document.getElementById(id);
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
                modal.classList.add('active');
            }

            return id;

        } catch (error) {
            console.error('❌ Erro ao criar modal:', error);
            return null;
        }
    }

    /**
     * Fecha modal
     * @param {string} modalId - ID do modal a ser fechado
     */
    function fecharModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';

                // Remover do DOM após animação
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('❌ Erro ao fechar modal:', error);
        }
    }

    // ==================== BACKUP E RESTAURAÇÃO ====================

    /**
     * Exporta backup completo do sistema
     */
    function exportarBackup() {
        try {
            console.log('📦 Iniciando exportação de backup...');

            // Coletar todos os dados do sistema
            const dadosBackup = {
                versao: CONFIG.BACKUP_VERSION,
                dataExportacao: new Date().toISOString(),
                dados: {}
            };

            // Coletar dados do localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const chave = localStorage.key(i);
                if (chave && chave.startsWith(CONFIG.PREFIX)) {
                    const chaveLocal = chave.replace(CONFIG.PREFIX, '');
                    try {
                        dadosBackup.dados[chaveLocal] = JSON.parse(localStorage.getItem(chave));
                    } catch (error) {
                        console.warn(`⚠️ Erro ao processar chave ${chave}:`, error);
                        dadosBackup.dados[chaveLocal] = localStorage.getItem(chave);
                    }
                }
            }

            // Gerar arquivo para download
            const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `possatto_backup_${new Date().toISOString().split('T')[0]}.json`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpar URL objeto
            URL.revokeObjectURL(url);

            const totalItens = Object.keys(dadosBackup.dados).length;
            mostrarAlerta(`✅ Backup exportado com sucesso! ${totalItens} itens salvos.`, 'success');

        } catch (error) {
            console.error('❌ Erro ao exportar backup:', error);
            mostrarAlerta('❌ Erro ao exportar backup', 'danger');
        }
    }

    /**
     * Importa backup do sistema
     * @param {Event} event - Evento do input de arquivo
     */
    function importarBackup(event) {
        try {
            const file = event.target.files[0];
            if (!file) {
                mostrarAlerta('⚠️ Nenhum arquivo selecionado', 'warning');
                return;
            }

            if (!file.name.endsWith('.json')) {
                mostrarAlerta('⚠️ Arquivo deve ser um .json', 'warning');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const dadosBackup = JSON.parse(e.target.result);

                    // Validar estrutura do backup
                    if (!dadosBackup.versao || !dadosBackup.dados) {
                        mostrarAlerta('❌ Arquivo de backup inválido', 'danger');
                        return;
                    }

                    // Confirmar restauração
                    if (!confirm('Tem certeza que deseja restaurar o backup?\n\nTodos os dados atuais serão substituídos.')) {
                        return;
                    }

                    // Limpar dados atuais
                    const chavesAtuais = Object.keys(localStorage).filter(chave =>
                        chave.startsWith(CONFIG.PREFIX)
                    );
                    chavesAtuais.forEach(chave => localStorage.removeItem(chave));

                    // Restaurar dados
                    let itensRestaurados = 0;
                    for (const [chave, dados] of Object.entries(dadosBackup.dados)) {
                        try {
                            localStorage.setItem(CONFIG.PREFIX + chave, JSON.stringify(dados));
                            itensRestaurados++;
                        } catch (error) {
                            console.warn(`⚠️ Erro ao restaurar chave ${chave}:`, error);
                        }
                    }

                    mostrarAlerta(`✅ Backup restaurado! ${itensRestaurados} itens recuperados.`, 'success');

                    // Recarregar página após um breve delay
                    setTimeout(() => {
                        location.reload();
                    }, 2000);

                } catch (error) {
                    console.error('❌ Erro ao processar backup:', error);
                    mostrarAlerta('❌ Erro ao processar arquivo de backup', 'danger');
                }
            };

            reader.readAsText(file);

        } catch (error) {
            console.error('❌ Erro ao importar backup:', error);
            mostrarAlerta('❌ Erro ao importar backup', 'danger');
        }
    }

    // ==================== UTILITÁRIOS DIVERSOS ====================

    /**
     * Gera ID único para elementos
     * @param {string} prefixo - Prefixo opcional para o ID
     * @returns {string} - ID único
     */
    function gerarIdUnico(prefixo = 'id') {
        try {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            return `${prefixo}_${timestamp}_${random}`;
        } catch (error) {
            console.error('❌ Erro ao gerar ID único:', error);
            return `${prefixo}_${Date.now()}`;
        }
    }

    /**
     * Dispara evento customizado
     * @param {string} nomeEvento - Nome do evento
     * @param {*} dados - Dados a serem enviados com o evento
     */
    function dispararEvento(nomeEvento, dados = {}) {
        try {
            const evento = new CustomEvent(nomeEvento, {
                detail: dados,
                bubbles: true,
                cancelable: true
            });

            document.dispatchEvent(evento);

            if (CONFIG.DEBUG) {
                console.log(`📡 Evento disparado: ${nomeEvento}`, dados);
            }

        } catch (error) {
            console.error('❌ Erro ao disparar evento:', error);
        }
    }

    /**
     * Configura manipulador global de erros
     */
    function configurarGlobalErrorHandler() {
        try {
            window.addEventListener('error', function (error) {
                console.error('❌ Erro global capturado:', error);

                if (CONFIG.DEBUG) {
                    mostrarAlerta(`Erro: ${error.message}`, 'danger');
                }
            });

            window.addEventListener('unhandledrejection', function (event) {
                console.error('❌ Promise rejeitada não tratada:', event.reason);

                if (CONFIG.DEBUG) {
                    mostrarAlerta(`Promise rejeitada: ${event.reason}`, 'danger');
                }
            });

        } catch (error) {
            console.error('❌ Erro ao configurar handler global:', error);
        }
    }

    /**
     * Configura sistema de eventos customizados
     */
    function configurarEventosCustomizados() {
        try {
            // Evento de mudança de dados
            document.addEventListener('dados:salvos', function (e) {
                if (CONFIG.DEBUG) {
                    console.log('📊 Dados salvos:', e.detail);
                }
            });

            // Evento de limpeza de dados
            document.addEventListener('dados:limpeza-completa', function (e) {
                if (CONFIG.DEBUG) {
                    console.log('🧹 Limpeza completa realizada:', e.detail);
                }
            });

        } catch (error) {
            console.error('❌ Erro ao configurar eventos customizados:', error);
        }
    }

    // ==================== DIAGNÓSTICO E VERIFICAÇÃO ====================

    /**
     * Verifica a integridade e funcionamento do utils.js
     * @returns {Object} - Relatório de integridade
     */
    function checkUtilsHealth() {
        const relatorio = {
            versao: CONFIG.VERSION,
            inicializado: systemState.initialized,
            localStorage: {
                disponivel: typeof Storage !== 'undefined',
                itens: 0,
                tamanho: 0
            },
            funcoes: {
                persistencia: ['salvarDados', 'obterDados', 'removerDados', 'limparDados'],
                formatacao: ['formatarMoeda', 'formatarData', 'formatarCNPJ', 'formatarCPF', 'formatarTelefone'],
                validacao: ['validarCNPJ', 'validarCPF', 'validarEmail'],
                alertas: ['mostrarAlerta', 'mostrarAlertaSeguro'],
                backup: ['exportarBackup', 'importarBackup'],
                utilitarios: ['gerarIdUnico', 'aplicarMascara', 'dispararEvento']
            },
            testes: {
                salvarDados: false,
                obterDados: false,
                formatacao: false,
                validacao: false,
                alertas: false
            }
        };

        try {
            // Verificar localStorage
            if (relatorio.localStorage.disponivel) {
                relatorio.localStorage.itens = localStorage.length;
                relatorio.localStorage.tamanho = JSON.stringify(localStorage).length;
            }

            // Testar persistência
            const chaveTest = 'test_' + Date.now();
            const dadoTest = { teste: true, timestamp: Date.now() };

            relatorio.testes.salvarDados = salvarDados(chaveTest, dadoTest);
            relatorio.testes.obterDados = JSON.stringify(obterDados(chaveTest)) === JSON.stringify(dadoTest);
            removerDados(chaveTest);

            // Testar formatação
            relatorio.testes.formatacao = (
                formatarMoeda(1234.56) === 'R$ 1.234,56' &&
                formatarCNPJ('12345678000195').includes('/') &&
                formatarCPF('12345678901').includes('-')
            );

            // Testar validação
            relatorio.testes.validacao = (
                validarCNPJ('11.222.333/0001-81') &&
                !validarCNPJ('11.111.111/1111-11') &&
                validarCPF('111.444.777-35') &&
                !validarCPF('111.111.111-11')
            );

            // Testar alertas
            relatorio.testes.alertas = typeof mostrarAlerta === 'function';

            console.log('🏥 Relatório de integridade do utils.js:', relatorio);
            return relatorio;

        } catch (error) {
            console.error('❌ Erro no diagnóstico:', error);
            relatorio.erro = error.message;
            return relatorio;
        }
    }

    /**
     * Verifica se o carregamento completo foi realizado
     */
    function verificarCarregamentoCompleto() {
        try {
            const modulosEsperados = {
                utils: !!window.utils,
                abaEmpresa: !!(window.abaEmpresa || window.inicializarAbaEmpresa),
                orcamentos: !!(window.abaOrcamentos || window.inicializarAbaOrcamentos),
                projetos: !!(window.abaProjetos || window.inicializarAbaProjetos),
                gestao: !!(window.abaGestao || window.abaGestaoModule),
                fluxo: !!(window.abaFluxo || window.inicializarAbaFluxo),
                folha: !!(window.abaFolha || window.inicializarAbaFolha),
                gerarPDF: !!window.gerarPDF,
            };

            const totalModulos = Object.keys(modulosEsperados).length;
            const modulosCarregados = Object.values(modulosEsperados).filter(Boolean).length;
            const percentualCarregamento = (modulosCarregados / totalModulos) * 100;

            console.log('📊 Status de carregamento dos módulos:');
            console.table(modulosEsperados);
            console.log(`📈 Carregamento: ${percentualCarregamento.toFixed(1)}% (${modulosCarregados}/${totalModulos})`);

            if (percentualCarregamento === 100) {
                console.log('✅ Todos os módulos foram carregados com sucesso!');
                mostrarAlerta('✅ Sistema totalmente carregado!', 'success');
            } else {
                console.warn(`⚠️ Alguns módulos não foram carregados (${percentualCarregamento.toFixed(1)}%)`);
                mostrarAlerta(`⚠️ Carregamento parcial: ${percentualCarregamento.toFixed(1)}%`, 'warning');
            }

            return {
                percentual: percentualCarregamento,
                modulos: modulosEsperados,
                completo: percentualCarregamento === 100
            };

        } catch (error) {
            console.error('❌ Erro na verificação de carregamento:', error);
            return { percentual: 0, modulos: {}, completo: false, erro: error.message };
        }
    }

    // ==================== API PÚBLICA DO MÓDULO ====================

    const utilsAPI = {
        // Metadados
        versao: CONFIG.VERSION,
        inicializado: () => systemState.initialized,

        // Persistência de dados
        salvarDados,
        obterDados,
        removerDados,
        limparDados,

        // Formatação
        formatarMoeda,
        formatarData,
        formatarCNPJ,
        formatarCPF,
        formatarTelefone,
        aplicarMascara,

        // Validação
        validarCNPJ,
        validarCPF,
        validarEmail,

        // Sistema de alertas
        mostrarAlerta,
        mostrarAlertaSeguro,

        // Sistema de modais
        criarModal,
        fecharModal,

        // Backup e restauração
        exportarBackup,
        importarBackup,

        // Utilitários
        gerarIdUnico,
        dispararEvento,

        // Diagnóstico
        checkUtilsHealth,
        verificarCarregamentoCompleto,

        // Configurações
        config: CONFIG,
        debug: (ativo) => {
            if (typeof ativo === 'boolean') {
                systemState.debugMode = ativo;
                CONFIG.DEBUG = ativo;
                console.log(`🐛 Debug mode: ${ativo ? 'ativado' : 'desativado'}`);
            }
            return systemState.debugMode;
        }
    };

    // ==================== EXPORTAÇÃO GLOBAL ====================

    // Anexar ao objeto window para acesso global
    window.utils = utilsAPI;

    // Compatibilidade com possíveis chamadas diretas
    window.salvarDados = salvarDados;
    window.obterDados = obterDados;
    window.mostrarAlerta = mostrarAlerta;
    window.formatarMoeda = formatarMoeda;
    window.formatarData = formatarData;
    window.validarCNPJ = validarCNPJ;
    window.validarCPF = validarCPF;
    window.exportarBackup = exportarBackup;
    window.importarBackup = importarBackup;

    // ==================== AUTO-INICIALIZAÇÃO ====================

    // Inicializar automaticamente quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarUtils);
    } else {
        inicializarUtils();
    }

    // ==================== LOG DE SUCESSO ====================

    console.log(`✅ utils.js v${CONFIG.VERSION} carregado com sucesso!`);
    console.log('📋 Funções disponíveis via window.utils:');
    console.log('  💾 Persistência: salvarDados, obterDados, removerDados, limparDados');
    console.log('  🎨 Formatação: formatarMoeda, formatarData, formatarCNPJ, formatarCPF, formatarTelefone');
    console.log('  ✅ Validação: validarCNPJ, validarCPF, validarEmail');
    console.log('  🚨 Alertas: mostrarAlerta, mostrarAlertaSeguro');
    console.log('  📦 Backup: exportarBackup, importarBackup');
    console.log('  🛠️ Utilitários: gerarIdUnico, aplicarMascara, dispararEvento');
    console.log('  🏥 Diagnóstico: checkUtilsHealth, verificarCarregamentoCompleto');
    console.log('📦 MÓDULO UTILS.JS FINALIZADO E 100% FUNCIONAL!');

})();