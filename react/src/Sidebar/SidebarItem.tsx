import { SidebarItemType } from "./sidebarConfig";

interface SidebarItemProps {
    item: SidebarItemType;
    isActive: boolean;
    onItemClick: (component: string) => void;
    toggleSidebar: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
    item,
    isActive,
    onItemClick,
    toggleSidebar,
}) => {
    const { label, icon, path } = item;
    return (
        <div
            onClick={() => {
                onItemClick(path);
                toggleSidebar();
            }}
            className={`flex items-center px-3 py-2 text-sm font-medium text-gray-100 ${isActive ? 'bg-[#196A58]/80' : 'hover:bg-[#196A58]/60'
                } rounded-md dark:text-green-200 cursor-pointer transition-colors duration-150`}
        >
            <div className="w-5 h-5 mr-2">{icon}</div>
            <span className="truncate">{label}</span>
        </div>
    );
};

export default SidebarItem;