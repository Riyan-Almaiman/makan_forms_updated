/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { User, Calculation } from "./types";
import SideBar from "./Sidebar/SideBar";
import { userService } from "./services/userService";
import { calculationService } from "./services/calculationService";
import AppRoutes from "./AppRoutes";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const initialNavigationOccurred = useRef(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Adjust this value as needed
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    console.log("Current location:", location.pathname);
  }, [location]);

  useEffect(() => {
    console.log("User state changed:", user);
  }, [user]);

  useEffect(() => {
    console.log("Initial path:", window.location.pathname);
    fetchData();
    checkUser();
  }, []);
  const handleInitiateLogin = async (credentials: { username: string; password: string }) => {
    try {
      const result = await userService.initiateLogin(credentials.username, credentials.password);
      if (!result.requiresOTP) {
        // Login successful without OTP
        const user = await userService.getCurrentUser();
        setUser(user);
        navigate(getDefaultPath(user.role as string));
      }
      return result;
    } catch (error : any) {
      console.error("Error during login initiation:", error);
      throw new Error(error);
    }
  };
  
  const handleVerifyOTP = async (username: string, otp: string) => {
    try {
      await userService.verifyOTP(username, otp);
      const user = await userService.getCurrentUser();
      setUser(user);
      navigate(getDefaultPath(user.role as string));
    } catch (error) {
      console.error("Error during OTP verification:", error);
      throw new Error("OTP verification failed");
    }
  };
  useEffect(() => {
    if (!loading && user && !initialNavigationOccurred.current) {
      console.log("Checking navigation, current path:", location.pathname);
      if (location.pathname === "/login" || location.pathname === "/") {
        console.log("User set, current path is login or root. Navigating to default path.");
        navigate(getDefaultPath(user.role as string));
      } else {
        console.log("User set, staying on current path:", location.pathname);
      }
      initialNavigationOccurred.current = true;
    }
  }, [loading, user, location, navigate]);

  
  const checkUser = async () => {
    console.log("Checking user...");
    const token = Cookies.get("token");
    if (token) {
      console.log("Token found");
      try {
        console.log("Validating token...");
        const validUser = await userService.getCurrentUser();
        console.log("Token validated:", validUser);
        setUser(validUser);
      } catch (error) {
        console.error("Error validating token:", error);
        Cookies.remove("token");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };


  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    Cookies.set("user", JSON.stringify(updatedUser), { expires: 1 });
  };

  const fetchData = async () => {
    try {
      const calculationsData = await calculationService.getAllCalculations();
      console.log("Fetched calculations:", calculationsData);
      setCalculations(calculationsData);
    } catch (error) {
      console.error("Error fetching calculations:", error);
    }
  };

  
  const handleLogout = () => {
    Cookies.remove("token");
    setUser(null);
    setIsSidebarOpen(false);
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getDefaultPath = (role: string) => {
    switch (role) {
      case "superadmin":
      case "CEO":
      case "admin":
        return "/dashboard";
      case "supervisor":
        return "/supervisor-table";
      case "editor":
        return "/form";
      default:
        return "/login";
    }
  };

  const ProtectedRoute = ({
    children,
    allowedRoles,
  }: {
    children: React.ReactNode;
    allowedRoles?: string[];
  }) => {
    useEffect(() => {
      console.log("ProtectedRoute effect, user:", user?.role, "allowedRoles:", allowedRoles);
      if (!loading && user && allowedRoles && !allowedRoles.includes(user.role as string)) {
        console.log(`User role ${user.role} not allowed. Redirecting to default path.`);
        navigate(getDefaultPath(user.role as string));
      }
    }, [allowedRoles]);

    if (loading) {
      return <div>Loading...</div>;
    }
    if (!user) {
      console.log("No user, navigating to login");
      return <Navigate to="/login" />;
    }
    console.log("Rendering protected route for role:", user.role);
    return <>{children}</>;
  };

  if (isSmallScreen) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sorry, this app is not currently designed for small screens.</h1>
          <p className="text-lg">Please use a device with a larger screen for the best experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {user && (
        <>
          <button
            className="fixed z-30 flex items-center justify-center p-2 bg-[#196A58] rounded-full top-2 left-2 md:hidden"
            onClick={toggleSidebar}
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20M4 12H20M4 18H20"
                className="stroke-gray-100"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <SideBar
            user={user}
            onLogout={handleLogout}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </>
      )}
      <div
        className={`flex-1 p-6 overflow-auto ${
          user ? "md:ml-36" : "w-full flex items-center justify-center"
        }`}
      >
        <AppRoutes
          user={user}
          calculations={calculations}
          handleInitiateLogin={handleInitiateLogin}
          handleVerifyOTP={handleVerifyOTP}
          handleUserUpdate={handleUserUpdate}
          getDefaultPath={getDefaultPath}
          ProtectedRoute={ProtectedRoute}
        />
      </div>
    </div>
  );
}

export default App;