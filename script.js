const fieldForm = document.getElementById('field-form');
const fieldList = document.getElementById('field-list');
const dataForm = document.getElementById('data-form');
const saveDataButton = document.getElementById('save-data');

let fields = [];
let collectedData = [];
let selectedFile = null;

// Campos padrão
const defaultFields = ['unidade_municipal', 'cadastro_imobiliario', 'latitude', 'longitude'];
fields = [...defaultFields];

// Atualiza a interface com os campos padrão
updateFieldList();
updateDataForm();

// Função para normalizar os nomes dos campos
function normalizeFieldName(fieldName) {
    return fieldName
        .toLowerCase()
        .normalize('NFD') // Remove acentuações
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .replace(/\s+/g, '_') // Substitui espaços por underlines
        .replace(/[^a-z0-9_]/g, ''); // Remove caracteres especiais
}

// Adiciona um novo campo ao formulário
fieldForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fieldName = document.getElementById('field-name').value.trim();
    const normalizedFieldName = normalizeFieldName(fieldName);
    if (normalizedFieldName && !fields.includes(normalizedFieldName)) {
        fields.push(normalizedFieldName);
        updateFieldList();
        updateDataForm();
        document.getElementById('field-name').value = '';
    }
});

// Atualiza a lista de campos exibida
function updateFieldList() {
    fieldList.innerHTML = '';
    fields.forEach((field, index) => {
        const li = document.createElement('li');
        li.textContent = field;

        // Permite edição apenas para campos que não são padrão
        if (!defaultFields.includes(field)) {
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.addEventListener('click', () => editField(index));
            li.appendChild(editButton);
        }

        fieldList.appendChild(li);
    });
}

// Função para editar um campo
function editField(index) {
    const newFieldName = prompt('Editar nome do campo:', fields[index]);
    const normalizedFieldName = normalizeFieldName(newFieldName);
    if (normalizedFieldName && !fields.includes(normalizedFieldName)) {
        fields[index] = normalizedFieldName;
        updateFieldList();
        updateDataForm();
    } else if (fields.includes(normalizedFieldName)) {
        alert('Este campo já existe!');
    }
}

// Adiciona eventos para preencher os campos latitude e longitude ao colar coordenadas
function addPasteEvents() {
    const latitudeInput = document.querySelector('input[name="latitude"]');
    const longitudeInput = document.querySelector('input[name="longitude"]');

    if (latitudeInput) {
        latitudeInput.addEventListener('paste', (event) => {
            navigator.clipboard.readText().then((text) => {
                const lat = parseFloat(text);
                if (!isNaN(lat)) {
                    latitudeInput.value = lat.toFixed(6); // Preenche o campo com a latitude
                }
            });
        });
    }

    if (longitudeInput) {
        longitudeInput.addEventListener('paste', (event) => {
            navigator.clipboard.readText().then((text) => {
                const lng = parseFloat(text);
                if (!isNaN(lng)) {
                    longitudeInput.value = lng.toFixed(6); // Preenche o campo com a longitude
                }
            });
        });
    }
}

// Monitora a área de transferência e preenche os campos latitude e longitude
function monitorClipboardForCoordinates() {
    setInterval(async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            const [lat, lng] = clipboardText.split(',').map(coord => parseFloat(coord.trim()));

            if (!isNaN(lat) && !isNaN(lng)) {
                const latitudeInput = document.querySelector('input[name="latitude"]');
                const longitudeInput = document.querySelector('input[name="longitude"]');

                if (latitudeInput && longitudeInput) {
                    latitudeInput.value = lat.toFixed(6); // Preenche o campo latitude
                    longitudeInput.value = lng.toFixed(6); // Preenche o campo longitude

                    // Limpa a área de transferência
                    await navigator.clipboard.writeText('');
                }
            }
        } catch (err) {
            console.error('Erro ao acessar ou limpar a área de transferência:', err);
        }
    }, 1000); // Verifica a cada 1 segundo
}

// Chama a função para monitorar a área de transferência
monitorClipboardForCoordinates();

// Atualiza o formulário de coleta de dados
function updateDataForm() {
    dataForm.innerHTML = '';
    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = field;
        input.placeholder = field;
        dataForm.appendChild(input);
    });

    // Remova a chamada para addGoogleMapsEvents
    addPasteEvents();
}

// Função para normalizar o valor do campo unidade_municipal para o nome do arquivo
function normalizeFileName(value) {
    return value
        .toLowerCase()
        .normalize('NFD') // Remove acentuações
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .replace(/\s+/g, '_') // Substitui espaços por underlines
        .replace(/[^a-z0-9_]/g, ''); // Remove caracteres especiais
}

// Função para limpar os campos latitude e longitude
function clearCoordinates() {
    const latitudeInput = document.querySelector('input[name="latitude"]');
    const longitudeInput = document.querySelector('input[name="longitude"]');

    if (latitudeInput) latitudeInput.value = '';
    if (longitudeInput) longitudeInput.value = '';
}

// Limpa os campos latitude e longitude ao carregar a aplicação
window.addEventListener('load', () => {
    clearCoordinates();
});

// Salva os dados coletados em um arquivo .csv
saveDataButton.addEventListener('click', () => {
    const formData = new FormData(dataForm);
    const data = fields.map(field => (formData.get(field) || '').toUpperCase()).join(','); // Apenas valores em maiúsculas
    if (collectedData.length === 0) {
        collectedData.push(fields.join(',')); // Cabeçalho original (nomes dos campos)
    }
    collectedData.push(data);

    const unidadeMunicipal = (formData.get('unidade_municipal') || 'sem_nome').toUpperCase();
    const normalizedUnidadeMunicipal = normalizeFileName(unidadeMunicipal);
    const filename = `dados_${normalizedUnidadeMunicipal}.csv`;

    downloadFile(selectedFile || filename, collectedData.join('\n'));
});

// Adiciona um novo registro ao formulário
document.getElementById('new-record').addEventListener('click', () => {
    const formData = new FormData(dataForm);
    const data = fields.map(field => (formData.get(field) || '').toUpperCase()).join(','); // Apenas valores em maiúsculas
    if (collectedData.length === 0) {
        collectedData.push(fields.join(',')); // Cabeçalho original (nomes dos campos)
    }
    collectedData.push(data);
    dataForm.reset();
    clearCoordinates();
});

// Permite a escolha de um arquivo .txt para continuar o cadastro
document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result.split('\n');
            fields = [...defaultFields, ...content[0].split(',').filter(f => !defaultFields.includes(f))];
            collectedData = content;
            updateFieldList();
            updateDataForm();
        };
        reader.readAsText(file);
    }
});

// Função para baixar o arquivo
function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content)); // Alterado para text/csv
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Alterna entre as abas
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');

        // Ativa o botão da aba
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Mostra o conteúdo da aba correspondente
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// Adiciona evento ao botão "Coletar Coordenadas"
document.getElementById('collect-coordinates').addEventListener('click', () => {
    window.open('https://www.google.com/maps', '_blank'); // Abre o Google Maps em uma nova aba
});

// Chama a função para limpar os campos latitude e longitude após o carregamento completo
document.addEventListener('DOMContentLoaded', () => {
    clearCoordinates();
});
