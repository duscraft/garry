import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateWarrantyRequest } from '../types';
import { formatInputDate } from '../utils/date';
import { Save, X } from 'lucide-react';

interface WarrantyFormProps {
  initialData?: CreateWarrantyRequest;
  onSubmit: (data: CreateWarrantyRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const WarrantyForm: React.FC<WarrantyFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateWarrantyRequest>({
    product_name: '',
    brand: '',
    category: '',
    purchase_date: formatInputDate(new Date().toISOString()),
    warranty_months: 24, // Default to 2 years
    store: '',
    notes: '',
    receipt_url: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        purchase_date: formatInputDate(initialData.purchase_date),
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'warranty_months' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categories = [
    { key: 'appliances', label: t('categories.appliances') },
    { key: 'highTech', label: t('categories.highTech') },
    { key: 'audioVideo', label: t('categories.audioVideo') },
    { key: 'home', label: t('categories.home') },
    { key: 'diy', label: t('categories.diy') },
    { key: 'fashion', label: t('categories.fashion') },
    { key: 'sports', label: t('categories.sports') },
    { key: 'other', label: t('categories.other') }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 transition-colors duration-200">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('form.productInfo')}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('form.productInfoDesc')}
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-4">
              <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.productName')}
              </label>
              <input
                type="text"
                name="product_name"
                id="product_name"
                required
                value={formData.product_name}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.brand')}
              </label>
              <input
                type="text"
                name="brand"
                id="brand"
                required
                value={formData.brand}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.category')}
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              >
                <option value="" className="dark:bg-slate-700">{t('form.selectCategory')}</option>
                {categories.map(cat => (
                  <option key={cat.key} value={cat.label} className="dark:bg-slate-700">{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200 dark:border-slate-700" />
        </div>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('form.warrantyDetails')}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('form.warrantyDetailsDesc')}
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="store" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.store')}
              </label>
              <input
                type="text"
                name="store"
                id="store"
                required
                value={formData.store}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.purchaseDate')}
              </label>
              <input
                type="date"
                name="purchase_date"
                id="purchase_date"
                required
                value={formData.purchase_date}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="warranty_months" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.warrantyMonths')}
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="warranty_months"
                  id="warranty_months"
                  min="0"
                  required
                  value={formData.warranty_months}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 dark:border-slate-600 border p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('form.warrantyMonthsHint')}</p>
            </div>
            
            <div className="col-span-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes || ''}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
                placeholder={t('form.notesPlaceholder')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center transition-colors duration-200"
        >
          <X className="w-4 h-4 mr-2" />
          {t('form.cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center transition-colors duration-200 ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>{t('form.saving')}</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('form.save')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default WarrantyForm;
