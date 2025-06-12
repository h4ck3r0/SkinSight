import React, { useState } from 'react';

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
      {/* Desktop Navigation */}
      <div className="hidden sm:block border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center">
                {tabs.find(tab => tab.id === activeTab)?.icon}
                <span className="ml-2">{tabs.find(tab => tab.id === activeTab)?.label}</span>
              </div>
              <svg
                className={`ml-2 h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="px-4 py-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabNavigation;