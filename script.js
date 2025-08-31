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

    // Limpa os campos do formulário
    dataForm.reset();
    clearCoordinates();
    if (drawnItems) {
        drawnItems.clearLayers();
    }
    const coordDiv = document.getElementById('marker-coords-map');
    if (coordDiv && coordDiv.parentNode) {
        coordDiv.parentNode.removeChild(coordDiv);
    }

    alert('Dados salvos e formulário limpo com sucesso!');
});

// Adiciona um novo registro ao formulário
document.getElementById('new-record').addEventListener('click', () => {
    const formData = new FormData(dataForm);
    const data = fields.map(field => (formData.get(field) || '').toUpperCase()).join(',');
    if (collectedData.length === 0) {
        collectedData.push(fields.join(','));
    }
    collectedData.push(data);
    dataForm.reset();
    clearCoordinates();

    // Limpa o mapa e coordenadas
    if (drawnItems) {
        drawnItems.clearLayers();
    }
    // Remove coordenadas do topo do mapa
    const coordDiv = document.getElementById('marker-coords-map');
    if (coordDiv && coordDiv.parentNode) {
        coordDiv.parentNode.removeChild(coordDiv);
    }

    navigator.clipboard.writeText('').then(() => {
        console.log('Área de transferência limpa após novo registro.');
    });
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

// Variável global para o mapa e itens desenhados
let leafletMap;
let drawnItems;

// Inicialização do Leaflet com ferramentas de desenho
function initLeafletMap() {
    if (leafletMap) return;

    leafletMap = L.map('map').setView([-20.5382, -47.4009], 12);

    const baseLayers = {
        'Padrão': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }),
        'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri'
        }),
        'Híbrido': L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            attribution: 'Map data © Google'
        })
    };

    baseLayers['Padrão'].addTo(leafletMap);

    L.control.layers(baseLayers).addTo(leafletMap);

    drawnItems = new L.FeatureGroup();
    leafletMap.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
            polygon: true,
            polyline: true,
            rectangle: true,
            circle: true,
            marker: true
        }
    });
    leafletMap.addControl(drawControl);

    leafletMap.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);

        if (event.layerType === 'marker') {
            const { lat, lng } = layer.getLatLng();
            const popupContent = `
                <div>
                    <strong>Coordenadas:</strong><br>
                    Latitude: ${lat}<br>
                    Longitude: ${lng}<br>
                    <button onclick="copyToClipboard('${lat}, ${lng}')">Copiar para Área de Transferência</button>
                </div>
            `;
            layer.bindPopup(popupContent).openPopup();
        }
    });
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

        // Inicialização do Leaflet e Leaflet Draw
        let leafletMap;
        function initLeafletMap() {
            if (leafletMap) return;

            leafletMap = L.map('map').setView([-20.5382, -47.4009], 12);

            const baseLayers = {
                'Padrão': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }),
                'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles © Esri'
                }),
                'Híbrido': L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                    attribution: 'Map data © Google'
                })
            };

            baseLayers['Padrão'].addTo(leafletMap);

            L.control.layers(baseLayers).addTo(leafletMap);

            drawnItems = new L.FeatureGroup();
            leafletMap.addLayer(drawnItems);

            const drawControl = new L.Control.Draw({
                edit: { featureGroup: drawnItems },
                draw: {
                    polygon: true,
                    polyline: true,
                    rectangle: true,
                    circle: true,
                    marker: true
                }
            });
            leafletMap.addControl(drawControl);

            leafletMap.on(L.Draw.Event.CREATED, function (event) {
                const layer = event.layer;
                drawnItems.addLayer(layer);

                if (event.layerType === 'marker') {
                    const { lat, lng } = layer.getLatLng();
                    const popupContent = `
                        <div>
                            <strong>Coordenadas:</strong><br>
                            Latitude: ${lat}<br>
                            Longitude: ${lng}<br>
                            <button onclick="copyToClipboard('${lat}, ${lng}')">Copiar para Área de Transferência</button>
                        </div>
                    `;
                    layer.bindPopup(popupContent).openPopup();
                }
            });
        }

        // Ajusta o tamanho do mapa e garante que o evento de clique seja registrado corretamente
        if (tab === 'map-tab') {
            setTimeout(() => {
                initLeafletMap();
                if (leafletMap) {
                    leafletMap.invalidateSize();
                }
            }, 200); // Garante que o elemento esteja visível
        }
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
document.addEventListener('DOMContentLoaded', () => {
    clearCoordinates();
});

// Adicione um elemento fixo no topo para mostrar as coordenadas e botão de copiar
function showMarkerCoordinates(lat, lng) {
    // Seleciona o container do mapa
    const mapTab = document.getElementById('map-tab');
    if (!mapTab) return;

    // Cria ou atualiza o container das coordenadas no topo do mapa
    let coordDiv = document.getElementById('marker-coords-map');
    if (!coordDiv) {
        coordDiv = document.createElement('div');
        coordDiv.id = 'marker-coords-map';
        coordDiv.style.position = 'absolute';
        coordDiv.style.top = '10px';
        coordDiv.style.left = '50%';
        coordDiv.style.transform = 'translateX(-50%)';
        coordDiv.style.background = '#fff';
        coordDiv.style.zIndex = '999';
        coordDiv.style.padding = '8px 16px';
        coordDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        coordDiv.style.display = 'flex';
        coordDiv.style.justifyContent = 'center';
        coordDiv.style.alignItems = 'center';
        coordDiv.style.gap = '10px';
        coordDiv.style.borderRadius = '6px';

        // Adiciona o container dentro do div do mapa
        const mapDiv = document.getElementById('map');
        if (mapDiv) {
            mapDiv.style.position = 'relative';
            mapDiv.appendChild(coordDiv);
        }
    }

    // Atualiza ou cria o texto das coordenadas
    let span = coordDiv.querySelector('span');
    if (!span) {
        span = document.createElement('span');
        coordDiv.appendChild(span);
    }
    span.textContent = `Coordenadas do marcador: Latitude ${lat.toFixed(6)}, Longitude ${lng.toFixed(6)}`;

    // Atualiza ou cria o botão de copiar
    let copyBtn = coordDiv.querySelector('button');
    if (!copyBtn) {
        copyBtn = document.createElement('button');
        copyBtn.id = 'copy-coords-btn';
        copyBtn.textContent = 'Copiar Coordenadas';
        copyBtn.style.padding = '5px 10px';
        copyBtn.style.background = '#007BFF';
        copyBtn.style.color = '#fff';
        copyBtn.style.border = 'none';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(`${lat.toFixed(6)},${lng.toFixed(6)}`);
        };
        coordDiv.appendChild(copyBtn);
    } else {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(`${lat.toFixed(6)},${lng.toFixed(6)}`);
        };
    }
}

// Atualiza os campos de latitude e longitude no formulário
function updateFormCoordinates(lat, lng) {
    const latitudeField = dataForm.querySelector('input[name="latitude"]');
    const longitudeField = dataForm.querySelector('input[name="longitude"]');
    if (latitudeField && longitudeField) {
        latitudeField.value = lat;
        longitudeField.value = lng;
    } else {
        console.warn('Campos de latitude e longitude não encontrados no formulário.');
    }
}

// Função para criar uma popup com botão de copiar coordenadas
function createPopup(lat, lng) {
    const popupContent = `<div>
        <p>Lat: ${lat}, Lng: ${lng}</p>
        <button style="cursor: pointer;" onclick="copyToClipboard('${lat}, ${lng}'); updateFormCoordinates(${lat}, ${lng});">
            Copiar Coordenadas
        </button>
    </div>`;
    return popupContent;
}

// Função para criar um marcador ao clicar no mapa
function addMarkerWithPopup(lat, lng) {
    const marker = L.marker([lat, lng]).addTo(leafletMap);

    const popupContent = `
        <div>
            <strong>Coordenadas:</strong><br>
            Latitude: ${lat}<br>
            Longitude: ${lng}<br>
            <button onclick="copyToClipboard('${lat}, ${lng}')">Copiar para Área de Transferência</button>
        </div>
    `;

    marker.bindPopup(popupContent).openPopup();
}

// Função para copiar texto para a área de transferência do Windows
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Texto copiado para a área de transferência:', text);
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
    });
}
