import { Outlet, Link, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';

const AuthLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className='min-h-screen flex flex-col justify-center items-center space-y-6'>
      <Logo />
      <div className='w-full max-w-md px-8 py-10 bg-white rounded-lg border flex flex-col space-y-6 items-center animate-fadeIn'>
        <div className='w-full max-w-sm mx-auto'>
          <Outlet />
        </div>
        <div className='text-center'>
          {isLoginPage ? (
            <div>
              <span className='text-gray-500'>Don&apos;t have an account?</span>{' '}
              <Link to='/register' className=' font-bold'>
                Register here.
              </Link>
            </div>
          ) : (
            <div>
              <span className='text-gray-500'>Already have an account?</span>{' '}
              <Link to='/login' className=' font-bold'>
                Login here.
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className='animate-fadeIn flex flex-col items-center gap-2 text-center '>
        <span className='text-xs text-gray-800'>Powered By</span>
        <a href='https://serverless.com/' target='_blank'>
          <img
            src='https://s3.us-east-2.amazonaws.com/assets.public.serverless/general/framework-text-lighting-icon-center-black.svg'
            alt='Serverless Framework'
            className='h-8 p-0 m-0'
          />
        </a>
      </div>
    </div>
  );
};

export default AuthLayout;
