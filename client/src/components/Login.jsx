import { useState } from "react";
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom";

export default function Login() {
    const { signin } = useAuth();
    const navigate = useNavigate();
    const [email, Setemail] = useState("");
    const [password, Setpassword] = useState("");
    const [err, Seterr] = useState("");
    const [iserr, Setiserr] = useState('');

    async function singin() {
        try {
            const credentials = { email, password }
            const response = await signin(credentials);
            console.log("Login successful:", response);
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(response));
            
            if (!response.hospitalId && (response.role === "staff" || response.role === "doctor")) {
                navigate('/hospital-selection');
                return;
            }
            
            if (response.role === "patient") {
                navigate('/patient');
            } else if (response.role === "staff") {
                navigate('/hospital');
            } else if (response.role === "doctor") {
                navigate('/doctor');
            }
        } catch (err) {
            Setiserr(true);
            Seterr(err.message || "Login failed");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>
                <div className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => Setemail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => Setpassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {iserr && (
                        <div className="text-red-500 text-sm text-center">
                            {err}
                        </div>
                    )}

                    <div>
                        <button
                            onClick={singin}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign in
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}