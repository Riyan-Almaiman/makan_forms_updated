import iconPaths from './sidebarIcons';
// Define and export the SidebarItemType
export interface SidebarItemType {
    label: string;
    icon: React.ReactNode;
    path: string;
}

// Define and export the Role type

const allSidebarItems: SidebarItemType[] = [
    {
        label: 'Forms',
        icon: iconPaths.supervisorTableIcon,
        path: '/supervisor-table',
    },
  
    {
        label: 'Pending',
        icon: iconPaths.submissionsIcon,
        path: '/pending',
    },
    {
        label: 'Teams',
        icon: iconPaths.teamsIcon,
        path: '/teams',
    },
    {
        label: 'Users',
        icon: iconPaths.addUserIcon,
        path: '/create-user',
    },
    {
        label: 'Settings',
        icon: iconPaths.settingsIcon,
        path: '/settings',
    },

    {
        label: 'Dashboard',
        icon: iconPaths.exportIcon,
        path: '/dashboard',
    },
    {
        label: 'Forms',
        icon: iconPaths.formsIcon,
        path: '/form',
    },
    {
        label: 'Targets',
        icon: iconPaths.calculationsIcon,
        path: '/calculations',
    },
];

export const sidebarItemsByRole: Record<string, string[]> = {
    superadmin: [
        '/dashboard',     
           '/create-user',

        '/supervisor-table',
        '/pending',      
          '/teams',
          '/assignsheets',
        '/form',
        '/calculations',
        '/settings',
     
    ],
    CEO: [
        '/dashboard',

        '/settings'

    ],
    admin: [
        '/dashboard',
        '/calculations',
        '/teams',

                '/create-user',
                

        '/settings',       

    ],
    supervisor: [  
        '/supervisor-table', 
        '/calculations',     
        '/dashboard',
'/create-user',

        '/teams',

       '/settings', 

    ],
    editor: [
        '/form',
        '/pending',
        '/assignsheets',

        '/settings',
    ],
    
};

export const getSidebarItemsForRole = (role: string): SidebarItemType[] => {
    const itemsForRole = sidebarItemsByRole[role] || [];
    return itemsForRole.map(itemPath => 
        allSidebarItems.find(item => item.path === itemPath)
    ).filter((item): item is SidebarItemType => item !== undefined);
};
