import { Colors } from '../colors';

describe('Colors', () => {
  it('uses the brand purple from the spec, not green', () => {
    expect(Colors.primary).toBe('#7C5CFF');
    expect(Colors.primary.toLowerCase()).not.toContain('00ff00');
  });

  it('defines the full palette used across the app', () => {
    expect(Colors.primaryDark).toBe('#5B3FD4');
    expect(Colors.primaryLight).toBe('#A98CFF');
    expect(Colors.background).toBe('#F7F5FF');
    expect(Colors.surface).toBe('#FFFFFF');
    expect(Colors.text).toBe('#17152A');
    expect(Colors.secondary).toBe('#77738A');
    expect(Colors.success).toBe('#35B77A');
    expect(Colors.warning).toBe('#FFB547');
    expect(Colors.danger).toBe('#FF5C73');
    expect(Colors.info).toBe('#5D8CFF');
  });
});
