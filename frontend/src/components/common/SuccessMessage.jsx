// src/components/common/SuccessMessage.jsx
import { CheckCircle } from 'lucide-react';

export const SuccessMessage = ({ message }) => (
  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-green-800">{message}</p>
    </div>
  </div>
);