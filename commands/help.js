const settings = require('../settings');

async function helpCommand(sock, chatId) {
    const helpMessage = `
*${settings.botName || 'WhatsApp Bot'}* - Version ${settings.version || '1.0.0'}
_Bot by ${settings.botOwner || 'Unknown Owner'}_

Here are the available commands:

1. *.help* or *.menu* - Display this help message.

2. *.tagall* - Tag all members of a group (Admin only).
`;

    await sock.sendMessage(chatId, { text: helpMessage });
}

module.exports = helpCommand;
