import test from 'ava';
import { dirname, join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { deleteSync } from 'del';
import { fileURLToPath } from 'url';
import buildStyles from './buildStyles.mjs';

const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
const destinationFolder = join(basePath, '../test/dist/css');
const sourceFolder = join(basePath, '../test/src/sass');
const clear = () => deleteSync(join(basePath, '../test/dist'));

test.serial('doesn\'t throw with defaults', async(t) => {
    clear();
    try {
        await buildStyles();
        t.pass();
    } catch (err) {
        t.fail(`Error with default arguments: ${err.message}`);
    }
    clear();
});

test.serial('works with multiple entry points', async(t) => {
    clear();
    await buildStyles({
        sourceFolder,
        sourceFiles: [
            'main.scss',
            'main2.scss',
        ],
        destinationFolder,
    });
    const files = readdirSync(destinationFolder);
    t.deepEqual(files, ['main.css', 'main.css.map', 'main2.css', 'main2.css.map']);
    // Make sure content is not minified
    const content = readFileSync(join(destinationFolder, 'main.css'), 'utf8');
    t.is(content.split('\n').length > 1, true);
    clear();
});

test.serial('works with globs', async(t) => {
    clear();
    await buildStyles({
        sourceFolder,
        sourceFiles: ['main*.scss'],
        destinationFolder,
    });
    const files = readdirSync(destinationFolder);
    t.deepEqual(files, ['main.css', 'main.css.map', 'main2.css', 'main2.css.map']);
    clear();
});

test.serial('does not compile partials starting with _', async(t) => {
    clear();
    await buildStyles({
        sourceFolder,
        sourceFiles: ['*.scss'],
        destinationFolder,
    });
    const files = readdirSync(destinationFolder);
    t.is(files.includes('_partial.css'), false);
    clear();
});

test.serial('works with the compress option', async(t) => {
    clear();
    await buildStyles({
        sourceFolder,
        sourceFiles: ['main*.scss'],
        destinationFolder,
        compress: true,
    });
    const files = readdirSync(destinationFolder);
    t.deepEqual(files, ['main.css', 'main.css.map', 'main2.css', 'main2.css.map']);
    const content = readFileSync(join(destinationFolder, 'main.css'), 'utf8');
    t.is(content.split('\n').length, 2); // 2 Lines: Minified CSS + Source Map URL Comment
    clear();
});

test.serial('adds prefixes', async(t) => {
    clear();
    await buildStyles({
        sourceFolder,
        sourceFiles: ['main.scss'],
        destinationFolder,
        compress: true,
    });
    const content = readFileSync(join(destinationFolder, 'main.css'), 'utf8');
    t.is(content.includes('-webkit-appearance'), true);
    clear();
});

test.serial('creates folder structure relative to sourceFolder', async (t) => {
    clear();
    await buildStyles({
        sourceFolder,
        sourceFiles: ['**/sub*.scss'],
        destinationFolder,
        compress: true,
    });
    const files = readdirSync(join(destinationFolder, 'subFolder'));
    t.deepEqual(files, ['subfolder-style.css', 'subfolder-style.css.map']);
    clear();
});
