import React, { useState } from 'react';


interface LoginProps {
  onInitiateLogin: (credentials: { username: string; password: string }) => Promise<{ requiresOTP: boolean }>;
  onVerifyOTP: (username: string, otp: string) => Promise<void>;
}

function Login({ onInitiateLogin, onVerifyOTP }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOTP] = useState('');
  const [error, setError] = useState('');
  const [isOTPRequired, setIsOTPRequired] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state


  const handleInitiateLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const credentials = { username, password };
    setLoading(true);
    try {
      setError('');
      const result = await onInitiateLogin(credentials);
      if (result.requiresOTP) {
        setIsOTPRequired(true);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Extract error message from the response, or use a default message
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      setError('');
      await onVerifyOTP(username, otp);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      // Extract error message from the response, or use a default message
      const errorMessage = err.response?.data?.message || err.message || 'OTP verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundImage: `url(makanBackgroundDark.png)` }}
      className="w-full max-w-md bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10"
    >
      <div className="w-full">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-100">Sign in</h1>
          <p className="mt-2 text-gray-200">
            {isOTPRequired ? 'Enter the OTP sent to your email' : 'Sign in below to access your account'}
          </p>
        </div>
        {error && (
          <div className="mt-4 text-red-600">
            {error}
          </div>
        )}
        <div className="mt-5">
          {!isOTPRequired ? (
            <form onSubmit={handleInitiateLogin}>
              <div className="mt-6">
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-2 rounded border-b-2 border-gray-300 py-1 focus:border-gray-500 focus:outline-none"
                  autoComplete="off"
                />
              </div>
              <div className="mt-6">
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-2 border-b-2 rounded border-gray-300 py-1 focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div className="my-6">
                <button
                  type="submit"
                  className={`w-full rounded-md bg-[#196A58] px-3 py-4 text-white focus:bg-gray-600 focus:outline-none ${loading ? 'btn btn-disabled' : ''}`}
                  disabled={loading} // Disable button while loading
                >
                  {loading ? (
                    <span className="loading loading-spinner bg-green-100"></span> // Spinner
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="mt-6">
                <input
                  type="text"
                  name="otp"
                  id="otp"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value)}
                  className="w-full pl-2 rounded border-b-2 border-gray-300 py-1 focus:border-gray-500 focus:outline-none"
                  autoComplete="off"
                />
              </div>
              <div className="my-6">
                <button
                  type="submit"
                  className={`w-full rounded-md bg-[#196A58] px-3 py-4 text-white focus:bg-gray-600 focus:outline-none ${loading ? 'btn btn-disabled' : ''}`}
                  disabled={loading} // Disable button while loading
                >
                  {loading ? (
                    <span className="loading loading-spinner"></span> // Spinner
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
