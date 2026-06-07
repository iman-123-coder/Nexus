import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Search, PlusCircle, Loader, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import api from '../../api/axios';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entrepreneurs, setEntrepreneurs] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, meetingsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/meetings')
      ]);
      const entrepreneurUsers = usersRes.data.users.filter((u: User) => u.role === 'entrepreneur');
      setEntrepreneurs(entrepreneurUsers);
      setMeetings(meetingsRes.data.meetings || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const industries = Array.from(new Set(entrepreneurs.map(e => e.industry).filter(Boolean))) as string[];
  const upcomingMeetings = meetings.filter(m => new Date(m.date) >= new Date() && m.status === 'accepted');

  const filteredEntrepreneurs = entrepreneurs.filter(e =>
    searchQuery === '' ||
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.startupName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.industry || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button>
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder="Search startups, industries, or keywords..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        startAdornment={<Search size={18} />}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
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
      </div>

      {/* Entrepreneurs grid */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Featured Startups
            <span className="ml-2 text-sm text-gray-500">({filteredEntrepreneurs.length})</span>
          </h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader size={32} className="animate-spin text-primary-600" />
            </div>
          ) : filteredEntrepreneurs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No startups found</p>
              {searchQuery && (
                <Button variant="outline" className="mt-2" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntrepreneurs.map(entrepreneur => (
                <EntrepreneurCard
                  key={entrepreneur._id || entrepreneur.id}
                  entrepreneur={entrepreneur}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};