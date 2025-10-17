// Funciones para análisis de sentiment con Hugging Face

async function analyzeSentiment(texts) {
    const results = [];
    
    for (const text of texts) {
        if (!text || text.trim().length === 0) continue;
        
        try {
            const sentiment = await callHuggingFace(text);
            results.push(sentiment);
        } catch (error) {
            console.error('Error analizando texto:', error);
            // Si falla, usar neutral como fallback
            results.push({ label: 'neutral', score: 1.0 });
        }
        
        // Pequeña pausa para no sobrecargar la API
        await sleep(100);
    }
    
    return results;
}

async function callHuggingFace(text) {
    // Llamar a la función de Netlify en lugar de Hugging Face directamente
    const response = await fetch('/.netlify/functions/analyze-sentiment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: text.substring(0, 500)
        })
    });
    
    if (!response.ok) {
        throw new Error('Error en analisis de sentiment');
    }
    
    const result = await response.json();
    
    if (Array.isArray(result) && result.length > 0) {
        const sentiments = Array.isArray(result[0]) ? result[0] : result;
        const topSentiment = sentiments.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );
        
        return {
            label: normalizeSentimentLabel(topSentiment.label),
            score: topSentiment.score
        };
    }
    
    return { label: 'neutral', score: 1.0 };
}

function normalizeSentimentLabel(label) {
    const lower = label.toLowerCase();
    if (lower.includes('pos') || lower.includes('good')) return 'positive';
    if (lower.includes('neg') || lower.includes('bad')) return 'negative';
    return 'neutral';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
