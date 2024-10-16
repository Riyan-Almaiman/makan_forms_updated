import React, { useState, useEffect } from 'react';
import { User } from './types';
import { userService } from './services/userService';

interface SettingsProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOTPRequired, setIsOTPRequired] = useState(false);

  useEffect(() => {
    const fetchOTPStatus = async () => {
      try {
        const status = await userService.isOTPEnabled();
        console.log('OTP status:', status);
        setIsOTPRequired(status);
      } catch (error) {
        console.error('Failed to fetch OTP status:', error);
      }
    };
    fetchOTPStatus();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      await userService.changePassword(newPassword);
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update password. Please try again.');
    }
  };

  const handleOTPToggle = async () => {
    try {
      console.log('Toggling OTP requirement');
      await userService.toggleOTP();
      setIsOTPRequired(!isOTPRequired);
      setSuccess(isOTPRequired ? 'OTP requirement disabled' : 'OTP requirement enabled');
    } catch (error) {
      setError('Failed to toggle OTP requirement. Please try again.');
    }
  };

  const isAdminOrSuperAdmin = user.role === 'admin' || user.role === 'superadmin';

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-[#196A58] mb-8 text-center">User Settings</h2>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-[#196A58]">User Information</h3>
          <div className="space-y-2">
            {[
              { label: 'Name', value: user.name },
              { label: 'Taqnia ID', value: user.taqniaID },
              { label: 'Username', value: user.username },
              { label: 'Role', value: user.role },
              { label: 'Employee Type', value: user.employeeType }
            ].map(({ label, value }) => (
              <p key={label} className="flex justify-between border-b border-gray-200 py-2">
                <span className="font-medium text-gray-600">{label}:</span>
                <span className="text-gray-800">{value}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-[#196A58]">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#196A58]"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#196A58]"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <button
              type="submit"
              className="w-full bg-[#196A58] text-white font-bold py-2 px-4 rounded-md hover:bg-[#124E3F] transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#196A58]"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>

      {isAdminOrSuperAdmin && (
        <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-[#196A58]">OTP Settings</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Require OTP for login</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={isOTPRequired}
                onChange={handleOTPToggle}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;