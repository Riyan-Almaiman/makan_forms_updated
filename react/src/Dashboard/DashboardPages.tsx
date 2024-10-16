import React, { useState } from 'react';
import DailyPage from './DailyPage/DailyPage';
import WeeklyStatsComponent from './WeeklyPage/WeeklyStatsComponent';
import EditorPerformanceComponent from './EditorPerformanceComponent';
import ProjectTargets from './ProjectTargets';

type CategoryName = 'Daily Productivity' | 'Weekly Targets' | 'Project Targets' | 'Editor Performance';

type Categories = {
  [K in CategoryName]: {
    component: React.ReactNode;
    disabled: boolean;
  };
};

const DashboardPages = () => {
  const [activeTab, setActiveTab] = useState<CategoryName>('Daily Productivity');

  const categories: Categories = {
    'Daily Productivity': {
      component: <DailyPage />,
      disabled: false
    },
    'Weekly Targets': {
      component: (
        <div >
          <WeeklyStatsComponent/>
        </div>
      ),
      disabled: false
    },
    'Project Targets': {
      component: <ProjectTargets/>,
      disabled: false
    },
    'Editor Performance': {
      component: <EditorPerformanceComponent />,
      disabled: true
    },
  };

  const handleTabClick = (category: CategoryName) => {
    if (!categories[category].disabled) {
      setActiveTab(category);
    }
  };

  return (
    <div className="container mx-auto flex flex-col h-full">
      <div className="tabs tabs-boxed bg-[#196A58]/20">
        {(Object.keys(categories) as CategoryName[]).map((category) => (
          <a
            key={category}
            className={`tab ${
              activeTab === category
                ? 'bg-[#196A58] text-white'
                : categories[category].disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-[#196A58]'
            }`}
            onClick={() => handleTabClick(category)}
          >
            {category}
          </a>
        ))}
      </div>
      <div className="flex-grow mt-1 overflow-auto">
        <div className="rounded-xl h-full">
          {categories[activeTab].component}
        </div>
      </div>
    </div>
  );
};

export default DashboardPages;