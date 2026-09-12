// Generates docs/SCENARIOS.md from the registry so the doc can never drift
// from what the simulator actually plays.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('src/scenarios/registry.ts', 'utf8');
// Strip types and imports, then evaluate the data.
const body = src
  .replace(/^import[\s\S]*?;\n/m, '')
  .replace(/export (type|interface)[\s\S]*?\n}\n/g, '')
  .replace(/export type Category[^\n]*\n/g, '')
  .replace(/: Scenario\b/g, '')
  .replace(/: ExpressionName\b/g, '')
  .replace(/export const CATEGORY_LABEL[\s\S]*$/m, '')
  .replace(/export function totalMs[\s\S]*$/m, '')
  .replace(/export const SCENARIOS[^=]*=/, 'const SCENARIOS =')
  .replace(/^export /gm, '');

const mod = await import(
  'data:text/javascript;base64,' +
    Buffer.from(body + '\nexport { SCENARIOS };').toString('base64')
);
const S = mod.SCENARIOS;

const esc = (t) => String(t).replace(/\|/g, '\\|');
let out = `# Scenario map

Ten scenarios across two categories. **Every one is simulated** — no microphone,
no network, no model. Timings below are the animation specification.

Play them: run the app and open \`#scenarios\`.

> This file is generated from \`app/src/scenarios/registry.ts\`.
> Edit the registry, then run \`node scripts-gen-scenarios.mjs\` from \`app/\`.

---

`;

for (const cat of ['wellbeing', 'work']) {
  const label = cat === 'wellbeing' ? 'Personal wellbeing' : 'Work';
  const list = S.filter((s) => s.category === cat);
  out += `## ${label}\n\n`;
  for (const s of list) {
    const total = s.beats.reduce((n, b) => n + b.ms, 0);
    out += `### ${s.title}\n\n`;
    out += `${s.premise}\n\n`;
    out += `| | |\n|---|---|\n`;
    out += `| **Trigger** | ${esc(s.trigger)} |\n`;
    out += `| **Adapters** | \`${s.adapters.join('\` · \`')}\` |\n`;
    out += `| **Runtime** | ${(total / 1000).toFixed(1)}s · ${s.beats.length} beats |\n\n`;
    out += `> **Honesty.** ${s.honesty}\n\n`;
    out += `| # | ms | Expression | On screen | Why |\n|---|---|---|---|---|\n`;
    s.beats.forEach((b, i) => {
      const bits = [];
      if (b.label) bits.push(`label: "${b.label}"`);
      if (b.transcript) bits.push(`transcript ×${b.transcript.length}`);
      if (b.caption) bits.push(`caption`);
      if (b.panel) bits.push(`panel: "${b.panel.title}"`);
      if (b.toast) bits.push(`toast`);
      if (b.energy) bits.push(`energy ${b.energy}`);
      if (b.faceDim) bits.push(`face ${Math.round(b.faceDim * 100)}%`);
      out += `| ${i + 1} | ${b.ms} | \`${b.expression}\` | ${esc(bits.join(', ') || '—')} | ${esc(b.note)} |\n`;
    });
    out += `\n`;
    if (s.beats.some((b) => b.caption)) {
      out += `**Spoken lines**\n\n`;
      s.beats.filter((b) => b.caption).forEach((b) => {
        out += `> ${b.caption}\n\n`;
      });
    }
    out += `---\n\n`;
  }
}

writeFileSync('../docs/SCENARIOS.md', out);
console.log('wrote docs/SCENARIOS.md —', S.length, 'scenarios');
