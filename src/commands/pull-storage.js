/* eslint-disable no-unused-vars,no-console */
// noinspection JSUnusedLocalSymbols

const chalk = require('chalk');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const tiged = require('tiged');
const { ApifyCommand } = require('../lib/apify_command');
const { getLoggedClientOrThrow, getLocalUserInfo } = require('../lib/utils');

class PullStorageCommand extends ApifyCommand {
    async run() {
        const {
            args,
            flags,
        } = this.parse(PullStorageCommand);
        const apifyClient = await getLoggedClientOrThrow();
        const userInfo = await getLocalUserInfo();
        const cwd = process.cwd();

        const {
            id: storageId = 'Rdtupxx5rzuLrpUHr', // FIXME: no default
            type: storageType = 'key_value_store', // FIXME: no default
        } = args;

        let subClient;
        // eslint-disable-next-line default-case
        switch (storageType) {
            case 'dataset': {
                console.log(`NOT IMPLEMENTED`);
                break;
            }
            case 'key_value_store': {
                subClient = apifyClient.keyValueStore(storageId);
                const keysRes = await subClient.listKeys();
                const keys = keysRes.items.map((x) => x.key);
                for (const key of keys) {
                    const itemData = await subClient.getRecord(key);
                    const dstPath = path.join(
                        cwd,
                        'apify_storage',
                        `${storageType}s`,
                        storageId,
                        key ?? 'default', // TODO: Maybe not best place to default
                    );
                    mkdirp.sync(path.dirname(dstPath)); // ensure dir exists
                    fs.writeFileSync(dstPath, itemData.value);
                }
                console.log(`Pulled ${keys.length} items from ${storageType} ${storageId}`);
                break;
            }
            case 'request_queue': {
                console.log(`NOT IMPLEMENTED`);
                break;
            }
            default: {
                throw new Error(`Unknown storage type: ${storageType}`);
            }
        }
    }
}

PullStorageCommand.description = 'FIXME';

PullStorageCommand.args = [
    {
        name: 'type',
        required: true,
        description: 'FIXME',
    },
    {
        name: 'id',
        required: false,
        description: 'ID of an existing actor on the Apify platform which will be pulled. '
            + 'If not provided, the command will pull the actor specified in "apify.json" file.',
    },
];

// PullStorageCommand.run(); // for testing

module.exports = PullStorageCommand;
