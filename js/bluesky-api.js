// Funciones para interactuar con la API de Bluesky

async function extractPostData(url) {
    try {
        // Extraer información de la URL
        const urlParts = parseBlueskyUrl(url);
        if (!urlParts) {
            throw new Error('URL de Bluesky inválida');
        }

        // Construir el AT URI
        const atUri = await resolveHandleToUri(urlParts.handle, urlParts.postId);
        
        // Obtener el post y sus comentarios
        const postData = await fetchPostThread(atUri);
        
        return postData;
    } catch (error) {
        console.error('Error extrayendo datos:', error);
        throw error;
    }
}

function parseBlueskyUrl(url) {
    // Ejemplo: https://bsky.app/profile/usuario.bsky.social/post/3kx...
    const regex = /bsky\.app\/profile\/([^\/]+)\/post\/([^\/\?]+)/;
    const match = url.match(regex);
    
    if (!match) return null;
    
    return {
        handle: match[1],
        postId: match[2]
    };
}

async function resolveHandleToUri(handle, postId) {
    try {
        // Resolver el handle a un DID
        const response = await fetch(
            `${CONFIG.BLUESKY_API}/com.atproto.identity.resolveHandle?handle=${handle}`
        );
        const data = await response.json();
        
        if (!data.did) {
            throw new Error('No se pudo resolver el usuario');
        }
        
        // Construir el AT URI
        return `at://${data.did}/app.bsky.feed.post/${postId}`;
    } catch (error) {
        throw new Error('Error resolviendo usuario: ' + error.message);
    }
}

async function fetchPostThread(uri) {
    try {
        const response = await fetch(
            `${CONFIG.BLUESKY_API}/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=1`
        );
        
        if (!response.ok) {
            throw new Error('No se pudo obtener el post');
        }
        
        const data = await response.json();
        
        // Extraer información relevante
        const post = data.thread.post;
        const replies = data.thread.replies || [];
        
        return {
            text: post.record.text,
            likes: post.likeCount || 0,
            reposts: post.repostCount || 0,
            replies: replies.slice(0, CONFIG.MAX_COMMENTS).map(reply => {
                if (reply.post) {
                    return {
                        text: reply.post.record.text,
                        author: reply.post.author.displayName || reply.post.author.handle
                    };
                }
                return null;
            }).filter(r => r !== null)
        };
    } catch (error) {
        throw new Error('Error obteniendo post: ' + error.message);
    }
}
