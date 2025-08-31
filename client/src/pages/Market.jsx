import { useApp } from '../AppContext.js'
import StockList from './StockList';
import StockDetail from './StockDetail';


export default function Market() {
    const { searchQuery, selectedStock, navigateToStockDetail, goBack } = useApp();

    return (
        <div>
            {selectedStock ? (
                    <StockDetail 
                        stock={selectedStock} 
                        onBack={goBack} 
                    />
                ) : (
                    <StockList 
                        onSelectStock={navigateToStockDetail}
                        initialSearchTerm={searchQuery} 
                    />
                )}
        </div>
    );
};
