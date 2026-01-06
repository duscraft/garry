import React from 'react';
import { useTranslation } from 'react-i18next';
import { WarrantyStatus } from '../utils/date';

interface StatusBadgeProps {
  status: WarrantyStatus;
  daysRemaining?: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, daysRemaining }) => {
  const { t } = useTranslation();
  
  const getStyles = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'expiring':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'active':
        return t('status.active');
      case 'expiring':
        return t('status.daysRemaining', { days: daysRemaining });
      case 'expired':
        return t('status.expired');
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyles()}`}>
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
