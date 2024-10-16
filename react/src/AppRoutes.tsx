import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User, Calculation, Role } from './types';
import Login from './Login';
import DashboardPages from './Dashboard/DashboardPages';
import EditorTable from './EditorTable';
import FormComponent from './FormComponent/FormComponent';
import CreateUser from './CreateUser';
import TargetManagement from './Targets/TargetManagement';
import SupervisorTable from './SupervisorTable/SupervisorTable';
import Settings from './Settings';
import TeamManagementComponent from './TeamMembers/TeamManagementComponent';
interface AppRoutesProps {
  user: User | null;
  calculations: Calculation[];
  handleInitiateLogin: (credentials: { username: string; password: string }) => Promise<{ requiresOTP: boolean }>;
  handleVerifyOTP: (username: string, otp: string) => Promise<void>;
  handleUserUpdate: (updatedUser: User) => void;
  getDefaultPath: (role: string) => string;
  ProtectedRoute: React.ComponentType<{ children: React.ReactNode; allowedRoles?: string[] }>;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  user,
  calculations,
  handleInitiateLogin,
  handleVerifyOTP,
  handleUserUpdate,
  getDefaultPath,
  ProtectedRoute,
}) => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={getDefaultPath(user.role as string)} />
          ) : (
            <Login onInitiateLogin={handleInitiateLogin} onVerifyOTP={handleVerifyOTP} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "admin", "supervisor", "CEO"]}>
            <DashboardPages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "editor"]}>
            <EditorTable user={user!} calculations={calculations} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form/:date"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "editor"]}>
            <FormComponent user={user!}  />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "editor"]}>
            <FormComponent user={user!}  />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-user"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "admin", 'supervisor']}>
            <CreateUser role={user?.role as Role}/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculations"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "admin", "supervisor"]}>
            <TargetManagement user={user!} calculations={calculations} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor-table"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "admin", "supervisor"]}>
            <SupervisorTable calculations={calculations} user={user!} />
          </ProtectedRoute>
        }
      />           

      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "admin", "editor", "supervisor", "CEO"]}>
             <Settings user={user!} onUserUpdate={handleUserUpdate} /> 
             </ProtectedRoute>

        }
      />   
          {/* <Route
        path="/assignsheets"
        element={
          <ProtectedRoute allowedRoles={["editor"]}>
           <SheetAssignmentComponent currentUser={user!} />
          </ProtectedRoute>
        }
      />  */}
       <Route
      path="/teams"
      element={
        <ProtectedRoute allowedRoles={["superadmin", "admin", "supervisor"]}>
 <TeamManagementComponent />        </ProtectedRoute>
      }
    />
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={getDefaultPath(user.role as string)} />
          ) : (
            <Login onInitiateLogin={handleInitiateLogin} onVerifyOTP={handleVerifyOTP} />
          )
        }
      />
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;