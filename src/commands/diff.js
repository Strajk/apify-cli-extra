/* eslint-disable no-unused-vars,no-console */
// noinspection JSUnusedLocalSymbols

const chalk = require('chalk');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const tiged = require('tiged');
const { diff: deepDiff } = require('jest-diff');
const { ApifyCommand } = require('../lib/apify_command');
const { getLoggedClientOrThrow, getLocalUserInfo,
    getLocalConfigOrThrow,
    getActorLocalFilePaths,
} = require('../lib/utils');

class DiffCommand extends ApifyCommand {
    async run() {
        const {
            args,
            flags,
        } = this.parse(DiffCommand);
        const apifyClient = await getLoggedClientOrThrow();
        const localConfig = await getLocalConfigOrThrow();
        const userInfo = await getLocalUserInfo();
        const cwd = process.cwd();

        const usernameOrId = userInfo.username || userInfo.id;
        const actorSlug = `${usernameOrId}/${localConfig.name}`;
        const actor = await apifyClient.actor(actorSlug)
            .get();
        if (!actor) throw new Error(`Cannot find actor '${actorSlug}' in your account.`);

        const lastVersion = actor.versions[actor.versions.length - 1];
        if (lastVersion.sourceType !== 'SOURCE_FILES') throw new Error(`Cannot diff actor with sourceType '${lastVersion.sourceType}'`);
        const { sourceFiles } = lastVersion;
        const remote = sourceFiles.reduce((acc, file) => {
            acc[file.name] = file.content;
            return acc;
        }, {});

        const localFilePaths = await getActorLocalFilePaths({ extraIgnore: ['apify_storage/**'] });
        // load all files to object
        const localFiles = {};
        for (const filePath of localFilePaths) {
            localFiles[filePath] = fs.readFileSync(filePath, 'utf8');
        }

        // TODO: Nicer output, per file, not all files in one object
        const diff = deepDiff(localFiles, remote, {
            aAnnotation: 'Local',
            bAnnotation: 'Remote',
        });
        console.log(diff);
    }
}

DiffCommand.description = 'FIXME';

DiffCommand.args = [
    {
        // FIXME
        name: 'actorId',
        required: false,
        description: 'ID of an existing actor on the Apify platform which will be pulled. '
            + 'If not provided, the command will pull the actor specified in "apify.json" file.',
    },
];

module.exports = DiffCommand;
