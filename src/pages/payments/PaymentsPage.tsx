import React, { useState, useEffect } from 'react';
import {
  DollarSign, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft,
  Loader, RefreshCw, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'transfer_sent' | 'transfer_received';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  recipient?: { name: string; email: string };
  createdAt: string;
}

type ActiveTab = 'overview' | 'deposit' | 'withdraw' | 'transfer';

export const PaymentsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [walletBalance, setWalletBalance] = useState<number>(user?.walletBalance || 0);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [historyRes, profileRes] = await Promise.all([
        api.get('/payments/history'),
        api.get('/auth/me')
      ]);
      setTransactions(historyRes.data.transactions);
      setWalletBalance(profileRes.data.user.walletBalance || 0);
      const usersRes = await api.get('/auth/users');
      setAllUsers(usersRes.data.users);
    } catch {
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > 10000) { toast.error('Max deposit is $10,000'); return; }
    try {
      setSubmitting(true);
      // Step 1: Create payment intent
      const { data } = await api.post('/payments/deposit', { amount });
      // Step 2: In sandbox, confirm immediately with the paymentIntentId
      await api.post('/payments/deposit/confirm', {
        paymentIntentId: data.transaction.stripePaymentId
      });
      toast.success(`$${amount} deposited successfully!`);
      setDepositAmount('');
      setActiveTab('overview');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > walletBalance) { toast.error('Insufficient balance'); return; }
    try {
      setSubmitting(true);
      await api.post('/payments/withdraw', { amount });
      toast.success(`$${amount} withdrawn successfully!`);
      setWithdrawAmount('');
      setActiveTab('overview');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!transferRecipient.trim()) { toast.error('Enter recipient user ID'); return; }
    if (amount > walletBalance) { toast.error('Insufficient balance'); return; }
    try {
      setSubmitting(true);
      await api.post('/payments/transfer', {
        recipientId: transferRecipient.trim(),
        amount,
        description: transferNote || 'Transfer'
      });
      toast.success(`$${amount} transferred successfully!`);
      setTransferAmount('');
      setTransferRecipient('');
      setTransferNote('');
      setActiveTab('overview');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getTxIcon = (type: Transaction['type']) => {
    if (type === 'deposit') return <ArrowDownCircle size={18} className="text-green-500" />;
    if (type === 'withdraw') return <ArrowUpCircle size={18} className="text-red-500" />;
    if (type === 'transfer_sent') return <ArrowRightLeft size={18} className="text-orange-500" />;
    return <ArrowRightLeft size={18} className="text-blue-500" />;
  };

  const getTxLabel = (type: Transaction['type']) => {
    if (type === 'deposit') return 'Deposit';
    if (type === 'withdraw') return 'Withdrawal';
    if (type === 'transfer_sent') return 'Transfer Sent';
    return 'Transfer Received';
  };

  const getTxSign = (type: Transaction['type']) =>
    type === 'deposit' || type === 'transfer_received' ? '+' : '-';

  const getTxColor = (type: Transaction['type']) =>
    type === 'deposit' || type === 'transfer_received' ? 'text-green-600' : 'text-red-600';

  const getStatusBadge = (status: Transaction['status']) => {
    if (status === 'completed') return <Badge variant="success" size="sm">Completed</Badge>;
    if (status === 'failed') return <Badge variant="error" size="sm">Failed</Badge>;
    return <Badge variant="warning" size="sm">Pending</Badge>;
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <DollarSign size={16} /> },
    { key: 'deposit', label: 'Deposit', icon: <ArrowDownCircle size={16} /> },
    { key: 'withdraw', label: 'Withdraw', icon: <ArrowUpCircle size={16} /> },
    { key: 'transfer', label: 'Transfer', icon: <ArrowRightLeft size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage your wallet and transactions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={16} />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </div>

      {/* Wallet Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <CardBody>
            <p className="text-primary-200 text-sm font-medium">Wallet Balance</p>
            <p className="text-4xl font-bold mt-2">${walletBalance.toFixed(2)}</p>
            <p className="text-primary-200 text-xs mt-2">{user?.name}</p>
          </CardBody>
        </Card>

        <Card className="md:col-span-1">
          <CardBody>
            <p className="text-gray-500 text-sm">Total Deposited</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              ${transactions
                .filter(t => t.type === 'deposit' && t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="md:col-span-1">
          <CardBody>
            <p className="text-gray-500 text-sm">Total Transferred</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">
              ${transactions
                .filter(t => t.type === 'transfer_sent' && t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader size={28} className="animate-spin text-primary-600" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <DollarSign size={48} className="mx-auto mb-3 text-gray-200" />
                <p className="font-medium">No transactions yet</p>
                <p className="text-sm mt-1">Deposit funds to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <div key={tx._id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        {getTxIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getTxLabel(tx.type)}</p>
                        <p className="text-xs text-gray-400">
                          {tx.recipient ? `${tx.type === 'transfer_sent' ? 'To' : 'From'}: ${tx.recipient.name}` : ''}
                          {tx.description && tx.description !== 'Transfer' ? ` · ${tx.description}` : ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(tx.status)}
                      <span className={`text-sm font-bold ${getTxColor(tx.type)}`}>
                        {getTxSign(tx.type)}${tx.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'deposit' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Deposit Funds</h2>
          </CardHeader>
          <CardBody className="space-y-4 max-w-md">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
              🧪 Sandbox mode — no real money is charged. Use any amount up to $10,000.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(amount.toString())}
                  className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ${amount}
                </button>
              ))}
            </div>
            <Button
              onClick={handleDeposit}
              isLoading={submitting}
              leftIcon={<ArrowDownCircle size={16} />}
              className="w-full"
            >
              Deposit ${depositAmount || '0'}
            </Button>
          </CardBody>
        </Card>
      )}

      {activeTab === 'withdraw' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
          </CardHeader>
          <CardBody className="space-y-4 max-w-md">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
              Available balance: <span className="font-bold text-gray-900">${walletBalance.toFixed(2)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min="1"
                  max={walletBalance}
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
            <Button
              onClick={handleWithdraw}
              isLoading={submitting}
              leftIcon={<ArrowUpCircle size={16} />}
              className="w-full"
              variant="outline"
            >
              Withdraw ${withdrawAmount || '0'}
            </Button>
          </CardBody>
        </Card>
      )}

      {activeTab === 'transfer' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Transfer Funds</h2>
          </CardHeader>
          <CardBody className="space-y-4 max-w-md">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
              Available balance: <span className="font-bold text-gray-900">${walletBalance.toFixed(2)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipient</label>
              <select
                value={transferRecipient}
                onChange={e => setTransferRecipient(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Select a user --</option>
                {allUsers.map((u: any) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min="1"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. Investment for Series A"
                value={transferNote}
                onChange={e => setTransferNote(e.target.value)}
                className={inputClass}
              />
            </div>
            <Button
              onClick={handleTransfer}
              isLoading={submitting}
              leftIcon={<ArrowRightLeft size={16} />}
              className="w-full"
            >
              Transfer ${transferAmount || '0'}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};