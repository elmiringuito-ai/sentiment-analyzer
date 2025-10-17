// Aplicación principal

let currentAnalysis = null;

function saveToken(token) {
    localStorage.setItem('hf_token', token);
    console.log('Token guardado');
}

function getToken() {
    return localStorage.getItem('hf_token') || '';
}

function hasValidToken() {
    const token = getToken();
    return token && token.length > 0 && token.startsWith('hf_');
}

function clearToken() {
    localStorage.removeItem('hf_token');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicacion cargada');
    
    const tokenSetup = document.getElementById('tokenSetup');
    const analysisSection = document.getElementById('analysisSection');
    const tokenInput = document.getElementById('tokenInput');
    const saveTokenBtn = document.getElementById('saveTokenBtn');
    const changeTokenBtn = document.getElementById('changeTokenBtn');
    const urlInput = document.getElementById('urlInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const errorText = document.getElementById('errorText');
    const inputScreen = document.getElementById('inputScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const backBtn = document.getElementById('backBtn');
    
    checkTokenStatus();
    
    saveTokenBtn.addEventListener('click', handleSaveToken);
    changeTokenBtn.addEventListener('click', handleChangeToken);
    analyzeBtn.addEventListener('click', startAnalysis);
    backBtn.addEventListener('click', resetApp);
    
    urlInput.addEventListener('input', () => {
        errorSection.classList.add('hidden');
    });
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startAnalysis();
        }
    });
    
    console.log('Listeners configurados');
    
    function checkTokenStatus() {
        console.log('Verificando token...');
        if (hasValidToken()) {
            console.log('Token encontrado');
            showAnalysisSection();
        } else {
            console.log('No hay token');
            showTokenSetup();
        }
    }
    
    function showTokenSetup() {
        tokenSetup.classList.remove('hidden');
        analysisSection.classList.add('hidden');
    }
    
    function showAnalysisSection() {
        tokenSetup.classList.add('hidden');
        analysisSection.classList.remove('hidden');
    }
    
    function handleSaveToken() {
        console.log('Boton clickeado');
        const token = tokenInput.value.trim();
        
        if (!token) {
            alert('Por favor, ingresa un token valido');
            return;
        }
        
        if (!token.startsWith('hf_')) {
            alert('El token debe comenzar con hf_');
            return;
        }
        
        saveToken(token);
        alert('Token guardado correctamente');
        showAnalysisSection();
        tokenInput.value = '';
    }
    
    function handleChangeToken() {
        if (confirm('Quieres cambiar tu token de Hugging Face?')) {
            clearToken();
            showTokenSetup();
        }
    }
    
    async function startAnalysis() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Por favor, introduce una URL valida');
            return;
        }
        
        if (!url.includes('bsky.app')) {
            showError('Por favor, introduce una URL de Bluesky valida');
            return;
        }
        
        analyzeBtn.disabled = true;
        loadingSection.classList.remove('hidden');
        errorSection.classList.add('hidden');
        
        try {
            console.log('Extrayendo datos del post...');
            const postData = await extractPostData(url);
            
            if (postData.replies.length === 0) {
                throw new Error('Este post no tiene comentarios para analizar');
            }
            
            console.log('Analizando sentiment...');
            const commentTexts = postData.replies.map(r => r.text);
            const sentiments = await analyzeSentiment(commentTexts);
            
            console.log('Procesando resultados...');
            const sentimentData = aggregateSentiments(sentiments);
            const conclusions = generateConclusions(postData, sentimentData);
            const keywords = extractKeywords(commentTexts);
            
            currentAnalysis = {
                url: url,
                postData: postData,
                sentimentData: sentimentData,
                conclusions: conclusions,
                keywords: keywords
            };
            
            displayResults();
            
        } catch (error) {
            console.error('Error en analisis:', error);
            showError(error.message || 'Error al analizar el post');
            analyzeBtn.disabled = false;
            loadingSection.classList.add('hidden');
        }
    }
    
    function displayResults() {
        inputScreen.classList.remove('active');
        resultsScreen.classList.add('active');
        
        const { url, postData, sentimentData, conclusions, keywords } = currentAnalysis;
        
        document.getElementById('analyzedUrl').textContent = url;
        document.getElementById('likesCount').textContent = formatNumber(postData.likes);
        document.getElementById('repostsCount').textContent = formatNumber(postData.reposts);
        document.getElementById('commentsCount').textContent = postData.replies.length;
        document.getElementById('reachCount').textContent = formatNumber(postData.likes * 10);
        
        document.getElementById('positiveBar').style.width = sentimentData.positive + '%';
        document.getElementById('neutralBar').style.width = sentimentData.neutral + '%';
        document.getElementById('negativeBar').style.width = sentimentData.negative + '%';
        
        document.getElementById('positivePercent').textContent = sentimentData.positive + '%';
        document.getElementById('neutralPercent').textContent = sentimentData.neutral + '%';
        document.getElementById('negativePercent').textContent = sentimentData.negative + '%';
        
        createSentimentChart(sentimentData);
        
        document.getElementById('conclusionsText').textContent = conclusions.text;
        document.getElementById('dominantTone').textContent = conclusions.dominantTone;
        document.getElementById('engagementLevel').textContent = conclusions.engagement;
        document.getElementById('controversyLevel').textContent = conclusions.controversy;
        
        displayKeywords(keywords);
        
        window.scrollTo(0, 0);
    }
    
    function createSentimentChart(sentimentData) {
        const ctx = document.getElementById('sentimentChart');
        
        if (window.sentimentChartInstance) {
            window.sentimentChartInstance.destroy();
        }
        
        window.sentimentChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Positivo', 'Neutral', 'Negativo'],
                datasets: [{
                    data: [sentimentData.positive, sentimentData.neutral, sentimentData.negative],
                    backgroundColor: ['#05E6C6', '#95a5a6', '#e74c3c'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
    
    function displayKeywords(keywords) {
        const container = document.getElementById('keywordsContainer');
        container.innerHTML = '';
        
        if (keywords.length === 0) {
            container.innerHTML = '<p style="color: #95a5a6;">No se encontraron palabras clave relevantes</p>';
            return;
        }
        
        keywords.forEach(keyword => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag';
            tag.textContent = keyword;
            container.appendChild(tag);
        });
    }
    
    function showError(message) {
        errorText.textContent = message;
        errorSection.classList.remove('hidden');
    }
    
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    function resetApp() {
        resultsScreen.classList.remove('active');
        inputScreen.classList.add('active');
        
        urlInput.value = '';
        analyzeBtn.disabled = false;
        loadingSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        currentAnalysis = null;
        
        window.scrollTo(0, 0);
    }
});

console.log('app.js cargado');
