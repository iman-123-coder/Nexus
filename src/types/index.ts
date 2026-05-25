export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  createdAt?: string;
  // Entrepreneur fields
  startupName?: string;
  pitchSummary?: string;
  fundingNeeded?: number | string;
  industry?: string;
  location?: string;
  foundedYear?: number;
  teamSize?: number;
  startupStage?: string;
  pitch?: string;
  // Investor fields
  investmentInterests?: string[];
  investmentStage?: string[];
  portfolioCompanies?: string[];
  totalInvestments?: number;
  minimumInvestment?: string;
  maximumInvestment?: string;
  preferredIndustries?: string[];
  portfolioSize?: number;
  investmentRange?: { min: number; max: number };
  // Wallet
  walletBalance?: number;
  phone?: string;
  isVerified?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  _id?: string;
  title?: string;
  name?: string;
  type?: string;
  mimetype?: string;
  size?: string;
  filesize?: number;
  lastModified?: string;
  shared?: boolean;
  url?: string;
  filepath?: string;
  filename?: string;
  ownerId?: string;
  owner?: User;
  sharedWith?: User[];
  isSigned?: boolean;
  signature?: string;
  version?: number;
  createdAt?: string;
}

export interface Meeting {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  organizer: User;
  participant: User;
  date: string;
  duration: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  roomId: string;
  notes?: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  _id?: string;
  user: User;
  type: 'deposit' | 'withdraw' | 'transfer_sent' | 'transfer_received';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  stripePaymentId?: string;
  recipient?: User;
  description?: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}