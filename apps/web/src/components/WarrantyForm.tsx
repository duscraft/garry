import React, { useState, useEffect } from 'react';
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
    'Électroménager',
    'High-Tech',
    'Audio & Vidéo',
    'Maison',
    'Bricolage',
    'Mode',
    'Sport',
    'Autre'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Informations du produit</h3>
          <p className="mt-1 text-sm text-gray-500">
            Détails essentiels pour identifier votre garantie.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-4">
              <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
                Nom du produit
              </label>
              <input
                type="text"
                name="product_name"
                id="product_name"
                required
                value={formData.product_name}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                Marque
              </label>
              <input
                type="text"
                name="brand"
                id="brand"
                required
                value={formData.brand}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200" />
        </div>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Détails de la garantie</h3>
          <p className="mt-1 text-sm text-gray-500">
            Dates et informations d'achat.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="store" className="block text-sm font-medium text-gray-700">
                Magasin / Site web
              </label>
              <input
                type="text"
                name="store"
                id="store"
                required
                value={formData.store}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                Date d'achat
              </label>
              <input
                type="date"
                name="purchase_date"
                id="purchase_date"
                required
                value={formData.purchase_date}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="warranty_months" className="block text-sm font-medium text-gray-700">
                Durée de garantie (mois)
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
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 border p-2"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">24 mois = 2 ans (garantie légale standard)</p>
            </div>
            
            <div className="col-span-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (optionnel)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes || ''}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                placeholder="Numéro de série, conditions particulières, etc."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>Enregistrement...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default WarrantyForm;
