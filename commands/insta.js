const axios = require('axios');

const INSTAGRAM_API = 'https://api-aswin-sparky.koyeb.app/api/downloader/igdl';

function collectMediaItems(payload) {
    const root = payload?.data ?? payload?.result ?? payload;
    const list = Array.isArray(root) ? root : [root];
    const items = [];

    for (const item of list) {
        if (!item) continue;
        if (typeof item === 'string') {
            items.push({ url: item });
            continue;
        }
        if (typeof item.url === 'string') items.push(item);
        else if (typeof item.download_url === 'string') items.push({ ...item, url: item.download_url });
        else if (typeof item.downloadUrl === 'string') items.push({ ...item, url: item.downloadUrl });
    }

    return items.filter(item => /^https?:\/\//i.test(item.url));
}

function isVideo(item) {
    const type = String(item.type || item.mime || item.mimetype || '').toLowerCase();
    if (type.includes('video') || type.includes('mp4')) return true;
    return /\.(mp4|mov|m4v)(?:[?#].*)?$/i.test(item.url);
}

async function instaCommand(sock, from, msg, q) {
    if (!q) {
        return await sock.sendMessage(
            from,
            { text: '❌ Instagram link do. Example: *.ig https://www.instagram.com/reel/...' },
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // Only the user-provided Instagram API is used here.
        const response = await axios.get(INSTAGRAM_API, {
            params: { url: q.trim() },
            timeout: 45_000,
            validateStatus: status => status >= 200 && status < 500
        });
        const data = response.data;

        if (data?.status === false) {
            throw new Error(data.msg || 'No media found. Link private ya invalid ho sakta hai.');
        }

        const mediaItems = collectMediaItems(data);
        if (!mediaItems.length) {
            throw new Error(data?.msg || 'API ne koi downloadable media URL return nahi kiya.');
        }

        const caption = '*📸 Instagram Downloader*\n\n> © POWERED BY 𝙎𝙃𝙀𝙃𝙕么𝘿𝘼 MINI BOT';
        for (const item of mediaItems) {
            if (isVideo(item)) {
                await sock.sendMessage(from, {
                    video: { url: item.url },
                    mimetype: 'video/mp4',
                    caption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    image: { url: item.url },
                    caption
                }, { quoted: msg });
            }
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (error) {
        console.error('Instagram API Error:', error.response?.data || error.message);
        await sock.sendMessage(
            from,
            { text: `❌ Instagram download failed: ${error.message || 'Unknown API error'}` },
            { quoted: msg }
        );
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
    }
}

module.exports = instaCommand;
