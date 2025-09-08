
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
        disabled={currentPage === 1}
        className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:hover:text-gray-400"
      >
        ««
      </button>
      
      {/* Previous 버튼 */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:hover:text-gray-400"
      >
        ‹
      </button>

      {/* 페이지 번호들 */}
      {getVisiblePages().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded text-sm ${
            page === currentPage
              ? 'bg-green-500 text-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next 버튼 */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:hover:text-gray-400"
      >
        ›
      </button>

      {/* Last 버튼 */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:hover:text-gray-400"
      >
        »»
      </button>
    </div>
  );
};
