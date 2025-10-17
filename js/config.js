// Configuración de la aplicación
const CONFIG = {
    // El token se cargará del localStorage
    get HUGGINGFACE_TOKEN() {
        return localStorage.getItem('hf_token') || '';
    },
    
    // APIs endpoints
    BLUESKY_API: 'https://public.api.bsky.app/xrpc',
    HUGGINGFACE_API: 'https://api-inference.huggingface.co/models',
    
    // Modelos de IA
    SENTIMENT_MODEL: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
    
    // Límites
    MAX_COMMENTS: 100
};
