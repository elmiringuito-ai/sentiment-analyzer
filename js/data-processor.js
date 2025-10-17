// Funciones para procesar y agregar datos

function aggregateSentiments(sentiments) {
    const counts = {
        positive: 0,
        neutral: 0,
        negative: 0
    };
    
    sentiments.forEach(s => {
        counts[s.label]++;
    });
    
    const total = sentiments.length || 1;
    
    return {
        positive: Math.round((counts.positive / total) * 100),
        neutral: Math.round((counts.neutral / total) * 100),
        negative: Math.round((counts.negative / total) * 100),
        counts: counts,
        total: total
    };
}

function generateConclusions(postData, sentimentData) {
    const dominant = getDominantSentiment(sentimentData);
    const engagement = calculateEngagement(postData);
    const controversy = calculateControversy(sentimentData);
    
    let conclusion = `El análisis de sentiment revela una recepción `;
    
    if (dominant === 'positive') {
        conclusion += `mayormente positiva (${sentimentData.positive}%) hacia el contenido publicado. `;
        conclusion += `Los usuarios expresan apoyo y entusiasmo en sus comentarios. `;
    } else if (dominant === 'negative') {
        conclusion += `predominantemente negativa (${sentimentData.negative}%) hacia el contenido. `;
        conclusion += `Los comentarios reflejan críticas y desacuerdo con el mensaje. `;
    } else {
        conclusion += `equilibrada con un ${sentimentData.neutral}% de sentiment neutral. `;
        conclusion += `Los usuarios mantienen una postura moderada o buscan más información. `;
    }
    
    if (sentimentData.positive > 50) {
        conclusion += `El alto nivel de sentiment positivo indica una buena resonancia con la audiencia. `;
    }
    
    if (sentimentData.negative > 30) {
        conclusion += `El ${sentimentData.negative}% de sentiment negativo sugiere áreas de controversia que requieren atención. `;
    }
    
    conclusion += `El nivel de engagement es ${engagement.toLowerCase()} con ${postData.replies.length} comentarios analizados.`;
    
    return {
        text: conclusion,
        dominantTone: getToneName(dominant),
        engagement: engagement,
        controversy: controversy
    };
}

function getDominantSentiment(sentimentData) {
    const values = {
        positive: sentimentData.positive,
        neutral: sentimentData.neutral,
        negative: sentimentData.negative
    };
    
    return Object.keys(values).reduce((a, b) => values[a] > values[b] ? a : b);
}

function getToneName(sentiment) {
    const tones = {
        positive: 'ENTUSIASTA',
        neutral: 'MODERADO',
        negative: 'CRÍTICO'
    };
    return tones[sentiment] || 'MIXTO';
}

function calculateEngagement(postData) {
    const totalInteractions = postData.likes + postData.reposts + postData.replies.length;
    
    if (totalInteractions > 100) return 'ALTO';
    if (totalInteractions > 20) return 'MEDIO';
    return 'BAJO';
}

function calculateControversy(sentimentData) {
    const diff = Math.abs(sentimentData.positive - sentimentData.negative);
    
    if (diff < 20) return 'ALTA';
    if (diff < 50) return 'MEDIA';
    return 'BAJA';
}

function extractKeywords(texts) {
    // Palabras comunes a ignorar (stopwords en español e inglés)
    const stopwords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella', 'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa', 'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte', 'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar', 'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo', 'mundo', 'casa', 'usar', 'último', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír', 'acabar', 'the', 'and', 'is', 'it', 'to', 'of', 'this', 'that', 'for', 'are', 'was', 'have', 'been', 'has', 'not', 'but', 'they', 'with', 'from', 'had', 'will', 'would', 'there', 'their', 'what', 'out', 'about', 'who', 'get', 'which', 'when', 'make', 'can', 'like', 'time', 'just', 'him', 'know', 'take', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'muy', 'esta', 'está', 'son', 'tiene', 'tiene', 'todo', 'todos', 'puede', 'pueden', 'hacer', 'hace', 'hay'];
    
    const wordCount = {};
    
    texts.forEach(text => {
        const words = text.toLowerCase()
            .replace(/[^\w\sáéíóúñü]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopwords.includes(word));
        
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
    });
    
    // Ordenar por frecuencia y tomar top 10
    return Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}
