import React from 'react';
import { Link } from 'react-router-dom';
import { Warranty } from '../types';
import { formatDate, getWarrantyStatus, getDaysRemaining } from '../utils/date';
import StatusBadge from './StatusBadge';
import { Calendar, Tag, Store } from 'lucide-react';

interface WarrantyCardProps {
  warranty: Warranty;
}

const WarrantyCard: React.FC<WarrantyCardProps> = ({ warranty }) => {
  const status = getWarrantyStatus(warranty.warranty_end_date);
  const daysRemaining = getDaysRemaining(warranty.warranty_end_date);

  return (
    <Link 
      to={`/warranty/${warranty.id}`}
      className="block bg-white dark:bg-slate-800 shadow rounded-lg hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-slate-700 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={warranty.product_name}>
              {warranty.product_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{warranty.brand}</p>
          </div>
          <StatusBadge status={status} daysRemaining={daysRemaining} />
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Store className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="truncate">{warranty.store}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Tag className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="truncate">{warranty.category}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span>Fin: {formatDate(warranty.warranty_end_date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default WarrantyCard;
