import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'security';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Common fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  // Entrepreneur fields
  const [startupName, setStartupName] = useState('');
  const [startupStage, setStartupStage] = useState('');
  const [fundingNeeded, setFundingNeeded] = useState('');
  const [industry, setIndustry] = useState('');
  const [pitch, setPitch] = useState('');

  // Investor fields
  const [portfolioSize, setPortfolioSize] = useState('');
  const [minInvestment, setMinInvestment] = useState('');
  const [maxInvestment, setMaxInvestment] = useState('');
  const [preferredIndustries, setPreferredIndustries] = useState('');

  // Security fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setBio(user.bio || '');
    setLocation(user.location || '');
    setPhone(user.phone || '');
    setStartupName(user.startupName || '');
    setStartupStage(user.startupStage || '');
    setFundingNeeded(String(user.fundingNeeded || ''));
    setIndustry(user.industry || '');
    setPitch(user.pitch || '');
    setPortfolioSize(String(user.portfolioSize || ''));
    setMinInvestment(String(user.investmentRange?.min || ''));
    setMaxInvestment(String(user.investmentRange?.max || ''));
    setPreferredIndustries((user.preferredIndustries || []).join(', '));
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = { name, bio, location, phone };

      if (user.role === 'entrepreneur') {
        payload.startupName = startupName;
        payload.startupStage = startupStage;
        payload.fundingNeeded = Number(fundingNeeded);
        payload.industry = industry;
        payload.pitch = pitch;
      } else {
        payload.portfolioSize = Number(portfolioSize);
        payload.investmentRange = {
          min: Number(minInvestment),
          max: Number(maxInvestment),
        };
        payload.preferredIndustries = preferredIndustries
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }

      const { data } = await api.put('/profile/update', payload);
      await updateProfile(user.id, data.user);
      toast.success('Profile saved!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 800 * 1024) {
    toast.error('Image must be under 800KB');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', file);

  setSaving(true);
  try {
    const { data } = await api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await updateProfile(user!.id, data.user);
    toast.success('Photo updated!');
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Upload failed');
  } finally {
    setSaving(false);
    // Reset so same file can be re-selected
    e.target.value = '';
  }
};

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={18} /> },
    { key: 'security', label: 'Security', icon: <Lock size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Nav */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.key
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">

          {activeTab === 'profile' && (
            <>
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
                </CardHeader>
                <CardBody className="space-y-6">
                  {/* Avatar */}
<div className="flex items-center gap-6">
  <Avatar src={user.avatar || user.avatarUrl || ''} alt={user.name} size="xl" />
  <div>
    <input
      type="file"
      id="avatar-upload"
      accept="image/jpeg,image/png,image/gif"
      className="hidden"
      onChange={handleAvatarUpload}
    />
    <Button
      variant="outline"
      size="sm"
      onClick={() => document.getElementById('avatar-upload')?.click()}
    >
      Change Photo
    </Button>
    <p className="mt-2 text-sm text-gray-500">JPG, GIF or PNG. Max 800K</p>
  </div>
</div>

                  {/* Common fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} fullWidth />
                    <Input label="Email" type="email" value={user.email} disabled fullWidth />
                    <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} fullWidth />
                    <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} fullWidth />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  {/* Entrepreneur-specific */}
                  {user.role === 'entrepreneur' && (
                    <>
                      <hr />
                      <h3 className="text-md font-semibold text-gray-800">Startup Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Startup Name" value={startupName} onChange={e => setStartupName(e.target.value)} fullWidth />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                          <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={startupStage}
                            onChange={e => setStartupStage(e.target.value)}
                          >
                            <option value="">Select stage</option>
                            <option value="idea">Idea</option>
                            <option value="mvp">MVP</option>
                            <option value="growth">Growth</option>
                            <option value="scaling">Scaling</option>
                          </select>
                        </div>
                        <Input label="Industry" value={industry} onChange={e => setIndustry(e.target.value)} fullWidth />
                        <Input label="Funding Needed ($)" type="number" value={fundingNeeded} onChange={e => setFundingNeeded(e.target.value)} fullWidth />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Summary</label>
                        <textarea
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                          value={pitch}
                          onChange={e => setPitch(e.target.value)}
                          placeholder="Describe your startup in a few sentences..."
                        />
                      </div>
                    </>
                  )}

                  {/* Investor-specific */}
                  {user.role === 'investor' && (
                    <>
                      <hr />
                      <h3 className="text-md font-semibold text-gray-800">Investment Profile</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Portfolio Size ($)" type="number" value={portfolioSize} onChange={e => setPortfolioSize(e.target.value)} fullWidth />
                        <Input label="Min Investment ($)" type="number" value={minInvestment} onChange={e => setMinInvestment(e.target.value)} fullWidth />
                        <Input label="Max Investment ($)" type="number" value={maxInvestment} onChange={e => setMaxInvestment(e.target.value)} fullWidth />
                        <Input
                          label="Preferred Industries (comma separated)"
                          value={preferredIndustries}
                          onChange={e => setPreferredIndustries(e.target.value)}
                          placeholder="e.g. Fintech, Health, SaaS"
                          fullWidth
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
  {saved && (
    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
      ✓ Changes saved successfully
    </span>
  )}
  {saving && (
    <span className="text-sm text-gray-500 animate-pulse">Saving...</span>
  )}
  <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
  <Button onClick={handleSaveProfile} isLoading={saving} disabled={saving}>
    {saved ? '✓ Saved' : 'Save Changes'}
  </Button>
</div>
                </CardBody>
              </Card>
            </>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} fullWidth />
                <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
                  fullWidth
                />
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} isLoading={saving}>Update Password</Button>
                </div>
              </CardBody>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};