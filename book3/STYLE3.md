# THE LONG GRACE — CORE BOOK, Revised & Expanded Edition: Writers' Brief

We are producing a **revised and expanded edition** of the core book of the horror RPG *The Long Grace*, to be typeset as a black-and-gold PDF in the same style as the companion *Seven Tables*.

**Read first, in full:** `/home/user/newgame/book/STYLE.md` (the original writers' bible: tone, originality rule, RULES numbers, markup, canon) and `/home/user/newgame/book2/STYLE2.md` (the companion's brief; especially its extra markup). The setting source is `/home/user/newgame/source/gorging_bible.txt`. Your assigned source chapter(s) are in `/home/user/newgame/book/`.

## Your job

Take your assigned original chapter and produce a **new, expanded edition** of it: keep everything that is there (you may rewrite and improve prose, fix contradictions, tighten), and make it **50–80% longer** with:
- **More detail.** Deeper history, more texture, more named places/people/customs, more mechanics where relevant, more tables (d6/d10/d20 random tables are excellent).
- **Small blurbs everywhere.** Proverbs, overheard lines, ledger extracts, graffiti, nursery rhymes, sermon fragments, Cutwright marginalia, "Did you know" style curiosities, prices chalked on a stall. Use the new `[pull]` tag (below) and short `[box: ...]` sidebars generously: roughly one blurb or quote every page or two.
- **More visceral, on-page horror** in sensory detail (smell, texture, sound, taste, temperature), covering, where it fits your chapter, the full list the author requires:
  - Graphic body horror and gore: flesh, bone, rot, transformation.
  - Murder, including ritual killing and kin-slaying; torture.
  - Broken taboos: cannibalism, grave desecration, blasphemy and corrupted religion, oaths sworn on the dead, human sacrifice, betrayal of family.
  - Suicide, self-harm and madness spreading as the god's influence grows through a community, shown as TRAGEDY, never spectacle and never instructional (no methods; stay with the pull, the grief, the aftermath, the contagion).
  - A sacrifice that is demanded, given, and turns out to be worthless (each land chapter should contain at least one such episode in its history or present; the world chapter has the Eldest Walk; the adventure has the ninth chair).
  - Psychological horror: psychosis, hallucination, paranoia; delusions (being dead, loved ones as impostors, one's body not one's own); dissociation, lost time, fractured identity; obsession, compulsion; grief and guilt that warp reality; mania and despair as contagion; sadism and total loss of empathy; gaslighting, manipulation, cult control.
  - Existential: possession and loss of free will, damnation with no way out, isolation, starvation, slow decay, hungry or indifferent gods, no hope, no rescue, no redemption.
  - Taboo, kept **implied and never explicit**: sexual taboo and perversion between adults only; incestuous and cursed bloodlines; necrophilia and desecration of the dead (implication, aftermath, horror of discovery; never a depicted act). Never any sexual content involving anyone under 18. Children may suffer the setting's horrors but graphic gore inflicted on children is never lingered on.
- **Creativity.** Surprise the reader: new customs, new strange details, in-world documents in unusual forms (a menu, a death license, a wanted notice, a children's counting game, an interrogation transcript, a recipe, a hymn, a census page).

## Consistency

Stay consistent with the original core book and with the companion *Seven Tables* (`/home/user/newgame/book2/`), which already expanded every land's people and places. Land writers: grep/skim the matching `book2/2Xa_*.md` and `book2/2Xb_*.md` files (headings and the "New canon"-type secrets) so you do not contradict them; you may reference their places and minor people. Use the RULES numbers exactly as in STYLE.md and the rules chapters (`book/30_creation.md`, `book/40_rules.md`, `book/45_combat.md`, `book/50_bazaar.md`). Do not reveal the Eighth (the Guest) outside the Secrets chapter; hint only.

## Markup

Exactly the core markup (STYLE.md) plus the companion tags (`[bigquote] text | — attribution`, `[sigil: land]`), plus one new tag:
- `[pull] Short quote or blurb text | — attribution` — a small decorative pull-quote set inside the text columns (1–3 sentences). Use often.

Keep headings: one `#` chapter title per chapter file (the original title, optionally with a `: subtitle`), `##` sections, `###` subsections, `####` minor heads. One paragraph per line. No tables inside boxes. Max 5 table columns. No `---`.

## Delivery

Write to the path you are given, in appended parts (Write the first part, then `cat >> file <<'EOF'`). When done, check all blocks are closed and reply with only a short summary (word count via `wc -w`, what you added).
