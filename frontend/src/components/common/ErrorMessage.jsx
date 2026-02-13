// src/components/common/ErrorMessage.jsx
import { AlertCircle } from 'lucide-react';

export const ErrorMessage = ({ message }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-red-800">{message}</p>
    </div>
  </div>
);