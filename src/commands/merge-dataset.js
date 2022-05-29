/* eslint-disable no-unused-vars */
const fs = require('fs');
const globby = require('globby');
const { parse } = require('json2csv');
const Database = require('better-sqlite3');
const { execSync } = require('child_process');
const { ApifyCommand } = require('../lib/apify_command');
const outputs = require('../lib/outputs');

class Command extends ApifyCommand {
    async run() {
        const { args } = this.parse(Command);
        const {
            name = 'default', // TODO: but does it make sense to override?
        } = args;
        try {
            const src = `./apify_storage/datasets/${name}`; // TODO: Resolve dir same as `apify` pkg does
            const files = globby.sync(`${src}/*.json`); // TODO: This makes sense only with dataset
            console.log(`Found ${files.length} files in ${src}`);

            const contents = files.map((file) => {
                const content = fs.readFileSync(file, 'utf8');
                return JSON.parse(content);
            });

            // TODO: Make it work if some fields are missing in some datasets,
            // e.g. when discount prop is missing for items that are not discounted

            // CSV
            // ===
            const outputFile = `./${name}-dataset-merged`;
            fs.writeFileSync(`${outputFile}.csv`, parse(contents));

            // SQLite
            // ===

            // Using node, this should work but I give up, getting SqliteError: near "USING": syntax error
            // const db = new Database(`${outputFile}.db`);
            // db.exec(`CREATE TABLE main USING csv(${outputFile}.csv)`); // this should work!

            // Yolo
            // TODO: unfortunately, sqlite assumes all fields are text fields
            execSync(`sqlite3 ${outputFile}.db ".import ${outputFile}.csv main --csv"`);

            outputs.success(`Merged dataset ${name} to ${outputFile}.{csv,db}`);
        } catch (err) {
            throw new Error(`FIXME (${err})`);
        }
    }
}

Command.description = 'Merge dataset to CSV';

Command.args = [
    {
        name: 'FIXME',
        required: false,
        description: 'FIXME',
    },
];

module.exports = Command;
