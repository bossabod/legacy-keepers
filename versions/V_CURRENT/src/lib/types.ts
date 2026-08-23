export type Currency = "CHF" | "USD" | "BTC";

export type Classification =
  | "عام داخلي"
  | "محدود"
  | "سري"
  | "سري جدًا";

export interface Member {
  id: number;
  code: string;
  name: string;
  initials: string;
  rank: string;
  role: string;
  city: string;
  country: string;
  bio: string;
  visible: boolean;
  memberSince: number;
}

export interface Rank {
  id: number;
  ord: number;
  name: string;
  holders: number;
  description: string;
}

export interface Project {
  id: number;
  title: string;
  track: string;
  location: string;
  valueChf: number;
  status: string;
  summary: string;
  partnership: number;
  partners: number;
  remaining: number;
}

export interface Investment {
  id: number;
  scope: string;
  type: string;
  title: string;
  status: string;
  valueChf: number;
  change: number;
}

export interface Bank {
  id: number;
  code: string;
  name: string;
  location: string;
  balanceChf: number;
  files: number;
  status: string;
}

export interface Invoice {
  id: number;
  title: string;
  category: string;
  amountChf: number;
  status: string;
  date: string;
}

export interface ArchiveFile {
  id: number;
  title: string;
  classification: Classification;
  custodian: string;
  pages: number;
  date: string;
}

export interface Message {
  id: number;
  sender: string;
  subject: string;
  category: string;
  read: boolean;
  date: string;
  body: string;
}

export interface LogEntry {
  id: number;
  action: string;
  section: string;
  detail: string;
  actor: string;
  time: string;
}

export interface AppData {
  members: Member[];
  ranks: Rank[];
  projects: Project[];
  investments: Investment[];
  banks: Bank[];
  invoices: Invoice[];
  archive: ArchiveFile[];
  messages: Message[];
  log: LogEntry[];
}
