# Question Issues Log

Tracking data quality problems found in question banks and their resolutions.

---

## 1. Missing `underlineText` on Craft & Structure questions

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-26
**Status:** Fixed

33 questions referenced "underlined sentence/portion/phrase" in their question text but the passage object was missing the `underlineText` property, so nothing was visually underlined for the student.

**Fix:** Added `underlineText` to all 33 passages. Also updated `PassageData` type (`src/types.ts`) and `PassageViewer.tsx` to support `string | string[]` for questions with multiple underlined portions (e.g. `c6bd3447`).

**Affected question IDs:**
ca50de52, eb89dcc8, 236fee8e, cef79fb9, eaea6f8f, 105ea6de, 066a3295, ac9a3a26, 662ebff2, 835d1ae6, 4c4db685, cf46f239, 81da17d3, 617a8a10, e13171c4, df46a2ee, a2f64e58, aa5897b8, c502943e, 39857700, 2aaee77f, 2e744883, d2a90d4f, 3e6ad72d, f3c45b4f, 5336f2e4, 809addda, ea9dfe27, c6bd3447, a68239ed, 422c5068, 74446089, cf9a00e0

---

## 2. Truncated passage for c966ad55

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-26
**Status:** Fixed

Passage text was cut off at "The following text is from Srimati Svarna Kumari Devi's 1894 novel The Fatal Garland (translated by" — the rest of the passage (Shakti walking through the woods) was missing entirely. The question text was also wrong ("Which choice best completes the text?" instead of the correct underlined-portion question).

**Fix:** Restored full passage from source file (`questions/craft-structure-1-100.txt`), added `underlineText`, and corrected the question text.

---

## 3. Garbled character and truncated options for dd11e5ab

**Domain:** `cb-rw-expression-of-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

The passage and option B both contained a Unicode replacement character (`U+FFFD`) instead of an en dash in the date range "1897–1920". Additionally, options A, B, and D were truncated mid-sentence (likely an OCR line-wrap parsing issue).

**Fix:** Replaced `U+FFFD` with en dash (`\u2013`) in passage and option B. Restored full text for options A, B, and D from source file (`questions/expression-ideas-1-100.txt`). Also updated `correctAnswer` to match the now-complete option A text.

---

## 4. Truncated options for 296801d2

**Domain:** `cb-rw-expression-of-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

Options A and D were cut off mid-sentence (OCR line-wrap parsing issue). Option A ended at "coast of" and D ended at "not mariners". `correctAnswer` also truncated since it matched option D.

**Fix:** Restored full text for options A and D, and updated `correctAnswer`, from source file (`questions/expression-ideas-1-100.txt`).

---

## 5. Garbled dash in passage for 221ecf0f

**Domain:** `cb-rw-expression-of-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

Passage contained `U+FFFD` instead of an en dash in the date range "1873–1908".

**Fix:** Replaced `U+FFFD` with en dash (`\u2013`).

---

## 6. Garbled characters in passage and explanation for 707461d8

**Domain:** `cb-rw-standard-english-conventions.ts`
**Found:** 2026-02-26
**Status:** Fixed

Passage contained two `U+FFFD` characters: `Mac�as-Rubalcava` (should be `Macías-Rubalcava` with accented í) and `fungi�produced` (should be `fungi-produced` with regular hyphen). The explanation also had `Mac�as-Rubalcava`. Source file (`questions/sec-1-100.txt`) has the same garbled characters.

**Fix:** Replaced `U+FFFD` with `í` in the biologist's name and with `-` in `fungi-produced`, in both passage and explanation.

---

## 7. Bulk garbled characters across Standard English Conventions domain

**Domain:** `cb-rw-standard-english-conventions.ts`
**Found:** 2026-02-26
**Status:** Fixed

59 `U+FFFD` characters across the entire file, affecting proper names, date ranges, compound terms, and temperature values. OCR replaced accented/special characters with the Unicode replacement character.

**Fix:** 28 targeted find/replace pairs covering:
- **Names** (57 occurrences): René Descartes, Pura Belpré, José Limón, Tomas Tranströmer, Rabinal Achí/K'iche' Achí, Simón Bolívar, Félix González-Torres, Driss Chraïbi, Lola Álvarez Bravo, Neuländer-Simon, Lê Lương Minh, Poincaré, Gijón, Día, Botânico, Árbol, Passé
- **Date ranges** (2): 1809–1849, 1572–1631, Wisconsin–Madison (en dashes)
- **Grammar terms** (2): pronoun–antecedent, subject–verb (en dashes)
- **Compounds** (2): energy-powered, wave-based (hyphens)
- **Temperature** (2): 0.1°C, 1.7°C (degree symbols)

---

## 8. Bulk garbled characters across Expression of Ideas domain

**Domain:** `cb-rw-expression-of-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

79 `U+FFFD` characters across the file, affecting proper names, date ranges, temperature values, dimension symbols, and compound terms from OCR extraction.

**Fix:** ~35 targeted find/replace pairs covering:
- **Names** (~40 occurrences): Estefanía Muñoz-Hernández, Sanmartín, Diné, Simón Bolívar, Ramírez, Ramón y Cajal, Ántonia, Lluís Domènech, Frédéric Bartholdi, Chloé Zhao, María Martínez, Velázquez, López, Børre Sæthre, mistikôsiwak
- **Date ranges** (~15 occurrences): 1916–2009, 1887–1980, 774–775, 384–322 BCE, 965–1040 CE, 206 BCE–220 CE, 1861–1865, 1889–1948, 1925–1945
- **Temperature** (~5 occurrences): 9,800°F, 8,900°F
- **Dimensions** (~4 occurrences): 149 × 255, 132 × 264
- **Compound terms** (2): game–centric, Sueños/sueños

---

## 9. Bulk garbled characters across Craft & Structure domain

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-26
**Status:** Fixed

54 `U+FFFD` characters across the file, from OCR extraction.

**Fix:** ~30 targeted find/replace pairs covering:
- **Copyright leaks in question fields** (7): Removed `©YEAR by AUTHOR` prefixes from question text for Anita Desai, Yann Martel, Cynthia Kadohata, James Baldwin, N. Scott Momaday, Jhumpa Lahiri, Joan Didion
- **Names** (~25 occurrences): José Martí, Charlotte Brontë, Jünger, Neshnabé, güiro/Taíno, Alemán, Algarín, Grimké, Sông, Mônica, Teotihuacán, Cáceres, Luiseño, Diné, López-Morales, Batalhão, Humpenöder, naïve
- **Date ranges** (~5 occurrences): 1910–1970, 1871–72, 1969–1972, 0–30 cm
- **Compound terms** (3): Hong Kong–based, World War II–era, Crow Tribe– MSU

---

## 10. Poem stanzas leaked into question fields

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-26
**Status:** Fixed

Two questions had poem stanzas that belonged in the passage text incorrectly placed at the start of the question field.

**Fix:** Moved the poem text from `question` to the end of `passage.text` for both questions.

**Affected question IDs:** rw-cb-6cf906fc (José Martí, "At the Salon"), rw-cb-9c759a09 (Georgia Douglas Johnson, "Benediction")

---

## 11. Misplaced question prompt in passage text

**Domain:** `cb-rw-expression-of-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

Question rw-cb-d8aa8ba2 had the Rhetorical Synthesis question prompt ("The student wants to emphasize the mass of Sirius") appended to the passage text instead of the question field.

**Fix:** Moved the prompt from passage to question field. Updated question from generic "Which choice best completes the text?" to the correct "The student wants to emphasize the mass of Sirius A. Which choice most effectively uses relevant information from the notes to accomplish this goal?"

---

## 12. Garbled names in Standard English Conventions

**Domain:** `cb-rw-standard-english-conventions.ts`
**Found:** 2026-02-26
**Status:** Fixed

Two names had OCR-dropped characters (not U+FFFD, just missing letters):
- `kk kila` → `kika kila` (Hawaiian steel guitar, question rw-cb-856b495d)
- `Shnagon` → `Shōnagon` (Sei Shōnagon, question rw-cb-f10b7ce4)

---

## 13. OCR line-break artifacts (broken hyphenation)

**Domain:** `cb-rw-standard-english-conventions.ts`
**Found:** 2026-02-26
**Status:** Fixed

Four instances where a hyphenated word split across lines in the source PDF preserved a spurious space after the hyphen: `chorus-to- verse`, `tug-of- war`, `light- colored`, `self- discovery`.

**Fix:** Removed the space after each hyphen.

**Affected question IDs:** rw-cb-4c335aea, rw-cb-4aa28ac3 (explanation), rw-cb-73a6603c, rw-cb-96953201

---

## 14. Wrong closing quotation marks

**Domain:** `cb-rw-information-and-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

Question rw-ii-cb-c83e0b43: Options A and B ended with `\u201c` (LEFT double quotation mark) instead of `\u201d` (RIGHT/closing double quotation mark).

**Fix:** Changed trailing `\u201c` to `\u201d` on both options.

---

## 15. Trailing punctuation artifact

**Domain:** `cb-rw-information-and-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

Question rw-ii-cb-29cde5fa: Explanation ended with `arrogant! .` — spurious space-period after exclamation mark.

**Fix:** Removed the trailing ` .`.

---

## 38. Truncated passage for rw-cb-b411eb09

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-26
**Status:** Fixed (2026-02-28)

Passage text was truncated to just "New and interesting research conducted by Suleiman". Full passage is a single sentence about Al-Sweedan and Alhaj's research on altitude's effect on blood chemistry. Also had wrong question prompt ("Which choice best completes the text?" instead of "Which choice completes the text with the most logical and precise word or phrase?").

**Fix:** Restored full passage text from source PDF. Fixed question prompt.

---

## 39. Truncated options across Craft & Structure domain

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-26
**Status:** Fixed (2026-02-28)

10 questions had answer options cut off mid-sentence (OCR line-wrap issue). The `correctAnswer` also truncated to match. All restored from source PDFs (`SAT BANK - READING - CRAFT-STRUCTURE - 1-100.pdf` and `101-200.pdf`).

**Affected question IDs:** rw-cb-b13378c8, rw-cb-d4732483, rw-cb-105ea6de, rw-cb-c4737d6a, rw-cb-d6c77ae5, rw-cb-4b4ab04e, rw-cb-e1befb41, rw-cb-65406d2c, rw-cb-f7c02e89, rw-cb-975b0602

---

## 41. Truncated/malformed explanations in Information & Ideas

**Domain:** `cb-rw-information-and-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed (2026-02-28)

**rw-ii-cb-5fb6ed10**: Explanation had "Choice D is the best answer because." — errant period after "because" creating broken sentence. Fixed by removing period.

**rw-ii-cb-040583a5**: Explanation truncated at "...to about 8." — missing the rest about 18°C untreated bananas and the conclusion. Restored from source PDF.

**rw-ii-cb-086dd8cc**: Explanation truncated at "...sea star species (P." — missing P. miniata comparison with acorn worm and conclusion about head/trunk regions. Restored from source PDF.

---

## OPEN — Truncated explanations (need source material)

**Status:** Unfixed — requires College Board source text

9 explanations in `cb-rw-standard-english-conventions.ts` are cut off mid-sentence:
rw-cb-aaa1907f, rw-cb-f78997cf, rw-cb-9c3630b9, rw-cb-6e071432, rw-cb-c06af4d8, rw-cb-a05cc490, rw-cb-548f4956, rw-cb-5aa171de, rw-cb-21e58a83

---

## 40. Structurally broken questions in Information & Ideas

**Domain:** `cb-rw-information-and-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed (2026-02-28)

Three questions were structurally broken, all restored from source PDFs (`SAT BANK - READING - INFO+IDEAS - 1-100.pdf`):

**rw-ii-cb-458b4a11**: Passage text was in question field (truncated at "2°"), question text was in options[0], only 3 real options, correctAnswer pointed to wrong option. Reconstructed full passage with `passage` object, moved question text, added missing option D, fixed correctAnswer to C.

**rw-ii-cb-be19faa1**: Only 3 options (missing option D). Explanation said "Choice D" but D didn't exist. Added missing option D (subsurface thermal pollution), fixed correctAnswer to D.

**rw-ii-cb-8a584241**: Only 3 options (missing option D). Explanation said "Choice B" but correctAnswer pointed to option A text. Added missing option D (H2S germination at 48 hours), fixed correctAnswer to B.

---

## OPEN — Missing passage objects

**Status:** Unfixed — low priority (questions work but passage displays inline)

5 questions in `cb-rw-standard-english-conventions.ts` have passage text embedded in the `question` field instead of a separate `passage` object: rw-cb-8b017d4e, rw-cb-fced396a, rw-cb-b0115ef6, rw-cb-1684b237, rw-cb-dab8b8ee

1 question has passage text split between passage and question fields: rw-cb-9df6da04

---

## 16. OCR line-break artifacts across all RW domains

**Domains:** `cb-rw-craft-and-structure.ts`, `cb-rw-expression-of-ideas.ts`, `cb-rw-standard-english-conventions.ts`, `cb-rw-information-and-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

31 instances of spurious spaces after hyphens in compound words (OCR line-wrap artifacts).

**Fix:** Removed the space after each hyphen across all 4 files:
- **cb-rw-craft-and-structure.ts** (6): `self-effacement`, `one-volume`, `short-nosed`, `sugar-maples`, `day-dreams`, `mold-made`
- **cb-rw-expression-of-ideas.ts** (3): `year-round`, `left-right`, `high-quality`
- **cb-rw-standard-english-conventions.ts** (1): `Subject-modifier`
- **cb-rw-information-and-ideas.ts** (21): `chest-high`, `high-elevation`, `mim-root`, `nine-year`, `single-species`, `stand-alone`, `home-lessons`, `natural-resource` (×2), `seventh-century`, `high-resolution`, `polymer-derived`, `stress-exposed`, `yellow-tinted`, `cross-genre`, `country-specific`, `lava-affected` (×3), `gray-furred`, `trade-off`

---

## 17. U+FFFD in option text for rw-cb-e13171c4

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-26
**Status:** Fixed

Option D had `Neshnab\ufffd` instead of `Neshnabé`. The passage text already had the correct accented form.

**Fix:** Replaced `\ufffd` with `é` in option D.

---

## 18. Garbled volcano name for rw-cb-92fe0ed7

**Domain:** `cb-rw-expression-of-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

Passage and explanation had `Phhonu` instead of `Pūhāhonu` (Hawaiian shield volcano).

**Fix:** Replaced all occurrences of `Phhonu` with `Pūhāhonu`.

---

## 19. Misplaced question prompt for rw-cb-5d3177aa

**Domain:** `cb-rw-expression-of-ideas.ts`
**Found:** 2026-02-26
**Status:** Fixed

Rhetorical Synthesis question had the student's intent ("The student wants to present the significance of the Hart-Celler Act to an audience unfamiliar with the history of US immigration.") appended to `passage.text` instead of the `question` field.

**Fix:** Moved the intent sentence from passage to question field.

---

## 20. Trailing punctuation artifacts in explanations

**Domain:** `cb-rw-standard-english-conventions.ts`
**Found:** 2026-02-26
**Status:** Fixed

Two explanations ended with `." .` — a spurious space-period after a quoted sentence.

**Fix:** Removed the trailing ` .` from both explanations.

**Affected question IDs:** rw-cb-b0a525be, rw-cb-403d7bb5

---

## 42. Copyright notices in Information & Ideas passages

**Domain:** `cb-rw-information-and-ideas.ts`
**Found:** 2026-02-28
**Status:** Fixed

5 passages had copyright notices (`©YEAR by AUTHOR`) appended to the end of the passage text.

**Affected question IDs:** rw-ii-cb-82d2436a (Laila Lalami), rw-ii-cb-487a05f8 (Sylvia Acevedo), rw-ii-cb-40630cef (David Barclay Moore), rw-ii-cb-69d662af (Ann Petry), rw-ii-cb-7f0be746 (Milan Kundera)

---

## 43. Grammar fix for rw-ii-cb-d5b9ed0d

**Domain:** `cb-rw-information-and-ideas.ts`
**Found:** 2026-02-28
**Status:** Fixed

Question text had "the students' conclusion" (plural possessive) but the passage refers to "a student" (singular). Fixed to "the student's conclusion".

---

## 37. Dropped macron character for rw-cb-e386a11d

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-02-28
**Status:** Fixed

Artist name "Hishida Shunsō" had the macron-o (ō, U+014D) dropped, appearing as "Hishida Shuns" in both passage text and explanation.

**Fix:** Replaced all occurrences of "Hishida Shuns" with "Hishida Shunsō".

---

## OPEN — Missing explanations (empty string)

**Status:** Ongoing — fix as found during review

Many questions across all domains have `explanation: ""` (empty string). These need explanations added that walk through the solution step by step.

**Known issue types in this category:**
- Grid-in questions from OCR extraction frequently have empty explanations
- Some multiple-choice questions also missing explanations
- When fixing, verify the correctAnswer is correct before writing the explanation

---

## 36. Garbled function and missing number for math-alg-cb2-5ad6bc97

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

Function definition `flc) = Tr +1` garbled — should be `f(x) = 7x + 1`. Question text missing the number of managers ("with managers?" → "with 7 managers?"). Missing explanation.

**Fix:** Reconstructed function as `f(x) = 7x + 1` (verified: f(7) = 50 matches answer). Added formula-first formatting. Added explanation.

---

## 35. OCR artifacts and trailing comma for math-alg-cb2-a04190b7

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

`correctAnswer` was `"4.51,"` (trailing comma). Equation had `4.5lx` (OCR read `1` as `l`), missing `=` sign, semicolon instead of comma. Missing explanation.

**Fix:** Fixed equation to `4.51x + 6.07y = 896.86`. Changed correctAnswer to numeric `4.51`. Added explanation.

---

## 34. Garbled equation for math-alg-cb2-e53870b6

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Question text `"6x+k=6x+5"` with answer `"189/5,"` — equation as displayed trivially gives k=5, but stored answer is 189/5. Original equation must have involved fractions that OCR destroyed. Unsalvageable.

**Fix:** Removed the question entirely.

---

## 33. Garbled equation for math-alg-cb2-9f70fd47

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Question text was `"...the graph of % + 21 in the xy-plane?"` — equation replaced by `%` symbol. Answer `"189/5,"` with trailing comma. Unsalvageable.

**Fix:** Removed the question entirely.

---

## 32. Garbled equation for math-alg-cb2-429fb7c0

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Equation `"0.8t 0.46 = 8(t _ 0.001) + 1.9"` — missing operators, underscore instead of minus. Answer `"-.3266,"` with trailing comma. Could not verify or reconstruct.

**Fix:** Removed the question entirely.

---

## 31. Garbled function definition for math-alg-cb2-1f0966db

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Function defined as `f(c) = % +` — completely garbled. Uses inconsistent variable names (c, x, a). Unsalvageable.

**Fix:** Removed the question entirely.

---

## 30. Garbled system of equations for math-alg-cb2-3a84f885

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Both equations garbled with mismatched parentheses: `"I - 2) - 4(y +7) = 117"` and `"2)+ 4y + 7) = 442"`. Final expression `"6(k 2)2"` also garbled. Unsalvageable.

**Fix:** Removed the question entirely.

---

## 29. Inline equation and OCR artifacts for math-alg-cb2-2d54c272

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

Equation `5G + 45R = 380` was inline with the question text instead of on its own line. Also had OCR artifacts: semicolons/colons instead of commas/periods, missing articles, `Rred` → `R red`, missing explanation.

**Fix:** Moved equation to its own line with `\n\n` separator. Fixed punctuation and grammar. Added explanation.

---

## 28. Missing system of equations for math-alg-cb2-aacc834b

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Question text was `"+ 3y = 26"` — the first equation of the system was completely missing, only a fragment of the second equation remained. Unsalvageable without source material.

**Fix:** Removed the question entirely.

---

## 27. Garbled equation for math-alg-cb2-d0a2fed5

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Question text was `"#p+18 54,what is the value of 7p?"` — the equation was garbled beyond recognition (# symbol, missing operator, no equals sign). Could not reconstruct the intended equation.

**Fix:** Removed the question entirely.

---

## 26. Trailing comma in correctAnswer for math-alg-cb2-56e1b09e

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

`correctAnswer` was `"0.2,"` (string with trailing comma) instead of numeric `0.2`. Also missing explanation and formula not separated from question text.

**Fix:** Changed correctAnswer to `0.2` (number). Added formula-first formatting with `\n\n`. Added explanation.

---

## 25. Mangled text and missing explanation for math-alg-cb2-feb78194

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

Question text had extensive OCR artifacts: missing "A" at start, underscores instead of periods, colons/semicolons instead of periods/commas, parenthetical formula missing equals/minus signs. Explanation was empty.

**Fix:** Rewrote question text with correct punctuation. Fixed parenthetical to `(profit = total revenue - total expenses)`. Added explanation.

---

## 24. Missing equation (OCR garbage) for math-alg-cb2-c7d7980e

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed (removed)

Question text was `"131 112 What value of x is the solution to the given equation?"` — the actual equation was completely lost during OCR, replaced by stray numbers (likely page numbers or artifact). No way to reconstruct the intended equation.

**Fix:** Removed the question entirely.

---

## 23. Mangled text and missing explanation for math-alg-cb2-b78cd5df

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

Question text had multiple OCR artifacts: colons instead of periods, `onetime` → `one-time`, missing articles ("planning party" → "planning a party", "has budget" → "has a budget"), stray `"` character, `$300_` → `$300`. Explanation was also empty.

**Fix:** Rewrote question text with correct punctuation and grammar. Added step-by-step explanation (inequality 35 + 10.25a ≤ 300, solve for a ≤ 25.85, round down to 25).

---

## 22. Missing explanation and OCR typos for math-alg-cb2-7625073d

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

Explanation field was empty. Also two OCR artifacts in the question text: `9` instead of `g` (the variable for green tiles) and `:` instead of `.` before "How many green tiles".

**Fix:** Added step-by-step explanation (substitute b=71, solve for g=49). Fixed `9` → `g` and `:` → `.` in question text.

---

## 21. Trailing spaces after blanks in rw-standard-english-conventions.ts

**Domain:** `rw-standard-english-conventions.ts`
**Found:** 2026-02-26
**Status:** Fixed

3 passage texts had a trailing space after `_______` at the end of the string.

**Fix:** Removed the trailing space before the closing quote.

**Affected question IDs:** rw-sec-q6, rw-sec-q12, rw-sec-q28

---

## 44. Bulk OCR cleanup — Math Algebra "Linear Equations in One Variable" skill

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-02-28
**Status:** Fixed

43 questions fixed across the "Linear Equations in One Variable" skill group. Issues ranged from garbled equations to missing options to wrong answers, all verified against source PDFs where available.

### Garbled OCR text (equations unreadable or wrong characters) — 29 questions fixed:

| Question ID | Issue | Fix |
|---|---|---|
| math-alg-cb2-15daa8d6 | "constant If" missing sentence | → "a is a constant. If" |
| math-alg-cb2-40ba6288 | `3x 122` garbled | → `3x - 12`, formula-first formatting |
| math-alg-cb2-12ee1edc | Missing "a", semicolons, missing option, no `?` | Full rewrite + added option C "6" |
| math-alg-cb2-6ac23de7 | Equation missing entirely (`=20 In the equation`) | → `4x/5 = 20`, option C "6"→"16" |
| math-alg-cb2-018a2704 | `2(2 8)` missing minus/x | → `2(x - 8)` |
| math-alg-cb2-3d04de9c | `principa` truncated, colons | → `principal`, fixed punctuation |
| math-alg-cb2-4de87c9a | `(3)(8)2` garbled options | → `(3)(8)x`, `3x + 8` |
| math-alg-cb2-70e29454 | `"a = 2 andb =7"` garbled answer/options | Rewrote all 4 options, correctAnswer→"B" |
| math-alg-cb2-e7b6f0d1 | `4x \| 6 = 18` pipe for plus | → `4x + 6 = 18`, formula-first |
| math-alg-cb2-7d5d1b32 | Garbled fractions in equation, trailing comma | Rewrote equation, correctAnswer→"-14/15" |
| math-alg-cb2-bf749912 | `{ (2 + 6) _ % (c + 6) =` completely garbled | → `(1/3)(x + 6) - (1/2)(x + 6) = -8` |
| math-alg-cb2-550b352c | "None" leaked into question, 3 garbled options | Separated question, 4 proper options |
| math-alg-cb2-87071893 | `I F 40 = 95` garbled | → `x + 40 = 95`, formula-first |
| math-alg-cb2-620abf36 | `If5(2 +4) = 4( + 4)` OCR dropped x | → `If 5(x + 4) = 4(x + 4)` |
| math-alg-cb2-da2e9202 | `l62` (l for 1), options missing = | → `16x`, fixed all options |
| math-alg-cb2-4f669597 | `Sp` → `5p`, **wrong answer** (27→1.2) | Fixed equation and correctAnswer |
| math-alg-cb2-3c4ce699 | `3c` → `3x`, `If6` → `If 6` | Fixed OCR misreads |
| math-alg-cb2-2e8cc1c0 | `241` → `24x` | Fixed OCR misread |
| math-alg-cb2-153ee763 | `3c + 21pc` → `-3x + 21px`, merged options | Rewrote equation, split to 4 options |
| math-alg-cb2-ce6b52d8 | `3t 10` missing minus | → `3t - 10` |
| math-alg-cb2-83fb222d | `6n 12` missing equals | → `6n = 12` |
| math-alg-cb2-7a987ae4 | `"2n =10 If 5...Zn _ 1"` garbled | → `If 2n/5 = 10...2n - 1` |
| math-alg-cb2-4771a64a | Missing minus signs throughout | → `5 - 7(2 - 4x) = 16 - 8(2 - 4x)` |
| math-alg-cb2-40049d49 | `a(2+3) 4x + 12 =` garbled | → `4x + 12 = a(x + 3)` |
| math-alg-cb2-3f8a701b | Entire question garbled (Roman numerals + options merged) | Complete rewrite from source PDF |
| math-alg-cb2-b4553284 | `9z` → `9x` | Fixed OCR misread |
| math-alg-cb2-771bd0ca | `_` → `-` (underscore for minus) | Fixed |
| math-alg-cb2-12255364 | `836`/`819` → `$36`/`$19` (8 for $) | Fixed OCR misread |
| math-alg-cb2-c3989ef8 | `860.00` → `$60.00` (8 for $) | Fixed OCR misread |

### Missing/merged options (fewer than 4 for multiple-choice) — 10 questions fixed:

| Question ID | Before | After |
|---|---|---|
| math-alg-cb2-12ee1edc | 3 options | Added "6" (4 options) |
| math-alg-cb2-550b352c | 3 garbled | 4 proper: None/Exactly 1/Exactly 3/Infinitely many |
| math-alg-cb2-0cb57740 | Question in options | Moved text, 4 proper options |
| math-alg-cb2-153ee763 | "7 3" merged | Split to 4: 0/1÷7/4÷3/4 |
| math-alg-cb2-2e98b1df | "130 94" merged | Split to 4: 400/130/94/90 |
| math-alg-cb2-36ab4122 | "$11.75" leaked into question | Moved to option A, 4 proper options |
| math-alg-cb2-fbb0ea7f | "17,243 39,481" merged | Split to 4: 4995/17243/39481/104895 |
| math-alg-cb2-5ad9eff0 | "4w +12 w2+6" merged | Split to 4: 2w+6/4w+12/w²+6/w²+6w |
| math-alg-cb2-46f68129 | 3 options | Added "29" (4 options) |
| math-alg-cb2-56e373b3 | "40 60" merged | Split to 4: 20/40/60/80 |

### Wrong question type — 2 questions fixed:

| Question ID | Before | After |
|---|---|---|
| math-alg-cb2-f09097b1 | multiple-choice (no options) | grid-in, answer=22.4 |
| math-alg-cb2-4f7981a0 | multiple-choice (no options) | grid-in, answer=24 |

### Wrong correctAnswer — 2 questions fixed:

| Question ID | Before | After |
|---|---|---|
| math-alg-cb2-4f669597 | 27 | 1.2 (verified: 5p=6, p=6/5) |
| math-alg-cb2-7d5d1b32 | "-.9333," (trailing comma) | "-14/15" |

### correctAnswer format (raw value → letter) — 3 questions fixed:

| Question ID | Before | After |
|---|---|---|
| math-alg-cb2-6ac23de7 | "25" | "A" |
| math-alg-cb2-7a987ae4 | "49" | "B" |
| math-alg-cb2-b80d10d7 | "2" | "B" |

### Other fixes:

- math-alg-cb2-0d685865: `Ifz` → `If z`, added missing `?`
- math-alg-cb2-ed18c4f7: "Cathy has CDs" → "Cathy has n CDs"
- math-alg-cb2-1ce51655: "decreases by ounce" → "decreases by 1 ounce"
- math-alg-cb2-c841e8e8: Added formula-first formatting, fixed spacing
- math-alg-cb2-36ab4122: Fixed `.5 times` → `1.5 times`, correctAnswer A→B

---

## 45. OCR garbled root expressions and wrong answers — Math Advanced Math "Equivalent Expressions"

**Domain:** `cb-math-advanced-math.ts`
**Found:** 2026-02-28
**Status:** Fixed

5 questions had OCR errors in the Equivalent Expressions skill group. All verified against source PDFs.

| Question ID | Issue | Fix |
|---|---|---|
| math-adv-cb-137cc6fd | `sqrt(70n)(sqrt(70n))^2` — roots garbled (should be 5th and 6th roots) | → `(5th root of 70n)(6th root of 70n)^2`, formula-first formatting |
| math-adv-cb-40c09d66 | `(x^5)/(4th root of x^4)` — should be sqrt / cube root | → `sqrt(x^5) / (cube root of x^4)`, formula-first formatting |
| math-adv-cb-433184f1 | Option D `0/((x+1)(4x-5))` — OCR read 9 as 0, **wrong answer** | → Option D `9/((x+1)(4x-5))`, correctAnswer fixed to D |
| math-adv-cb-6d04c89d | `1/(x+b)` — OCR dropped the 4, should be `4/(x+b)` | → `4/(x+b)` |
| math-adv-cb-a520ba07 | `(3)sqrt(x*y^5)` — expression garbled, should be cube root of x³y⁶ | → `cube root of (x^3 * y^6)`, formula-first formatting |

---

## 46. Formula-first formatting — Math Advanced Math "Nonlinear Equations"

**Domain:** `cb-math-advanced-math.ts`
**Found:** 2026-02-28
**Status:** Fixed

4 questions had single `\n` instead of `\n\n` between formula/equation and question text.

| Question ID | Fix |
|---|---|
| math-adv-cb-3a9d60b2 | `\n` → `\n\n` between equation and "What is..." |
| math-adv-cb-7028c74f | `\n` → `\n\n` between equation and "What is..." |
| math-adv-cb-3148fe3e | `\n` → `\n\n` between system of equations and "The solution..." |
| math-adv-cb-84e5e36c | `\n` → `\n\n` between system of equations and "The graphs..." |

---

## 47. OCR errors — Math Advanced Math "Nonlinear Functions"

**Domain:** `cb-math-advanced-math.ts`
**Found:** 2026-02-28
**Status:** Fixed

7 questions had OCR errors in the Nonlinear Functions skill group. All verified against source PDFs.

| Question ID | Issue | Fix |
|---|---|---|
| math-adv-cb-1ee962ec | Only 3 options instead of 4 (option D missing) | Added option D: "x: 0, 12, -6 and y: 0, 3, 0" |
| math-adv-cb-341ba5db | `g(x) = -x^2 + 55` — OCR added minus sign, should be positive | → `g(x) = x^2 + 55` (upward parabola with minimum of 55) |
| math-adv-cb-ce508fb0 | `g(w) = (-w)/(w-1) - w + 5` — missing absolute value bars around fraction | → `g(w) = \|(-w)/(w-1)\| - w + 5` (answer -4.9 now correct) |
| math-adv-cb-263f9937 | `5.12 × 10^9` — OCR misread exponent | → `5.12 × 10^8` (Day 12 = 5.12 × 10^8) |
| math-adv-cb-2992ac30 | Exponent `(t/8)` — OCR garbled, answer 8 months impossible with t/8 | → `(3t/2)` (3t/2 = 1 when t = 2/3 years = 8 months) |
| math-adv-cb-841ef26c | `f(x) = -4x^2 + 64x + 262` — OCR added minus sign | → `f(x) = 4x^2 + 64x + 262` (upward parabola with minimum at x = -13) |
| math-adv-cb-b8f13a3a | `f(x) = -ax^2 + b` (quadratic) — OCR garbled to quadratic from exponential; y-intercept `-75/8` → `-75/7` | → `f(x) = -a^x + b` (exponential), y-intercept `(0, -75/7)` |

---

## 48. Bulk data errors — Math Problem-Solving "Probability" skill group

**Domain:** `cb-math-problem-solving.ts`
**Found:** 2026-03-01
**Status:** Fixed

10 of 21 Probability questions had incorrect data when verified against source PDFs. Issues ranged from completely wrong question text to wrong options, wrong table data, and wrong answers. All verified against source PDFs in `questions/math-701-800/` and `questions/math-801-900/`.

### Wrong question text/answer (question doesn't match source PDF) — 1 question:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-eccbf957 | Question asked "probability of rolling less than 12" (answer 11/14) but PDF asks "probability of rolling a 2" (answer 1/14) | Rewrote question, options [1/14, 2/14, 12/14, 13/14], answer 1/14 |

### Wrong table data and/or answer — 3 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-b1b5300b | Answer "1/14" wrong — PDF table shows 2 hybrid cars ≤$25K out of 14, answer is 2/14 = 1/7 | Options → [1/7, 2/7, 1/3, 4/7], answer → 1/7 |
| math-ps-cb-0301c5dc | Table data completely wrong (Camping 15,2 vs PDF 20,5; No Camping 20,0 vs PDF 8,4). Answer 2/37 wrong, should be 5/37 | Rebuilt table from PDF, options → [5/37, 25/37, 8/37, 5/9], answer → 5/37 |
| math-ps-cb-0ae37ff3 | "4 red" cubes but PDF says "7 red" (total 74→77). Answer 8/74 wrong, should be 11/77 = 1/7 | Fixed to 7 red, options → [33/77, 4/77, 66/77, 1/7], answer → 1/7 |

### Wrong question type — 1 question:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-1353b86e | Was grid-in (answer 0.25) but PDF is multiple-choice with options 30/40, 22/40, 18/40, 10/40 | Changed to multiple-choice with tableData, answer → "10/40" |

### Wrong options (answer correct but distractors don't match PDF) — 5 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-16cea46c | Table simplified to Baritone/Other (PDF has 4 voice types). Option D "0.90" should be "0.67" | Restored full table (Countertenor 4, Tenor 6, Baritone 10, Bass 5), option D → "0.67" |
| math-ps-cb-79201024 | Options [11/45, 11/34, 34/45, 45/11] but PDF has [1/45, 11/45, 34/45, 45/45] | Fixed options to match PDF |
| math-ps-cb-e1ad3d41 | Options C "12/16" and D "3/4" but PDF has C "16/32" and D "12/16". Answer "3/4" should be "12/16" | Fixed options and answer to match PDF |
| math-ps-cb-46545dd6 | Options A "65/709" and D "140/709" use total across all years. PDF has A "10/140" and D "65/75" | Fixed distractors to match PDF |
| math-ps-cb-d89c1513 | Had both "50/135" and "10/27" as options (equivalent values). PDF has [15/50, 15/135, 35/50, 50/135] | Fixed options, answer → "50/135" |

### Simplified table restored to full 2-way table — 1 question:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-2905ded0 | Table only showed age totals, missing east/west river split from PDF. Option C "89/135" should be "100/135" | Restored full 2-way table, options → [28/135, 35/135, 100/135, 107/135] |

### Distractor options corrected — 1 question:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-912cd125 | Options [3/16, 1/4, 2/7, 3/7] but PDF rationale shows [4/21, 1/4, 2/3, 3/4] | Fixed distractors to match PDF |

---

## 49. Data errors — Math Problem-Solving "Evaluating Studies" skill group

**Domain:** `cb-math-problem-solving.ts`
**Found:** 2026-03-01
**Status:** Fixed

3 of 7 Evaluating Studies questions had minor issues when verified against source PDFs.

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-37930b2a | Options B and C swapped vs PDF ("II only" / "I only" should be "I only" / "II only") | Swapped to match PDF order |
| math-ps-cb-7d68096f | Missing table from PDF (hours practiced × points scored). Options B and C wrong: PDF has "The 55 trivia teams in the sample" and "The 40 trivia teams...practiced at least 3 hours per week" | Added tableData, fixed options B and C |
| math-ps-cb-642519d7 | Options used Arabic numerals ("2 only", "1 and 2 only") but question text uses Roman (I, II, III) | Changed to "II only", "I and II only", "I, II, and III" |

---

## 50. Data errors — Math Problem-Solving "Statistical Inference" skill group

**Domain:** `cb-math-problem-solving.ts`
**Found:** 2026-03-01
**Status:** Fixed

3 of 16 Statistical Inference questions had issues when verified against source PDFs.

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-85939da5 | Options B, C, D all wrong. Answer was wrong. PDF: B="It is not possible...less than 27%", C="The percent...is 33%", D="It is doubtful...35%". Correct answer is D. | Replaced options B/C/D and correct answer to match PDF |
| math-ps-cb-90eed2e5 | Option "50" not in PDF. PDF has A=6, B=9, C=15, D=30. Missing distractor "9". | Replaced "50" with "9" |
| math-ps-cb-f4b3672a | OCR artifacts: semicolons instead of commas, missing article "a", missing period, inconsistent number spacing. Empty explanation. | Fixed question text punctuation, added explanation |

---

## 51. Data errors — Math Problem-Solving "Percentages" skill group

**Domain:** `cb-math-problem-solving.ts`
**Found:** 2026-03-01
**Status:** Fixed

4 of 32 CB Percentages questions had issues when verified against source PDFs.

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-65c49824 | Question had "committee of 4,900 people" but PDF says remaining "6 individuals are students" (total=40). Answer 980 was wrong (should be 8). | Rewrote question text to match PDF, fixed answer to 8 |
| math-ps-cb-bd90f87e | Question asked about 1970→1980 percent increase but PDF asks about 1960→1970. Options and answer completely wrong. | Changed year range, options to [30%,60%,62.5%,120%], answer to 60% |
| math-ps-cb-0ea56bb2 | Year ranges inverted: data said "2013→2014 double 2012→2013" but PDF says "2012→2013 double 2013→2014". Answer 6,468 was wrong. | Swapped year relationship, changed answer to 6,027 |
| math-ps-cb-63573fea | Wrong unit count: data had 300,000 but PDF has 1,300,000. Option C and answer wrong (270,000 vs 1,170,000). | Fixed to 1,300,000 units, option C to 1,170,000, answer to 1,170,000 |

---

## 52. Data errors — Math Problem-Solving "Ratios and Proportions" skill group

**Domain:** `cb-math-problem-solving.ts`
**Found:** 2026-03-01
**Status:** Fixed

7 of 50 Ratios and Proportions questions had incorrect distractor options or garbled text when verified against source PDFs.

### Wrong distractor options (answer correct but options don't match PDF) — 6 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-d28c29e1 | Options ["285.6","571.2","17,136.0","34,272.0"] but PDF has C=856.8 and D=17,136.0 (missing 856.8, extra 34,272.0) | Fixed options to ["285.6","571.2","856.8","17,136.0"] |
| math-ps-cb-3f5398a6 | Options B="15" and C="20" but PDF has B=9 and C=6 | Fixed options to ["10","9","6","5"] |
| math-ps-cb-e9841407 | Option D="7 to 28" but PDF has D="7 to 1" | Fixed option D to "7 to 1" |
| math-ps-cb-1d945139 | Option A="146/t" but PDF has A="146 - t" | Fixed option A to "146 - t" |
| math-ps-cb-939c46d1 | Option D="2" but PDF has D=3 | Fixed option D to "3" |
| math-ps-cb-8917ce38 | Options C="324 meters per second" and D="90,000 meters per second" but PDF has C="250 meters per second" and D="324 meters per second" | Fixed options C and D to match PDF |

### Garbled OCR text — 1 question:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-7e6c745f | Question text garbled from OCR of table data (`\|s0.36`, `\| s0.24`, semicolons). Option C was ": 4" instead of "3 : 4". Empty explanation. | Rewrote question text (table shown via visualAsset image), fixed option C, added explanation |

## 53. Data errors — Math Problem-Solving "Scatterplots and Models" skill group

**Domain:** `cb-math-problem-solving.ts`
**Found:** 2026-03-01
**Status:** Fixed

20 of 27 Scatterplots and Models questions had issues when verified against source PDFs. This is the most error-prone skill group encountered so far — many questions were fabricated by OCR because the original graph-dependent questions couldn't be captured as text.

### Wrong distractor options only (answer correct) — 5 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-1adb39f0 | Option D="8" but PDF has D=12 | Fixed option D to "12" |
| math-ps-cb-82aaa0a1 | Option D="y = 2x² + 5x + 3" but PDF has "y = 2x² - 5x + 3" (sign error) | Fixed sign in option D |
| math-ps-cb-83272c51 | Options B,C,D=["10-20 min","30-40 min","50-60 min"] but PDF=["30-40 min","50-60 min","90-100 min"] | Fixed all three distractor options |
| math-ps-cb-74dee52b | Options B,C,D=["2003","2004","2005"] but PDF=["2004","2005","2007"] | Fixed all three distractor options |
| math-ps-cb-9d88a3e3 | Option D="maximum speed > 6 mph" but PDF="speed reached maximum during last 10 min" | Fixed option D text |

### Wrong options AND wrong answer — 4 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-f46139df | Options B,C,D=["8.0","9.8","11.5"] answer="9.8" but PDF=[7.3,8.2,9.1] answer=C(8.2) | Fixed options and answer to match PDF |
| math-ps-cb-1e1027a7 | Option D="d = 22t + 84" answer="d = 22t + 84" but PDF has "d = 33t + 84" | Fixed slope from 22 to 33 in option and answer |
| math-ps-cb-3d985614 | Options C,D=["2.36x - 3.60","2.36x + 3.60"] answer="2.36x - 3.60" but PDF C="3.30x + 0.82" D="3.30x - 3.30" answer=C | Fixed options C,D and answer |
| math-ps-cb-2e74e403 | All options=["0.5","1","2","3"] answer="2" but PDF=[7,0.7,-0.7,-7] answer=C(-0.7) | Fixed all options and answer (slope is negative) |

### Fabricated questions rewritten to match PDF (had visual assets) — 6 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-8baf2118 | Was grid-in "predicted y at x=7"; PDF is MC "equation of line of best fit" with options ±13.5 ±0.8x | Changed to MC, rewrote question/options/answer to match PDF |
| math-ps-cb-03a16790 | Was "predicted y at x=6" options [10,12,14,16]; PDF asks about slope with options [-2.4,-0.8,0.8,2.4] answer=-0.8 | Rewrote question/options/answer to match PDF |
| math-ps-cb-e24765e6 | Asked "from x=5 to x=10" but PDF asks "from x=5 to x=7" (graph only goes to x=8). Answer 5 correct by coincidence | Fixed x range to match PDF, fixed explanation |
| math-ps-cb-d230e963 | Was "which describes association" (positive/negative); PDF asks "which equation represents line" y=2.8±1.7x | Rewrote to equation question with correct options/answer |
| math-ps-cb-e17babed | Was "y-intercept of line" answer=2; PDF asks "how many points above line" answer=6 | Rewrote question/options/answer to match PDF |
| math-ps-cb-ad7dbb22 | Was formula-based residual question; PDF shows scatterplot asking "how many points below line" answer=6 | Rewrote question, added visualAsset reference |

### Fabricated questions rewritten (visual assets added) — 4 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-fb866265 | Was linear equation question; PDF shows exponential decay y=a(b)^x asking for value of b. Options=[0.83,1.83,18.36,126.35] answer=0.83 | Complete rewrite + added visualAsset |
| math-ps-cb-9bb4107c | Was "slope through (2,5) and (6,7)"; PDF shows momentum vs time graph, asks avg rate of change x=2 to x=6. Answer=0.5 | Complete rewrite + added visualAsset |
| math-ps-cb-2e8027b0 | Was "y-intercept from two points"; PDF shows data set E/F (multiply y by 3.9), asks for new line equation | Complete rewrite + added visualAsset |
| math-ps-cb-15ce8207 | Was "describes relationship" (text only); PDF has 4 graphical answer choices showing different model lines | Adapted as "which function type" (exponential growth) + added visualAsset. Original graphical answer choices cannot be represented in text format |

**Note:** Questions fb866265, 9bb4107c, 2e8027b0, 15ce8207, and ad7dbb22 need graph images generated at their `/graphs/[id].png` paths.

---

## 54. Data errors — Math Problem-Solving "Data Distributions" skill group

**Domain:** `cb-math-problem-solving.ts`
**Found:** 2026-03-01
**Status:** Fixed

Reviewed all 36 Data Distributions questions (34 CB + 2 supplementary) against source PDFs. Found 17 with issues out of 34 CB questions (50% error rate). Supplementary questions (d4e5f605, d4e5f606) not checked — no source PDF.

### Missing options — 2 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-f890dc20 | Only 3 options ["2","3","4"] — missing option D "9" | Added "9" as 4th option |
| math-ps-cb-7b65bb28 | Only 3 options — missing "$3.689" (option B) | Added "$3.689" to options |

### Wrong distractor options only — 5 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-3f2ee20a | Group B std dev 19.0 in data, PDF says 19.1 | Changed 19.0 → 19.1 in tableData |
| math-ps-cb-4ff597db | Option C "15.25" in data, PDF says "9.00" | Changed to "9.00" |
| math-ps-cb-457d2f2c | Value "1" should be "7"; Option C "The number 33 remains the same" should be "Sum of the numbers" | Fixed value 1→7, fixed option C |
| math-ps-cb-be00d896 | Options rearranged; Option D "1,2,3,...,9" fabricated; missing PDF's option B "0,10,20,...,80" | Replaced options to match PDF order: A(all 5s), B(0-80), C(geometric), D(107s) |
| math-ps-cb-374b18f9 | Options C,D wrong (10595,12000 instead of 8831,10595); missing visualAsset for box plot | Fixed options to [4399, 7067, 8831, 10595]; added visualAsset |

### Wrong question AND options (table/data issues) — 3 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-1142af44 | Table had 3 values (2a,3a,2a) instead of 5 (a,2a,3a,2a,a); options were fractions instead of integers | Added tableData with 5 values; fixed options to [0,1,2,3] |
| math-ps-cb-c178d4da | Missing frequency table entirely — question unsolvable without it | Added tableData with frequencies (A: 2,4,5,7,9 / B: 9,7,5,4,2) |
| math-ps-cb-c3d65f93 | Nest labels "1-5" instead of "A-E" as in PDF | Fixed labels to A-E |

### Fabricated questions rewritten — 7 questions:

| Question ID | Issue | Fix |
|---|---|---|
| math-ps-cb-4c774b00 | Was "what is the median age?" answer=19; PDF asks "correct order of mean, median, mode" answer=mode<median<mean | Rewrote question/options/answer; kept existing visualAsset |
| math-ps-cb-29fa7970 | Was "how many days >16 kWh?" answer=8; PDF asks "how many days 0 kWh?" answer=6 | Rewrote question/options/answer; kept existing visualAsset |
| math-ps-cb-15d87c0f | Was "which activity has most students?" answer=Chess (WRONG); PDF asks "how many MORE in drama than chess?" answer=10 | Rewrote question/options/answer; kept existing visualAsset |
| math-ps-cb-fe6a49d6 | Was "what is median walnuts?" answer=76; PDF asks "how many containers have exactly 78?" answer=7 | Rewrote question/options/answer; kept existing visualAsset |
| math-ps-cb-52f9a246 | Was grid-in "frequency of value 4?" answer=4; PDF is MC "which frequency table represents data?" with 4 table options answer=A | Changed to MC with text-described table options |
| math-ps-cb-a456cfd2 | Was "what is the mode?" with fabricated data; PDF shows frequency table (values 6-14) asking "max data value?" answer=14 | Rewrote with tableData for frequency table; answer same (14) coincidentally |
| math-ps-cb-07f2829b | Was MC "greatest increase country?" answer=Spain; PDF is grid-in "median difference 2013 vs 2012" answer=1.3 | Changed to grid-in; added UK+Russia to table; rewrote question/answer |

**Note:** Questions d3b9c8d8 and 374b18f9 need graph images generated at their `/graphs/[id].png` paths (box plot images).

---

## 55. Text 1 / Text 2 not separated into paragraphs for rw-cb-eb89dcc8

**Domain:** `cb-rw-craft-and-structure.ts`
**Found:** 2026-03-01
**Status:** Fixed

Cross-Text Connections question had "Text 1" and "Text 2" run together in a single paragraph. The passage text was `"Text 1 Imagine you and your friend..."` with Text 2 continuing inline.

**Fix:** Added `\n` after "Text 1" and "Text 2" labels, and `\n\n` between the two text blocks so they render as separate paragraphs.

---

## 56. Bar chart columns not rendering for rw-ii-cb-a9040290

**Domain:** `cb-rw-information-and-ideas.ts`
**Found:** 2026-03-01
**Status:** Fixed

Replaced the PNG graph image with a native `BarChartViewer` component (`barChartData`), but the bars rendered with zero height. The chart frame, y-axis ticks, x-axis labels, and legend all appeared correctly — only the colored columns were missing.

**Root cause:** The bar wrapper div used `height: ${pct}%` (CSS percentage) but had no explicit height itself, so the percentage resolved to 0. The parent flex container had a pixel height via `style={{ height: 220 }}`, but percentages don't propagate through flex children without an explicit `height: 100%`.

**Fix:** Changed from percentage-based heights to pixel-based: `height: (value / yMax) * chartHeight` in `BarChartViewer.tsx`. Also added `justify-end` and explicit `height: chartHeight` on each bar wrapper so bars anchor to the bottom.

---

## 57. Merged options and OCR errors for math-alg-cb2-317e80f9

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-03-01
**Status:** Fixed

Only 3 options instead of 4 — first option was `"(15,3) .(16,2)"` (two merged). Variable `c` instead of `x` in equation. `correctAnswer` was `"A"` (letter) instead of option text.

**Fix:** Split option A into `"(15, 3)"` and `"(16, 2)"`, fixed `c` to `x` in equation, changed correctAnswer to `"(15, 3)"` (verified: x + y = 18, 5y = x → y = 3, x = 15).

---

## 58. Letter-based correctAnswer across 280 Math Algebra questions

**Domain:** `cb-math-algebra.ts`, `cb-math-advanced-math.ts`
**Found:** 2026-03-01
**Status:** Partially fixed (223 of 280)

280 multiple-choice questions had `correctAnswer` set to a letter (`"A"`, `"B"`, `"C"`, `"D"`) instead of the actual option text. The app compares the user's selected option text against `correctAnswer`, so letter-based answers always mark the user's selection as wrong even when correct.

**Fix:** Ran `fix-letter-answers.cjs` to automatically resolve each letter to the corresponding option text. Fixed 223 questions automatically. Remaining 56 required manual repair (see below).

---

## 59. Manual repair of 56 garbled letter-answer questions

**Domain:** `cb-math-algebra.ts`
**Found:** 2026-03-01
**Status:** Fixed

56 questions had letter-based `correctAnswer` with garbled options (merged entries, missing options, options in question text, graph/table-dependent with no data).

### Fixed (17 questions):
Reconstructed proper 4-option arrays, fixed OCR errors, set correctAnswer to option text:
- **e470e19d**: `f(z) = Tx 84` → `f(x) = 7x - 84`, split merged options, answer `"(12, 0)"`
- **af2ba762**: Extracted option A from question text, fixed equation, 4 options
- **adf60b28**: Extracted option A from question text, fixed equation `f(x) = 8x + 4`
- **d1042cf8**: Reconstructed 4 equation options, answer `"0.04x + 0.48y = 661.76"`
- **a396ed75**: Reconstructed 4 function options, answer `"m(x) = 5.7x"`
- **d7bf55e1**: Converted to grid-in, answer `180`
- **2e379126**: Converted to grid-in, answer `-34`
- **4fe4fd7c**: Converted to grid-in, answer `3500`
- **979b0b8d**: Reconstructed 4 options, answer `"f(x) = 39x"`
- **23dedddd**: Reconstructed 4 options, answer `"f(x) = 4x + 8"`
- **79784c23**: Reconstructed 4 options, answer `"2y = 2(6x + 3)"`
- **ee031767**: Extracted 4 options from question text
- **13909d78**: Fixed equation `f(x) = 100x + 2`, split merged option, answer `"902"`
- **14360f84**: Reconstructed 4 options, fixed equation
- **e744499e**: Extracted 4 inequality system options from question text
- **830120b0**: Extracted 4 options from question text, answer `"y > 4"`
- **948087f2**: Split merged options into 4 ordered pairs, answer `"(2, -1)"`

### Removed (39 questions — 38 unique + 1 duplicate):
Unsalvageable due to graph-dependency, table-choice without data, or garbled beyond repair:
541bef2f, 13294295, 33e4af6b, 8adf1335, 3174f07d, e7343559, 94b48cbf, 16889ef3, c651cc56, ecca0603, 6cb9bf45, cea27ab2, a049f400, d62ad380, d9733ed9, 92aa3a94, 431c3038, bd45df49, d8539e09 (×2 duplicate), 48fb34c8, 265f2a53, 0366d965, 4acd05cd, 184ce5aa, b2de69bd, d0cb49e8, 1e0a46e4, 1efd8202, 295a41f0, cb58833c, 2704399f, a94ed4e0, 6f6dfe3e, f0773a55, 5e08a055, 0ea7ef01, 49800634, a8e6bd75

**Result:** 0 letter-based correctAnswers remaining. Question count: 384 → 345.
