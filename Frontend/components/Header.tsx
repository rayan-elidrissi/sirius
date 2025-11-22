import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoSiriusSvg from '@/assets/svg/logo-sirius.svg';

const Header: React.FC = () => {
  const location = useLocation();
  const isDocsPage = location.pathname === '/docs';
  const isAboutPage = location.pathname === '/about';
  const isDarkHeader = isDocsPage || isAboutPage;
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Don't hide header on Docs page
      if (isDocsPage) {
        setIsVisible(true);
        return;
      }

      // Get scroll position from the scrollable container or window
      const scrollContainer = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
      const currentScrollY = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);

      if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 10) {
        // Scrolling down and past 10px - hide header
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    // Listen to scroll on the scrollable container
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Also listen to window scroll as fallback
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, isDocsPage]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isDarkHeader 
          ? 'bg-[#161923] border-b border-[#334155]' 
          : 'bg-white border-b border-[#e5e5e5]'
      }`}
    >
      <div className="w-full">
        <div className="flex items-center justify-between h-20 md:h-24 px-4 sm:px-6 lg:px-8">
          {/* Left side: Logo + Site Name */}
          <Link to="/" className="flex items-center space-x-1">
            <img
              src={logoSiriusSvg}
              alt="Sirius Logo"
              className={`${isDarkHeader ? 'brightness-0 invert' : ''}`}
              style={{ width: '5rem', height: '5rem' }}
            />
            <span className={`font-medium text-5xl ${isDarkHeader ? 'text-white' : 'text-black'}`}>
              Sirius
            </span>
          </Link>

          {/* Right side: Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              to="/docs"
              className={`group px-10 py-4 rounded-xl hover:brightness-110 transition-all duration-200 font-medium text-3xl inline-flex items-center gap-2 ${
                isDarkHeader 
                  ? 'bg-[#97F0E5] text-black' 
                  : 'bg-[#CCA9DD] text-black'
              }`}
            >
              Read Docs
              <div className="relative flex items-center justify-center" style={{ width: '1.5rem', height: '1.5rem' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 10 8"
                  className="w-full h-full arrow-icon transition-transform duration-300 ease-in-out"
                  fill="currentColor"
                >
                  <path d="M4.45231 0.385986H6.02531L9.30131 3.99999L6.02531 7.61399H4.45231L7.40331 4.58499H0.695312V3.42799H7.41631L4.45231 0.385986Z" />
                </svg>
              </div>
            </Link>
            <Link
              to="/about"
              className={`px-10 py-4 rounded-xl hover:brightness-110 transition-all duration-200 font-medium text-3xl ${
                isDarkHeader 
                  ? 'bg-[#97F0E5] text-black' 
                  : 'bg-[#CCA9DD] text-black'
              }`}
            >
              About Us
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

