import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 36, className = "" }) => {
  // Adjust font size based on the container size prop
  const fontSize = size * 0.5;

  return (
    <div 
        className={`flex items-baseline font-bold ${className}`}
        style={{ fontSize: `${fontSize}px` }}
    >
        <span className="text-c-text-primary dark:text-white tracking-tighter">Agende</span>
        <span className="text-primary tracking-tighter">Certo</span>
    </div>
  );
};