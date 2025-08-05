// ===================== Validador de Integridade dos Módulos Possatto PRO =====================

function validarIntegridadeSistema() {
    const dependencias = [
        { nome: 'utils', ver: () => !!window.utils },
        { nome: 'abaEmpresa', ver: () => !!window.abaEmpresa },
        { nome: 'abaOrcamentos', ver: () => !!window.abaOrcamentosModule || !!window.abaOrcamentos || typeof window.inicializarAbaOrcamentos === 'function' },
        { nome: 'abaProjetos', ver: () => !!window.abaProjetos || typeof window.inicializarAbaProjetos === 'function' },
        { nome: 'abaGestao', ver: () => !!window.abaGestao || !!window.abaGestaoModule },
        { nome: 'abaFluxo', ver: () => !!window.abaFluxo || typeof window.inicializarAbaFluxo === 'function' },
        { nome: 'abaFolha', ver: () => !!window.abaFolha || typeof window.inicializarAbaFolha === 'function' },
        { nome: 'gerarPDF', ver: () => !!window.gerarPDF },
        { nome: 'jsPDF', ver: () => !!window.jspdf || !!window.jspdf?.jsPDF },
        { nome: 'style.css', ver: () => !!document.querySelector('link[href*="style.css"]') }
    ];

    let falhas = [];
    let relatorio = '<strong>Validação de Módulos Possatto PRO:</strong><ul style="margin:8px 0 0 10px;padding:0;">';

    dependencias.forEach(dep => {
        let ok = false;
        try { ok = dep.ver(); } catch { }
        if (!ok) {
            falhas.push(dep.nome);
            relatorio += `<li style="color:#e74c3c;">❌ ${dep.nome} <span style="font-size:0.9em;color:#bdbdbd;">(NÃO CARREGADO)</span></li>`;
        } else {
            relatorio += `<li style="color:#27ae60;">✅ ${dep.nome}</li>`;
        }
    });
    relatorio += '</ul>';

    // Cria painel flutuante (só para admins/devs, pode comentar para esconder de clientes)
    let painel = document.getElementById('painelIntegridade');
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'painelIntegridade';
        painel.style.cssText = `
            position:fixed;bottom:12px;left:12px;z-index:99999;
            background:#fff;border:1px solid #d9e0e8;border-radius:8px;
            box-shadow:0 6px 30px rgba(0,0,0,.12);padding:15px 20px;min-width:220px;
            font-size:15px;line-height:1.6;max-width:380px;color:#2c3e50;opacity:.95;
        `;
        document.body.appendChild(painel);
    }
    painel.innerHTML = relatorio + (falhas.length
        ? `<div style="color:#e74c3c;font-size:1.05em;font-weight:500;margin-top:10px;">
              Falha(s) crítica(s): <b>${falhas.join(', ')}</b><br>
              <span style="font-size:0.95em;color:#bdbdbd;">Verifique scripts, nomes, dependências e console.</span>
           </div>`
        : `<div style="color:#27ae60;font-size:1.1em;font-weight:600;margin-top:10px;">Sistema 100% íntegro!</div>`
    );

    // (Opcional) Remove painel após X segundos
    setTimeout(() => { painel.style.display = 'none'; }, 15000);
}

// Chame assim que todos os scripts forem carregados (ex: window.onload ou no final do DOMContentLoaded)
window.addEventListener('load', validarIntegridadeSistema);
