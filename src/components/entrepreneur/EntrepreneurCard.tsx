import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, DollarSign } from 'lucide-react';
import { User } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EntrepreneurCardProps {
  entrepreneur: User;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true
}) => {
  const navigate = useNavigate();

  const entrepreneurId = entrepreneur._id || entrepreneur.id;
  const avatarUrl = entrepreneur.avatarUrl || entrepreneur.avatar || '';
  const startupName = entrepreneur.startupName || '';
  const industry = entrepreneur.industry || '';
  const location = entrepreneur.location || '';
  const pitchSummary = entrepreneur.pitchSummary || entrepreneur.pitch || '';
  const fundingNeeded = entrepreneur.fundingNeeded
    ? typeof entrepreneur.fundingNeeded === 'number'
      ? `$${entrepreneur.fundingNeeded.toLocaleString()}`
      : entrepreneur.fundingNeeded
    : null;
  const teamSize = entrepreneur.teamSize || null;
  const stage = entrepreneur.startupStage || '';

  const handleViewProfile = () => {
    navigate(`/profile/entrepreneur/${entrepreneurId}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${entrepreneurId}`);
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
              alt={entrepreneur.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-700 font-semibold text-lg">
                {entrepreneur.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{entrepreneur.name}</h3>
            {startupName && (
              <p className="text-sm text-gray-500 truncate">{startupName}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {industry && <Badge variant="primary" size="sm">{industry}</Badge>}
              {location && <Badge variant="gray" size="sm">{location}</Badge>}
              {stage && <Badge variant="accent" size="sm">{stage}</Badge>}
            </div>
          </div>
        </div>

        {/* Pitch */}
        {pitchSummary && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Pitch Summary
            </h4>
            <p className="text-sm text-gray-600 line-clamp-3">{pitchSummary}</p>
          </div>
        )}

        {/* Stats */}
        {(fundingNeeded || teamSize) && (
          <div className="mt-3 flex justify-between items-center">
            {fundingNeeded && (
              <div className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-green-600" />
                <div>
                  <span className="text-xs text-gray-500">Funding Need </span>
                  <span className="text-sm font-medium text-gray-900">{fundingNeeded}</span>
                </div>
              </div>
            )}
            {teamSize && (
              <div>
                <span className="text-xs text-gray-500">Team </span>
                <span className="text-sm font-medium text-gray-900">{teamSize} people</span>
              </div>
            )}
          </div>
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