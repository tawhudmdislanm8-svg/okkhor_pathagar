export interface Book {
  id: string;
  code: string;
  name: string;
  author: string;
  publisher: string;
  imageUrl: string;
  status: "Available" | "Issued";
}

export interface Member {
  formNumber: string;
  name: string;
  mobile: string;
  address: string;
}

export interface IssueRecord {
  id: string;
  bookCode: string;
  bookName: string;
  author: string;
  publisher: string;
  memberName: string;
  formNumber: string;
  mobile: string;
  address: string;
  issueDate: string;
  returnDate: string;
  status: "Issued" | "Returned";
  extensionHistory: Array<{
    date: string;
    action: "Extended" | "Reduced";
    payload: string;
  }>;
  comments: string[];
  returnedAt?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  author: string;
  publisher: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface SMSAlert {
  id: string;
  bookName: string;
  memberName: string;
  returnDate: string;
  mobile: string;
  status: "Scheduled" | "Sent";
  alertText: string;
  triggerTime: string;
}

export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  issuedBooks: number;
  lateBooks: number;
  todaysTransactions: number;
  totalMembers: number;
}

export interface DashboardData {
  stats: DashboardStats;
  charts: {
    monthlyReport: Array<{ month: string; issues: number; returns: number }>;
    popularBooks: Array<{ code: string; name: string; count: number }>;
    activeMembers: Array<{ formNumber: string; name: string; count: number }>;
    lateReportLoans: IssueRecord[];
  };
}
