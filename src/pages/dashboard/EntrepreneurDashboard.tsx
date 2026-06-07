import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, Loader } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import api from '../../api/axios';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [investors, setInvestors] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, meetingsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/meetings')
      ]);
      const investorUsers = usersRes.data.users.filter((u: User) => u.role === 'investor');
      setInvestors(investorUsers.slice(0, 3));
      setMeetings(meetingsRes.data.meetings || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const upcomingMeetings = meetings.filter(m =>
    new Date(m.date) >= new Date() && m.status === 'accepted'
  );
  const pendingMeetings = meetings.filter(m => m.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>Find Investors</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Meetings</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Investors Available</p>
                <h3 className="text-xl font-semibold text-secondary-900">{investors.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">{upcomingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-green-50 border border-green-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Total Meetings</p>
                <h3 className="text-xl font-semibold text-green-900">{meetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming meetings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Meetings</h2>
              <Link to="/meetings">
                <Badge variant="primary">{pendingMeetings.length} pending</Badge>
              </Link>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size={24} className="animate-spin text-primary-600" />
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No meetings yet</p>
                  <p className="text-sm text-gray-500 mt-1">Schedule a meeting with an investor to get started</p>
                  <Link to="/meetings" className="mt-3 inline-block">
                    <Button size="sm" variant="outline">Schedule Meeting</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.slice(0, 5).map((meeting: any) => (
                    <div key={meeting._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(meeting.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          meeting.status === 'accepted' ? 'success' :
                          meeting.status === 'rejected' ? 'error' : 'warning'
                        }
                        size="sm"
                      >
                        {meeting.status}
                      </Badge>
                    </div>
                  ))}
                  <Link to="/meetings" className="block text-center text-sm text-primary-600 hover:underline pt-2">
                    View all meetings →
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recommended investors */}
        <div>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </CardHeader>
            <CardBody className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader size={20} className="animate-spin text-primary-600" />
                </div>
              ) : investors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No investors yet</p>
              ) : (
                investors.map(investor => (
                  <InvestorCard key={investor._id || investor.id} investor={investor} showActions={false} />
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};