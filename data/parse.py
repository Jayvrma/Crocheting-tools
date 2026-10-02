import re

pattern = """
Abbreviations
Sc – single crochet
Inc – increase
Dec – decrease
FO – Finish off
Rnd – round
sts – stitches

Materials
Size F 3.75mm crochet hook
One skein of black worsted weight yarn (For example Red Heart Super Saver, Loops & Threads Impeccable, etc.)
One piece of black felt
One skein of black embroidery floss
One skein of silver embroidery floss
1 pair of 12mm safety eyes
Scissors
Yarn needle
Embroidery/sewing needle
Stuffing (I use polyester fiberfill)

Head
Begin with black yarn
Rnd 1: 6 sc in a Magic Ring (6)
Rnd 2: inc in each sc around (12)
Rnd 3: *sc, inc* 6 times (18)
Rnd 4: *sc (2), inc* 6 times (24)
Rnds 5-9: sc 24 each round
If you are using safety eyes, place them in now between rows 7 and 8, with 5 stitches in between them. Snap on the back of the eyes, then begin stuffing the head.
Rnd 10: *sc (2), dec* 6 times (18)
Rnd 11: *sc (1), dec* 6 times (12)
Rnd 12: *dec* 6 times (6)
You should now have 6 sts left. Cut the yarn leaving a tail about 6 inches long. Use a yarn/embroidery needle to thread the tail through the remaining loops. Pull tight to close the hole, similar to closing a drawstring bag. Then weave the tail in back through the head.

Body
Begin with black yarn
Rnd 1: 7 sc in a Magic Ring (7)
Rnd 2: inc in each sc around (14)
Rnd 3: sc 2, inc 2, sc 5, inc 2, sc 3 (18)
Rnds 4-5: sc 18 each round
Rnd 6: sc 2, dec 2, sc 5, dec 2, sc 3 (14)
Rnds 7-8: sc 14 each round
Rnd 9: sc, dec 2, sc 3, dec 2, sc 2 (10)
FO, leaving an 8 inch tail for sewing on later.

Feet (make 2)
Begin with black yarn
Rnd 1: 5 sc in a Magic Ring (5)
Rnds 2-3: sc 5 in each rnd
FO leaving an 8 inch tail for sewing on.
"""

patterns = re.compile(r'^([A-Za-z0-9]+(?:[ \t][A-Za-z0-9]+)?)[ \t]*(?:[–—=:-]|\t|[ \t]{2,})[ \t]*(.+)$', re.MULTILINE | re.IGNORECASE)
abbreviations = re.compile(r'\b(?:Sc|Inc|Dec|FO|Rnd|sts)\b',re.MULTILINE | re.IGNORECASE)
rounds = re.compile(r'^(?:Rnds?|Rows?)\.?[ \t]*\d+(?:-\d+)?:.*$', re.MULTILINE | re.IGNORECASE)

# matches = patterns.finditer(pattern)
with open('data/pattern.txt', 'r', encoding='utf-8') as f:
    contents= f.read()
    # only look for definitions in the Abbreviations block (up to the first blank line)
    abbreviation_block = contents.split('\n\n')[0]
    matches = patterns.finditer(abbreviation_block)
    matchesabv = abbreviations.finditer(abbreviation_block)
    for match in matches:
        print(match)
    for match in matchesabv:
        print(match)
sections = {}
for block in contents.split('\n\n'):
    lines = block.strip().split('\n')
    section_header = lines[0].strip()
    section_rounds = rounds.findall(block)
    if section_rounds:
        sections[section_header] = section_rounds
        print(f"Section: {section_header}")
        for rnd in section_rounds:
            print(f"Round: {rnd}")
print(sections)
abbrev_dict = dict(patterns.findall(abbreviation_block))
print(abbrev_dict)
