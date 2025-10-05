document.addEventListener('DOMContentLoaded', () => {
    const sidebarItems = document.querySelectorAll('#sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');
    const saveBtn = document.getElementById('save-btn');
    const publishBtn = document.getElementById('publish-btn');
    const previewFrame = document.getElementById('totem-preview-frame');
    
    // Botões de Ação Específica
    const addCoberturaBtn = document.getElementById('add-cobertura-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const importJsonBtn = document.getElementById('import-json-btn');

    // Botões e Modais de ITENS
    const createCatBtn = document.getElementById('create-cat-btn');
    const saveCatBtn = document.getElementById('save-cat-btn');
    const addIitemBtn = document.getElementById('add-item-btn');
    const saveItemBtn = document.getElementById('save-item-btn');
    

    // --- UTILS: MODAIS ---
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = function() { closeModal(this.closest('.modal').id); };
    });
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) { closeModal(event.target.id); }
    };

    // --- UTILS: Renderizar Listas (Para a aba ITENS) ---
    function renderItemsLists(data) {
        const categoriasList = document.getElementById('categorias-list');
        const produtosList = document.getElementById('produtos-list');
        categoriasList.innerHTML = '';
        produtosList.innerHTML = '';

        (data.itens.categorias || []).forEach(cat => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `<strong>${cat.nome}</strong> ${cat.temSub ? `(Sub: ${cat.subNome})` : ''} 
                              <button data-id="${cat.id}" class="edit-cat">Editar</button> <button data-id="${cat.id}" class="delete-cat">Excluir</button>`;
            categoriasList.appendChild(item);
        });
        
        (data.itens.produtos || []).forEach(prod => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `<strong>${prod.nome}</strong> (R$ ${prod.preco.toFixed(2)}) - ${prod.ativo ? 'Ativo' : 'Inativo'}
                              <button data-id="${prod.id}" class="edit-item">Editar</button> <button data-id="${prod.id}" class="delete-item">Excluir</button>`;
            produtosList.appendChild(item);
        });
    }


    // --- 1. COLETA DE DADOS (SERIALIZAÇÃO PARA JSON) ---

    function collectFormData() {
        const data = {};
        
        document.querySelectorAll('.tab-content[data-group]').forEach(section => {
            const groupKey = section.getAttribute('data-group');
            const groupData = {};

            // Coletar dados simples de INPUT/TEXTAREA/SELECT
            section.querySelectorAll('[data-key]').forEach(input => {
                const key = input.getAttribute('data-key');
                let value;

                if (input.type === 'checkbox') {
                    value = input.checked;
                } else if (input.type === 'number' || input.type === 'range') {
                    value = parseFloat(input.value) || input.value;
                } else {
                    value = input.value;
                }
                groupData[key] = value;
            });
            
            // LÓGICA DE ARRAYS
            let existingData = JSON.parse(localStorage.getItem('configData'));
            
            if (groupKey === 'loja') {
                // Área de Cobertura
                const coberturaList = Array.from(document.querySelectorAll('#cobertura-list > div')).map(item => ({
                    bairro: item.getAttribute('data-bairro'),
                    taxa: parseFloat(item.getAttribute('data-taxa'))
                }));
                groupData.cobertura = coberturaList;
            }

            if (groupKey === 'itens') {
                // Mantém os arrays de itens e categorias do estado salvo
                groupData.categorias = existingData?.itens?.categorias || [];
                groupData.produtos = existingData?.itens?.produtos || [];
                groupData.modos = existingData?.itens?.modos || [];
            }
            if (groupKey === 'publicidades') {
                groupData.cupons = existingData?.publicidades?.cupons || [];
            }

            data[groupKey] = groupData;
        });

        return data;
    }
    
    // --- 2. FUNÇÕES DE AÇÃO GERAL ---

    // SALVAR/EDITAR (localStorage)
    saveBtn.addEventListener('click', () => {
        const data = collectFormData();
        localStorage.setItem('configData', JSON.stringify(data));
        alert('Configurações salvas localmente!');
        renderItemsLists(data); // Atualiza listas de itens
        updatePreview();
    });

    // PUBLICAR (JSONBin com Fetch)
    publishBtn.addEventListener('click', async () => {
        const binId = document.getElementById('bin-id').value.trim();
        const masterKey = document.getElementById('master-key').value.trim();
        const data = collectFormData(); 

        if (!data || !binId || !masterKey) {
            alert('Erro: Preencha BinID, Chave Master e clique em SALVAR antes de publicar.');
            return;
        }

        const endpoint = `https://api.jsonbin.io/v3/b/${binId}`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': masterKey,
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('🚀 Publicado com sucesso no JSONBin! Seu Totem está atualizado.');
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

    // --- 3. UTILS: Importação/Exportação JSON ---
    exportJsonBtn.addEventListener('click', () => {
        const data = localStorage.getItem('configData');
        if (!data) { alert('Não há dados salvos localmente para exportar.'); return; }
        const jsonString = JSON.stringify(JSON.parse(data), null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'configuracao_painel_loja.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    });

    importJsonBtn.addEventListener('click', () => {
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
                    if (typeof importedData.loja === 'object' && typeof importedData.itens === 'object') {
                        localStorage.setItem('configData', JSON.stringify(importedData));
                        alert('✨ Configurações importadas com sucesso! Recarregue a página.');
                        // location.reload(); // Descomente para recarregar automaticamente
                    } else {
                        alert('❌ Erro: O arquivo JSON não parece ser um arquivo de configuração válido.');
                    }
                } catch (error) {
                    alert('❌ Erro ao processar o arquivo JSON. Verifique a formatação.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // --- 4. GESTÃO DE ARRAYS (Cobertura) ---
    addCoberturaBtn.addEventListener('click', () => {
        const bairro = document.getElementById('bairro-input').value.trim();
        const taxa = document.getElementById('taxa-input').value.trim();
        
        if (bairro && taxa) {
            const list = document.getElementById('cobertura-list');
            const item = document.createElement('div');
            item.setAttribute('data-bairro', bairro);
            item.setAttribute('data-taxa', taxa);
            item.className = 'list-item-cobertura';
            item.innerHTML = `<span>${bairro}: R$ ${taxa}</span> <button onclick="this.parentNode.remove()">X</button>`;
            list.appendChild(item);
            document.getElementById('bairro-input').value = '';
            document.getElementById('taxa-input').value = '';
            alert('Bairro adicionado. Clique em SALVAR para persistir no JSON.');
        }
    });


    // --- 5. GESTÃO DE ITENS (Categorias) ---
    createCatBtn.addEventListener('click', () => {
        // Limpa e abre o modal para criação
        document.getElementById('cat-id-edit').value = '';
        document.getElementById('cat-nome').value = '';
        document.getElementById('cat-sub').checked = false;
        document.getElementById('cat-sub-nome').value = '';
        openModal('modal-categorias');
    });

    saveCatBtn.addEventListener('click', () => {
        const nome = document.getElementById('cat-nome').value;
        const temSub = document.getElementById('cat-sub').checked;
        const subNome = document.getElementById('cat-sub-nome').value;
        const editId = document.getElementById('cat-id-edit').value;

        if (!nome) { alert('Nome da categoria é obrigatório.'); return; }

        let data = JSON.parse(localStorage.getItem('configData')) || collectFormData();
        if (!data.itens.categorias) data.itens.categorias = [];
        
        const novaCat = {
            id: editId || Date.now(),
            nome: nome,
            temSub: temSub,
            subNome: temSub ? subNome : null
        };
        
        // Lógica de Edição ou Criação
        if (editId) {
            data.itens.categorias = data.itens.categorias.map(c => c.id == editId ? novaCat : c);
            alert(`Categoria "${nome}" atualizada!`);
        } else {
            data.itens.categorias.push(novaCat);
            alert(`Categoria "${nome}" adicionada!`);
        }
        
        localStorage.setItem('configData', JSON.stringify(data));
        closeModal('modal-categorias');
        renderItemsLists(data);
    });

    // **TODO: Implementar funções addIitemBtn e saveItemBtn de forma semelhante à gestão de categorias**


    // --- 6. PREVIEW DO TOTEM ---

    function generateTotemHtml(data) {
        const loja = data.loja || {};
        const customizar = data.customizar || {};
        const itens = data.itens || { categorias: [], produtos: [] };

        // --- Estilos Base (Usando dados de Customização) ---
        const style = `
            body { font-family: sans-serif; margin: 0; background-color: ${customizar.fundoUrlCor || '#f4f4f4'}; color: ${customizar.cor1 || '#333'}; }
            .totem-header { background-color: ${customizar.cor2 || '#2c3e50'}; color: white; padding: 10px; text-align: center; font-weight: bold; }
            .totem-category-bar { display: flex; overflow-x: auto; padding: 10px 0; background-color: #ecf0f1; border-bottom: 1px solid #ddd;}
            .totem-category-bar button { flex-shrink: 0; margin: 0 5px; padding: 8px 15px; border: 1px solid #ccc; background-color: white; border-radius: 20px; color: ${customizar.cor1 || '#333'};}
            .totem-item-card { border: 1px solid #ddd; margin: 10px; padding: 15px; border-radius: 8px; background: white; text-align: center;}
        `;

        // --- Conteúdo Dinâmico ---
        const categoriesHtml = (itens.categorias || []).map(cat => 
            `<button>${cat.nome}</button>`
        ).join('');

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
                ${loja.nome || 'NOME DA LOJA (Preview)'}
            </div>
            
            <div class="totem-category-bar">
                ${categoriesHtml || '<span>Nenhuma Categoria Cadastrada.</span>'}
            </div>
            
            <div style="padding: 10px;">
                <h3>Destaques do Cardápio</h3>
                <p style="font-size: 0.8em;">Itens no JSON: ${(itens.produtos || []).length}</p>
                ${randomItems || '<p>Cadastre itens para ver o cardápio.</p>'}
            </div>
            
            <div style="text-align: center; padding: 15px; background: #eee;">
                <button style="background: ${customizar.cor2 || '#3498db'}; color: white; padding: 10px;">Delivery</button>
                <button style="background: ${customizar.cor1 || '#2ecc71'}; color: white; padding: 10px;">Retirar</button>
            </div>
        `;
    }

    function updatePreview() {
        const savedData = JSON.parse(localStorage.getItem('configData'));
        const dataToDisplay = savedData || collectFormData(); 
        const totemHtml = generateTotemHtml(dataToDisplay);
        previewFrame.srcdoc = totemHtml;
    }

    // --- 7. INICIALIZAÇÃO ---
    function initialize() {
        const initialData = JSON.parse(localStorage.getItem('configData'));
        if (initialData) {
            // **TODO: Implementar loadDataIntoForms(initialData) aqui para preencher os inputs**
            renderItemsLists(initialData);
        }
        
        // Simular clique na primeira aba
        document.querySelector('#sidebar li[data-tab="loja"]').click();
    }
    
    // Troca de Abas
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
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

    initialize();
});
// --- 7. INICIALIZAÇÃO ---
function initialize() {
    const initialData = JSON.parse(localStorage.getItem('configData'));
    if (initialData) {
        // ... (Aqui seria o código para preencher os inputs simples)
        
        // CHAMA A FUNÇÃO QUE RECARREGA OS ARRAYS DE ITENS E CATEGORIAS
        renderItemsLists(initialData); 
        
        // CHAMAMOS UMA FUNÇÃO PARA RECARREGAR A COBERTURA
        loadCobertura(initialData.loja.cobertura); 
    }
    
    // Simular clique na primeira aba
    document.querySelector('#sidebar li[data-tab="loja"]').click();
}


// NOVO CÓDIGO: Função para carregar os bairros de volta na tela
function loadCobertura(coberturaArray) {
    const list = document.getElementById('cobertura-list');
    list.innerHTML = ''; // Limpa antes de carregar
    
    (coberturaArray || []).forEach(item => {
        const div = document.createElement('div');
        div.setAttribute('data-bairro', item.bairro);
        div.setAttribute('data-taxa', item.taxa);
        div.className = 'list-item-cobertura';
        div.innerHTML = `<span>${item.bairro}: R$ ${item.taxa}</span> <button onclick="this.parentNode.remove()">X</button>`;
        list.appendChild(div);
    });
}
