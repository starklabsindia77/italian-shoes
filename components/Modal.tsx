import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  width?: string; // Optional width prop to make it dynamic
  scrollable?: boolean; // Optional scrollable prop to enable vertical scrolling
}

const Modal = ({ children, onClose, title, width = 'w-1/3', scrollable = false }: ModalProps) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className={`rounded-lg shadow-lg ${width} !bg-white dark:!bg-navy-900`}>
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h2 className="text-lg font-bold dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        <div className={`p-4 ${scrollable ? 'overflow-y-auto max-h-screen' : ''}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;

  