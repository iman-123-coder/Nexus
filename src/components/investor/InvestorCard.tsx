import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, DollarSign } from 'lucide-react';
import { User } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InvestorCardProps {
  investor: User;
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true
}) => {
  const navigate = useNavigate();

  // Normalize id — backend uses _id, mock uses id
  const investorId = investor._id || investor.id;

  // Normalize avatar
  const avatarUrl = investor.avatarUrl || investor.avatar || '';

  // Normalize investment stages
  const stages = investor.investmentStage || [];

  // Normalize industries/interests
  const interests = investor.preferredIndustries || investor.investmentInterests || [];

  // Normalize investment range
  const getInvestmentRange = () => {
    if (investor.investmentRange?.min || investor.investmentRange?.max) {
      const min = investor.investmentRange.min
        ? `$${investor.investmentRange.min.toLocaleString()}`
        : 'N/A';
      const max = investor.investmentRange.max
        ? `$${investor.investmentRange.max.toLocaleString()}`
        : 'N/A';
      return `${min} – ${max}`;
    }
    if (investor.minimumInvestment && investor.maximumInvestment) {
      return `${investor.minimumInvestment} – ${investor.maximumInvestment}`;
    }
    return null;
  };

  const investmentRange = getInvestmentRange();
  const portfolioCount = investor.portfolioSize || investor.totalInvestments || 0;

  const handleViewProfile = () => {
    navigate(`/profile/investor/${investorId}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${investorId}`);
  };

  return (
    <Card
      hoverable
      className="transition-all duration-300 h-full"
      onClick={handleViewProfile}
    >
      <CardBody className="flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={investor.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-semibold text-lg">
                {investor.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{investor.name}</h3>
            <p className="text-sm text-gray-500">
              Investor{portfolioCount > 0 ? ` · ${portfolioCount} investments` : ''}
            </p>
            {stages.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {stages.map((stage, i) => (
                  <Badge key={i} variant="secondary" size="sm">{stage}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Industries */}
        {interests.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Investment Interests
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {interests.slice(0, 4).map((interest, i) => (
                <Badge key={i} variant="primary" size="sm">{interest}</Badge>
              ))}
              {interests.length > 4 && (
                <Badge variant="gray" size="sm">+{interests.length - 4}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {investor.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">{investor.bio}</p>
        )}

        {/* Investment range */}
        {investmentRange && (
          <div className="mt-3 flex items-center gap-2">
            <DollarSign size={14} className="text-green-600 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500">Range: </span>
              <span className="text-sm font-medium text-gray-900">{investmentRange}</span>
            </div>
          </div>
        )}

        {/* Location */}
        {investor.location && (
          <p className="mt-1.5 text-xs text-gray-400">{investor.location}</p>
        )}
      </CardBody>

      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={handleMessage}
          >
            Message
          </Button>
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ExternalLink size={16} />}
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};