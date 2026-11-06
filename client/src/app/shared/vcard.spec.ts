import { Household } from '../models/household';
import { householdToVCard, householdsToVCard } from './vcard';

const base: Household = {
  id: 'h1',
  street1: '12 Elm Street',
  street2: 'Apt 2',
  city: 'Springfield',
  state: 'IL',
  zip: '62701',
  lastSent: '2025-12-21',
  comments: null,
  addressee: { id: 'p1', firstName: 'Ann', lastName: 'Zeta', suffix: null },
  spouse: { id: 'p2', firstName: 'Bob', lastName: 'Zeta', suffix: null },
  children: [
    { id: 'c1', firstName: 'Cal', lastName: 'Zeta' },
    { id: 'c2', firstName: 'Dee', lastName: 'Ray' },
  ],
};

describe('householdToVCard', () => {
  it('writes one vCard 3.0 contact per household, named for the couple', () => {
    const card = householdToVCard(base);

    expect(card).toBe(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Zeta;Ann & Bob;;;',
        'FN:Ann & Bob Zeta',
        'ADR;TYPE=HOME:;Apt 2;12 Elm Street;Springfield;IL;62701;',
        'NOTE:Children: Cal\\, Dee Ray\\nLast sent: 2025-12-21',
        'UID:h1',
        'END:VCARD',
        '',
      ].join('\r\n'),
    );
  });

  it('keeps both names whole when the spouse has a different last name', () => {
    const card = householdToVCard({ ...base, spouse: { firstName: 'Bo', lastName: "O'Neill" } });

    expect(card).toContain("FN:Ann Zeta & Bo O'Neill\r\n");
    expect(card).toContain("N:;Ann Zeta & Bo O'Neill;;;\r\n");
  });

  it('uses the suffix for a single addressee', () => {
    const card = householdToVCard({ ...base, spouse: null, children: [], addressee: { firstName: 'Al', lastName: 'Ray', suffix: 'Jr.' } });

    expect(card).toContain('N:Ray;Al;;;Jr.\r\n');
    expect(card).toContain('FN:Al Ray Jr.\r\n');
  });

  it('escapes special characters and folds long lines', () => {
    const comments = 'Gate code; ring twice, then wait\\knock. ' + 'Ünïcödé '.repeat(12);
    const card = householdToVCard({ ...base, comments });
    const lines = card.split('\r\n');

    const unfolded = card.replace(/\r\n /g, '');
    expect(unfolded).toContain('Gate code\\; ring twice\\, then wait\\\\knock.');
    for (const line of lines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(lines.length).toBeGreaterThan(9);
    expect(unfolded).toContain('Ünïcödé '.repeat(12).trim());
  });

  it('joins several households', () => {
    expect(householdsToVCard([base, base]).match(/BEGIN:VCARD/g)?.length).toBe(2);
  });
});
