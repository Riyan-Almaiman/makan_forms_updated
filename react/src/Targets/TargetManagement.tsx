import React, { useState } from 'react';
import Calculations from './Calculations';
import EntitiesManager from './EntitiesManager';
import { Calculation, User } from '../types';
import Links from './Links';
import WeeklyTargets from './WeeklyTargets';

interface TargetManagementProps {
    user: User;
    calculations: Calculation[];
}

type ViewType = 'calculations' | 'dailyTargets' | 'weeklyTargets' | 'layers' | 'links';

const TargetManagement: React.FC<TargetManagementProps> = ({ user, calculations }) => {
    const [selectedView, setSelectedView] = useState<ViewType>('weeklyTargets');

    const renderView = () => {
        switch (selectedView) {
            case 'calculations':
                return <Calculations user={user} calculations={calculations} />;
            case 'links':
                return <Links />;
            case 'weeklyTargets':
                return <WeeklyTargets />;
            case 'layers':
                return <EntitiesManager />;
            default:
                return null;
        }
    };

    const getTabStyle = (view: ViewType) => {
        const baseStyle = "px-3 py-2 font-medium text-sm rounded-md transition-colors duration-200";
        const activeStyle = "bg-[#196A58] text-white";
        const inactiveStyle = "text-[#196A58] hover:bg-[#e6f0ee]";
        const disabledStyle = "text-gray-400 cursor-not-allowed";

        if (view === 'calculations' || view === 'links' || (user.role === 'supervisor' && view === 'layers')) {
            return `${baseStyle} ${disabledStyle}`;
        }
        return `${baseStyle} ${selectedView === view ? activeStyle : inactiveStyle}`;
    };

    const handleTabClick = (view: ViewType) => {
        if (view !== 'calculations' && view !== 'links' && (user.role !== 'supervisor' || view !== 'layers')) {
            setSelectedView(view);
        }
    };

    return (
        <div className="container mx-auto p-4">
                        <div className="mb-6">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => handleTabClick('weeklyTargets')}
                        className={getTabStyle('weeklyTargets')}
                    >
                        Weekly Targets
                    </button>
                    <button
                        onClick={() => handleTabClick('calculations')}
                        className={getTabStyle('calculations')}
                        disabled
                    >
                        Hourly Targets
                    </button>
                    <button
                        onClick={() => handleTabClick('layers')}
                        className={getTabStyle('layers')}
                        disabled={user.role === 'supervisor'}
                    >
                        Layers
                    </button>
                    <button
                        onClick={() => handleTabClick('links')}
                        className={getTabStyle('links')}
                        disabled
                    >
                        Links
                    </button>
                </nav>
            </div>
            {renderView()}
        </div>
    );
};

export default TargetManagement;