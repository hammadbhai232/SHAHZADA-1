const settings = require('../settings'); // اگر settings نہیں تو اس لائن کو ہٹا دو

module.exports = async function(sock, chatId, msg, args) {
    // ── Helper: Branded send (newsletter forward) ──
    const sendMsg = async (text) => {
        return await sock.sendMessage(chatId, {
            text: text,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363428130221854@newsletter",
                    newsletterName: "𝙎𝙃𝙀𝙃𝙕么𝘿𝘼 𝐓𝐄𝐂𝐇",
                    serverMessageId: 200
                }
            }
        }, { quoted: msg });
    };

    try {
        // ── Reaction ──
        await sock.sendMessage(chatId, { react: { text: "🔗", key: msg.key } });

        // ── Heavy Box Response ──
        const response = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💀  *𝙎𝙃𝙀𝙃𝙕么𝘿𝘼 𝙈𝙄𝙉𝙄  —  𝙍𝙀𝙋𝙊𝙎𝙄𝙏𝙊𝙍𝙔*  💀  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  🔗 *Official Website*                   ┃
┃  ➤ https://yasir-gillani-mini-bot-production.up.railway.app/ ┃
┃  ➤ https://yasir-gillani-mini-bot-production.up.railway.app/ ┃
┃  ➤ https://yasir-gillani-mini-bot-production.up.railway.app/ ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  📱 *Pairing Guide*                      ┃
┃  ➤ Type .pair 92XXXXXXXXXX              ┃
┃  ➤ Scan QR or enter code in WhatsApp    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  🚀 *Quick Connect*                      ┃
┃  ✨ .pair 923XXXXXXXXX                   ┃
┃  ⚡ Scan • Pair • Enjoy        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  👑 *Version*   : ${settings?.version || '3.0'}  ┃
┃  🔐 *Security*  : Premium Encrypted      ┃
┃  ☠️ *Powered by* : 𝙎𝙃𝙀𝙃𝙕么𝘿𝘼 MINI TEAM          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `;

        await sendMsg(response);

    } catch (error) {
        console.error("❌ Repo command error:", error);
        await sendMsg("⚠️ کچھ غلط ہو گیا، براہِ کرم دوبارہ کوشش کریں۔");
    }
};
