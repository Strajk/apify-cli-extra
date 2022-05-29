const { validateInputSchema } = require('apify-shared/input_schema'); // eslint-disable-line import/no-extraneous-dependencies
const Ajv = require('ajv');
const fs = require('fs');
const nodePath = require('path');
const inquirer = require('inquirer');
const { ApifyCommand } = require('../lib/apify_command');
const outputs = require('../lib/outputs');

inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'));
inquirer.registerPrompt('recursive', require('inquirer-recursive'));

const DEFAULT_INPUT_SCHEMA_PATH = './INPUT_SCHEMA.json'; // override to absolute path for easy testing

class GenerateExampleInputCommand extends ApifyCommand {
    async run() {
        // <same as `vis`>
        const { args } = this.parse(GenerateExampleInputCommand);
        const { path = DEFAULT_INPUT_SCHEMA_PATH } = args;
        const validator = new Ajv({ cache: false });

        let inputSchemaObj;

        try {
            const inputSchemaStr = fs.readFileSync(path).toString();
            inputSchemaObj = JSON.parse(inputSchemaStr);
        } catch (err) {
            throw new Error(`Input schema is not a valid JSON (${err})`);
        }

        validateInputSchema(validator, inputSchemaObj); // This one throws an error in a case of invalid schema.
        // </same as `vis`>

        // TODO: Params
        const inputPath = './apify_storage/key_value_stores/default/INPUT.json';
        const inputDir = nodePath.dirname(inputPath);
        fs.mkdirSync(inputDir, { recursive: true });

        // TODO: Check existing

        const result = {};
        for (const [key, val] of Object.entries(inputSchemaObj.properties)) {
            // https://github.com/SBoudrias/Inquirer.js#objects
            const prompt = { name: key };
            const ref = prompt;

            if (val.type === 'array') {
                // prompt.type = 'recursive';
                // prompt.type = 'editor';
                // prompt.message = 'Add another?';
                // const subPrompt = { name: 'val' };
                // prompt.prompts = [subPrompt];
                // ref = subPrompt;
            } else {
                ref.type = 'input';
            }

            ref.message = `${val.title} (${val.description})`;

            if (typeof val.default !== 'undefined') {
                ref.default = val.default;
            } else if (!Array.isArray(val.prefill)) {
                ref.default = val.prefill;
            } else if (Array.isArray(val.prefill)) {
                ref.default = '';
                if (val.prefill.every((x) => Object.keys(x).length === 1)) {
                    const k = Object.keys(val.prefill[0])[0];
                    ref.type = 'suggest';
                    ref.suggestions = val.prefill.map((x) => x[k]);
                }
            }

            console.dir(prompt);
            const response = await inquirer.prompt(prompt);
            result[key] = response[key];
        }

        fs.writeFileSync(inputPath, JSON.stringify(result, null, 2));

        outputs.success(`Input example generated to ${inputPath}`);
    }
}

GenerateExampleInputCommand.description = 'Generates example INPUT.json from INPUT_SCHEMA.json file.';

GenerateExampleInputCommand.args = [
    {
        name: 'path',
        required: false,
        description: 'Optional path to your INPUT_SCHEMA.json file. If not provided ./INPUT_SCHEMA.json is used.',
    },
];

module.exports = GenerateExampleInputCommand;

// GenerateExampleInputCommand.run()
