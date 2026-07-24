/**
 * On-device data models. These mirror the backend contract (see
 * splitit-server/lib/schema.ts) so a split returned by the API maps cleanly onto
 * a stored SplitRecord.
 */

export type ID = string;

export type Friend = {
  id: ID;
  name: string;
  /** Optional short color seed / emoji for the avatar. */
  colorSeed?: string;
  /** Set when this friend is a real linked Splitit user (added by code). */
  profileId?: ID;
  /** The friend's shareable code (when linked). */
  friendCode?: string;
  createdAt: string;
};

export type Group = {
  id: ID;
  name: string;
  friendIds: ID[];
  createdAt: string;
};

/** A single line item read from the receipt. */
export type LineItem = {
  name: string;
  qty: number;
  price: number;
};

/** Which people a given item is attributed to. */
export type Assignment = {
  item: string;
  people: string[];
};

/** Amount owed by one participant. */
export type PerPerson = {
  name: string;
  amount: number;
};

/** The split result (from the backend or after manual edits). */
export type SplitResult = {
  items: LineItem[];
  assignments: Assignment[];
  perPerson: PerPerson[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  /** True when the computed total could not be reconciled with the receipt. */
  needsReview: boolean;
};

/** A saved split in history. */
export type SplitRecord = SplitResult & {
  id: ID;
  title: string;
  /** Local URI of the invoice image, if kept. */
  invoiceImageUri?: string;
  /** Free-text description the user provided. */
  description?: string;
  groupId?: ID;
  /** Participant names, in case they are ad-hoc (not saved friends). */
  participants: string[];
  /** Who paid the bill. Defaults to the device owner ("Me"). */
  paidBy?: string;
  createdAt: string;
};

/**
 * A settlement between the owner and a member.
 *   direction 'received' → the member paid YOU back (lowers what they owe you).
 *   direction 'given'    → YOU paid the member (lowers what you owe them).
 * Older records without a direction are treated as 'received'.
 */
export type PaymentDirection = 'received' | 'given';

export type Payment = {
  id: ID;
  friendId: ID;
  amount: number;
  direction?: PaymentDirection;
  note?: string;
  createdAt: string;
};

export type StoreSnapshot = {
  friends: Friend[];
  groups: Group[];
  splits: SplitRecord[];
  payments: Payment[];
};
