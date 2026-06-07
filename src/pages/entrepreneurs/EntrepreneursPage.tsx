import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { User } from '../../types';

export const EntrepreneursPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [entrepreneurs, setEntrepreneurs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingRange, setSelectedFundingRange] = useState<string>('');

  const fundingRanges = ['< $500K', '$500K - $1M', '$1M - $5M', '> $5M'];

  useEffect(() => { fetchEntrepreneurs(); }, []);

  const fetchEntrepreneurs = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/auth/users');
      const filtered = data.users.filter((u: User) => u.role === 'entrepreneur');
      setEntrepreneurs(filtered);
    } catch {
      toast.error('Failed to load entrepreneurs');
    } finally {
      setIsLoading(false);
    }
  };

  // Build industry list from real data
  const allIndustries = Array.from(
    new Set(entrepreneurs.map(e => e.industry).filter(Boolean))
  ) as string[];

  const matchesFundingRange = (entrepreneur: User, range: string): boolean => {
    const amount = typeof entrepreneur.fundingNeeded === 'number'
      ? entrepreneur.fundingNeeded
      : parseInt(String(entrepreneur.fundingNeeded || '0').replace(/[^0-9]/g, ''));
    if (!amount) return true;
    // fundingNeeded stored as raw number (e.g. 1500000)
    const inK = amount >= 1000 ? amount / 1000 : amount;
    switch (range) {
      case '< $500K': return inK < 500;
      case '$500K - $1M': return inK >= 500 && inK <= 1000;
      case '$1M - $5M': return inK > 1000 && inK <= 5000;
      case '> $5M': return inK > 5000;
      default: return true;
    }
  };

  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    const notSelf =
      entrepreneur._id !== currentUser?.id &&
      entrepreneur.id !== currentUser?.id;

    const matchesSearch = searchQuery === '' ||
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entrepreneur.startupName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entrepreneur.industry || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entrepreneur.pitch || entrepreneur.pitchSummary || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry = selectedIndustries.length === 0 ||
      selectedIndustries.includes(entrepreneur.industry || '');

    const matchesFunding = !selectedFundingRange ||
      matchesFundingRange(entrepreneur, selectedFundingRange);

    return notSelf && matchesSearch && matchesIndustry && matchesFunding;
  });

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {allIndustries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Industry</h3>
                  <div className="space-y-1">
                    {allIndustries.map(industry => (
                      <button
                        key={industry}
                        onClick={() => toggleIndustry(industry)}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedIndustries.includes(industry)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Funding Range</h3>
                <div className="space-y-1">
                  {fundingRanges.map(range => (
                    <button
                      key={range}
                      onClick={() => setSelectedFundingRange(
                        selectedFundingRange === range ? '' : range
                      )}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedFundingRange === range
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedIndustries.length > 0 || selectedFundingRange) && (
                <button
                  onClick={() => {
                    setSelectedIndustries([]);
                    setSelectedFundingRange('');
                  }}
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
              placeholder="Search startups by name, industry, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {filteredEntrepreneurs.length} result{filteredEntrepreneurs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader size={32} className="animate-spin text-primary-600" />
            </div>
          ) : filteredEntrepreneurs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-gray-300" />
              </div>
              <p className="font-medium text-gray-700">No startups found</p>
              <p className="text-sm mt-1">
                {searchQuery || selectedIndustries.length || selectedFundingRange
                  ? 'Try adjusting your search or filters'
                  : 'No entrepreneurs have registered yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEntrepreneurs.map(entrepreneur => (
                <EntrepreneurCard
                  key={entrepreneur._id || entrepreneur.id}
                  entrepreneur={entrepreneur}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};