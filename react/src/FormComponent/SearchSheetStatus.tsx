import React, { useState } from 'react';
import axios from 'axios';
import { SheetLayerStatus, ProductionRole } from '../types';
import { URL, getAuthHeader } from '../../config';

interface Props {
    layerId: number | undefined;
    productId: number | undefined;
    onSearchResults: (results: SheetLayerStatus[]) => void;
    role: ProductionRole;
}

export const SearchSheetStatus: React.FC<Props> = ({ layerId, onSearchResults, productId, role }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = async () => {
        try {
            const response = await axios.get<SheetLayerStatus[]>(`${URL}/api/sheetlayerstatus/search`, {
                params: {
                    searchTerm,
                    layerId: layerId?.toString(),
                    productId: productId,
                    role: role,
                    limit: '5'
                },
                headers: getAuthHeader()
            });
            onSearchResults(response.data);
        } catch (error) {
            console.error('Error searching sheet statuses:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
            }
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const isQCRole = [ProductionRole.DailyQC].includes(role);

    return (
        <div className="flex flex-col sm:flex-row w-full gap-2">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isQCRole ? "Search completed sheets..." : "Search sheets..."}
                className="flex-grow p-2 border rounded text-sm"
            />
            <button
                onClick={handleSearch}
                className="bg-[#196A58] text-white p-2 rounded hover:bg-[#124c3f] transition-colors duration-200 text-sm whitespace-nowrap"
            >
                Search
            </button>
        </div>
    );
};