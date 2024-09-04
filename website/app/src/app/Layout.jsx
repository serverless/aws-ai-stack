import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const Layout = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <div className="flex flex-row justify-between fixed top-0 left-0 w-full p-2 bg-white shadow-md">
        <img
          src="https://assets.serverless-extras.com/general/logo-aws-ai-stack-black.png"
          alt="AWS AI Stack"
          className="h-10 p-0 m-0"
        />
        <div className="m-2">
          {isLoggedIn() && (
            <div className="cursor-pointer" onClick={handleLogout}>
              Logout
            </div>
          )}
        </div>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
