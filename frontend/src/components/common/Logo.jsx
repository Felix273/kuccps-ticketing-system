import React, { useState } from 'react';

export const Logo = ({ size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
    xl: 'h-32'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const paddingClasses = {
    sm: 'px-2 py-1',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
    xl: 'px-8 py-4'
  };

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
        <div className={`bg-gradient-to-r from-[#911414] to-[#d20001] text-white font-bold rounded-lg ${paddingClasses[size]} shadow-lg`}>
          <span className={textSizes[size]}>KUCCPS</span>
        </div>
      </div>
    );
  }

  // Fixed: Use /kuccps-logo.png instead of /public/kuccps-logo.png
  return (
    <img 
      src="/kuccps-logo.png" 
      alt="KUCCPS Logo" 
      className={`${sizeClasses[size]} w-auto ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

export default Logo;
