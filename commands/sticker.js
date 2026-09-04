const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStatic);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const MAX_VIDEO_SECONDS = 6;

function getMediaMessage(message) {
    const direct = message?.imageMessage || message?.videoMessage;
    if (direct) return direct;

    const quoted = message?.extendedTextMessage?.contextInfo?.quotedMessage;
    return quoted?.imageMessage || quoted?.videoMessage || null;
}

async function downloadMedia(mediaMessage, type) {
    const stream = await downloadContentFromMessage(mediaMessage, type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function imageToSticker(inputBuffer, outputPath) {
    await sharp(inputBuffer, { failOn: 'none' })
        .rotate()
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 80, effort: 4 })
        .toFile(outputPath);
}

async function videoToSticker(inputBuffer, inputPath, outputPath) {
    await fs.writeFile(inputPath, inputBuffer);

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .inputOptions(['-t 6'])
            .outputOptions([
                '-t 6',
                '-vf scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=15,format=rgba',
                '-c:v libwebp',
                '-q:v 60',
                '-compression_level 4',
                '-loop 0',
                '-an',
                '-vsync 0',
                '-f webp'
            ])
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

module.exports = async function stickerCommand(sock, chatId, msg) {
    let outputPath;
    let inputPath;

    try {
        const mediaMessage = getMediaMessage(msg.message);
        if (!mediaMessage) {
            return await sock.sendMessage(
                chatId,
                { text: '⚠️ Image/video par *.s* ya *.sticker* caption lagao, ya media ko reply karke *.s* bhejo.' },
                { quoted: msg }
            );
        }

        const type = mediaMessage.imageMessage ? 'image' : 'video';
        if (type === 'video' && mediaMessage.seconds && Number(mediaMessage.seconds) > MAX_VIDEO_SECONDS) {
            return await sock.sendMessage(
                chatId,
                { text: `⚠️ Video sticker maximum ${MAX_VIDEO_SECONDS} seconds ka ho sakta hai.` },
                { quoted: msg }
            );
        }

        await sock.sendMessage(chatId, { text: '✨ Sticker ban raha hai, thoda wait karo...' }, { quoted: msg });
        await fs.ensureDir(TEMP_DIR);

        const id = crypto.randomBytes(8).toString('hex');
        inputPath = path.join(TEMP_DIR, `${id}_input`);
        outputPath = path.join(TEMP_DIR, `${id}_sticker.webp`);
        const buffer = await downloadMedia(mediaMessage, type);

        if (!buffer.length) throw new Error('Media download nahi ho saka.');
        if (type === 'image') {
            await imageToSticker(buffer, outputPath);
        } else {
            await videoToSticker(buffer, inputPath, outputPath);
        }

        const sticker = await fs.readFile(outputPath);
        if (!sticker.length) throw new Error('Sticker file create nahi hui.');
        await sock.sendMessage(chatId, { sticker }, { quoted: msg });
    } catch (error) {
        console.error('[sticker]', error);
        await sock.sendMessage(
            chatId,
            { text: `❌ Sticker nahi ban saka: ${error.message || 'unknown error'}` },
            { quoted: msg }
        );
    } finally {
        for (const file of [inputPath, outputPath]) {
            if (file) await fs.remove(file).catch(() => {});
        }
    }
};
