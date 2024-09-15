const settings = require('../settings');

async function helpCommand(sock, chatId) {
    const helpMessage = `
*${settings.botName}* - Version ${settings.version}
_Bot by ${settings.botOwner}_

Here are the available commands:

1. *.help* or *.menu* - Display this help message.

2. *.tagall* - Tag all members of a group (Admin only).

`;

    await sock.sendMessage(chatId, { text: helpMessage });
}

module.exports = helpCommand;
