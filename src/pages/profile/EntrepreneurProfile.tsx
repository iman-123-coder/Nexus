import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import api from '../../api/axios';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [entrepreneur, setEntrepreneur] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/profile/${id}`)
      .then(r => setEntrepreneur(r.data.user))
      .catch(() => setEntrepreneur(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">This profile doesn't exist or has been removed.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const profileId = entrepreneur._id || entrepreneur.id;
  const currentId = currentUser?._id || currentUser?.id;
  const isCurrentUser = currentId === profileId;
  const isInvestor = currentUser?.role === 'investor';

  const handleSendRequest = () => {
    setRequestSent(true);
    // Future: POST /api/collaboration/request
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatar || entrepreneur.avatarUrl || ''}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName || 'Stealth Startup'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {entrepreneur.industry && <Badge variant="primary">{entrepreneur.industry}</Badge>}
                {entrepreneur.location && (
                  <Badge variant="gray">
                    <MapPin size={14} className="mr-1" />
                    {entrepreneur.location}
                  </Badge>
                )}
                {entrepreneur.startupStage && (
                  <Badge variant="secondary">{entrepreneur.startupStage}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${profileId}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>
                    Message
                  </Button>
                </Link>
                {isInvestor && (
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={requestSent}
                    onClick={handleSendRequest}
                  >
                    {requestSent ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                )}
              </>
            )}
            {isCurrentUser && (
              <Button variant="outline" leftIcon={<UserCircle size={18} />}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody>
              <p className="text-gray-700">{entrepreneur.bio || 'No bio provided yet.'}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Pitch</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur.pitch || entrepreneur.pitchSummary || 'No pitch provided.'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Industry</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur.industry || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Stage</h3>
                  <p className="text-gray-700 mt-1 capitalize">{entrepreneur.startupStage || 'Not specified'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Funding Needed</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">
                      ${Number(entrepreneur.fundingNeeded || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Wallet Balance</span>
                  <p className="text-md font-medium text-gray-900">
                    ${Number(entrepreneur.walletBalance || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {!isCurrentUser && isInvestor && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Send a collaboration request to access detailed financials.
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={handleSendRequest}
                    disabled={requestSent}
                  >
                    {requestSent ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Documents</h2></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3>
                    <p className="text-xs text-gray-500">Shared documents</p>
                  </div>
                  <Link to="/documents">
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};