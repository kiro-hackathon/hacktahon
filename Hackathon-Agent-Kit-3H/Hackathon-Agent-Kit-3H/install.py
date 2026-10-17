#!/usr/bin/env python3
"""Install the kit in a project non-destructively. Standard library only."""
from pathlib import Path
import argparse
import shutil
import sys

SRC = Path(__file__).resolve().parent
MARK_START = '<!-- hackathon-agent-kit:start -->'
MARK_END = '<!-- hackathon-agent-kit:end -->'
INSTRUCTIONS = [
    Path('AGENTS.md'), Path('CLAUDE.md'), Path('GEMINI.md'),
    Path('.github/copilot-instructions.md')
]

parser = argparse.ArgumentParser(description='Safely install original agent skills into an existing project')
parser.add_argument('--target', required=True, help='Existing project path')
parser.add_argument('--dry-run', action='store_true', help='Print planned actions without writing')
parser.add_argument('--replace-skills', action='store_true', help='Replace colliding hackathon skill files (only .agents/.claude skill subtrees)')
args = parser.parse_args()
TARGET = Path(args.target).expanduser().resolve()
if not TARGET.is_dir():
    parser.error(f'Target is not an existing directory: {TARGET}')
if TARGET == SRC:
    parser.error('Kit already at target. Open this folder as your workspace instead.')
try:
    TARGET.relative_to(SRC)
    parser.error('Target cannot be nested inside kit directory.')
except ValueError:
    pass

def action(message):
    print(('PLAN ' if args.dry_run else '') + message)

def copy_file(rel):
    src, dst = SRC / rel, TARGET / rel
    if dst.exists():
        if args.replace_skills and str(rel).replace('\\','/').startswith(('.agents/skills/','.claude/skills/')):
            action('REPLACE SKILL ' + str(rel))
        else:
            action('SKIP EXISTS ' + str(rel))
            return
    else:
        action('COPY ' + str(rel))
    if not args.dry_run:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

# The kit's main README is put under a conflict-free name.
readme_target = TARGET / 'HACKATHON_KIT_README.md'
if readme_target.exists():
    action('SKIP EXISTS HACKATHON_KIT_README.md')
else:
    action('COPY HACKATHON_KIT_README.md')
    if not args.dry_run: shutil.copy2(SRC/'README.md', readme_target)

for rel_dir in ['.agents/skills', '.claude/skills', 'workflow','prompts','scripts','examples']:
    for path in sorted((SRC/rel_dir).rglob('*')):
        if path.is_file(): copy_file(path.relative_to(SRC))
for rel in [Path('START_HERE.md'), Path('PROJECT_FILES_NOTICE.md')]:
    copy_file(rel)

# Preserve existing instructions and append a nonintrusive include directive.
for rel in INSTRUCTIONS:
    dest = TARGET / rel
    if not dest.exists():
        copy_file(rel)
        continue
    text = dest.read_text(encoding='utf-8', errors='replace')
    if text == (SRC / rel).read_text(encoding='utf-8'):
        action('ALREADY INSTALLED ' + str(rel))
        continue
    if MARK_START in text:
        action('ALREADY CONFIGURED ' + str(rel))
        continue
    addition = (f'\n\n{MARK_START}\n'
                'For hackathon project ideas, read `START_HERE.md` and apply the '
                '3-hour kit; follow existing user/project instructions if they conflict.\n'
                f'{MARK_END}\n')
    action('APPEND INSTRUCTION POINTER ' + str(rel))
    if not args.dry_run:
        with dest.open('a', encoding='utf-8') as f: f.write(addition)

print('INSTALLATION ' + ('PREVIEWED' if args.dry_run else 'FINISHED'))
print('Next: start a NEW agent session in', TARGET)
print('Paste an idea using prompts/IDEA_ONLY_MINIMAL.txt, or use prompts/ONE_SHOT_START.md.')
