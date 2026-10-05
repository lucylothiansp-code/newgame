#!/usr/bin/env python3
"""Find the PDF page of each heading recorded by build.js, for TOC/index page numbers.
Usage: python3 pagemap.py The_Long_Grace.pdf build_headings.json pagemap.json
Printed page number = PDF page index - 1 (the title page is unnumbered section 1;
the footer PAGE field continues across sections, so printed page == pdf page)."""
import json, re, subprocess, sys

pdf, heads, out = sys.argv[1:4]
txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
pages = txt.split("\f")
norm = lambda s: re.sub(r"[^a-z0-9]+", "", s.lower())
npages = [norm(p) for p in pages]
H = json.load(open(heads))
res, cur, miss = {}, 0, 0
for h in H:
    key = norm(h["text"])[:40]
    if not key:
        continue
    found = None
    for p in range(cur, min(cur + 40, len(npages))):
        if key in npages[p]:
            found = p
            break
    if found is None:
        miss += 1
        continue
    cur = found
    res[h["bm"]] = found + 1
json.dump(res, open(out, "w"))
print(f"mapped {len(res)} / {len(H)} headings, missed {miss}, pages {len(pages)}")
