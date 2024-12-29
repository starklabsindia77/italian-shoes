const Modal = ({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) => {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-1/3">
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    );
  };
  
  export default Modal;
  