#!/usr/bin/env python3
"""Validate the skill package and mirrors. No network access or dependencies."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / '.agents' / 'skills'
CLAUDE = ROOT / '.claude' / 'skills'
REQUIRED = ['START_HERE.md', 'AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'workflow/3_HOUR_RUNBOOK.md', 'prompts/ONE_SHOT_START.md']
if not ((ROOT / 'README.md').is_file() or (ROOT / 'HACKATHON_KIT_README.md').is_file()):
    errors.append('Missing kit README')
errors = []
for file in REQUIRED:
    if not (ROOT / file).is_file():
        errors.append(f'Missing {file}')

skills = sorted(p.name for p in SKILLS.iterdir() if p.is_dir()) if SKILLS.exists() else []
if not skills:
    errors.append('No agent skills found')
for name in skills:
    a = SKILLS / name / 'SKILL.md'
    c = CLAUDE / name / 'SKILL.md'
    if not a.exists() or not c.exists():
        errors.append(f'Missing mirror of {name}')
        continue
    txt = a.read_text(encoding='utf-8')
    if txt != c.read_text(encoding='utf-8'):
        errors.append(f'Skill mirror mismatch: {name}')
    if not txt.startswith('---\n'):
        errors.append(f'Invalid YAML frontmatter start: {name}')
    if f'name: {name}' not in txt.split('---', 2)[1]:
        errors.append(f'Invalid or missing skill name: {name}')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', name):
        errors.append(f'Invalid directory name: {name}')
    if not re.search(r'^description: .+', txt, flags=re.MULTILINE):
        errors.append(f'Missing description: {name}')

print(f'Kit: {ROOT}')
print(f'Skills: {len(skills)}')
if errors:
    for e in errors: print('ERROR:', e)
    sys.exit(1)
print('PASS: Required files, skill metadata, and platform mirrors verified.')
