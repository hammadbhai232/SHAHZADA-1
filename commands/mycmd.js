module.exports = async function(sock, chatId, msg) {
    const text = `*\u1F4DC Your Command Stats*\n\n` +
        `Total commands used: Tracking...\n` +
        `Favorite command: .menu\n` +
        `Session active: Yes\n\n` +
        `_Keep using 𝙎𝙃𝙀𝙃𝙕么𝘿𝘼 MINI BOT!_`;
    
    await sock.sendMessage(chatId, { text }, { quoted: msg });
};
