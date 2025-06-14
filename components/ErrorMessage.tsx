
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-red-700 bg-opacity-80 border border-red-500 text-red-100 px-4 py-3 rounded-lg relative my-4 shadow-md" role="alert">
      <strong className="font-bold">Lỗi! </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default ErrorMessage;
