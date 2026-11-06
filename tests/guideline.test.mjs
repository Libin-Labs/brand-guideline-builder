import test from 'node:test';
import assert from 'node:assert/strict';
import { createGuideline, GuidelineError, renderGuidelineHtml } from '../dist/esm/index.js';

const model = {
  title: 'Northstar Brand',
  summary: 'Rules for consistent use.',
  colors: [{ name: 'Ocean', value: '#126699', usage: 'Use for primary actions.' }],
  typography: [
    { role: 'Body', family: 'A Licensed Font', weight: '400', usage: 'Long-form copy.' },
  ],
  logoRules: [{ name: 'Clear space', rule: 'Keep one cap-height around the supplied logo.' }],
  sections: [{ heading: 'Voice', paragraphs: ['Be direct.', 'Use plain language.'] }],
};

test('creates a detached frozen reusable rule model', () => {
  const source = structuredClone(model);
  const guideline = createGuideline(source);
  source.colors[0].value = '#ffffff';
  assert.equal(guideline.colors[0].value, '#126699');
  assert.ok(Object.isFrozen(guideline));
  assert.ok(Object.isFrozen(guideline.colors[0]));
  assert.ok(Object.isFrozen(guideline.sections[0].paragraphs));
});

test('renders complete accessible semantic HTML and a color sample', () => {
  const html = renderGuidelineHtml(model);
  assert.ok(html.startsWith('<!doctype html><html lang="en">'));
  assert.match(html, /<main><h1>Northstar Brand<\/h1>/u);
  assert.match(
    html,
    /<section aria-labelledby="brand-colors"><h2 id="brand-colors">Color palette/u,
  );
  assert.match(html, /role="img" aria-label="Ocean, #126699"/u);
  assert.match(html, /background-color:#126699/u);
  assert.match(html, /<h2 id="guideline-section-1">Voice<\/h2>/u);
});

test('escapes every user-controlled text field while restricting CSS color input', () => {
  const html = renderGuidelineHtml({
    ...model,
    title: '<script>alert("x")</script>',
    colors: [{ name: 'X" onmouseover="bad', value: '#AABBCC', usage: '& <safe>' }],
  });
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(html.includes('X&quot; onmouseover=&quot;bad'));
  assert.ok(html.includes('&amp; &lt;safe&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('onmouseover="bad"'));
  assert.throws(() =>
    renderGuidelineHtml({ ...model, colors: [{ ...model.colors[0], value: 'red' }] }),
  );
});

test('validates missing, malformed, control-character, and over-capacity inputs', () => {
  assert.throws(() => createGuideline(null), GuidelineError);
  assert.throws(() => createGuideline(model, null), { code: 'invalid' });
  assert.throws(() => createGuideline({ ...model, title: ' ' }), { code: 'invalid' });
  assert.throws(() => createGuideline({ ...model, title: 'bad\u0000title' }), { code: 'invalid' });
  assert.throws(
    () => createGuideline({ ...model, sections: [{ heading: 'empty', paragraphs: [] }] }),
    {
      code: 'invalid',
    },
  );
  assert.throws(() => createGuideline(model, { maxItems: 1 }), { code: 'capacity' });
  assert.throws(() => createGuideline(model, { maxItems: 5 }), { code: 'capacity' });
  assert.throws(() => createGuideline(model, { maxTextLength: 3 }), { code: 'invalid' });
  assert.throws(() => createGuideline({ ...model, summary: '\ud800' }), { code: 'invalid' });
  assert.throws(() => createGuideline({ ...model, colors: new Array(1) }), { code: 'invalid' });
});

test('accepts empty optional collections and bounds color swatches to literal hex', () => {
  const empty = createGuideline({
    title: 'Small guide',
    summary: 'Summary',
    colors: [],
    typography: [],
    logoRules: [],
    sections: [],
  });
  assert.match(renderGuidelineHtml(empty), /<ul><\/ul>/u);
  for (const value of ['url(https://example.test)', '#12345', '#11223344'])
    assert.throws(
      () => createGuideline({ ...model, colors: [{ ...model.colors[0], value }] }),
      GuidelineError,
    );
});
