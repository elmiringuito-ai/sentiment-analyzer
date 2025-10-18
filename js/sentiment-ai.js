// Funciones para análisis de sentiment usando Netlify Functions

async function analyzeSentiment(texts) {
    const results = [];
    
    for (const text of texts) {
        if (!text || text.trim().length === 0) continue;
        
        try {
            const sentiment = await callNetlifyFunction(text);
            results.push(sentiment);
        } catch (error) {
            console.error('Error analizando texto:', error);
            results.push({ label: 'neutral', score: 1.0 });
        }
        
        await sleep(100);
    }
    
    return results;
}

async function callNetlifyFunction(text) {
    const response = await fetch('/.netlify/functions/analyze-sentiment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text.substring(0, 500)
        })
    });
    
    if (!response.ok) {
        throw new Error('Error en API de sentiment');
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
