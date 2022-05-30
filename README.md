# apify-cli-extra - my mod of [apify-cli](https://github.com/apify/apify-cli)

🤔 **Why fork** and not add these to apify-cli directly? Mostly because I'm really not sure **if these would add more benefit than confusions**. Plus:

- 🐶 Brainstorming new features and dog-fooding them.
- ✏️ Basically sketching out new features I needed, and ereasing and re-drawing often. TODOs everywhere.
- 👨‍🔬 Not ready for a prime time – not caring about completeness, performance, nor stability.
- 📦 Adding deps without much thinking how it will affect bundle size/compatibility - that's a problem for future me.
- ⚠️ You probably don't want to use this and expect it to work.
- 🙈 Keeping everything in master and rebasing, for simplicity, don't judge me.

Name inspired by [fs-extra](https://www.npmjs.com/package/fs-extra)

## Usage

I personally use it by `alias a-cli=~/Projects/a/apify-cli/src/bin/run` (`a` is my abbr for Apify)

## Added/changed

- 🆕 `diff` - compare remote (Apify Console) and local (cwd file system)
    - for now, compares as nested object of files and their content. Not pretty, but fastest to implement.
    - TODO: Would be nicer more "git"y
- 🆕 `gi` - generate example input from INPUT_SCHEMA
    - I kinda haven't made my mind about this one, it might not be useful after all ¯\_(ツ)_/¯
- 🆕 `merge-dataset` - glob all dataset files in local apify_storage and outputs csv and sqlite.
- 🆕 `pull` - opposite of existing `push`. Gets the actor's source to local cwd. Kinda works with various source types (source files/single file/tar/even git)
- 🆕 `pull-storage` - pulls storage from remote (Apify Console) to local (cwd), e.g. `apify-cli pull-storage key_value_store Rdtupxx5rzuLrpUHr`
- 🆕 `put` - existing `push` pushes the source code to Apify Console, `put` is for updating metadata (settings)
    - beware: uses Imgur for uploading images 😅
    - this is not very good name, i know

- `extraIgnore` option for `getActorLocalFilePaths`, useful for ignoring `apify_storage` dir when pushing
- on `push`, add more explanatory console message when zipping instead of plain uploading (because total file size of ... exceeded ...)
- on `push` (only initial when actor is being created) and on `put`, use `defaultRunOptions` from apify.json
