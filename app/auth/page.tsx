'use client';

import { FC, SetStateAction, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import InputField from '@/components/fields/InputField';
import Checkbox from '@/components/checkbox';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/services/authService';
import Cookies from 'js-cookie';

type Props = {};

const AuthPage: FC<Props> = () => {
    const [email, setEmail] = useState<string>(''); // Strongly typed
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const router = useRouter();
    const AUTH_TOKEN_KEY = 'auth_token'; // Avoid hardcoding keys

    // Handle login action
    const handleLogin = async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const { token, user } = await loginUser(email, password);
            console.log('token ====>', token);
            console.log('user ====>', user);
            // Store token securely
            localStorage.setItem(AUTH_TOKEN_KEY, token);

            // Store token in cookies
        Cookies.set('auth_token', token, { expires: 1, path: '/' }); // Expires in 1 day
        Cookies.set('user_role', user.roles[0], { expires: 1, path: '/' }); // Store user role

            // Redirect on successful login
            router.push('/dashboard');
        } catch (error: any) {
            // Error handling: extract message safely
            const message = error?.message || 'An unexpected error occurred';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
            {/* Sign In Section */}
            <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
                <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">Sign In</h4>
                <p className="mb-9 ml-1 text-base text-gray-600">
                    Enter your email and password to sign in!
                </p>

                {/* Error Message */}
                {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}

                {/* Sign In with Google */}
                <div className="mb-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-lightPrimary hover:cursor-pointer dark:bg-navy-800">
                    <div className="rounded-full text-xl">
                        <FcGoogle />
                    </div>
                    <h5 className="text-sm font-medium text-navy-700 dark:text-white">Sign In with Google</h5>
                </div>

                {/* Divider */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
                    <p className="text-base text-gray-600 dark:text-white">or</p>
                    <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
                </div>

                {/* Email Field */}
                <InputField
                    variant="auth"
                    extra="mb-3"
                    label="Email*"
                    placeholder="mail@simmmple.com"
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setEmail(e.target.value)}
                />

                {/* Password Field */}
                <InputField
                    variant="auth"
                    extra="mb-3"
                    label="Password*"
                    placeholder="Min. 8 characters"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setPassword(e.target.value)}
                />

                {/* Remember Me Checkbox */}
                <div className="mb-4 flex items-center justify-between px-2">
                    <div className="flex items-center">
                        <Checkbox id="remember-me" />
                        <label htmlFor="remember-me" className="ml-2 text-sm font-medium text-navy-700 dark:text-white">
                            Keep me logged In
                        </label>
                    </div>
                    <a className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white" href="">
                        Forgot Password?
                    </a>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={`linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 ${
                        loading ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* Create Account Link */}
                <div className="mt-4">
                    <span className="text-sm font-medium text-navy-700 dark:text-gray-600">
                        Not registered yet?
                    </span>
                    <a href=" " className="ml-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white">
                        Create an account
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
