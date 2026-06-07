import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { User } from '../../types';

export const InvestorsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [investors, setInvestors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => { fetchInvestors(); }, []);

  const fetchInvestors = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/auth/users');
      const investorUsers = data.users.filter((u: User) => u.role === 'investor');
      setInvestors(investorUsers);
    } catch {
      toast.error('Failed to load investors');
    } finally {
      setIsLoading(false);
    }
  };

  // Build filter options from real data
  const allStages = Array.from(
    new Set(investors.flatMap(i => i.investmentStage || []))
  );
  const allInterests = Array.from(
    new Set(investors.flatMap(i => i.preferredIndustries || []))
  );

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchQuery === '' ||
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (investor.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (investor.preferredIndustries || []).some(i =>
        i.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStages = selectedStages.length === 0 ||
      (investor.investmentStage || []).some(s => selectedStages.includes(s));

    const matchesInterests = selectedInterests.length === 0 ||
      (investor.preferredIndustries || []).some(i => selectedInterests.includes(i));

    // Don't show current user
    const notSelf = investor._id !== currentUser?.id && investor.id !== currentUser?.id;

    return matchesSearch && matchesStages && matchesInterests && notSelf;
  });

  const toggleStage = (stage: string) => {
    setSelectedStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {allStages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Stage</h3>
                  <div className="space-y-1">
                    {allStages.map(stage => (
                      <button
                        key={stage}
                        onClick={() => toggleStage(stage)}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedStages.includes(stage)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {allInterests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map(interest => (
                      <button
  key={interest}
  onClick={() => toggleInterest(interest)}
  className="cursor-pointer"
>
  <Badge
    variant={selectedInterests.includes(interest) ? 'primary' : 'gray'}
  >
    {interest}
  </Badge>
</button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedStages.length > 0 || selectedInterests.length > 0) && (
                <button
                  onClick={() => { setSelectedStages([]); setSelectedInterests([]); }}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Clear filters
                </button>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search by name, industry, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {filteredInvestors.length} result{filteredInvestors.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader size={32} className="animate-spin text-primary-600" />
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-gray-300" />
              </div>
              <p className="font-medium text-gray-700">No investors found</p>
              <p className="text-sm mt-1">
                {searchQuery || selectedStages.length || selectedInterests.length
                  ? 'Try adjusting your search or filters'
                  : 'No investors have registered yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredInvestors.map(investor => (
                <InvestorCard
                  key={investor._id || investor.id}
                  investor={investor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};