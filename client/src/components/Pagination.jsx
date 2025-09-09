import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  return (
    <div className="flex justify-center items-center mt-6 space-x-1">
      {/* First 버튼 */}
      <button
        onClick={() => onPageChange(1)}
        className={`w-8 px-1 py-1 rounded text-sm 
          ${ 
            currentPage === 1
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-400 hover:text-gray-800"}`}
      >
        <ChevronFirst />
      </button>
      
      {/* Left 버튼 */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage - 1))}
        className={`w-8 px-1 py-1 rounded text-sm 
          ${ 
            currentPage === 1
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-400 hover:text-gray-800"}`}
      >
        <ChevronLeft />
      </button>

      {/* 페이지 번호들 */}
      {getVisiblePages().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
            page === currentPage
              ? 'bg-green-500 text-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Right 버튼 */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className={`w-8 px-1 py-1 rounded text-sm 
          ${ 
            currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-gray-800' 
          }`}
      >
        <ChevronRight />
      </button>

      {/* Last 버튼 */}
      <button
        onClick={() => onPageChange(totalPages)}
        className={`w-8 px-1 py-1 rounded text-sm 
          ${ 
            currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-gray-800' 
          }`}
      >
        <ChevronLast />
      </button>
    </div>
  );
};
