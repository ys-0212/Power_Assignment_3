export interface MemberInfo {
  number: number;
  name: string;
}

export const MEMBERS: MemberInfo[] = [
  { number: 1, name: 'Yash Brijesh Modi' },
  { number: 2, name: 'Dhananjay Dhumal' },
  { number: 3, name: 'Rucha Gadgil' },
  { number: 4, name: 'Ninad Kulkarni' },
  { number: 5, name: 'Yogendra Singh' },
  { number: 6, name: 'Rohan Jain' },
];

export function getMemberName(memberNumber: number, groupNumber: number): string | undefined {
  if (groupNumber === 14) {
    return MEMBERS.find(m => m.number === memberNumber)?.name || `Student ${memberNumber}`;
  }
  return `Student ${memberNumber}`;
}
