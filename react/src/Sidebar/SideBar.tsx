import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Role} from "../types";
import { getSidebarItemsForRole, SidebarItemType, sidebarItemsByRole} from "./sidebarConfig";
import SidebarItem from "./SidebarItem";
import iconPaths from "./sidebarIcons";

interface Props {
  user: User | null;
  onLogout: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const SideBar = (props: Props) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarItems: SidebarItemType[] = props.user?.role 
    ? getSidebarItemsForRole(props.user.role as Role) 
    : [];

  useEffect(() => {
    if (props.user) {

      const currentPath = location.pathname;
      const allowedPaths = sidebarItemsByRole[props.user.role as Role];
      
      // Check if the current path starts with any of the allowed paths
      const matchingPath = allowedPaths.find(path => currentPath.startsWith(path));
      
      if (!matchingPath) {
        const firstItem = sidebarItems[0];
        if (firstItem) {
          setActiveItem(firstItem.path);
          navigate(firstItem.path);
        }
      } else {
        setActiveItem(matchingPath);
      }
    }else{
      console.log('no user found')
      navigate("/login");
    }
  }, [props.user, navigate, sidebarItems, location]);

    return (
        <aside
            style={{ backgroundImage: `url(/makanBackgroundDark.png)` }}
            className={`fixed z-30 inset-y-0 left-0 transform ${props.isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 transition-transform duration-300 ease-in-out w-36 h-screen px-3 py-4 overflow-y-auto bg-base-100 border-r rtl:border-r-0 rtl:border-l dark:bg-gray-900 dark:border-gray-700 flex flex-col justify-between`}
        >
            <div>
                <div className="flex justify-center mb-4">
                    <img className="h-8" src="/makanLogo.png" alt="" />
                </div>
                <nav className="space-y-2">
                    {sidebarItems.map((item: SidebarItemType) => (
                        <SidebarItem
                            key={item.path}
                            item={item}
                            isActive={activeItem === item.path}
                            onItemClick={(path) => {
                                setActiveItem(path);
                                navigate(path);
                                props.toggleSidebar();
                            }}
                            toggleSidebar={props.toggleSidebar}
                        />
                    ))}
                </nav>
            </div>

            <div className="flex flex-col">
                <hr className="my-4 border-gray-200 dark:border-gray-600" />
                <div className="flex items-center space-x-2 px-2 mb-2">
                    <div className="w-6 h-6 text-gray-100">{iconPaths.userIcon}</div>
                    <span className="text-gray-100 text-xs truncate">
                        {props.user?.name ?? ""}
                    </span>
                </div>
                <h1 className="text-xs text-green-300 px-2 mb-2">
                    {props.user?.role === "CEO" ? "Dashboard" : props.user?.role?.toUpperCase() ?? ""}
                </h1>
                <button
                    onClick={props.onLogout}
                    className="mt-2 bg-[#196A58] hover:bg-green-700 py-2 text-gray-100 text-sm font-semibold transition-colors duration-300 transform rounded-md flex items-center justify-center space-x-2"
                >
                    <div className="w-4 h-4">{iconPaths.logoutIcon}</div>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default SideBar;

