import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { CreateWarrantyRequest } from '../types';
import Navbar from '../components/Navbar';
import WarrantyForm from '../components/WarrantyForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AddWarrantyPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: CreateWarrantyRequest) => {
    setLoading(true);
    setError('');
    
    try {
      await api.request('/warranties', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Impossible de créer la garantie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajouter une garantie</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <WarrantyForm 
          onSubmit={handleSubmit} 
          onCancel={() => navigate('/')} 
          isLoading={loading} 
        />
      </main>
    </div>
  );
};

export default AddWarrantyPage;
