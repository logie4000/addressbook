import { Household, HouseholdPerson } from '../models/household';

/**
 * Households as vCard 3.0, the version Google Contacts and iPhones read
 * best. Each household becomes one contact named for the couple (e.g.
 * "Ann & Bob Zeta") with the home address; children, the date a card was
 * last sent and the notes go in the contact's note.
 */
export function householdsToVCard(households: Household[]): string {
  return households.map(householdToVCard).join('');
}

export function householdToVCard(household: Household): string {
  const { given, family, suffix, full } = names(household);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${[family, given, '', '', suffix].map(escape).join(';')}`,
    `FN:${escape(full)}`,
  ];

  if (household.street1 || household.city || household.zip) {
    const parts = ['', household.street2, household.street1, household.city, household.state, household.zip, ''];
    lines.push(`ADR;TYPE=HOME:${parts.map((part) => escape(part ?? '')).join(';')}`);
  }

  const note = [
    children(household) && `Children: ${children(household)}`,
    household.lastSent && `Last sent: ${household.lastSent}`,
    household.comments,
  ].filter((part) => !!part);
  if (note.length) {
    lines.push(`NOTE:${escape(note.join('\n'))}`);
  }

  if (household.id) {
    lines.push(`UID:${escape(household.id)}`);
  }
  lines.push('END:VCARD');

  return lines.map(fold).join('\r\n') + '\r\n';
}

function names(household: Household) {
  const person = household.addressee;
  const spouse = household.spouse;
  const first = person?.firstName ?? '';
  const last = person?.lastName ?? '';

  if (!person) {
    const label = household.street1 ?? 'Unknown';
    return { given: label, family: '', suffix: '', full: label };
  }
  if (!spouse?.firstName) {
    const full = [first, last, person.suffix].filter((part) => !!part).join(' ');
    return { given: first, family: last, suffix: person.suffix ?? '', full };
  }
  if (!spouse.lastName || spouse.lastName === last) {
    const given = `${first} & ${spouse.firstName}`;
    return { given, family: last, suffix: '', full: [given, last].filter((part) => !!part).join(' ') };
  }
  // Different last names: keep each name whole.
  const full = `${fullName(person)} & ${fullName(spouse)}`;
  return { given: full, family: '', suffix: '', full };
}

function fullName(person: HouseholdPerson): string {
  return [person.firstName, person.lastName].filter((part) => !!part).join(' ');
}

function children(household: Household): string {
  const last = household.addressee?.lastName;
  return household.children
    .map((child) => (child.lastName && child.lastName !== last ? fullName(child) : child.firstName))
    .filter((name) => !!name)
    .join(', ');
}

/** Backslash, comma, semicolon and line breaks must be escaped in a value. */
function escape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/([,;])/g, '\\$1');
}

/** Lines longer than 75 bytes are folded: CRLF, then a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}
