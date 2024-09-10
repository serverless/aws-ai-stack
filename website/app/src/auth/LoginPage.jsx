import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ email, password });
      setPassword('');
      setEmail('');
      navigate('/chat');
    } catch (error) {
      setError(error.message);
      return;
    } finally {
      setLoading(false);
    }
  };

  const formValid = email && password.length > 4;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
      className='animate-fadeIn'
    >
      <div className='space-y-6'>
        <div>
          <label htmlFor='email' className='block text-gray-700 font-semibold'>
            Email
          </label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            id='email'
            type='email'
            className='w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
            placeholder='Enter your email address'
            autoComplete='email'
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor='password'
            className='block text-gray-700 font-semibold'
          >
            Password
          </label>
          <input
            id='password'
            type='password'
            autoComplete='current-password'
            className='w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
            placeholder='Enter your password'
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            disabled={loading}
          />
        </div>
        <div>
          <button
            type='submit'
            className={`w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-300 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading || !formValid}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        {error && (
          <div className='text-red-500 text-sm text-center'>{error}</div>
        )}
      </div>
    </form>
  );
};

export default LoginPage;
