import React from 'react';
import './Loading.css';

interface LoadingProps {
  isLoading: boolean;
  msg?: string;
}

const Loading: React.FC<LoadingProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <img
        src="assets/Atking-loading.png"
        alt="Loading"
        className="loading-img"
      />
    </div>
  );
};

export default Loading;
