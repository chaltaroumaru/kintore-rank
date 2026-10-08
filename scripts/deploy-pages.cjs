// dist/ を gh-pages ブランチに push して GitHub Pages を更新する (npm run deploy:web)
const { execSync } = require('child_process');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
const run = (cmd) => execSync(cmd, { cwd: dist, stdio: 'inherit' });

run('git init -q -b gh-pages');
run('git add -A');
run('git -c user.name=chaltaroumaru -c user.email=277738630+chaltaroumaru@users.noreply.github.com commit -q -m "Deploy web"');
run(`git push -f ${remote} gh-pages`);
console.log('\nデプロイしました: https://chaltaroumaru.github.io/kintore-rank/');
