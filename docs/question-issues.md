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

## OPEN — Truncated passages (need source material)

**Status:** Unfixed — requires College Board source text

- **rw-cb-b411eb09** (`cb-rw-craft-and-structure.ts`): Passage text is severely truncated at "New and interesting research conducted by Suleiman". Full passage about altitude's effect on blood chemistry is missing.

---

## OPEN — Truncated options (need source material)

**Status:** Unfixed — requires College Board source text

Multiple questions have options cut off mid-sentence (OCR line-wrap issue). The `correctAnswer` matches the truncated option text so no mismatch, but students see incomplete choices.

**cb-rw-craft-and-structure.ts** (~13 questions): rw-cb-b13378c8, rw-cb-d4732483, rw-cb-105ea6de, rw-cb-c4737d6a, rw-cb-d6c77ae5, rw-cb-4b4ab04e, rw-cb-e1befb41, rw-cb-65406d2c, rw-cb-f7c02e89, rw-cb-975b0602

---

## OPEN — Truncated explanations (need source material)

**Status:** Unfixed — requires College Board source text

9 explanations in `cb-rw-standard-english-conventions.ts` are cut off mid-sentence:
rw-cb-aaa1907f, rw-cb-f78997cf, rw-cb-9c3630b9, rw-cb-6e071432, rw-cb-c06af4d8, rw-cb-a05cc490, rw-cb-548f4956, rw-cb-5aa171de, rw-cb-21e58a83

1 explanation in `cb-rw-information-and-ideas.ts` has a missing clause:
rw-ii-cb-5fb6ed10 ("Choice D is the best answer because. This quotation..." — clause after "because" is missing)

---

## OPEN — Structurally broken questions (need source material)

**Status:** Unfixed — requires College Board source text

**rw-ii-cb-458b4a11** (`cb-rw-information-and-ideas.ts`): Passage text is in the question field, question text is in options[0], only 3 real options instead of 4. correctAnswer also appears incorrect per explanation.

**rw-ii-cb-be19faa1** (`cb-rw-information-and-ideas.ts`): Only 3 options (should be 4). Explanation references "Choice D" but only 3 options exist — option A is missing.

**rw-ii-cb-8a584241** (`cb-rw-information-and-ideas.ts`): Only 3 options (should be 4). correctAnswer points to wrong option per explanation.

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

## 21. Trailing spaces after blanks in rw-standard-english-conventions.ts

**Domain:** `rw-standard-english-conventions.ts`
**Found:** 2026-02-26
**Status:** Fixed

3 passage texts had a trailing space after `_______` at the end of the string.

**Fix:** Removed the trailing space before the closing quote.

**Affected question IDs:** rw-sec-q6, rw-sec-q12, rw-sec-q28
