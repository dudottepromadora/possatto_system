import time
from playwright.sync_api import sync_playwright, expect

# Edite esta URL para apontar para o endereço do seu sistema local/web
URL = "http://localhost:5500/"  # Exemplo: arquivo index.html rodando no Live Server

def run(playwright):
    browser = playwright.chromium.launch(headless=False)  # Coloque True se não quiser ver o navegador abrindo
    page = browser.new_page()
    page.goto(URL)

    # --- PASSO 1: Ir para aba Orçamentos ---
    page.click('button[data-tab="orcamentos"]')
    time.sleep(1)

    # --- PASSO 2: Novo Orçamento ---
    page.click('text="Novo Orçamento"')  # Ajuste caso o botão tenha outro texto
    time.sleep(0.5)

    # --- PASSO 3: Preencher dados do cliente ---
    page.fill('input[name="cliente_nome"]', "Rodrigo Rodrigues Freitas")
    page.fill('input[name="cliente_cpf"]', "889.264.781-49")
    page.fill('input[name="cliente_telefone"]', "47996065173")
    page.select_option('select[name="tipo_projeto"]', label="Quarto")  # Ajuste o name se for diferente
    page.fill('input[name="arquiteto"]', "Andressa")
    page.fill('input[name="prazo_entrega"]', "2025-09-17")  # Campo data deve aceitar ISO
    page.fill('input[name="endereco"]', "Rua 280, n°138, bairro Castelo Branco, Itapema/SC")

    # --- PASSO 4: Adicionar ambiente ---
    page.click('button:has-text("Adicionar Ambiente")')  # Ajuste texto conforme seu sistema
    page.fill('input[name="ambiente_nome"]', "Quarto")
    page.click('button:has-text("Salvar Ambiente")')

    # --- PASSO 5: Adicionar móvel ---
    page.click('button:has-text("Adicionar Móvel")')
    page.fill('input[name="movel_nome"]', "Roupeiro 3 portas")
    page.fill('input[name="movel_largura"]', "200")
    page.fill('input[name="movel_altura"]', "200")
    page.fill('input[name="movel_profundidade"]', "75")
    page.click('button:has-text("Salvar Móvel")')

    # --- PASSO 6: Adicionar Materiais ---
    materiais = [
        ("MDF Branco TX 6mm", "2", "150"),
        ("MDF Branco TX 15 mm", "4", "200"),
        ("MDF Colorido TX 18 mm", "2", "350"),
        ("Fita 22mm Rolo", "2", "35"),
        ("Corrediça Invisível com amortecedor", "4", "150"),
    ]
    for nome, qtd, preco in materiais:
        page.click('button:has-text("Adicionar Material")')
        page.fill('input[name="material_nome"]', nome)
        page.fill('input[name="material_qtd"]', qtd)
        page.fill('input[name="material_preco"]', preco)
        page.click('button:has-text("Salvar Material")')

    # --- PASSO 7: Adicionar Ferragens ---
    ferragens = [
        ("Trilho Sup/Inf – Aéreo/Balcão", "1", "100"),
        ("Puxador Perfil Slim", "1", "135"),
        ("KIT Porta de Correr RO-47", "2", "35"),
    ]
    for nome, qtd, preco in ferragens:
        page.click('button:has-text("Adicionar Ferragem")')
        page.fill('input[name="ferragem_nome"]', nome)
        page.fill('input[name="ferragem_qtd"]', qtd)
        page.fill('input[name="ferragem_preco"]', preco)
        page.click('button:has-text("Salvar Ferragem")')

    # --- PASSO 8: Fatores ---
    page.fill('input[name="fator_multiplicador"]', "3")
    page.fill('input[name="percentual_rt"]', "10")
    page.fill('input[name="percentual_adicional"]', "10")

    # --- PASSO 9: Conferir totais (asserts) ---
    expect(page.locator('text="Total Materiais"')).to_be_visible()
    assert "2.100,00" in page.text_content('text="Total Materiais"')
    assert "6.300,00" in page.text_content('text="Materiais × Fator"')
    assert "305,00" in page.text_content('text="Ferragens"')
    assert "6.605,00" in page.text_content('text="Subtotal"')
    assert "660,50" in page.text_content('text="RT"')
    assert "660,50" in page.text_content('text="Adicional"')
    assert "7.926,00" in page.text_content('text="VALOR FINAL"')

    # --- PASSO 10: Forma de pagamento ---
    page.click('button:has-text("Simular Pagamento")')
    page.click('input[type="radio"][value="avista"]')  # Ajuste o seletor conforme seu sistema
    page.fill('input[name="desconto"]', "0")
    assert "7.926,00" in page.text_content('text="Valor Final"')

    # --- PASSO 11: Salvar ---
    page.click('button:has-text("Salvar Orçamento")')
    time.sleep(1)
    page.click('button:has-text("Voltar para lista")')

    # --- PASSO 12: Conferir orçamento salvo ---
    assert "Rodrigo Rodrigues Freitas" in page.content()
    assert "Quarto" in page.content()
    assert "7.926,00" in page.content()

    print("\n✅ Teste de orçamento COMPLETO — todos os passos executados com sucesso!")

    # --- (Opcional) Gerar PDF ---
    page.click('button:has-text("Gerar PDF")')
    time.sleep(2)  # Aguarde geração

    # --- Finalize ---
    page.screenshot(path="orcamento_teste.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
