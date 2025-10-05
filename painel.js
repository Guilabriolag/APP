document.addEventListener('DOMContentLoaded', () => {
    const sidebarItems = document.querySelectorAll('#sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');
    const saveBtn = document.getElementById('save-btn');
    const publishBtn = document.getElementById('publish-btn');
    const previewFrame = document.getElementById('totem-preview-frame');
    const addCoberturaBtn = document.getElementById('add-cobertura-btn');

    // --- FUNÇÕES DE NAVEGAÇÃO ---
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Lógica de troca de abas (mantida do código anterior)
            sidebarItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'preview') {
                updatePreview();
            }
        });
    });

    // --- LÓGICA DE COLETA DE DADOS (SERIALIZAÇÃO PARA JSON) ---

    /**
     * Coleta todos os dados de formulário usando os atributos data-key
     * e organiza em um objeto JSON.
     */
    function collectFormData() {
        const data = {};
        
        tabContents.forEach(section => {
            const groupKey = section.getAttribute('data-group');
            if (!groupKey) return;

            const groupData = {};

            // 1. Coletar dados simples de INPUT/TEXTAREA
            section.querySelectorAll('[data-key]').forEach(input => {
                const key = input.getAttribute('data-key');
                if (input.type === 'checkbox') {
                    groupData[key] = input.checked;
                } else if (input.tagName === 'TEXTAREA') {
                    groupData[key] = input.value;
                } else {
                    groupData[key] = input.value;
                }
            });
            
            // 2. Coletar dados de Arrays (Ex: Cobertura, Cupons, Itens)
            if (groupKey === 'loja') {
                // Lógica específica para o array de Cobertura
                const coberturaList = Array.from(document.querySelectorAll('#cobertura-list > div')).map(item => ({
                    bairro: item.getAttribute('data-bairro'),
                    taxa: parseFloat(item.getAttribute('data-taxa'))
                }));
                groupData.cobertura = coberturaList;
            }

            // 3. Adiciona o grupo ao objeto principal
            data[groupKey] = groupData;
        });

        // Simulação de dados para ITENS (seria populado via lógica de adicionar/editar)
        data.itens = {
            categorias: [{nome: "Pizzas", sub: "N"}, {nome: "Bebidas", sub: "N"}],
            produtos: [{nome: "Pizza Pepperoni", preco: 55.00}, {nome: "Coca Cola 2L", preco: 10.00}]
        };

        return data;
    }

    // --- FUNÇÕES DE AÇÃO ---

    // Adicionar Bairro à Lista de Cobertura
    addCoberturaBtn.addEventListener('click', () => {
        const bairro = document.getElementById('bairro-input').value;
        const taxa = document.getElementById('taxa-input').value;
        
        if (bairro && taxa) {
            const list = document.getElementById('cobertura-list');
            const item = document.createElement('div');
            item.setAttribute('data-bairro', bairro);
            item.setAttribute('data-taxa', taxa);
            item.innerHTML = `<span>${bairro}: R$ ${taxa}</span> <button onclick="this.parentNode.remove()">X</button>`;
            list.appendChild(item);
            document.getElementById('bairro-input').value = '';
            document.getElementById('taxa-input').value = '';
            alert('Bairro adicionado temporariamente. Clique em SALVAR para persistir.');
        }
    });

    // SALVAR/EDITAR (localStorage)
    saveBtn.addEventListener('click', () => {
        const data = collectFormData();
        localStorage.setItem('configData', JSON.stringify(data));
        alert('Configurações salvas localmente!');
        updatePreview();
    });

    // PUBLICAR (JSONBin Simulação com Fetch)
    publishBtn.addEventListener('click', async () => {
        const binId = document.getElementById('bin-id').value.trim();
        const masterKey = document.getElementById('master-key').value.trim();
        const data = collectFormData(); // Coleta os dados mais recentes

        if (!data || !binId || !masterKey) {
            alert('Erro: Preencha BinID, Chave Master e salve as configurações antes de publicar.');
            return;
        }

        const endpoint = `https://api.jsonbin.io/v3/b/${binId}`; // Altere se usar v4 ou outra configuração
        
        try {
            const response = await fetch(endpoint, {
                method: 'PUT', // PUT para atualizar o bin existente
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': masterKey,
                    // 'X-Bin-Versioning': 'false' // Pode ser útil para manter o mesmo link
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                alert('🚀 Publicado com sucesso no JSONBin!');
                console.log('JSONBin Response:', result);
            } else {
                const errorText = await response.text();
                alert(`⚠️ Erro ao publicar: ${response.status}. Verifique o BinID e a Chave Master.`);
                console.error('JSONBin Error:', errorText);
            }

        } catch (error) {
            alert('❌ Erro de conexão ou rede ao tentar publicar.');
            console.error('Fetch Error:', error);
        }
    });

    // --- PREVIEW ---

    function generateTotemHtml(data) {
        // Usa os dados coletados (data) para construir o HTML do totem dinamicamente.
        const storeName = data.loja.nome || "Loja Desconhecida";
        const coverCount = data.loja.cobertura ? data.loja.cobertura.length : 0;
        
        return `
            <style>
                body { font-family: sans-serif; padding: 20px; background-color: ${data.customizar.fundoUrlCor || '#f0f8ff'}; color: ${data.customizar.cor1 || '#333'}; }
                .header-preview { background-color: ${data.customizar.cor2 || '#1abc9c'}; color: white; padding: 10px; text-align: center;}
            </style>
            <div class="header-preview">
                <h2>TOTEM: ${storeName}</h2>
            </div>
            <h3>Dados Carregados</h3>
            <p><strong>Total de Itens:</strong> ${data.itens.produtos.length}</p>
            <p><strong>Áreas de Entrega:</strong> ${coverCount} bairros cadastrados.</p>
            <p><strong>Chave PIX:</strong> ${data.loja.pixChave || 'Não informada'}</p>
            <p style="color: ${data.customizar.cor1};">Este iframe simula o layout final do Totem usando seus dados.</p>
        `;
    }

    function updatePreview() {
        // Tenta carregar dados do localStorage, ou coleta dados atuais do formulário
        const savedData = JSON.parse(localStorage.getItem('configData'));
        const dataToDisplay = savedData || collectFormData(); 
        
        const totemHtml = generateTotemHtml(dataToDisplay);
        previewFrame.srcdoc = totemHtml;
    }
/**
 * Traduz os dados de configuração (data) em uma string HTML
 * que representa o layout final do Totem para ser exibida no iframe de preview.
 * @param {object} data - O objeto JSON contendo todas as configurações da loja.
 */
function generateTotemHtml(data) {
    const loja = data.loja || {};
    const customizar = data.customizar || {};
    const itens = data.itens || { categorias: [], produtos: [] };

    // --- Estilos Base (Usando dados de Customização) ---
    const style = `
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            background-color: ${customizar.fundoUrlCor || '#f4f4f4'}; 
            color: ${customizar.cor1 || '#333'}; 
        }
        .totem-header { 
            background-color: ${customizar.cor2 || '#2c3e50'}; 
            color: white; 
            padding: 10px; 
            text-align: center; 
            font-weight: bold; 
        }
        .totem-category-bar { 
            display: flex; 
            overflow-x: auto; 
            padding: 10px 0; 
            background-color: #ecf0f1; 
            border-bottom: 1px solid #ddd;
        }
        .totem-category-bar button { 
            flex-shrink: 0; /* Não encolhe os botões */
            margin: 0 5px; 
            padding: 8px 15px; 
            border: 1px solid #ccc; 
            background-color: white; 
            border-radius: 20px;
            color: ${customizar.cor1 || '#333'};
        }
        .totem-item-card { 
            border: 1px solid #ddd; 
            margin: 10px; 
            padding: 15px; 
            border-radius: 8px; 
            background: white; 
            text-align: center;
        }
    `;

    // --- Conteúdo Dinâmico ---
    const categoriesHtml = (itens.categorias || []).map(cat => 
        `<button>${cat.nome}</button>`
    ).join('');

    // Exibe até 3 itens aleatórios (ou os 3 primeiros)
    const randomItems = (itens.produtos || []).slice(0, 3).map(prod => `
        <div class="totem-item-card">
            <h4>${prod.nome}</h4>
            <p>R$ ${prod.preco ? prod.preco.toFixed(2) : '0.00'}</p>
            <button style="background: ${customizar.cor2 || '#2ecc71'}; color: white; border: none; padding: 10px;">Adicionar ao Carrinho</button>
        </div>
    `).join('');

    // --- HTML Final do Totem ---
    return `
        <style>${style}</style>
        
        <div class="totem-header">
            ${loja.urlLogo ? `<img src="${loja.urlLogo}" alt="Logo" style="height: 30px; margin-right: 10px;">` : ''}
            ${loja.nome || 'NOME DA LOJA'}
        </div>
        
        <div class="totem-category-bar">
            ${categoriesHtml || '<span>Nenhuma Categoria Cadastrada.</span>'}
        </div>
        
        <div style="padding: 10px;">
            <h3>Destaques do Cardápio</h3>
            <p style="font-size: 0.8em;">Total de itens no JSON: ${(itens.produtos || []).length}</p>
            ${randomItems || '<p>Cadastre itens para ver o cardápio.</p>'}
        </div>
        
        <div style="text-align: center; padding: 15px; background: #eee;">
            <button style="background: ${customizar.cor2 || '#3498db'}; color: white; padding: 10px;">Delivery</button>
            <button style="background: ${customizar.cor1 || '#2ecc71'}; color: white; padding: 10px;">Retirar</button>
        </div>
    `;
}
    // Inicialização
    if (localStorage.getItem('configData')) {
        // Se houver dados salvos, você pode carregar eles nos inputs aqui (lógica de loadData)
    }
    document.querySelector('#sidebar li[data-tab="loja"]').click();
});
// Adicionar as seguintes funções ao seu Painel.js

// --- LÓGICA GERAL DE MODAL ---
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Fechar modais ao clicar fora ou no X
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = function() {
        closeModal(this.closest('.modal').id);
    };
});
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
};


// --- FUNÇÕES DE CATEGORIAS ---

document.getElementById('create-cat-btn').addEventListener('click', () => {
    // Resetar formulário antes de abrir
    document.getElementById('cat-nome').value = '';
    document.getElementById('cat-sub').checked = false;
    document.getElementById('cat-sub-nome').value = '';
    openModal('modal-categorias');
});

document.getElementById('save-cat-btn').addEventListener('click', () => {
    const nome = document.getElementById('cat-nome').value;
    const temSub = document.getElementById('cat-sub').checked;
    const subNome = document.getElementById('cat-sub-nome').value;

    if (!nome) { alert('Nome da categoria é obrigatório.'); return; }

    const novaCat = {
        id: Date.now(), // ID único
        nome: nome,
        temSub: temSub,
        subNome: temSub ? subNome : null
    };

    // 1. Coleta dados atuais (ou inicializa)
    let data = collectFormData();
    if (!data.itens.categorias) data.itens.categorias = [];
    
    // 2. Adiciona e salva
    data.itens.categorias.push(novaCat);
    localStorage.setItem('configData', JSON.stringify(data));
    alert(`Categoria "${nome}" adicionada! Salve no Painel.`);
    
    closeModal('modal-categorias');
    // Força a atualização do painel de itens
    renderItemsLists(data);
});


// --- FUNÇÕES DE PRODUTOS ---

document.getElementById('add-item-btn').addEventListener('click', () => {
    // Lógica para popular o SELECT de categorias antes de abrir o modal
    const data = collectFormData();
    const select = document.getElementById('item-categoria-select');
    select.innerHTML = '<option value="">-- Selecione a Categoria --</option>';
    data.itens.categorias.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.nome;
        select.appendChild(opt);
    });
    
    // Resetar formulário (implementação omitida para brevidade)
    openModal('modal-item');
});

document.getElementById('save-item-btn').addEventListener('click', () => {
    // ... Lógica para coletar e salvar o item de forma semelhante à categoria ...
    alert('Item salvo (Lógica completa a ser implementada)!');
    closeModal('modal-item');
});


// --- FUNÇÃO PARA RENDERIZAR LISTAS (Simples) ---

function renderItemsLists(data) {
    const categoriasList = document.getElementById('categorias-list');
    categoriasList.innerHTML = '';
    
    (data.itens.categorias || []).forEach(cat => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<strong>${cat.nome}</strong> ${cat.temSub ? `(Sub: ${cat.subNome})` : ''} 
                          <button>Editar</button> <button>Excluir</button>`;
        categoriasList.appendChild(item);
    });
    
    // ... Lógica para renderizar produtos e modos...
}

// Altere a função de inicialização para chamar renderItemsLists(data)
// Exemplo:
// if (localStorage.getItem('configData')) {
//    const initialData = JSON.parse(localStorage.getItem('configData'));
//    renderItemsLists(initialData);
// }
// Adicione o seguinte código ao final do seu Painel.js

// --- LÓGICA DE EXPORTAÇÃO JSON ---
document.getElementById('export-json-btn').addEventListener('click', () => {
    const data = localStorage.getItem('configData');
    if (!data) {
        alert('Não há dados salvos localmente para exportar.');
        return;
    }

    const jsonString = JSON.stringify(JSON.parse(data), null, 2); // Formatação para legibilidade
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configuracao_painel_loja.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Configurações exportadas como configuracao_painel_loja.json!');
});


// --- LÓGICA DE IMPORTAÇÃO JSON ---
document.getElementById('import-json-btn').addEventListener('click', () => {
    // Cria um input de arquivo temporário
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validação básica (garante que tem a estrutura de dados esperada)
                if (typeof importedData.loja === 'object' && typeof importedData.itens === 'object') {
                    localStorage.setItem('configData', JSON.stringify(importedData));
                    alert('✨ Configurações importadas com sucesso! Salve para publicar.');
                    location.reload(); // Recarrega a página para aplicar os novos dados
                } else {
                    alert('❌ Erro: O arquivo JSON não parece ser um arquivo de configuração válido.');
                }
            } catch (error) {
                alert('❌ Erro ao processar o arquivo JSON. Verifique a formatação.');
                console.error('Import Error:', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click(); // Abre a janela de seleção de arquivo
});
