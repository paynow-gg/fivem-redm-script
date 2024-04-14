const hexToDecimal = require('../util/hexToDecimal');
const axios = require('axios');

class PayNowAPI {
    constructor() {
        this.url = 'https://api.paynow.gg/v1/';

        this.token = GetConvar('paynow.token', '');
        this.intervalTime = GetConvarInt('paynow.interval', 15);
        this.interval = null;
        this.executedCommands = [];

        this.initialize();
    }

    initialize() {
        if (this.checkToken(this.token)) {
            this.log(`Initialized with interval of ${this.intervalTime} seconds.`)
        }

        this.startInterval();
    }

    checkToken() {
        if (this.token) return true;

        this.token = GetConvar('paynow.token', '');

        if (this.token) return true;

        this.log('^1No API token set! Use the \'set paynow.token <token>\' command to set it.');

        return false;
    }

    startInterval() {
        this.interval = setInterval(() => {
            if (!this.checkToken()) return;

            this.handlePendingCommands();
        }, this.intervalTime * 1000);
    }

    async handlePendingCommands() {
        const result = await this.request('delivery/command-queue/', 'POST', { steam_ids: this.getPlayerSteamIDs() });

        if (!result?.length) return;

        this.log(`Handling ${result.length} pending commands.`);

        for (const command of result) {
            if (this.executedCommands.includes(command.attempt_id)) continue;

            if (command.online_only) {
                if (!this.isPlayerOnline(command.steam_id)) continue;
            }

            ExecuteCommand(command.command);

            this.executedCommands.push(command.attempt_id);
        }

        this.handleCompletedCommands();
    }

    async handleCompletedCommands() {
        if (!this.executedCommands?.length) return;

        await this.request('delivery/command-queue/', 'DELETE', this.getExecutedCommands() );

        this.log(`Handled ${this.executedCommands.length} completed commands.`);

        this.executedCommands = [];
    }

    getExecutedCommands() {
        return this.executedCommands.map(command => {
            return {
                attempt_id: command
            };
        });
    }

    isPlayerOnline(steamIDLong) {
        const players = getPlayers();

        for (const player of players) {
            const identifiers = getPlayerIdentifiers(player);

            for (const identifier of identifiers) {
                if (!identifier.includes('steam')) continue;

                const steamID = hexToDecimal(identifier.replace('steam:', ''));

                if (steamID === steamIDLong) return true;
            }
        }

        return false;
    }

    getPlayerSteamIDs() {
        const steamIDs = [];

        const players = getPlayers();

        for (const player of players) {
            const identifiers = getPlayerIdentifiers(player);

            for (const identifier of identifiers) {
                if (!identifier.includes('steam')) continue;

                const steamIDLong = hexToDecimal(identifier.replace('steam:', ''));

                steamIDs.push(steamIDLong);

                break;
            }
        }

        return steamIDs;
    }

    async request(path, method, body = {}, headers = {}) {
        if (!this.checkToken()) return;

        try {
            const result = await axios({
                method: method,
                url: `${this.url}${path}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Gameserver ${this.token}`,
                    ...headers
                },
                data: JSON.stringify(body)
            });
    
            return result.data;
        } catch (error) {
            this.log(`Request failed: ${error.message}`);

            return null;
        }
    }

    log(message) {
        console.log(`^7[PayNow] ^5${message}^7`);
    }
}

module.exports = PayNowAPI;