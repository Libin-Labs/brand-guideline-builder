import {
  createGuideline,
  GuidelineError,
  renderGuidelineHtml,
} from '@lp-labs/brand-guideline-builder';
import type {
  BrandColor,
  BrandTypography,
  GuidelineInput,
  GuidelineLimits,
  GuidelineSection,
  LogoRule,
} from '@lp-labs/brand-guideline-builder';
const colors: BrandColor[] = [{ name: 'Ocean', value: '#123456', usage: 'Actions' }];
const typography: BrandTypography[] = [
  { role: 'Body', family: 'Licensed', weight: '400', usage: 'Copy' },
];
const logoRules: LogoRule[] = [{ name: 'Clear space', rule: 'Leave room' }];
const sections: GuidelineSection[] = [{ heading: 'Voice', paragraphs: ['Be direct'] }];
const input: GuidelineInput = {
  title: 'Brand',
  summary: 'Rules',
  colors,
  typography,
  logoRules,
  sections,
};
const limits: GuidelineLimits = { maxItems: 10, maxTextLength: 1000 };
const guide = createGuideline(input, limits);
const html: string = renderGuidelineHtml(guide);
const error = new GuidelineError('invalid', 'bad model');
void [html, error];
