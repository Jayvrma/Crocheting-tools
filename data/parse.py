import re
from collections import Counter
import pymupdf
import tkinter as tk
from tkinter import filedialog

# Regex to match lines that represent rows (rnds, rows, R)
rounds = re.compile(r'^(?:Rnds?|Rows?|R)\s*\d+(?:\s*-\s*\d+)?(?:\s*\([^)]*\))?\s*[:.)]', re.IGNORECASE)
# Regex to split abbrev from definition for the dictionary
abbrev_split = re.compile(r'\s*[:=–—]\s*')

# Pdf lines extract each line of text, and other attributes like font size, boldness, etc
def pdf_lines(path):
    # Opens the pdf and iterates through each page, extracting text blocks and lines, filtering out empty spans, and yielding the text, font size, and boldness of each line.
    for page in pymupdf.open(path):
        # Gets the text of each page in a dictonary format
        for block in page.get_text('dict')['blocks']:
            # Gets the lines of text from each block
            for line in block.get('lines', []):
                # Creates a list of spans that arent empty
                spans = [s for s in line['spans'] if s['text'].strip()]
                if not spans:
                    continue
                # Joins text inro a string, checks its boldness & size
                text = ''.join(s['text'] for s in spans).strip()
                size = max(s['size'] for s in spans)
                # Checks if the spans are bold and if they contain any word characters
                all_bold = all(s['flags'] & 16 for s in spans if re.search(r'\w', s['text']))
                yield text, size, all_bold

# Gets the sections of the pdf via the lines extracted from the pdf and returns a dictionary of sections with their corresponding lines of text.
def pdf_to_sections(path):
    # creates a list oflines, and counts the size of lines
    lines = list(pdf_lines(path))
    sizes = Counter()
    # iterates through the lines, rounding the size and counting the length of text for each size
    for text, size, _ in lines:
        # counts the number of lines for each size b adding the length of the text to the counter
        sizes[round(size)] += len(text)
    body_size = sizes.most_common(1)[0][0]
    sections, current = {}, 'Intro'
    # Iterates through the pdf lines and checks if the line is a header or a body line, and adds it to the appropriate section in the sections dictionary.
    for text, size, all_bold in lines:
        # If the size of the line is less than the body size - 1 or if the text is a digit, it skips to the next line.
        if round(size) < body_size - 1 or text.isdigit():
            continue
        is_header = len(text.split()) <= 5 and not rounds.match(text) and (
            round(size) > body_size + 1 or all_bold)
        # If the line is a header, it splits the text into parts and sets the current section to the last part. If the line is not a header, it adds the text to the current section in the sections dictionary. If the line is wrapped (i.e., it starts with a lowercase letter or an opening parenthesis and does not match certain patterns), it appends the text to the last item in the current section instead of creating a new item.
        if is_header:
            parts = [p.strip() for p in text.split('.') if p.strip()]
            current = parts[-1]
            continue
        items = sections.setdefault(current, [])
        # checks if the line is wrappped, if it is it appends the text to the current section for consistency
        wrapped = (text[0].islower() or text[0] == '(') and not rounds.match(text) \
            and not abbrev_split.search(text) and not items[-1].endswith((')', '.')) if items else False
        if wrapped:
            items[-1] += ' ' + text
        else:
            items.append(text)
    return sections

# finds the section in the sections dict that matches to the name of the section
def find_section(sections, name):
    for key, lines in sections.items():
        if key.lower().rstrip('s') == name:
            return lines
    return []

# used to open a file dialog
root = tk.Tk()
root.withdraw() 
# maks sure the user selects a pdf file
file_path = filedialog.askopenfilename(title="Select a PDF file", filetypes=[("PDF files", "*.pdf")])
if not file_path:
    exit()

sections = pdf_to_sections(file_path)

abbrev_dict = {}
# iterates through the lines for the abbv section adding the abbrev and definition to the abbrev_dict
for line in find_section(sections, 'abbreviation'):
    parts = abbrev_split.split(line, maxsplit=1)
    if len(parts) == 2:
        abbrev_dict[parts[0]] = parts[1]

materials = find_section(sections, 'material')

pattern_sections = {}
for name, lines in sections.items():
    found = [line for line in lines if rounds.match(line)]
    if found:
        pattern_sections[name] = found

print(abbrev_dict)
print(materials)
print(pattern_sections)
