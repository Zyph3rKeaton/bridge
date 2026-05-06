import { isAllowedLocalOrigin } from './local-origin';

describe('isAllowedLocalOrigin', () => {
  it('allows local app origins and blocks remote web pages', () => {
    expect(isAllowedLocalOrigin(undefined)).toBe(true);
    expect(isAllowedLocalOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedLocalOrigin('http://127.0.0.1:51234')).toBe(true);
    expect(isAllowedLocalOrigin('https://example.com')).toBe(false);
  });
});
