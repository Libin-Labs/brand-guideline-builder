# @lp-labs/brand-guideline-builder

Turns an explicit brand-rule model into an escaped, accessible, self-contained HTML guide. It does not include logos, fonts, photos, templates, or any other licensed assets.

## Install and quickstart

```sh
npm install @lp-labs/brand-guideline-builder
```

```js
import assert from 'node:assert/strict';
import { createGuideline, renderGuidelineHtml } from '@lp-labs/brand-guideline-builder';

const guide = createGuideline({
  title: 'Northstar',
  summary: 'A practical guide to our identity.',
  colors: [{ name: 'Ocean', value: '#126699', usage: 'Primary actions and links.' }],
  typography: [
    { role: 'Body', family: 'Your Licensed Font', weight: '400', usage: 'Long-form text.' },
  ],
  logoRules: [{ name: 'Clear space', rule: 'Keep one cap-height around your supplied logo.' }],
  sections: [{ heading: 'Voice', paragraphs: ['Be direct.', 'Use plain language.'] }],
});
const html = renderGuidelineHtml(guide);
assert.ok(html.includes('aria-labelledby="brand-colors"'));
assert.ok(html.includes('background-color:#126699'));
```

## API and types

- `createGuideline(input, limits?): GuidelineInput` validates and deeply freezes a detached rule model.
- `renderGuidelineHtml(input, limits?): string` generates semantic HTML with a single `h1`, named `h2` sections, semantic lists, explicit `lang`, and accessible color-swatch labels.
- `GuidelineError` exposes `code: 'invalid' | 'capacity'`.
- `GuidelineInput`: `title`, `summary`, `colors`, `typography`, `logoRules`, and optional-empty `sections` arrays.
- `BrandColor`: plain-text `name`, literal `#RRGGBB` `value`, and explanatory `usage`.
- `BrandTypography`: plain-text `role`, font `family`, `weight`, and `usage`; names are displayed as text, never loaded as CSS or fonts.
- `LogoRule`: plain-text `name` and `rule`. These rules describe customer-provided logo handling; no artwork is bundled or fetched.
- `GuidelineSection`: plain-text `heading` and one or more `paragraphs`.
- `GuidelineLimits`: optional `maxItems` and `maxTextLength`.

User-provided text is HTML-escaped in text and attribute contexts. Color values are limited to six-digit hex before use in the swatch's inline style. No arbitrary markup, URL, CSS, remote resource, image, or font is accepted as an asset.

## Customize, safety, and limits

Customize the manual by editing your structured rule model: add named palette entries, typography roles, logo do/don't guidance, and short topic sections. Reuse the validated frozen model or supply limits to either function. Empty color, typography, logo, or section lists are allowed; each provided section needs at least one paragraph.

Defaults: at most 100 total palette, typography, logo-rule, section, and paragraph entries and 2,000 characters for summary/copy. Limits may be lowered (or raised up to the hard ceiling of 1,000 total entries and 20,000 characters). Titles, names, roles, families, and weights have smaller fixed bounds. Empty required text, markup-control characters, non-hex colors, or malformed entries throw `GuidelineError` with `code: 'invalid'`; item overflow uses `code: 'capacity'`.

The output is English-language semantic HTML with no bundled stylesheet or JavaScript. Contrast ratios, font availability/licensing, logo clear-space measurement, translations, print/PDF fidelity, and compliance with your organization's rules are not inferred or certified. Check color contrast and content with your accessibility and brand owners.

## Performance

Model creation and HTML generation are linear in the bounded number of entries and their text bytes. Models are copied and frozen, and HTML is emitted as a single string; keep total rule entries and copy within the configured limits for predictable memory use.

## Modules and development

Independent ESM/CJS and TypeScript declarations; zero runtime/peer dependencies. CommonJS: `const { renderGuidelineHtml } = require('@lp-labs/brand-guideline-builder')`. TypeScript `^5.9.3` and Prettier `^3.6.2` are development-only.

```sh
npm ci --offline
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
