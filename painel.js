document.addEventListener('DOMContentLoaded', () => {
    const sidebarItems = document.querySelectorAll('#sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');
    const saveBtn = document.getElementById('save-btn');
    const publishBtn = document.getElementById('publish-btn');
    const previewFrame = document.getElementById('totem-preview-frame');

    // Função para Troca de Abas
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Remove 'active' de todos os links e conteúdos
            sidebarItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 2. Adiciona 'active' ao clicado
            item.classList.add('active');
            const targetId = item.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            // 3. Atualiza o Preview se a aba for 'preview'
            if (targetId === 'preview') {
                updatePreview();
            }
        });
    });

    // Função para SALVAR/EDITAR (localStorage)
    saveBtn.addEventListener('click', () => {
        const data = collectFormData(); // Função que coletaria todos os dados dos formulários
        localStorage.setItem('configData', JSON.stringify(data));
        alert('Configurações salvas localmente!');
        updatePreview(); // Atualiza a visualização após salvar
    });

    // Função para PUBLICAR (JSONBin)
    publishBtn.addEventListener('click', () => {
        const binId = document.getElementById('bin-id').value;
        const masterKey = document.getElementById('master-key').value;
        const data = localStorage.getItem('configData');

        if (!data || !binId || !masterKey) {
            alert('Preencha todos os campos e salve as configurações antes de publicar.');
            return;
        }

        // Simulação da chamada de API para o JSONBin (substituir pela lógica real)
        console.log(`Publicando dados para o BinID: ${binId}`);
        alert('Dados enviados para JSONBin (Simulado)!');
    });

    // Função que gera o HTML do Totem com base nos dados salvos
    function generateTotemHtml(data) {
        // **Aqui você implementaria a lógica para gerar o HTML in-line do totem**
        // usando os 'data' salvos.
        // Por agora, retorna uma estrutura simples de placeholder.
        return `
            <style>body{font-family: sans-serif; padding: 20px; background-color: #f0f8ff;}</style>
            <h1>TOTEM - PRÉ-VISUALIZAÇÃO</h1>
            <p>Configurações da Loja: ${data ? data.loja.nome : 'N/A'}</p>
            <p>Este é o layout final que será publicado.</p>
        `;
    }

    // Função para atualizar o iframe de Preview
    function updatePreview() {
        const savedData = JSON.parse(localStorage.getItem('configData')) || {loja: {nome: "Loja Teste"}};
        const totemHtml = generateTotemHtml(savedData);
        previewFrame.srcdoc = totemHtml;
    }

    // Exemplo de função que coletaria dados (Implementação real é mais complexa)
    function collectFormData() {
        // A lógica real percorreria todos os inputs das abas e organizaria em um objeto JSON
        return {
            loja: {
                nome: document.querySelector('#loja-form input[placeholder="Nome da Loja"]').value,
                telefone: document.querySelector('#loja-form input[placeholder="Telefone"]').value,
                // ...
            },
            itens: { /* ... */ },
            customizar: { /* ... */ },
            publicidades: { /* ... */ }
        };
    }

    // Carregar dados iniciais e exibir a primeira aba
    // A lógica real carregaria dados do localStorage
    if (localStorage.getItem('configData')) {
        // updatePreview(); // Carregar preview inicial
    }
    
    // Simular clique na primeira aba
    document.querySelector('#sidebar li[data-tab="loja"]').click();
});
