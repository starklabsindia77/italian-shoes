/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiAlignJustify, FiSearch } from 'react-icons/fi';
import { BsArrowBarUp } from 'react-icons/bs';
import { RiMoonFill, RiSunFill } from 'react-icons/ri';
import { IoMdNotificationsOutline, IoMdInformationCircleOutline } from 'react-icons/io';
import Dropdown from '@/components/dropdown';
import routes from '@/data/routes';
import { useSidebarContext } from '@/providers/SidebarProvider';
import { useThemeContext } from '@/providers/ThemeProvider';
import Cookies from 'js-cookie';

type RouteType = { name: string; path: string };

const Navbar = () => {
    const [currentRoute, setCurrentRoute] = useState<string>('Main Dashboard');
    const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null);

    const pathname = usePathname();
    const router = useRouter();
    const { setOpenSidebar } = useSidebarContext();
    const { theme, setTheme } = useThemeContext();

    useEffect(() => {
      const userData = Cookies.get('user'); // Assuming user data is stored in cookies as JSON
      if (userData) {
          try {
              setUser(JSON.parse(userData));
          } catch (error) {
              console.error('Failed to parse user data:', error);
          }
      }
  }, []);
    

    // Logout handler
    const handleLogout = () => {
        Cookies.remove('auth_token');
        Cookies.remove('user_role');
        Cookies.remove('user');
        localStorage.removeItem('auth_token');
        router.push('/auth');
    };

    const getActiveRoute = (routes: RouteType[]) => {
        const pathnameSegments = pathname.split('/').filter(Boolean); // Split pathname into segments
    
        for (const route of routes) {
            const routeSegments = route.path.split('/').filter(Boolean); // Split route path into segments
            if (
                pathnameSegments.length === routeSegments.length &&
                pathnameSegments.every((seg, i) => seg === routeSegments[i])
            ) {
                setCurrentRoute(route.name);
                return;
            }
        }
    
        setCurrentRoute('Main Dashboard');
    };
    

    useEffect(() => {
        getActiveRoute(routes);
    }, [pathname]);

    return (
        <nav className="sticky top-4 z-40 flex flex-row items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
            {/* Left Section */}
            <div className="ml-[6px]">
                <div className="h-6 w-[224px] pt-1">
                    <Link className="text-sm font-normal text-navy-700 hover:underline dark:text-white" href="/">
                        Pages
                        <span className="mx-1">/</span>
                    </Link>
                    <Link className="text-sm font-normal capitalize text-navy-700 hover:underline dark:text-white" href="#">
                        {currentRoute}
                    </Link>
                </div>
                <p className="shrink text-[33px] font-bold capitalize text-navy-700 dark:text-white">
                    <Link href="#">{currentRoute}</Link>
                </p>
            </div>

            {/* Right Section */}
            <div className="relative mt-[3px] flex h-[61px] w-[355px] items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl dark:bg-navy-800 md:w-[365px] xl:w-[365px]">
                {/* Search */}
                <div className="flex h-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white xl:w-[225px]">
                    <FiSearch className="ml-3 h-4 w-4 text-gray-400 dark:text-white" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full rounded-full bg-lightPrimary px-2 text-sm text-navy-700 placeholder-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder-white"
                    />
                </div>

                {/* Toggle Sidebar */}
                <span className="cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden" onClick={() => setOpenSidebar(true)}>
                    <FiAlignJustify className="h-5 w-5" />
                </span>

                {/* Notifications */}
                <Dropdown
                    button={<IoMdNotificationsOutline className="h-4 w-4 cursor-pointer text-gray-600 dark:text-white" />}
                    className="py-2 top-4 -left-[230px] md:-left-[440px] w-max"
                >
                    <div className="flex w-[360px] flex-col gap-3 rounded-2xl bg-white p-4 shadow-xl dark:bg-navy-700">
                        <p className="text-base font-bold">Notifications</p>
                        <button className="flex items-center">
                            <BsArrowBarUp className="h-10 w-10 rounded-xl bg-gradient-to-b from-brandLinear to-brand-500 text-white p-2" />
                            <div className="ml-2 text-sm">
                                <p className="font-bold">New Update</p>
                                <p className="text-gray-500 dark:text-white">A new update is available!</p>
                            </div>
                        </button>
                    </div>
                </Dropdown>

                {/* Dark Mode Toggle */}
                <div className="cursor-pointer" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? (
                        <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
                    ) : (
                        <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
                    )}
                </div>

                {/* Profile Dropdown */}
                <Dropdown
                    button={<img className="h-10 w-10 rounded-full cursor-pointer" src="/img/avatars/avatar4.png" alt="User" />}
                    className="py-2 top-8 -left-[180px] w-max"
                >
                    <div className="flex w-56 flex-col bg-white dark:bg-navy-700 rounded-2xl">
                        <p className="p-4 text-sm font-bold text-navy-700 dark:text-white">👋 Hey, {user ? `${user.firstName} ${user.lastName}` : 'Guest'}</p>
                        <div className="h-px w-full bg-gray-200 dark:bg-white/20" />
                        <div className="flex flex-col p-4">
                            <Link href="/profile" className="text-sm text-gray-800 dark:text-white">
                                Profile Settings
                            </Link>
                            <Link href="/newsletter" className="mt-3 text-sm text-gray-800 dark:text-white">
                                Newsletter Settings
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="mt-3 text-sm font-medium text-red-500 hover:text-red-600"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </Dropdown>
            </div>
        </nav>
    );
};

export default Navbar;

