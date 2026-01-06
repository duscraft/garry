import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { CreateWarrantyRequest, Warranty } from '../types';
import Navbar from '../components/Navbar';
import WarrantyForm from '../components/WarrantyForm';
import { ArrowLeft } from 'lucide-react';

const EditWarrantyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<CreateWarrantyRequest | undefined>(undefined);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchWarranty = async () => {
      try {
        const data = await api.request<Warranty>(`/warranties/${id}`);
        // Transform Warranty to CreateWarrantyRequest format for form
        setInitialData({
          product_name: data.product_name,
          brand: data.brand,
          category: data.category,
          purchase_date: data.purchase_date,
          warranty_months: data.warranty_months,
          store: data.store,
          notes: data.notes,
          receipt_url: data.receipt_url,
        });
      } catch (err: any) {
        console.error(err);
        setError('Impossible de charger la garantie');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchWarranty();
    }
  }, [id]);

  const handleSubmit = async (data: CreateWarrantyRequest) => {
    setLoading(true);
    setError('');
    
    try {
      await api.request(`/warranties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      navigate(`/warranty/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Impossible de modifier la garantie');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to={`/warranty/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux détails
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier la garantie</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <WarrantyForm 
          initialData={initialData}
          onSubmit={handleSubmit} 
          onCancel={() => navigate(`/warranty/${id}`)} 
          isLoading={loading} 
        />
      </main>
    </div>
  );
};

export default EditWarrantyPage;
