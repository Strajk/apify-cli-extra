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

class PullCommand extends ApifyCommand {
    async run() {
        const { args, flags } = this.parse(PullCommand);
        const apifyClient = await getLoggedClientOrThrow();
        const userInfo = await getLocalUserInfo();
        const cwd = process.cwd();

        const { actorId } = args;
        const actor = await apifyClient.acts.getAct({ actId: actorId });
        if (!actor) throw new Error(`Cannot find actor with ID '${actorId}' in your account.`);
        const {
            id,
            userId,
            name,
            username,
            isPublic,
            createdAt,
            modifiedAt,
            exampleRunInput,
            defaultRunOptions,
            versions, // [{versionNumber: '', envVars: [], sourceType: 'SOURCE_CODE', sourceCode: ''}]
        } = actor;

        // TODO: Check is sorted chronologically
        const lastVersion = versions[versions.length - 1];
        const {
            baseDockerImage,
            buildTag,
        } = lastVersion;

        const dirname = `${username}~${name}~${id}`;
        const dirpath = path.join(cwd, dirname);
        mkdirp.sync(dirpath);

        switch (lastVersion.sourceType) {
            case 'SOURCE_CODE': {
                console.log(`${chalk.green(`Pulling actor '${name}'`)}, type: 'SOURCE_CODE'`);
                const result = [
                    `// @ID: ${id}`,
                    `// @slug: ${username}/${name}`,
                    `// @docker: ${baseDockerImage}`,
                    ``,
                    lastVersion.sourceCode,
                ].join('\n');
                fs.writeFileSync(`${dirpath}/index.js`, result);
                console.log(`${dirpath}/index.js`);
                break;
            }
            case 'SOURCE_FILES': {
                const { sourceFiles } = lastVersion;
                for (const file of sourceFiles) {
                    // file.format ? "TEXT" : "BASE64"
                    fs.writeFileSync(`${dirpath}/${file.name}`, file.content);
                }
                console.log(`${chalk.green('Pulled to')} ${dirpath}/`);
                break;
            }
            case 'GIT_REPO': {
                // e.g. https://github.com/jakubbalada/Datasety.git#master:RejstrikPolitickychStran
                const { gitRepoUrl } = lastVersion;
                const [repoUrl, branchDirPart] = gitRepoUrl.split('#');

                // TODO: Handle defaults and edge cases
                let branch;
                let dir;
                if (branchDirPart) [branch, dir] = branchDirPart.split(':');

                const emitter = tiged(`${repoUrl}/${dir}#${branch}`);
                const res = await emitter.clone(dirpath);

                break;
            }
            default:
                throw new Error(`Unknown source type: ${lastVersion.sourceType}`);
        }
    }
}

PullCommand.description = 'FIXME';

PullCommand.args = [
    {
        name: 'actorId',
        required: false,
        description: 'ID of an existing actor on the Apify platform which will be pulled. '
            + 'If not provided, the command will pull the actor specified in "apify.json" file.',
    },
];

module.exports = PullCommand;
