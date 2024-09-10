import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const Layout = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen flex flex-col'>
      {isLoggedIn() && (
        <div className='flex bg-white items-center sticky top-0 left-0 w-full p-4 z-10 shadow-md gap-2'>
          <a href='https://github.com/serverless/aws-ai-stack' target='_blank'>
            <img
              src='https://assets.serverless-extras.com/general/logo-aws-ai-stack-black.png'
              alt='AWS AI Stack'
              className='h-10'
            />
          </a>
          <div className='flex items-center gap-2 text-center ml-auto mr-0 justify-center'>
            <span className='text-xs text-gray-800 mt-1.5'>By</span>
            <a href='https://serverless.com/' target='_blank'>
              <img
                src='https://s3.us-east-2.amazonaws.com/assets.public.serverless/general/framework-text-lighting-icon-center-black.svg'
                alt='Serverless Framework'
                className='h-8'
              />
            </a>
          </div>
          <button
            onClick={handleLogout}
            className='text-gray-400 bg-transparent px-2 py-2 rounded-md hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='lucide lucide-log-out'
            >
              <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
              <polyline points='16 17 21 12 16 7' />
              <line x1='21' x2='9' y1='12' y2='12' />
            </svg>
          </button>
        </div>
      )}

      <Outlet />
    </div>
  );
};

export default Layout;
