import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AnnouncementBar: React.FC = () => {
  return (
    <div className='bg-[#1c1c1c]'>
      <div className=" text-white py-2 relative max-w-7xl mx-auto container">
        <div className="flex items-center justify-center">
          <button className="absolute left-2">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-sm font-medium text-center">
            {`NEW YEAR SALE SO GOOD, IT'S LIKE A HOLIDAY MIRACLE`}
          </p>
          <button className="absolute right-2">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

  );
};

export default AnnouncementBar;