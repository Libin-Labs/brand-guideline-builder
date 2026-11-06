export interface BrandColor {
  readonly name: string;
  readonly value: string;
  readonly usage: string;
}

export interface BrandTypography {
  readonly role: string;
  readonly family: string;
  readonly weight: string;
  readonly usage: string;
}

export interface LogoRule {
  readonly name: string;
  readonly rule: string;
}

export interface GuidelineSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export interface GuidelineInput {
  readonly title: string;
  readonly summary: string;
  readonly colors: readonly BrandColor[];
  readonly typography: readonly BrandTypography[];
  readonly logoRules: readonly LogoRule[];
  readonly sections: readonly GuidelineSection[];
}

export interface GuidelineLimits {
  readonly maxItems?: number;
  readonly maxTextLength?: number;
}

export class GuidelineError extends Error {
  constructor(
    readonly code: 'invalid' | 'capacity',
    message: string,
  ) {
    super(message);
    this.name = 'GuidelineError';
  }
}

function text(value: string, field: string, maxLength: number): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > maxLength ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
  )
    throw new GuidelineError(
      'invalid',
      `${field} must be nonempty plain text up to ${maxLength} characters.`,
    );
  for (const character of value) {
    const point = character.codePointAt(0)!;
    if ((point >= 0xd800 && point <= 0xdfff) || point === 0xfffe || point === 0xffff)
      throw new GuidelineError('invalid', `${field} contains invalid Unicode.`);
  }
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function positiveLimit(value: number | undefined, fallback: number, ceiling: number): number {
  const resolved = value ?? fallback;
  if (!Number.isSafeInteger(resolved) || resolved < 1 || resolved > ceiling)
    throw new GuidelineError('invalid', `Limit must be an integer in 1..${ceiling}.`);
  return resolved;
}

function boundedItems<T>(items: readonly T[], max: number, field: string): readonly T[] {
  if (!Array.isArray(items)) throw new GuidelineError('invalid', `${field} must be an array.`);
  if (items.length > max) throw new GuidelineError('capacity', `${field} capacity exceeded.`);
  for (let index = 0; index < items.length; index += 1)
    if (!Object.hasOwn(items, index))
      throw new GuidelineError('invalid', `${field} cannot contain empty slots.`);
  return items;
}

/** Validates and snapshots editorial rules. No logo artwork, fonts or licensed assets are loaded. */
export function createGuideline(
  input: GuidelineInput,
  limits: GuidelineLimits = {},
): GuidelineInput {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new GuidelineError('invalid', 'A guideline model is required.');
  if (!limits || typeof limits !== 'object' || Array.isArray(limits))
    throw new GuidelineError('invalid', 'Limits must be an object.');
  const maxItems = positiveLimit(limits.maxItems, 100, 1000);
  const maxTextLength = positiveLimit(limits.maxTextLength, 2000, 20_000);
  const title = text(input.title, 'Title', 160);
  const summary = text(input.summary, 'Summary', maxTextLength);
  const colorItems = boundedItems(input.colors, maxItems, 'Colors');
  const typographyItems = boundedItems(input.typography, maxItems, 'Typography');
  const logoRuleItems = boundedItems(input.logoRules, maxItems, 'Logo rules');
  const sectionItems = boundedItems(input.sections, maxItems, 'Sections');
  let paragraphCount = 0;
  for (const section of sectionItems) {
    if (!section || typeof section !== 'object' || !Array.isArray(section.paragraphs))
      throw new GuidelineError('invalid', 'Each section must contain a paragraph array.');
    if (section.paragraphs.length > maxItems)
      throw new GuidelineError('capacity', 'Section paragraph capacity exceeded.');
    for (let index = 0; index < section.paragraphs.length; index += 1)
      if (!Object.hasOwn(section.paragraphs, index))
        throw new GuidelineError('invalid', 'Section paragraphs cannot contain empty slots.');
    paragraphCount += section.paragraphs.length;
  }
  if (
    colorItems.length +
      typographyItems.length +
      logoRuleItems.length +
      sectionItems.length +
      paragraphCount >
    maxItems
  )
    throw new GuidelineError('capacity', 'Total guideline item capacity exceeded.');
  const colors = colorItems.map((item) => {
    if (!item || typeof item !== 'object')
      throw new GuidelineError('invalid', 'Each color entry must be an object.');
    const name = text(item.name, 'Color name', 80);
    if (typeof item.value !== 'string' || !/^#[0-9a-fA-F]{6}$/u.test(item.value))
      throw new GuidelineError('invalid', `Color ${name} must use #RRGGBB.`);
    return Object.freeze({
      name,
      value: item.value.toLowerCase(),
      usage: text(item.usage, 'Color usage', maxTextLength),
    });
  });
  const typography = typographyItems.map((item) => {
    if (!item || typeof item !== 'object')
      throw new GuidelineError('invalid', 'Each typography entry must be an object.');
    return Object.freeze({
      role: text(item.role, 'Typography role', 80),
      family: text(item.family, 'Font family', 160),
      weight: text(item.weight, 'Font weight', 40),
      usage: text(item.usage, 'Typography usage', maxTextLength),
    });
  });
  const logoRules = logoRuleItems.map((item) => {
    if (!item || typeof item !== 'object')
      throw new GuidelineError('invalid', 'Each logo rule must be an object.');
    return Object.freeze({
      name: text(item.name, 'Logo rule name', 100),
      rule: text(item.rule, 'Logo rule', maxTextLength),
    });
  });
  const sections = sectionItems.map((item) => {
    if (!item || typeof item !== 'object')
      throw new GuidelineError('invalid', 'Each section must be an object.');
    const paragraphs = boundedItems(item.paragraphs, maxItems, 'Section paragraphs').map(
      (paragraph) => text(paragraph, 'Section paragraph', maxTextLength),
    );
    if (paragraphs.length === 0)
      throw new GuidelineError('invalid', 'A guideline section must contain a paragraph.');
    return Object.freeze({
      heading: text(item.heading, 'Section heading', 160),
      paragraphs: Object.freeze(paragraphs),
    });
  });
  return Object.freeze({
    title,
    summary,
    colors: Object.freeze(colors),
    typography: Object.freeze(typography),
    logoRules: Object.freeze(logoRules),
    sections: Object.freeze(sections),
  });
}

/** Generates self-contained semantic HTML with escaped copy and accessible color swatches. */
export function renderGuidelineHtml(input: GuidelineInput, limits: GuidelineLimits = {}): string {
  const model = createGuideline(input, limits);
  const colors = model.colors
    .map(
      (color) =>
        `<li><span role="img" aria-label="${escapeHtml(`${color.name}, ${color.value}`)}" style="display:inline-block;width:2em;height:1em;background-color:${color.value};border:1px solid #222"></span> <strong>${escapeHtml(color.name)}</strong> <code>${color.value}</code><p>${escapeHtml(color.usage)}</p></li>`,
    )
    .join('');
  const typography = model.typography
    .map(
      (item) =>
        `<li><h3>${escapeHtml(item.role)}</h3><p>${escapeHtml(item.family)} · ${escapeHtml(item.weight)}</p><p>${escapeHtml(item.usage)}</p></li>`,
    )
    .join('');
  const logoRules = model.logoRules
    .map((item) => `<li><strong>${escapeHtml(item.name)}</strong>: ${escapeHtml(item.rule)}</li>`)
    .join('');
  const sections = model.sections
    .map(
      (section, index) =>
        `<section aria-labelledby="guideline-section-${index + 1}"><h2 id="guideline-section-${index + 1}">${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(model.title)}</title></head><body><main><h1>${escapeHtml(model.title)}</h1><p>${escapeHtml(model.summary)}</p><section aria-labelledby="brand-colors"><h2 id="brand-colors">Color palette</h2><ul>${colors}</ul></section><section aria-labelledby="brand-typography"><h2 id="brand-typography">Typography</h2><ul>${typography}</ul></section><section aria-labelledby="brand-logo-rules"><h2 id="brand-logo-rules">Logo usage</h2><ul>${logoRules}</ul></section>${sections}</main></body></html>`;
}
