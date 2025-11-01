const hexToDecimal = require('../util/hexToDecimal');
const decimalToHex = require('../util/decimalToHex');
const axios = require('axios');

class PayNowAPI {
    constructor() {
        this.version = '0.0.4';
        this.url = 'https://api.paynow.gg/v1/';

        this.token = GetConvar('paynow.token', '');
        this.intervalTime = GetConvarInt('paynow.interval', 2);
        this.interval = null;
        this.executedCommands = [];

        this.initialize();
    }

    initialize() {
        if (!this.checkToken(this.token)) return;

        this.log(`Initialized with interval of ${this.intervalTime} seconds.`)

        this.serverLink();
    }

    checkToken() {
        if (this.token) return true;

        this.token = GetConvar('paynow.token', '');

        if (this.token) return true;

        this.log('^1No API token set! Use the \'set paynow.token <token>\' command to set it.');

        return false;
    }

    async serverLink() {
        const result = await this.request('delivery/gameserver/link', 'POST', {
            platform: 'fivem',
            version: this.version,
            hostname: GetConvar('sv_hostname', 'Unknown'),
            ip: GetConvar('paynow.ip', '0.0.0.0')
        });

        if (!result) return;

        if (result.update_available) {
            this.log(`^3An update is available for PayNow. Please update to version ${result.latest_version}.`);
        }

        if (result.previously_linked) {
            this.log(`^3This token has been previously used on "${result.previously_linked?.host_name}", ensure you have removed this token from the previous server.`);
        }

        if (!result.gameserver) {
            this.log(`^1PayNow API did not return a GameServer object, this may be a transient issue, please try again or contact support.`);

            return;
        }

        this.log(`Server linked to PayNow API. Server ID: ${result.gameserver.id}`);

        this.serverLinked = true;

        this.startInterval();
    }

    startInterval() {
        this.interval = setInterval(() => {
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

            const playerSourceRegex = /\{player\.source_from:(\d+)\}/g;
            
            const commandString = command.command;
            
            const result = commandString.replace(playerSourceRegex, (match, steamID) => {
                const steamIDLong = parseInt(steamID, 10);

                const steamHex = decimalToHex(steamIDLong);

                if (!steamHex) return -1;

                const players = getPlayers();

                for (const player of players) {
                    const identifiers = getPlayerIdentifiers(player);

                    for (const identifier of identifiers) {
                        if (!identifier.includes('steam')) continue;

                        const playerSteamID = hexToDecimal(identifier.replace('steam:', ''));

                        if (playerSteamID === steamIDLong) {
                            return player;
                        }
                    }
                }

                return -1;
            });

            ExecuteCommand(result);

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

                if (steamIDLong) steamIDs.push(steamIDLong);

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

            console.error(error.response?.data || error);

            return null;
        }
    }

    log(message) {
        console.log(`^7[PayNow] ^5${message}^7`);
    }
}

module.exports = PayNowAPI;
