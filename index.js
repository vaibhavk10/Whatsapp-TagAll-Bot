const settings = require('./settings');

global.packname = settings.packname;
global.author = settings.author;

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino'); // Logger for debugging
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');

async function isAdmin(sock, chatId, senderId) {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participant = groupMetadata.participants.find(p => p.id === senderId);
    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
}

async function canUseCommands(sock, chatId, senderId) {
    if (chatId.endsWith('@g.us')) {
        return await isAdmin(sock, chatId, senderId);
    }
    return false;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'trace' }) // Set log level to trace for detailed logs
    });

    sock.ev.on('creds.update', saveCreds);

    // Listen for incoming messages
    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;

        console.log('Received message:', message); // Debug log to show incoming message

        // Get the message type and content
        const messageType = Object.keys(message.message)[0]; // Get message type
        let userMessage = '';

        if (message.message?.conversation) {
            userMessage = message.message.conversation.trim().toLowerCase();
        } else if (message.message?.extendedTextMessage?.text) {
            userMessage = message.message.extendedTextMessage.text.trim().toLowerCase();
        }

        console.log('User message:', userMessage); // Debug log to show the actual user message

        // Check if the user is allowed to use commands (admin only in group chats)
        if (!(await canUseCommands(sock, chatId, senderId)) && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use the .tagall command.' });
            return;
        }

        // Handle commands
        if (userMessage === '.help' || userMessage === '.menu') {
            await helpCommand(sock, chatId);
        } else if (userMessage === '.tagall' && chatId.endsWith('@g.us')) {
            await tagAllCommand(sock, chatId, senderId);
        } else {
            console.log('No matching command found'); // Debug log for unmatched commands
        }
    });

    // Connection update event to handle connection and disconnection
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reason:', lastDisconnect.error);
            if (shouldReconnect) {
                startBot(); // Reconnect the bot
            } else {
                console.log("Logged out from WhatsApp. Please restart the bot and scan the QR code again.");
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
        }
    });
}

startBot();
