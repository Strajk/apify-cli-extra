const { flags: flagsHelper } = require('@oclif/command');
const { DEFAULT_LOCAL_STORAGE_DIR } = require('../lib/consts');
const { ApifyCommand } = require('../lib/apify_command');
const {
    purgeDefaultQueue,
    purgeDefaultKeyValueStore,
    purgeDefaultDataset,
} = require('../lib/utils');
const { info } = require('../lib/outputs');

class PurgeCommand extends ApifyCommand {
    async run() {
        const { flags } = this.parse(PurgeCommand);

        if (
            !flags.purgeQueue
            && !flags.purgeDataset
            && !flags.purgeKeyValueStore
        ) {
            await Promise.all([purgeDefaultQueue(), purgeDefaultKeyValueStore(), purgeDefaultDataset()]);
            info('All default local stores were purged.');
        }
        if (flags.purgeQueue) {
            await purgeDefaultQueue();
            info('Default local request queue was purged.');
        }
        if (flags.purgeDataset) {
            await purgeDefaultDataset();
            info('Default local dataset was purged.');
        }
        if (flags.purgeKeyValueStore) {
            await purgeDefaultKeyValueStore();
            info('Default local key-value store was purged.');
        }
    }
}

PurgeCommand.description = `Purges local storage of Apify (stored in the "${DEFAULT_LOCAL_STORAGE_DIR}" directory)`;

PurgeCommand.flags = {
    'purge-queue': flagsHelper.boolean({
        description: 'Deletes ONLY the local directory containing the default request queue before the run starts.',
        required: false,
    }),
    'purge-dataset': flagsHelper.boolean({
        description: 'Deletes ONLY the local directory containing the default dataset before the run starts.',
        required: false,
    }),
    'purge-key-value-store': flagsHelper.boolean({
        description: 'Deletes ONLY all records from the default key-value store in the local directory before the run starts, except for the "INPUT" key.',
        required: false,
    }),
};

module.exports = PurgeCommand;
