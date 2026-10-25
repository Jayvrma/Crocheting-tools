# Annotation guide — crochet pattern spans

The point of these conventions is that two people labeling the same pattern
produce the same spans. When a case isn't covered here, label it the way that
seems right, write why in the **notes** box, and add the rule to this file.

## Label definitions

| Label | Covers | Span boundary |
|---|---|---|
| `STITCH` | A stitch or stitch-like operation: `sc`, `dc`, `hdc`, `tr`, `sl st`, `ch`, `inc`, `dec`, `sc2tog`, `magic ring`, `puff st`, `bobble` | The stitch token only — **not** its count. In `6 dc`, label only `dc`. |
| `COUNT` | How many: `6`, `12 sts`, `(18)`, `x6`, `twice` | Include the unit when present (`12 sts`), include the parens on a row total (`(18)`). |
| `REPEAT` | Repeat instructions: `rep from * to *`, `* … * around`, `repeat rows 4-9`, `working in rounds` | The instruction phrase, not the repeated content. Link it to its target with the `repeats` relation. |
| `ROW` | A row/round identifier: `Row 1`, `Rnd 3`, `Rows 4-9`, `Round 12` | Identifier only, no colon. |
| `SECTION` | A named piece of the project: `Body`, `Sleeve`, `Ear`, `Assembly`, `Finishing`, `Edging` | The heading text. |
| `HOOK` | Hook size: `4.0 mm`, `H/8`, `3.5mm hook` | Include the size and the word "hook" if adjacent. |
| `YARN` | Yarn weight, fiber, brand or colorway: `worsted`, `DK`, `Aran weight`, `cotton`, `Colour A` | The descriptive phrase. |
| `GAUGE` | A gauge statement: `14 sts x 16 rows = 4"` | The whole measurement clause. |
| `ABBREV` | An abbreviation being *defined*, typically in a key: `sc = single crochet` | The abbreviation being defined. Link to its expansion with `defines`. |
| `NOTE` | Advisory prose that isn't an instruction: `Do not join`, `stuff firmly as you go`, `ch 1 does not count as a st` | The full clause. |

## Boundary rules

1. **Never include surrounding punctuation** unless it's part of the token
   (`sl st.` → span is `sl st`). Parentheses around a row total *are* included:
   `(18)`.
2. **Count and stitch are always separate spans.** `6 dc in the ring` gives
   `COUNT: 6` + `STITCH: dc`, joined by a `count_of` relation pointing from the
   count to the stitch. This is what lets a model reconstruct stitch math.
3. **A row total at the end of a row is a `COUNT`**, not a separate label:
   `Rnd 2: 2 sc in each st around (12)` → `COUNT: 2`, `STITCH: sc`,
   `REPEAT: around`, `COUNT: (18)`.
4. **Compound stitches are one span.** `sc2tog`, `dc3tog`, `front post dc` are a
   single `STITCH`, even though a count appears inside the token.
5. **Repeated multi-stitch groups**: label the stitches inside normally, then
   label the repeat marker and link it. In `[2 sc, inc] x6`, the `x6` is a
   `COUNT` and the brackets get a `REPEAT` span only if the pattern writes an
   explicit repeat word.
6. **Overlapping spans aren't supported** — pick the more specific label.
   `Aran weight cotton` is one `YARN` span, not two.
7. **Skip a task** (rather than guessing) if the source text is garbled or
   truncated mid-instruction. Note why.

## Relations

- `count_of` — from a `COUNT` **to** the `STITCH` it quantifies.
- `repeats` — from a `REPEAT` **to** the first span of the sequence being repeated.
- `defines` — from an `ABBREV` **to** its expansion text.

Relations are directional in Label Studio; draw them in the direction above so
the exported JSON is consistent.

## Quality checks before submitting a task

- Every `STITCH` that has a number in front of it has a `count_of` relation.
- Every `ROW` line has at least one `STITCH` span, unless the row is pure prose.
- The `construction` choice is set (use *not stated* rather than leaving it blank).
