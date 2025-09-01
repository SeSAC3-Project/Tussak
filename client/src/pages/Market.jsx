import { useApp } from '../AppContext'
import StockList from './StockList';


export default function Market() {
    const {  navigateToStockDetail } = useApp();

    return (
        <div>
            <StockList 
                onSelectStock={navigateToStockDetail} 
            />
        </div>
    );
};
