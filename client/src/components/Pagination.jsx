import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="flex justify-center items-center mb-4 space-x-2" style={{ fontFamily: 'DM Sans' }}>
      {/* Left 화살표 */}
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 flex items-center justify-center text-[#8A8A8A] hover:text-[#89D67D]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* 페이지 번호들 */}
      {getVisiblePages().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 flex items-center justify-center text-base font-normal ${
            page === currentPage
              ? 'text-[#89D67D]'
              : 'text-[#8A8A8A] hover:text-[#89D67D]'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Right 화살표 */}
      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 flex items-center justify-center text-[#8A8A8A] hover:text-[#89D67D]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
