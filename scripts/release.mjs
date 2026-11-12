// 一键发布：build → 校验产物是否含最新功能 → 拷成带版本号的分发文件。
//
// 用法：
//   npm run release                    # 完整流程（构建 + 校验 + 打包）
//   node scripts/release.mjs --skip-build   # 只校验/打包现有 dist（快速复查）
//   RELEASE_SKIP_BUILD=1 npm run release    # 同上（npm 11 不透传 -- 之后的参数，用环境变量更稳）
//
// 为什么用 Node 而不是 .ps1：
//   1. 这台机器 PowerShell 执行策略会拦未签名脚本（run.ps1 就被拦过）；
//   2. 跨平台，别人 clone 下来也能用。
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELEASE_MARKERS, buildReleaseName, formatBytes, missingMarkers } from './releaseCheck.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distFile = path.join(repoRoot, 'dist', 'index.html');
const releaseDir = path.join(repoRoot, 'release');
const tempDir = path.join(repoRoot, '.release-tmp');
const skipBuild = process.argv.includes('--skip-build') || process.env.RELEASE_SKIP_BUILD === '1';

function run(command) {
  execSync(command, { cwd: repoRoot, stdio: 'inherit', shell: true, env: process.env });
}

function gitCommit() {
  try {
    const head = execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
    const dirty = execSync('git status --porcelain --untracked-files=no', { cwd: repoRoot, encoding: 'utf8' }).trim();
    return dirty ? `${head}+dirty` : head;
  } catch {
    return 'unknown';
  }
}

function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function main() {
  const commit = gitCommit();
  console.log(`\n== 发布检查 ==\n仓库: ${repoRoot}\n版本: ${commit}\n日期: ${today()}\n`);

  if (!skipBuild) {
    // 这台机器 esbuild 删不掉系统临时文件（Access is denied），把 TEMP 指到工作区内
    fs.mkdirSync(tempDir, { recursive: true });
    process.env.TEMP = tempDir;
    process.env.TMP = tempDir;

    console.log('→ 构建中（npm run build）…');
    try {
      run('npm run build');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } else {
    console.log('→ 跳过构建（--skip-build）');
  }

  if (!fs.existsSync(distFile)) {
    console.error(`✗ 没有找到构建产物：${distFile}`);
    process.exit(1);
  }

  const html = fs.readFileSync(distFile, 'utf8');
  const missing = missingMarkers(html, RELEASE_MARKERS);

  console.log(`\n→ 产物校验（${RELEASE_MARKERS.length} 个功能标记）`);
  for (const marker of RELEASE_MARKERS) {
    console.log(`   ${missing.includes(marker) ? '✗' : '✓'} ${marker}`);
  }

  if (missing.length > 0) {
    console.error(
      `\n✗ 构建产物缺少 ${missing.length} 个功能标记：${missing.join('、')}\n` +
        '  说明 dist 是旧版本，或构建静默失败。请检查源码后重新 npm run release。'
    );
    process.exit(1);
  }

  fs.mkdirSync(releaseDir, { recursive: true });
  const fileName = buildReleaseName(commit, today());
  const target = path.join(releaseDir, fileName);
  fs.copyFileSync(distFile, target);

  const bytes = fs.statSync(target).size;
  const sha = createHash('sha256').update(fs.readFileSync(target)).digest('hex').slice(0, 16);

  fs.writeFileSync(
    path.join(releaseDir, '使用说明.txt'),
    [
      '深圳轨道物流 AGV 仿真系统 · 单文件演示版',
      '',
      `版本: ${commit}`,
      `日期: ${today()}`,
      `文件: ${fileName}`,
      `大小: ${formatBytes(bytes)}`,
      `SHA256(前16位): ${sha}`,
      '',
      '怎么用：',
      '1. 双击 HTML 文件，用 Chrome 或 Edge 打开（不要用记事本）',
      '2. 需要联网：地图 SDK 与样式来自 CDN',
      '',
      '这个版本没有后端，所以以下功能不可用：',
      '- 导出 Excel（按钮会显示"导出需后端"）',
      '- 派车算法「大运力优先」与批量仿真（需要 8000 端口的后端）',
      '- 仿真审计记录',
      '',
      '需要完整功能请走本地部署：npm ci → backend venv → npm run dev + run.ps1',
      ''
    ].join('\n'),
    'utf8'
  );

  console.log(`\n✓ 已生成：release/${fileName}`);
  console.log(`  大小: ${formatBytes(bytes)}（gzip 前）  SHA256: ${sha}…`);
  console.log('  使用说明: release/使用说明.txt\n');
}

main();
