import { format, parseISO, differenceInDays, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'd MMMM yyyy', { locale: fr });
};

export const formatInputDate = (dateString: string): string => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'yyyy-MM-dd');
};

export type WarrantyStatus = 'expired' | 'expiring' | 'active';

export const getWarrantyStatus = (endDateString: string): WarrantyStatus => {
  const endDate = parseISO(endDateString);
  const now = new Date();
  
  // If end date is in the past, it's expired
  if (isPast(endDate) && !isToday(endDate)) {
    return 'expired';
  }
  
  const daysLeft = differenceInDays(endDate, now);
  
  if (daysLeft <= 30) {
    return 'expiring';
  }
  
  return 'active';
};

export const getDaysRemaining = (endDateString: string): number => {
  const endDate = parseISO(endDateString);
  const now = new Date();
  return differenceInDays(endDate, now);
};
