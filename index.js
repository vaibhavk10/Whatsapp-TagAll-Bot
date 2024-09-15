const settings = require('./settings');

global.packname = settings.packname;
global.author = settings.author;

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');

// Helper function to check if the sender is an admin in a group
async function isAdmin(sock, chatId, senderId) {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participant = groupMetadata.participants.find(p => p.id === senderId);
    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
}

// Check if user is allowed to use commands (group admin or bot)
async function canUseCommands(sock, chatId, senderId) {
    if (chatId.endsWith('@g.us')) { // Ensure this is in a group
        return await isAdmin(sock, chatId, senderId); // Only group admins can use commands
    }
    return false; // In other contexts, disallow commands
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;

        if (!message.key.fromMe && message.message?.conversation) {
            const userMessage = message.message.conversation.trim().toLowerCase();

            // Check if the sender is a group admin or the bot
            if (!(await canUseCommands(sock, chatId, senderId)) && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use the .tagall command.' });
                return;
            }

            if (userMessage === '.help' || userMessage === '.menu') {
                await helpCommand(sock, chatId);
            } else if (userMessage === '.tagall' && chatId.endsWith('@g.us')) {
                await tagAllCommand(sock, chatId, senderId); // Allow tagall only in groups
            }
        }
    });
}

// Start the bot
startBot();
