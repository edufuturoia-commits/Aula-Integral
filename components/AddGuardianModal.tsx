import React, { useState } from 'react';

interface AddGuardianModalProps {
  onClose: () => void;
  onSave: (guardian: { id: string; name: string; email: string; phone: string }) => void;
}

const AddGuardianModal: React.FC<AddGuardianModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) {
      alert("La Cédula y el Nombre son obligatorios.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Añadir Nuevo Acudiente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cédula (ID)</label>
                    <input type="text" name="id" value={formData.id} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nombres y Apellidos</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Móvil</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
            </div>
            <div className="flex justify-end space-x-4 pt-6 mt-4 border-t">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Guardar Acudiente</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddGuardianModal;
