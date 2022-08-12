/**
 * BEWARE: `put` is a really weird name for this, but I could not come up with a better one.
 */
const path = require('path');
const { flags: flagsHelper } = require('@oclif/command');
const fs = require('fs');
const { ImgurClient } = require('imgur');
const { ApifyCommand } = require('../lib/apify_command');
const {
    getLoggedClientOrThrow,
    getLocalUserInfo,
    getLocalConfigOrThrow } = require('../lib/utils');
const outputs = require('../lib/outputs');

class PutCommand extends ApifyCommand {
    async run() {
        // NOTE: Logic highly inspired by other similar commands, mainly push
        const { flags } = this.parse(PutCommand);
        const apifyClient = await getLoggedClientOrThrow();
        const localConfig = await getLocalConfigOrThrow();
        const userInfo = await getLocalUserInfo();

        const usernameOrId = userInfo.username || userInfo.id;
        const actorSlug = `${usernameOrId}/${localConfig.name}`;
        const actor = await apifyClient.actor(actorSlug).get();
        if (!actor) {
            outputs.error(`Actor ${usernameOrId}/${localConfig.name} does not exist. Create it first – e.g. by "apify push". Aborting...`);
            return;
        }

        const actorId = actor.id;
        outputs.info(`Actor with slug ${actorSlug} found on Apify platform, actor id: ${actorId}. Updating...`);
        // TODO: Maybe I could create actorClient even few lines above without fetching actor for it's id first
        const actorClient = apifyClient.actor(actorId);

        // eslint-disable-next-line global-require,import/no-dynamic-require
        const pkg = require(path.join(process.cwd(), 'package.json'));
        const metadata = removeEmptyProps(pkg.apify);
        if (localConfig.defaultRunOptions) metadata.defaultRunOptions = localConfig.defaultRunOptions;

        if (flags.uploadPicture) {
            let picturePath;

            // First, try to find the picture in the current directory
            const parentDir = path.basename(process.cwd(), '.dist'); // e.g. tradeinn
            picturePath = path.join(process.cwd(), '..', `${parentDir}.png`);

            // Then, try to find the picture in .actor directory
            if (!fs.existsSync(picturePath)) {
                picturePath = path.join(process.cwd(), '.actor', `logo.png`);
            }

            if (!fs.existsSync(picturePath)) throw new Error(`The picture file "${picturePath}" does not exist.`);

            // for proper solution, see getUserImageUploadUrl
            // const pictureBuffer = fs.readFileSync(picturePath);
            // const bucketName = 'apify-image-uploads-staging';
            // const s3PathPrefix = 'actor._id'; // FIXME
            // const fileType = 'image/png';
            // const fileName = 'actor.png';
            // // createFileKey
            // // set s3Params
            // return {
            //     fileKey: key,
            //     uploadUrl: s3client.getSignedUrl('putObject', s3Params),
            // };

            // Quick hack with Imgur
            // FIXME: Do it proper way

            if (!process.env.IMGUR_CLIENT_ID || !process.env.IMGUR_CLIENT_SECRET) {
                console.error("Yo this won't work without IMGUR_CLIENT_ID & IMGUR_CLIENT_SECRET in env");
            }

            const imgurClient = new ImgurClient({
                clientId: process.env.IMGUR_CLIENT_ID,
                clientSecret: process.env.IMGUR_CLIENT_SECRET,
            });

            const imgurRes = await imgurClient.upload({
                image: fs.createReadStream(picturePath),
                type: 'stream',
            });

            metadata.pictureUrl = imgurRes.data.link;
        }

        console.log('⬆ <updateReq>');
        console.dir(metadata);
        console.log('⬆ </updateReq>');

        const updateRes = await actorClient.update(metadata);
        // const updateRes = {};

        console.log('⬇ <updateRes>');
        console.dir(updateRes);
        console.log('⬇ </updateRes>');

        outputs.link('Actor settings', `https://console.apify.com/actors/${actorId}#/settings`);
    }
}

PutCommand.description = `
Updates (put) the actor's metadata (settings) on the Apify platform.
The metadata are read from the "apify" property in the actor's "package.json".

NOTE: The target actor must exist in your Apify account.`;

PutCommand.flags = {
    // meh make it so it works with `--upload-picture`, not with `-i`
    // probably not flags but args
    'upload-picture': flagsHelper.boolean({
        char: 'i',
        description: `Upload the actor's picture to the Apify platform and includes the picture's URL in the payload.`,
        required: false,
    }),

};

PutCommand.args = [

];

module.exports = PutCommand;

function removeEmptyProps(obj) {
    Object.keys(obj).forEach((key) => {
        if (
            obj[key] === undefined
            || obj[key] === null
            || obj[key] === ''
        ) {
            delete obj[key];
        }
    });
    return obj;
}
