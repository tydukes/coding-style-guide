
#!/usr/bin/env python3
"""Simple metadata validator: scans docs/ and code files for required @module tag."""
import re, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent / 'docs'
pattern = re.compile(r'@module:\s*\w+')
missing = []
for p in root.rglob('*.*'):
    if p.suffix.lower() in ['.md', '.tf', '.yml', '.yaml', '.sh', '.py', '.ps1', '.groovy', '.json']:
        text = p.read_text(encoding='utf-8')
        if '##' in text or len(text.splitlines())>0: # skip empty
            if not pattern.search(text):
                missing.append(str(p.relative_to(root.parent)))
if missing:
    print('Files missing @module metadata:')
    for m in missing[:50]:
        print(' -', m)
    sys.exit(1)
print('Metadata validation passed.')
