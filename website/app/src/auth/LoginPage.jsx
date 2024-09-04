import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ email, password });
      setPassword("");
      setEmail("");
      navigate("/chat");
    } catch (error) {
      setError(error.message);
      return;
    } finally {
      setLoading(false);
    }
  };

  const formValid = email && password.length > 4;

  return (
    <div className="flex flex-col space-y-4 items-center justify-center">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700">Email</label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                id="email"
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                disabled={loading}
              />
            </div>
            <div>
              <button
                onClick={handleLogin}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
                disabled={loading || !formValid}
              >
                Login
              </button>
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
          </div>
        </form>
      </div>
      <div>
        <span className="text-gray-500">Need an account?</span>{" "}
        <Link to="/register" className="text-black font-bold">
          Sign up here.
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
