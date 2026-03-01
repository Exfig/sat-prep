/**
 * Comprehensive SAT Question Validator
 *
 * Checks every question against all known issue types.
 * Run: node tools/validate-questions.cjs
 * With --strict: exits with code 1 on errors (used in build pipeline)
 */

const fs = require('fs');
const path = require('path');

const strict = process.argv.includes('--strict');
const dataDir = path.join(__dirname, '..', 'src', 'data');
const publicDir = path.join(__dirname, '..', 'public');

// ─── Valid enums (from src/types.ts) ────────────────────────────────────────

const VALID_SECTIONS = ['reading-writing', 'math'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_TYPES = ['multiple-choice', 'grid-in'];
const VALID_DOMAINS = [
  'rw-craft-and-structure', 'rw-information-and-ideas',
  'rw-standard-english-conventions', 'rw-expression-of-ideas',
  'math-algebra', 'math-advanced-math',
  'math-problem-solving-data-analysis', 'math-geometry-and-trigonometry',
];
const REQUIRED_FIELDS = ['id', 'section', 'domain', 'skill', 'difficulty', 'type', 'question', 'correctAnswer', 'explanation', 'relatedConcepts'];
const GARBLED_PATTERNS = [/Â/, /â€™/, /â€"/, /â€œ/, /â€\u009d/, /Ã/, /â€/];
const LETTER_ANSWERS = /^[A-E]$/;
const VISUAL_REF_WORDS = /\b(figure|graph|table|chart|diagram|shown above|shown below|displayed|depicted)\b/i;

// ─── Helpers ────────────────────────────────────────────────────────────────

function unesc(s) {
  return s
    .replace(/\\u2019/g, '\u2019').replace(/\\u2014/g, '\u2014')
    .replace(/\\u201c/g, '\u201c').replace(/\\u201d/g, '\u201d')
    .replace(/\\u2018/g, '\u2018').replace(/\\u2026/g, '\u2026')
    .replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

function parseQuotedStrings(text, q) {
  const results = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === q) {
      let str = '';
      i++;
      while (i < text.length) {
        if (text[i] === '\\' && i + 1 < text.length) {
          const next = text[i + 1];
          if (next === q || next === '\\') { str += next; i += 2; }
          else if (next === 'n') { str += '\n'; i += 2; }
          else if (next === 't') { str += '\t'; i += 2; }
          else if (next === 'u' && i + 5 < text.length) {
            str += String.fromCharCode(parseInt(text.substring(i + 2, i + 6), 16));
            i += 6;
          } else { str += text[i] + text[i + 1]; i += 2; }
        } else if (text[i] === q) { i++; break; }
        else { str += text[i]; i++; }
      }
      results.push(str);
    } else { i++; }
  }
  return results;
}

// Unescape a JS string literal (handle \", \', \\, unicode escapes, etc.)
function unescLiteral(s, q) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && i + 1 < s.length) {
      const next = s[i + 1];
      if (next === q || next === '"' || next === "'" || next === '\\') { out += next; i++; }
      else if (next === 'n') { out += '\n'; i++; }
      else if (next === 't') { out += '\t'; i++; }
      else if (next === 'u' && i + 5 < s.length) {
        const hex = s.substring(i + 2, i + 6);
        out += String.fromCharCode(parseInt(hex, 16));
        i += 5;
      } else { out += s[i] + next; i++; }
    } else { out += s[i]; }
  }
  return out;
}

// Extract a string field value from a question block
function extractStringField(block, fieldName, q) {
  // Try primary quote style, then fallback to the other
  for (const qc of [q, q === '"' ? "'" : '"']) {
    const qr = qc === '"'
      ? new RegExp(fieldName + ':\\s*"((?:[^"\\\\]|\\\\.)*)"')
      : new RegExp(fieldName + ":\\s*'((?:[^'\\\\]|\\\\.)*)'");
    const m = block.match(qr);
    if (m) return unescLiteral(m[1], qc);
  }
  return null;
}

// Extract an unquoted/numeric field
function extractRawField(block, fieldName) {
  const m = block.match(new RegExp(fieldName + ':\\s*([^,\\n}]+)'));
  if (m) return m[1].trim();
  return null;
}

// Check if a field exists in the block (even if empty)
function hasField(block, fieldName) {
  return new RegExp('\\b' + fieldName + '\\s*:').test(block);
}

// ─── Parse all question files ───────────────────────────────────────────────

const files = fs.readdirSync(dataDir).filter(f =>
  f.endsWith('.ts') && f !== 'questions.ts' && f !== 'strategyGuideContent.ts' && f !== 'tutorial-data.ts'
);

const errors = [];
const warnings = [];
const allIds = [];
let errorCount = 0;
let warnCount = 0;

function addError(id, file, msg) {
  errorCount++;
  errors.push({ code: `E${String(errorCount).padStart(3, '0')}`, id, file, msg });
}
function addWarning(id, file, msg) {
  warnCount++;
  warnings.push({ code: `W${String(warnCount).padStart(3, '0')}`, id, file, msg });
}

for (const file of files) {
  const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');

  // Detect quote style
  const usesSingleQuotes = content.match(/id:\s*'/);
  const q = usesSingleQuotes ? "'" : '"';

  // Find all question IDs and positions
  const idPattern = usesSingleQuotes ? /id:\s*'([^']+)'/g : /id:\s*"([^"]+)"/g;
  let match;
  const positions = [];
  while ((match = idPattern.exec(content)) !== null) {
    // Skip non-question ids (chapter/section ids)
    if (match[1].startsWith('ch') || match[1].startsWith('section')) continue;
    positions.push({ id: match[1], pos: match.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const { id, pos } = positions[i];
    const endPos = i < positions.length - 1 ? positions[i + 1].pos : content.length;
    const block = content.substring(pos, endPos);

    allIds.push({ id, file });

    // ── 2. Required fields ──────────────────────────────────────────────
    for (const field of REQUIRED_FIELDS) {
      if (!hasField(block, field)) {
        addError(id, file, `Missing required field: ${field}`);
      }
    }

    // ── Extract key fields ──────────────────────────────────────────────
    const section = extractStringField(block, 'section', q);
    const domain = extractStringField(block, 'domain', q);
    const difficulty = extractStringField(block, 'difficulty', q);
    const type = extractStringField(block, 'type', q);
    const questionText = extractStringField(block, 'question', q);
    const explanation = extractStringField(block, 'explanation', q);

    // correctAnswer: could be string or number
    let correctAnswer = extractStringField(block, 'correctAnswer', q);
    if (correctAnswer === null) {
      const numMatch = block.match(/correctAnswer:\s*(-?\d+(?:\.\d+)?)\s*[,\n]/);
      if (numMatch) correctAnswer = numMatch[1];
    }

    // ── 3. Valid enums ──────────────────────────────────────────────────
    if (section && !VALID_SECTIONS.includes(section)) {
      addError(id, file, `Invalid section: "${section}"`);
    }
    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
      addError(id, file, `Invalid difficulty: "${difficulty}"`);
    }
    if (type && !VALID_TYPES.includes(type)) {
      addError(id, file, `Invalid type: "${type}"`);
    }
    if (domain && !VALID_DOMAINS.includes(domain)) {
      addError(id, file, `Invalid domain: "${domain}"`);
    }

    // ── 4. Domain matches section ───────────────────────────────────────
    if (section && domain) {
      if (section === 'reading-writing' && !domain.startsWith('rw-')) {
        addError(id, file, `Domain "${domain}" doesn't match section "reading-writing"`);
      }
      if (section === 'math' && !domain.startsWith('math-')) {
        addError(id, file, `Domain "${domain}" doesn't match section "math"`);
      }
    }

    // ── 5-8. Options checks (MC vs grid-in) ─────────────────────────────
    const optMatch = block.match(/options:\s*\[([\s\S]*?)\]\s*,/);
    const hasOptions = !!optMatch;

    if (type === 'multiple-choice') {
      if (!hasOptions) {
        addError(id, file, 'Multiple-choice question has no options array');
      } else {
        // Try primary quote style, fallback to the other
        let options = parseQuotedStrings(optMatch[1], q);
        if (options.length === 0) {
          options = parseQuotedStrings(optMatch[1], q === '"' ? "'" : '"');
        }

        // 8. Exactly 4 options
        if (options.length !== 4) {
          addError(id, file, `MC question has ${options.length} options (expected 4)`);
        }

        // 7. No duplicate options
        const uniqueOpts = new Set(options);
        if (uniqueOpts.size !== options.length) {
          addError(id, file, 'Duplicate options detected');
        }

        // 6. correctAnswer matches one option
        if (correctAnswer !== null && options.length > 0) {
          if (!options.includes(correctAnswer)) {
            addError(id, file, `correctAnswer "${String(correctAnswer).substring(0, 80)}" does not match any option`);
          }
        }
      }
    }

    if (type === 'grid-in' && hasOptions) {
      addError(id, file, 'Grid-in question should not have options array');
    }

    // ── 9. No letter answers ────────────────────────────────────────────
    if (correctAnswer !== null && LETTER_ANSWERS.test(String(correctAnswer))) {
      addError(id, file, `correctAnswer is a bare letter "${correctAnswer}" — should be the actual answer text`);
    }

    // ── 10. Grid-in answer is numeric ───────────────────────────────────
    if (type === 'grid-in' && correctAnswer !== null) {
      const ans = String(correctAnswer);
      // Valid: integer, decimal, fraction (e.g. "7/3"), negative
      const isValidGridIn = /^-?(\d+(\.\d+)?|\.\d+)(\/\d+)?$/.test(ans);
      if (!isValidGridIn) {
        addError(id, file, `Grid-in correctAnswer "${ans}" is not a valid number or fraction`);
      }
    }

    // ── 11. Garbled unicode ─────────────────────────────────────────────
    for (const pat of GARBLED_PATTERNS) {
      if (pat.test(block)) {
        const snippet = block.match(pat);
        addError(id, file, `Garbled unicode detected: "${snippet[0]}"`);
        break; // one error per question is enough
      }
    }

    // ── 12. Truncated text ──────────────────────────────────────────────
    if (questionText && questionText.length < 20) {
      addWarning(id, file, `Suspiciously short question text (${questionText.length} chars): "${questionText}"`);
    }
    if (explanation !== null && explanation.length > 0 && explanation.length < 20) {
      addWarning(id, file, `Suspiciously short explanation (${explanation.length} chars)`);
    }

    // ── 13. Empty strings ───────────────────────────────────────────────
    if (questionText === '') {
      addError(id, file, 'Empty question text');
    }
    // Empty explanation is common (many CB questions lack explanations), so warn instead
    if (explanation === '') {
      // Don't warn - too many legitimate empty explanations in CB data
    }

    // ── 14. Visual reference without visual data ────────────────────────
    if (questionText && VISUAL_REF_WORDS.test(questionText)) {
      const hasVisualAsset = hasField(block, 'visualAsset');
      const hasTableData = hasField(block, 'tableData');
      const hasBarChart = hasField(block, 'barChartData');
      if (!hasVisualAsset && !hasTableData && !hasBarChart) {
        addWarning(id, file, 'Question references a visual ("' +
          questionText.match(VISUAL_REF_WORDS)[0] + '") but has no visualAsset/tableData/barChartData');
      }
    }

    // ── 15. Text 1/Text 2 formatting ────────────────────────────────────
    const passageTextMatch = block.match(/text:\s*["'`]([\s\S]*?)["'`]\s*[,\n]/);
    if (passageTextMatch) {
      const passageText = unesc(passageTextMatch[1]);
      if (passageText.includes('Text 1') && passageText.includes('Text 2')) {
        // Check formatting: "Text 1\n" not "Text 1 "
        if (/Text 1 [^\n]/.test(passageText) && !/Text 1\n/.test(passageText)) {
          addWarning(id, file, 'Cross-text passage: "Text 1" should be followed by newline, not space');
        }
        if (/Text 2 [^\n]/.test(passageText) && !/Text 2\n/.test(passageText)) {
          addWarning(id, file, 'Cross-text passage: "Text 2" should be followed by newline, not space');
        }
      }
    }

    // ── 16. underlineText exists in passage ─────────────────────────────
    if (hasField(block, 'underlineText') && passageTextMatch) {
      const underlineVal = extractStringField(block, 'underlineText', q);
      const passageText = unesc(passageTextMatch[1]);
      if (underlineVal && !passageText.includes(underlineVal)) {
        addWarning(id, file, `underlineText not found as substring of passage text`);
      }
    }

    // ── 17. RW questions have passages ──────────────────────────────────
    if (section === 'reading-writing' && !hasField(block, 'passage')) {
      addWarning(id, file, 'Reading-writing question has no passage');
    }

    // ── 18. visualAsset src file exists ─────────────────────────────────
    if (hasField(block, 'visualAsset')) {
      const srcMatch = block.match(/src:\s*["']([^"']+)["']/);
      if (srcMatch) {
        const assetPath = path.join(publicDir, srcMatch[1]);
        if (!fs.existsSync(assetPath)) {
          addError(id, file, `visualAsset file not found: ${srcMatch[1]}`);
        }
      }
    }

    // ── 19. tableData structure ─────────────────────────────────────────
    if (hasField(block, 'tableData')) {
      const headersMatch = block.match(/headers:\s*\[([\s\S]*?)\]/);
      if (headersMatch) {
        let headers = parseQuotedStrings(headersMatch[1], q);
        if (headers.length === 0) headers = parseQuotedStrings(headersMatch[1], q === '"' ? "'" : '"');
        const colCount = headers.length;
        // Check that rows have matching column count
        const rowsSection = block.match(/rows:\s*\[([\s\S]*?)\]\s*\]/);
        if (rowsSection) {
          const rowMatches = [...rowsSection[1].matchAll(/\[([\s\S]*?)\]/g)];
          for (const rm of rowMatches) {
            let rowCols = parseQuotedStrings(rm[1], q);
            if (rowCols.length === 0) rowCols = parseQuotedStrings(rm[1], q === '"' ? "'" : '"');
            if (rowCols.length > 0 && rowCols.length !== colCount) {
              addError(id, file, `tableData row has ${rowCols.length} columns but headers has ${colCount}`);
              break;
            }
          }
        }
      }
    }
  }
}

// ── 1. Duplicate IDs ──────────────────────────────────────────────────────

const idMap = {};
for (const { id, file } of allIds) {
  if (!idMap[id]) idMap[id] = [];
  idMap[id].push(file);
}
for (const [id, files] of Object.entries(idMap)) {
  if (files.length > 1) {
    addError(id, files.join(', '), `Duplicate ID found in: ${files.join(', ')}`);
  }
}

// ─── Output ─────────────────────────────────────────────────────────────────

console.log('');
console.log('=== QUESTION VALIDATION ===');
console.log(`Files: ${files.length} | Questions: ${allIds.length.toLocaleString()}`);
console.log('');

if (errors.length > 0) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) {
    console.log(`  [${e.code}] ${e.id} (${e.file})`);
    console.log(`         ${e.msg}`);
  }
  console.log('');
}

if (warnings.length > 0) {
  console.log(`WARNINGS (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [${w.code}] ${w.id} (${w.file})`);
    console.log(`         ${w.msg}`);
  }
  console.log('');
}

console.log(`SUMMARY: ${errors.length} errors, ${warnings.length} warnings`);

if (errors.length === 0) {
  console.log('All questions passed validation.');
}

if (strict && errors.length > 0) {
  console.log('');
  console.log('Build blocked: fix all errors before deploying.');
  process.exit(1);
}
