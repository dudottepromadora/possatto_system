/**
 * SISTEMA POSSATTO PRO v7.0
 * Módulo: Aba Empresa
 * Funcionalidades:
 * - Gestão de dados da empresa
 * - Upload de logo
 * - Validação de documentos
 * - Integração com outros módulos
 */

(function () {
    'use strict';

    // ==================== VARIÁVEIS GLOBAIS ====================

    let dadosEmpresa = {};
    let logoDataURL = null;

    // Configurações do módulo
    const CONFIG = {
        logoMaxSize: 5 * 1024 * 1024, // 5MB
        logoFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
        requiredFields: ['razaoSocial', 'cnpj', 'enderecoEmpresa', 'telefoneEmpresa', 'emailEmpresa', 'responsavelLegal']
    };

    // ==================== INICIALIZAÇÃO ====================

    function inicializarAbaEmpresa() {
        try {
            console.log('🏢 Inicializando módulo Aba Empresa v7.0...');

            // Renderizar HTML da aba
            renderizarAbaEmpresa();

            // Carregar dados e configurar eventos
            setTimeout(() => {
                carregarDadosEmpresa();
                configurarEventListeners();
            }, 100);

            console.log('✅ Módulo Aba Empresa inicializado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao inicializar aba Empresa:', error);
        }
    }

    // ==================== RENDERIZAÇÃO DO HTML ====================

    function renderizarAbaEmpresa() {
        const container = document.getElementById('empresa');
        if (!container) {
            console.error('❌ Container #empresa não encontrado');
            return;
        }

        container.innerHTML = `
            <div class="empresa-container">
                <div class="empresa-header">
                    <h2>🏢 Dados da Empresa</h2>
                    <div class="empresa-actions">
                        <button id="btnSalvarEmpresa" class="btn btn-success">💾 Salvar Dados</button>
                        <button id="btnLimparEmpresa" class="btn btn-danger">🗑️ Limpar Dados</button>
                    </div>
                </div>

                <div class="empresa-form">
                    <!-- Seção de Logo -->
                    <div class="logo-section">
                        <h3>📷 Logo da Empresa</h3>
                        <div class="logo-upload" id="logoUpload">
                            <div id="logoPreview">
                                <p>Clique para fazer upload da logo</p>
                                <small class="text-muted">Formatos aceitos: JPG, PNG, SVG (máx. 5MB)</small>
                            </div>
                        </div>
                        <input type="file" id="logoInput" accept="image/*" style="display: none;">
                    </div>

                    <!-- Dados Básicos -->
                    <div class="form-section">
                        <h3>📋 Dados Básicos</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="razaoSocial">Razão Social <span class="required">*</span></label>
                                <input type="text" class="form-control" id="razaoSocial" required>
                            </div>
                        </div>
                        
                        <div class="form-row two-cols">
                            <div class="form-group">
                                <label for="cnpj">CNPJ <span class="required">*</span></label>
                                <input type="text" class="form-control" id="cnpj" maxlength="18" required>
                            </div>
                            <div class="form-group">
                                <label for="telefoneEmpresa">Telefone <span class="required">*</span></label>
                                <input type="tel" class="form-control" id="telefoneEmpresa" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="emailEmpresa">E-mail <span class="required">*</span></label>
                                <input type="email" class="form-control" id="emailEmpresa" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="enderecoEmpresa">Endereço Completo <span class="required">*</span></label>
                                <textarea class="form-control" id="enderecoEmpresa" rows="2" required></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Responsável Legal -->
                    <div class="form-section">
                        <h3>👤 Responsável Legal</h3>
                        <div class="form-row two-cols">
                            <div class="form-group">
                                <label for="responsavelLegal">Nome Completo <span class="required">*</span></label>
                                <input type="text" class="form-control" id="responsavelLegal" required>
                            </div>
                            <div class="form-group">
                                <label for="cpfResponsavel">CPF</label>
                                <input type="text" class="form-control" id="cpfResponsavel" maxlength="14">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="enderecoResponsavel">Endereço do Responsável</label>
                                <input type="text" class="form-control" id="enderecoResponsavel">
                            </div>
                        </div>
                    </div>

                    <!-- Dados Adicionais -->
                    <div class="form-section">
                        <h3>🌐 Dados Adicionais</h3>
                        <div class="form-row two-cols">
                            <div class="form-group">
                                <label for="siteEmpresa">Site</label>
                                <input type="url" class="form-control" id="siteEmpresa" placeholder="https://www.exemplo.com">
                            </div>
                            <div class="form-group">
                                <label for="instagramEmpresa">Instagram</label>
                                <input type="text" class="form-control" id="instagramEmpresa" placeholder="@empresa">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== CARREGAMENTO DE DADOS ====================

    function carregarDadosEmpresa() {
        try {
            if (window.utils && window.utils.obterDados) {
                const dadosSalvos = window.utils.obterDados('dadosEmpresa');
                if (dadosSalvos) {
                    dadosEmpresa = dadosSalvos;
                    preencherFormulario(dadosEmpresa);
                    console.log('📋 Dados da empresa carregados');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados da empresa:', error);
        }
    }

    function preencherFormulario(dados) {
        try {
            if (!dados || typeof dados !== 'object') return;

            const mapeamentoCampos = {
                'razaoSocial': dados.razaoSocial,
                'cnpj': dados.cnpj,
                'enderecoEmpresa': dados.endereco,
                'telefoneEmpresa': dados.telefone,
                'emailEmpresa': dados.email,
                'responsavelLegal': dados.responsavel,
                'cpfResponsavel': dados.cpfResponsavel,
                'enderecoResponsavel': dados.enderecoResponsavel,
                'siteEmpresa': dados.site,
                'instagramEmpresa': dados.instagram
            };

            for (const [fieldId, valor] of Object.entries(mapeamentoCampos)) {
                const element = document.getElementById(fieldId);
                if (element && valor) {
                    element.value = valor;
                }
            }

            // Carregar logo se existir
            if (dados.logo) {
                carregarLogoSalva(dados.logo);
            }

        } catch (error) {
            console.error('❌ Erro ao preencher formulário:', error);
        }
    }

    // ==================== EVENT LISTENERS ====================

    function configurarEventListeners() {
        try {
            // Botão salvar
            const btnSalvar = document.getElementById('btnSalvarEmpresa');
            if (btnSalvar) {
                btnSalvar.onclick = salvarDadosEmpresa;
            }

            // Botão limpar
            const btnLimpar = document.getElementById('btnLimparEmpresa');
            if (btnLimpar) {
                btnLimpar.onclick = limparDadosEmpresa;
            }

            // Upload de logo
            const logoUpload = document.getElementById('logoUpload');
            const logoInput = document.getElementById('logoInput');

            if (logoUpload && logoInput) {
                logoUpload.onclick = () => logoInput.click();
                logoInput.onchange = processarUploadLogo;
            }

            // Formatação automática dos campos
            const cnpjField = document.getElementById('cnpj');
            if (cnpjField) {
                cnpjField.oninput = function () {
                    this.value = formatarCNPJ(this.value);
                };
            }

            const cpfField = document.getElementById('cpfResponsavel');
            if (cpfField) {
                cpfField.oninput = function () {
                    this.value = formatarCPF(this.value);
                };
            }

            const telefoneField = document.getElementById('telefoneEmpresa');
            if (telefoneField) {
                telefoneField.oninput = function () {
                    this.value = formatarTelefone(this.value);
                };
            }

        } catch (error) {
            console.error('❌ Erro ao configurar event listeners:', error);
        }
    }

    // ==================== UPLOAD DE LOGO ====================

    function processarUploadLogo(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            // Validar tipo de arquivo
            if (!CONFIG.logoFormats.includes(file.type)) {
                window.utils?.mostrarAlerta('Formato não suportado. Use: JPG, PNG ou SVG', 'warning');
                return;
            }

            // Validar tamanho
            if (file.size > CONFIG.logoMaxSize) {
                window.utils?.mostrarAlerta('Arquivo muito grande. Máximo: 5MB', 'warning');
                return;
            }

            // Ler arquivo
            const reader = new FileReader();
            reader.onload = function (e) {
                logoDataURL = e.target.result;
                mostrarPreviewLogo(logoDataURL);
                window.utils?.mostrarAlerta('✅ Logo carregada com sucesso!', 'success');
            };

            reader.onerror = function () {
                window.utils?.mostrarAlerta('Erro ao ler arquivo de logo', 'danger');
            };

            reader.readAsDataURL(file);

        } catch (error) {
            console.error('❌ Erro ao processar upload:', error);
        }
    }

    function mostrarPreviewLogo(dataURL) {
        try {
            const logoPreview = document.getElementById('logoPreview');
            if (!logoPreview) return;

            logoPreview.innerHTML = `
                <div class="logo-container">
                    <img src="${dataURL}" class="logo-preview" alt="Logo da empresa" style="max-width: 200px; max-height: 100px; border-radius: 8px;" />
                    <div class="logo-overlay">
                        <button type="button" class="btn btn-danger btn-sm" onclick="window.abaEmpresa.removerLogo()">
                            🗑️ Remover
                        </button>
                    </div>
                </div>
                <small class="text-muted mt-2 d-block">Clique na imagem para alterar</small>
            `;

        } catch (error) {
            console.error('❌ Erro ao mostrar preview:', error);
        }
    }

    function carregarLogoSalva(logoData) {
        try {
            if (logoData && logoData.startsWith('data:')) {
                logoDataURL = logoData;
                mostrarPreviewLogo(logoData);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar logo salva:', error);
        }
    }

    function removerLogo() {
        try {
            logoDataURL = null;

            const logoPreview = document.getElementById('logoPreview');
            if (logoPreview) {
                logoPreview.innerHTML = `
                    <p>Clique para fazer upload da logo</p>
                    <small class="text-muted">Formatos aceitos: JPG, PNG, SVG (máx. 5MB)</small>
                `;
            }

            // Limpar input
            const logoInput = document.getElementById('logoInput');
            if (logoInput) {
                logoInput.value = '';
            }

            window.utils?.mostrarAlerta('Logo removida', 'info');

        } catch (error) {
            console.error('❌ Erro ao remover logo:', error);
        }
    }

    // ==================== SALVAR/LIMPAR DADOS ====================

    function salvarDadosEmpresa() {
        try {
            const dadosAtualizados = coletarDadosFormulario();

            // Validar campos obrigatórios
            const camposFaltando = CONFIG.requiredFields.filter(field => {
                const elemento = document.getElementById(field);
                return !elemento || !elemento.value.trim();
            });

            if (camposFaltando.length > 0) {
                window.utils?.mostrarAlerta('⚠️ Preencha todos os campos obrigatórios', 'warning');
                return false;
            }

            // Validar CNPJ
            if (!window.utils?.validarCNPJ(dadosAtualizados.cnpj)) {
                window.utils?.mostrarAlerta('⚠️ CNPJ inválido', 'warning');
                return false;
            }

            // Validar email
            if (!window.utils?.validarEmail(dadosAtualizados.email)) {
                window.utils?.mostrarAlerta('⚠️ E-mail inválido', 'warning');
                return false;
            }

            // Salvar usando utils.js
            if (window.utils && window.utils.salvarDados) {
                const sucesso = window.utils.salvarDados('dadosEmpresa', dadosAtualizados);
                if (sucesso) {
                    dadosEmpresa = { ...dadosAtualizados };
                    window.utils.mostrarAlerta('✅ Dados da empresa salvos com sucesso!', 'success');

                    // Disparar evento para outros módulos
                    window.utils.dispararEvento('empresa:atualizada', { dados: dadosEmpresa });

                    return true;
                }
            }

            return false;

        } catch (error) {
            console.error('❌ Erro ao salvar dados da empresa:', error);
            window.utils?.mostrarAlerta('❌ Erro ao salvar dados da empresa', 'danger');
            return false;
        }
    }

    function coletarDadosFormulario() {
        try {
            const dados = {
                razaoSocial: document.getElementById('razaoSocial')?.value?.trim() || '',
                cnpj: document.getElementById('cnpj')?.value?.trim() || '',
                endereco: document.getElementById('enderecoEmpresa')?.value?.trim() || '',
                telefone: document.getElementById('telefoneEmpresa')?.value?.trim() || '',
                email: document.getElementById('emailEmpresa')?.value?.trim() || '',
                responsavel: document.getElementById('responsavelLegal')?.value?.trim() || '',
                cpfResponsavel: document.getElementById('cpfResponsavel')?.value?.trim() || '',
                enderecoResponsavel: document.getElementById('enderecoResponsavel')?.value?.trim() || '',
                site: document.getElementById('siteEmpresa')?.value?.trim() || '',
                instagram: document.getElementById('instagramEmpresa')?.value?.trim() || '',
                logo: logoDataURL || '',
                dataUltimaAtualizacao: new Date().toISOString()
            };

            return dados;

        } catch (error) {
            console.error('❌ Erro ao coletar dados do formulário:', error);
            return {};
        }
    }

    function limparDadosEmpresa() {
        try {
            if (confirm('Tem certeza que deseja limpar todos os dados da empresa?')) {
                // Limpar formulário
                const inputs = document.querySelectorAll('#empresa input, #empresa textarea');
                inputs.forEach(input => {
                    input.value = '';
                });

                // Limpar logo
                removerLogo();

                // Limpar dados em memória
                dadosEmpresa = {};
                logoDataURL = null;

                // Limpar localStorage
                window.utils?.removerDados('dadosEmpresa');

                window.utils?.mostrarAlerta('🗑️ Dados da empresa foram limpos', 'warning');
            }

        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
        }
    }

    // ==================== FUNÇÕES DE FORMATAÇÃO ====================

    function formatarCNPJ(cnpj) {
        return window.utils?.formatarCNPJ ? window.utils.formatarCNPJ(cnpj) : cnpj;
    }

    function formatarCPF(cpf) {
        return window.utils?.formatarCPF ? window.utils.formatarCPF(cpf) : cpf;
    }

    function formatarTelefone(telefone) {
        return window.utils?.formatarTelefone ? window.utils.formatarTelefone(telefone) : telefone;
    }

    // ==================== FUNÇÕES PÚBLICAS ====================

    function obterDadosEmpresa() {
        return { ...dadosEmpresa };
    }

    function temDadosBasicos() {
        return dadosEmpresa.razaoSocial && dadosEmpresa.cnpj;
    }

    // ==================== API PÚBLICA ====================

    const abaEmpresaAPI = {
        inicializar: inicializarAbaEmpresa,
        salvarDadosEmpresa,
        limparDadosEmpresa,
        removerLogo,
        obterDadosEmpresa,
        temDadosBasicos,
        carregarDadosEmpresa,
        get dados() { return { ...dadosEmpresa }; },
        get logo() { return logoDataURL; },
        get temLogo() { return !!logoDataURL; }
    };

    // Tornar disponível globalmente
    window.abaEmpresa = abaEmpresaAPI;

    console.log('📦 Módulo abaEmpresa.js v7.0 carregado');

})();