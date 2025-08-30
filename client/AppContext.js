import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [currentPage, setCurrentPage] = useState('home');
    
}

