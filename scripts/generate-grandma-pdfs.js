const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const repoRoot = path.resolve(__dirname, '..');
const publicGuidePath = path.join(repoRoot, 'docs', 'grandma-guide.md');
const publicPdfPath = path.join(repoRoot, 'docs', 'grandma-guide.pdf');
const privatePdfPath = path.join(repoRoot, 'docs', 'grandma-openai-key-private.pdf');
const logoPath = path.join(repoRoot, 'apps', 'frontend', 'public', 'app-logo.png');

const colors = {
  ink: '#14213d',
  muted: '#4b5563',
  teal: '#1f938d',
  gold: '#d97706',
  red: '#b91c1c',
  softTeal: '#e7f6f5',
  softGold: '#fff7ed',
  line: '#d8dee4',
};

function createDoc(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 54,
    bufferPages: true,
    compress: false,
    info: {
      Title: path.basename(outputPath, '.pdf'),
      Author: 'Bridge Scoring',
      Subject: 'Large-print bridge scoring guide',
    },
  });
  doc.pipe(fs.createWriteStream(outputPath));
  return doc;
}

function finishDoc(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(colors.muted)
      .text(`Page ${i + 1} of ${range.count}`, 54, 742, { align: 'center', width: 504 });
  }
  doc.end();
}

function ensureSpace(doc, height) {
  if (doc.y + height > 720) {
    doc.addPage();
  }
}

function markdownText(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
}

function drawCover(doc, title, subtitle, options = {}) {
  doc.rect(0, 0, 612, 132).fill(options.private ? colors.red : colors.teal);
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 54, 36, { width: 62, height: 62 });
  }
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(30)
    .text(title, 132, 38, { width: 410 });
  if (subtitle) {
    doc
      .font('Helvetica')
      .fontSize(15)
      .text(subtitle, 132, 80, { width: 410, lineGap: 3 });
  }
  doc.y = 164;
}

function sectionHeader(doc, title) {
  ensureSpace(doc, 74);
  doc.moveDown(0.5);
  doc
    .roundedRect(54, doc.y, 504, 42, 8)
    .fill(colors.softTeal);
  doc
    .fillColor(colors.teal)
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(title, 72, doc.y + 10, { width: 468 });
  doc.y += 54;
}

function paragraph(doc, text, options = {}) {
  ensureSpace(doc, 44);
  doc
    .fillColor(options.color || colors.ink)
    .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(options.size || 14)
    .text(markdownText(text), 72, doc.y, {
      width: 450,
      lineGap: 5,
    });
  doc.moveDown(0.55);
}

function callout(doc, text, options = {}) {
  ensureSpace(doc, 74);
  const startY = doc.y;
  doc
    .roundedRect(72, startY, 450, 56, 8)
    .fill(options.warning ? colors.softGold : colors.softTeal);
  doc
    .fillColor(options.warning ? colors.gold : colors.teal)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(markdownText(text), 90, startY + 15, { width: 414, lineGap: 4 });
  doc.y = startY + 72;
}

function stepList(doc, steps) {
  for (let index = 0; index < steps.length; index += 1) {
    ensureSpace(doc, 48);
    const number = String(index + 1);
    const startY = doc.y;
    doc.circle(84, startY + 11, 12).fill(colors.teal);
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(number, 79, startY + 6, { width: 10, align: 'center' });
    doc
      .fillColor(colors.ink)
      .font('Helvetica')
      .fontSize(15)
      .text(markdownText(steps[index]), 110, startY, { width: 410, lineGap: 4 });
    doc.y = Math.max(doc.y, startY + 34);
  }
  doc.moveDown(0.5);
}

function parseGuide(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const title = markdownText(lines.find((line) => line.startsWith('# '))?.slice(2) || 'Bridge Scoring Guide');
  const sections = [];
  let intro = [];
  let current = null;

  for (const rawLine of lines.slice(1)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      current = { title: markdownText(line.slice(3)), paragraphs: [], steps: [] };
      sections.push(current);
      continue;
    }
    const step = line.match(/^\d+\.\s+(.*)$/);
    if (step && current) {
      current.steps.push(step[1]);
      continue;
    }
    if (current) current.paragraphs.push(line);
    else intro.push(line);
  }

  return { title, intro, sections };
}

function renderPublicGuide() {
  const doc = createDoc(publicPdfPath);
  const guide = parseGuide(fs.readFileSync(publicGuidePath, 'utf8'));
  drawCover(doc, guide.title, 'Simple large-print instructions for using Bridge Scoring.');

  for (const line of guide.intro) {
    paragraph(doc, line, { size: 16 });
  }

  for (const section of guide.sections) {
    sectionHeader(doc, section.title);
    for (const line of section.paragraphs) {
      if (/main way/i.test(line) || /one time/i.test(line)) callout(doc, line);
      else if (/only if/i.test(line)) callout(doc, line, { warning: true });
      else paragraph(doc, line);
    }
    if (section.steps.length) stepList(doc, section.steps);
  }

  finishDoc(doc);
}

function extractKeyFromPrivatePdf() {
  if (process.env.BRIDGE_PRIVATE_OPENAI_KEY) return process.env.BRIDGE_PRIVATE_OPENAI_KEY.trim();

  for (const envPath of [path.join(repoRoot, '.env'), path.join(repoRoot, 'apps', 'backend', '.env')]) {
    const key = extractKeyFromEnvFile(envPath);
    if (key) return key;
  }

  if (!fs.existsSync(privatePdfPath)) return '';

  const text = fs.readFileSync(privatePdfPath, 'latin1');
  const candidates = [...text.matchAll(/\(([^)]*sk-[^)]*)\)\s*Tj/g)].map((match) => match[1]);
  const joined = candidates.join('').replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\s+/g, '');
  const found = joined.match(/sk-[A-Za-z0-9_-]{20,}/);
  return found ? found[0] : '';
}

function extractKeyFromEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return '';
  const line = fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith('OPENAI_API_KEY='));
  if (!line) return '';
  return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
}

function keyLines(key) {
  return key.match(/.{1,44}/g) || [];
}

function renderPrivateGuide() {
  const key = extractKeyFromPrivatePdf();
  if (!key) {
    console.log('Skipped private key PDF: set BRIDGE_PRIVATE_OPENAI_KEY or keep the existing private PDF in docs/.');
    return false;
  }

  const doc = createDoc(privatePdfPath);
  drawCover(doc, 'Bridge Scoring Photo AI Setup', '', { private: true });

  sectionHeader(doc, 'Turn On Photo AI');
  stepList(doc, [
    'Open **Bridge Scoring**.',
    'Click **Settings**.',
    'Click the **OpenAI Key** box.',
    'Copy the key below and paste it into the box.',
    'It is okay if spaces or line breaks copy too. The app will clean it up.',
    'Click **Save Key**.',
    'When it says **Saved. Photo AI is ready.**, click **Scan**.',
  ]);

  sectionHeader(doc, 'OpenAI Key');
  ensureSpace(doc, 150);
  const boxY = doc.y;
  doc.roundedRect(72, boxY, 450, 132, 8).fill('#f8fafc').stroke(colors.line);
  doc
    .fillColor(colors.ink)
    .font('Courier-Bold')
    .fontSize(11.5)
    .text(keyLines(key).join('\n'), 88, boxY + 16, { width: 418, lineGap: 5 });
  doc.y = boxY + 156;

  sectionHeader(doc, 'Use Photo AI');
  stepList(doc, [
    'Click **Scan**.',
    'Choose a clear photo of the score sheet.',
    'Click **AI Parse & Import**.',
    'Click **Results** and check the scores.',
  ]);

  finishDoc(doc);
  return true;
}

renderPublicGuide();
const wrotePrivate = renderPrivateGuide();
console.log(`Wrote ${path.relative(repoRoot, publicPdfPath)}`);
if (wrotePrivate) console.log(`Wrote ${path.relative(repoRoot, privatePdfPath)} (ignored)`);
