import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useAuth();

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register({ email, password });
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

  const formValid =
    email && password.length > 4 && password === passwordConfirmation;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleRegister();
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
            autoComplete='new-password'
            className='w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
            placeholder='Enter your password'
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor='password-confirmation'
            className='block text-gray-700 font-semibold'
          >
            Confirm Password
          </label>
          <input
            id='password-confirmation'
            type='password'
            autoComplete='new-password'
            className='w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
            placeholder='Confirm your password'
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            value={passwordConfirmation}
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
        {error && (
          <div className='text-red-500 text-sm text-center'>{error}</div>
        )}
      </div>
    </form>
  );
};

export default RegistrationPage;
