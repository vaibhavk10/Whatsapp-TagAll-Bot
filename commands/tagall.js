const settings = require('../settings');
async function isAdmin(sock, chatId, senderId) {
    const groupMetadata = await sock.groupMetadata(chatId); 
    const participants = groupMetadata.participants;

    const sender = participants.find(p => p.id === senderId);
    const bot = participants.find(p => p.id === sock.user.id);

    const isSenderAdmin = sender && (sender.admin === 'admin' || sender.admin === 'superadmin');
    const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'superadmin');

    return { isSenderAdmin, isBotAdmin };
}

async function tagAllCommand(sock, chatId, senderId) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (isSenderAdmin || isBotAdmin) {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        let mentionText = 'Hey everyone! ';
        let mentions = [];

        for (let participant of participants) {
            mentionText += `@${participant.id.split('@')[0]} `;
            mentions.push(participant.id);
        }

        await sock.sendMessage(chatId, {
            text: mentionText,
            mentions: mentions
        });
    } else {
        await sock.sendMessage(chatId, {
            text: 'Only admins or the bot (if admin) can use the .tagall command.'
        });
    }
}

module.exports = tagAllCommand;
