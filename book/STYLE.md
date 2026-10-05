# THE LONG GRACE — Writers' Bible & House Style

You are writing one chapter of a complete, commercial-quality horror tabletop RPG core book. The source setting is in `/home/user/newgame/source/gorging_bible.txt` — READ ALL OF IT FIRST. It is canon. Every name, date, place and character in it must be kept and respected (you may deepen, never contradict). Your job is to EXPAND it enormously: more history, more texture, more sensory detail, more hooks, stats, and secrets.

## The new name

The world formerly called "the Gorging World" is now titled **THE LONG GRACE**. In-world, the continent is still called *the Table*. "The Long Grace" is what poets, priests and the book call the age itself: the six hundred and forty-one years between the meal and the bill — the long pause, like a grace said before eating, before the gods finish growing back. Use the phrase naturally ("in the Long Grace", "the Grace is ending"). The eaten-god event is still "the Gorging"; years are still A.G.; the present year is 641 A.G.

## Originality (hard rule)

The book borrows only the *format* of big European-style setting/rules books (lore chapters with epigraphs, in-world documents, faction rank ladders, NPC dossiers, sidebars, rules, bazaar, adversaries, adventure). Do NOT use any concepts, terms or ideas from Degenesis or any other published game (no Primer, Sepsis, Burn, Spore, clans, Apocalyptic, Chronicler, Anabaptists, etc.). Do not use Vampire/WoD terms (no Beast, Frenzy, Humanity, Disciplines). Everything must grow out of the bible's own logic: eaten gods, Cuts, Regrowth, the Table, the Rim Road.

## Tone & content

This is HORROR, and the user explicitly wants it graphic: visceral sensory detail — smell, texture, sound, temperature, taste. Put it on the page. Required throughout the book (each chapter should carry its share where it fits):
- Body horror and gore: flesh, bone, rot, transformation.
- Murder, including ritual killing and kin-slaying.
- Broken taboos: cannibalism, grave desecration, blasphemy, oaths sworn on the dead.
- Suicide and contagious madness spreading as the gods' influence grows — shown as TRAGEDY, never spectacle, never instructional (no methods described as how-to; focus on grief, aftermath, the ones left behind, the god's pull).
- Psychological horror: psychosis, hallucination, paranoia, delusions (believing you're dead, loved ones replaced by impostors, your body not being yours), lost time, obsession, compulsion, gaslighting, cult control.
- Existential: possession, damnation with no way out, isolation, starvation, decay, hungry and indifferent gods, no rescue.
- Allowed but must stay THEMATIC/IMPLIED, never explicit: sexual taboo (adults only, ever), incestuous/cursed bloodlines, necrophilia-adjacent desecration. Never any sexual content involving anyone under 18. Children exist in the setting (the bible has several) and suffer supernatural horror; do not linger on graphic gore inflicted on children — imply, cut away, show the aftermath through adults.
- Write with literary control: dread, specificity, restraint where it hurts more. Grim humor is welcome (the bible is darkly funny). Prose should feel like a real published book, not a list.

## Voice & formatting

Mix of: in-world documents (letters, ledgers, sermons, interrogation transcripts, songs, proverbs) set in `[fiction]` blocks; omniscient lore prose; GM-facing advice in boxes. Every chapter opens with an epigraph. Use sidebars generously. Use tables for rank ladders, timelines, random tables (d10/d20 tables of rumors, horrors, encounters are great).

## MARKUP FORMAT (strict — the build script parses this)

Write plain UTF-8 text files. **Each paragraph is exactly ONE line** (no hard wraps inside a paragraph). Blank lines between blocks are fine and ignored.

```
# Chapter Title                 -> Heading 1 (starts a new page). One per file usually.
## Section Title                -> Heading 2
### Subsection Title            -> Heading 3
#### Minor Heading              -> Heading 4
> Epigraph text line            -> epigraph (italic, indented). Can be several consecutive lines.
>> — attribution                -> epigraph attribution (right aligned)
- bullet text                   -> bullet list item
Normal line                     -> body paragraph
**bold** and *italic*           -> inline emphasis (do not nest; no other inline markup)
[box: Sidebar Title]            -> start of a shaded sidebar box
...lines (paragraphs, bullets)...
[/box]
[fiction]                       -> start of in-world fiction/document (rendered italic serif, indented)
...lines...
[/fiction]
[stat: Name — Title]            -> NPC/creature stat block start
Key: value                      -> each line inside is "Label: text"
[/stat]
[quick] text                    -> one-line compact stat line for minor NPCs/creatures
| Col A | Col B | Col C |       -> table row; FIRST row is the header; consecutive lines form one table
[pagebreak]                     -> force page break
```
Rules: no nested boxes; no tables inside boxes (put tables outside); no markdown links; no images; don't use `---`. Don't use `#` at the start of a line except for headings. Keep tables to at most 5 columns and keep cells short.

## THE RULES (canonical — use these numbers in any stats you write)

**Attributes** (1–5 for humans; 2 is average; 6+ only for monsters and the deep Regrowth): HAND (dexterity, violence, craft), GUT (strength, toughness, appetite), LUNG (speed, agility, stamina, stealth), EYE (perception, reason, memory), TONGUE (persuasion, deceit, command, oaths), CAUL (will, instinct, faith, the uncanny).

**Skills** (0–5; 6 legendary), four per attribute:
- Hand: Blades, Brawl, Shooting, Stitching (surgery, medicine, seaming the dead)
- Gut: Endure, Labor, Feast (eating the inedible, poisons, drink), Intimidate
- Lung: Athletics, Stealth, Wayfaring (travel, riding, survival), Filch (sleight, locks, pockets)
- Eye: Search, Lore, Craft, Reckoning (numbers, ledgers, mechanisms, natural philosophy)
- Tongue: Persuade, Deceive, Haggle, Clause (law, contracts, the drafting of oaths)
- Caul: Resolve, Rites, Instinct, Godsign (understanding/controlling the god in the blood)

**The Grace Roll:** roll 2d10 + Attribute + Skill vs Difficulty: Routine 10, Hard 14, Grim 18, Dire 22, Impossible 26. Every full 4 points of margin above the Difficulty is a **Helping** (extra effect; +2 damage in combat). **Doubles** on the 2d10: on a success it is a **Grace** (a strong extra benefit); on a failure it is a **Lack** (the worst plausible complication). Double 1s ("Licked Clean") always fail with a Lack. Double 10s always succeed with a Grace.

**Cut** (0–5): strength of the god in your blood. Blanks and the Unfed of the Fast are 0. Scraplings 1. Common folk 2. Prime Cuts 3. High Cuts (nobility) 4–5.

**Partaking:** a character with Cut 1+ may call on the god before a roll: add **the Tooth** (a d6) to the total; Cut 3+ may add two Teeth. Each Partake adds +1 **Hunger**; each Tooth showing a 1 adds +1 more Hunger ("the god bit back"). Hunger runs 0–10; when it reaches 10, **Regrowth** rises by 1 and Hunger empties.

**Regrowth** (0–12): 1–3 *the Taste*; 4–6 *the Appetite*; 7–9 *the Course*; 10–11 *the Brink*; 12 *the Seating* (the character is lost — the god wears them or they become a place). Each land has its own **Gifts** (powers gained at each stage), **Wants** (compulsions resisted with Caul + Resolve), and a **Sop** (an act that quiets the god: removes 1d6 Hunger but feeds the compulsion).

**Fray** (0–10): horror wears the mind. **Dread checks**: Caul + Resolve vs a difficulty set by the horror's **Dread rating**: Dread 1 (Routine 10, a rotting corpse), Dread 2 (Hard 14, watching a murder, a Kept man coming apart), Dread 3 (Grim 18, a loved one Called or Tenanted, a ritual killing), Dread 4 (Dire 22, a person becoming a place, a god's attention), Dread 5 (Impossible 26, a Seating, a god's face). Failure adds Fray equal to the Dread rating; success adds 1 (Grace: 0). At 10 Fray the character **Breaks** and gains a **Derangement** (Fray then drops to 3). Madness is contagious: those who witness a Break make a Dread 2 check and may share the delusion.

**Flesh** (hit points) = 8 + Gut + Endure. **Guard** (defense target) = 10 + Lung + best of Athletics, Blades or Brawl (ranged attacks use Athletics only). **Attack** = Hand + Blades/Brawl/Shooting. **Damage** = weapon damage + 2 per Helping − target's Armor. At 0 Flesh a character suffers **Ruin**: an Injury from the Mangling table and collapse; further damage kills (except in Sallowreach, where nothing dies).

Weapon damage benchmarks: fist 1, knife 2, cleaver/hatchet/club 3, sword/axe/boathook/spear 4, poleaxe/maul/greatcleaver 5–6, sling 2, shortbow 3, crossbow 4, harpoon 4. Armor: padded/hide 1, boiled leather 2, bone lamellar or mail 3, plate 4 (rare).

**Stat block format (major NPCs/creatures):**
```
[stat: Lady Corrow Vane — the Left Hand of the Court]
Attributes: Hand 4 · Gut 2 · Lung 2 · Eye 3 · Tongue 4 · Caul 4
Cut & Regrowth: Cut 5 (Hand-line) · Regrowth 7 (the Course) · Hunger 6
Skills: Rites 4, Persuade 3, Instinct 3, Clause 2, Stitching 2
Flesh 11 · Guard 13 · Armor 0 · Fray 4
Attacks: Closing Touch +8 (see Gifts); stiletto +5 (2)
Gifts: ...
Wants: ...
Dread: 2 (to see her gloves come off)
Secret: ...
[/stat]
```
**Quick stat format (minor NPCs, mobs, beasts):** `[quick] Netwatch Patroller — Threat 2 · Flesh 10 · Guard 13 · Attack +5 (boathook 4, Hooking) · Armor 1 · Dread 0` ("Threat" = bonus added to all their 2d10 rolls for non-attack tasks.)

**Money:** the **lack** (salt-cured bone disc, one day's bread) is the universal coin. 10 **crumbs** = 1 lack. A **platter** (sealed Rim Road Company bone tablet) = 20 lacks. **Sworn notes** are Oathen promissory notes backed by the issuer's own body. Regional currencies exist (see the Bazaar chapter). Cost of living per day: destitute 1, modest 3, comfortable 8, lavish 25+ lacks. A Closing (licensed death) in Sallowreach costs about 4,000 lacks.

## Canon decisions all writers share

- **The Eighth** (GM secret, revealed only in the Secrets chapter): its oldest name, recoverable from chisel-shadows, is **the Guest**. It was the god of hunger itself, and its "people" were every people — an eighth chair at every table. The Long Lack was the Guest eating the world's increase. Default truth: the Providers held still because being eaten and scattered through ten thousand bodies was the only way to hide from the Guest, which eats gods; the Regrowth is them coming back out of hiding because the Guest is returning; Orrum, the only god left whole, lays tables because a Host must feed whoever comes — and it is laying a place for the Guest. Other chapters may hint (chiseled-out figures, eighth chairs, an empty eighth side) but must not state this outright.
- The Rim Road Company swears all contracts in Oathen. Its notary is Jessamy Quill.
- The Cutwrights' College, the Purgation, the Second Table and the Reckoners cross all borders.
- Tablenight = longest night of Lack (winter). Seasons: Grace (spring), Plenty (summer), Carving (autumn), Lack (winter). The moon is the Plate; a new moon is "licked clean".
- Every land: when a person dies outside Sallowreach, they die normally. A Kept person who leaves Sallowreach drops dead at once.
- Greeting/grace common to all: "Lack keep away" before eating with strangers.
- No gunpowder. Technology: crossbows, clockwork, glass, lamps, iron, sail (stranded), surgery, distilling.

## Region chapter template (for land writers)

Write each land as one chapter (# Land Name), about 11,000–14,000 words, with roughly these sections (use your judgment, add more):
1. Epigraph + an opening in-world fiction piece (500–900 words, visceral).
2. The Meal (the night they ate their god — detailed, sensory, horrifying).
3. The Rule of the Land (expanded, with examples).
4. The Regrowth in [Land] (the four stages + the Brink, in visceral detail).
5. Land and Weather; a gazetteer of places (all bible places + 4–8 new ones).
6. History (expanded timeline table + narrative of key events).
7. Rule, Law and Politics; Culture and Daily Life (food, dress, sex/marriage (implied), death rites, children, festivals, crime & punishment, proverbs, oaths on the dead).
8. Factions — every bible faction, each with: who they are, beliefs, what they want, a **rank ladder** table (5 ranks with titles and what each rank grants), how a PC joins, enemies and allies.
9. [Land] Now — current crises; 3+ adventure hooks; a d10 table of rumors (some false).
10. **The People of [Land]** — EVERY character listed in the bible for that land, each expanded to a rich 120–250 word dossier (appearance with sensory detail, voice, wants, fears, secret, how they meet PCs). Give full `[stat:]` blocks to 6–8 of the most important; `[quick]` lines for others where useful. Add 4–6 NEW characters of your own.
11. **Playing a [Lander]** — a player-facing section: attribute bonus (given to you), the land's Sop, how the Tooth manifests when Partaking, Gifts at the Taste / Appetite / Course / Brink (mechanical, concrete, with costs), the Wants (with triggers), what the Seating means for a PC, 3 typical background concepts, names list (male/female/neutral and surnames).
12. A GM's box of "Horrors of [Land]": a d10 or d20 table of visceral encounter scenes.

Write with complete sentences; no placeholders; no "TBD". Do not write any other chapter. Save your work to the file path given to you (you may write it in several Write/append steps — e.g. write part 1, then append parts with Bash `cat >> file <<'EOF'`). When finished, reply only with a short summary (word count via `wc -w`, sections written, new characters added).
