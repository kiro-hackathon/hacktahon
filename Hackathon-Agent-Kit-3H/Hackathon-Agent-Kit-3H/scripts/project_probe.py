#!/usr/bin/env python3
"""Read-only inventory. No dependencies, no network, no project code execution."""
import argparse
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description='Report project tooling and files without executing project code.')
parser.add_argument('--project', default='.', help='Project root (default current directory)')
args = parser.parse_args()
root = Path(args.project).resolve()
if not root.is_dir():
    parser.error(f'Not a directory: {root}')
print('PROJECT:', root)
for file in ['package.json','pnpm-lock.yaml','package-lock.json','yarn.lock','bun.lock','bun.lockb','pyproject.toml','requirements.txt','Cargo.toml','go.mod','vite.config.ts','vite.config.js','index.html','.gitignore']:
    if (root / file).is_file(): print('FOUND:', file)
package = root / 'package.json'
if package.is_file():
    try:
        data = json.loads(package.read_text(encoding='utf-8'))
        print('PACKAGE:', data.get('name', '(no name)'))
        scripts = data.get('scripts', {})
        if isinstance(scripts, dict):
            for name in sorted(scripts): print('SCRIPT:', name, '(available; not executed)')
    except (json.JSONDecodeError, UnicodeError) as e:
        print('WARN: Cannot parse package.json:', type(e).__name__)
# Do not reveal .env contents. Only list safe filenames.
for file in sorted(root.glob('.env*')):
    if file.is_file(): print('ENV FILE EXISTS:', file.name, '(contents not read)')
if (root / '.git').exists():
    try:
        result = subprocess.run(['git','-C',str(root),'status','--short'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            lines = result.stdout.splitlines()
            print('GIT:', len(lines), 'modified/untracked entries')
        else: print('GIT: status unavailable')
    except (OSError, subprocess.TimeoutExpired):
        print('GIT: executable unavailable')
print('PROBE COMPLETE: no project commands were executed.')
