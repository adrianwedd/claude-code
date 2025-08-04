'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { CodeBracketIcon, CommandLineIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export function AuthPage() {
  const handleGitHubSignIn = () => {
    signIn('github', { callbackUrl: '/' });
  };

  const features = [
    {
      icon: CodeBracketIcon,
      title: 'AI-Powered Coding',
      description: 'Get intelligent code suggestions and automated refactoring with Claude AI',
    },
    {
      icon: CommandLineIcon,
      title: 'Terminal Integration',
      description: 'Seamless CLI integration with real-time command execution and monitoring',
    },
    {
      icon: CpuChipIcon,
      title: 'Smart Analysis',
      description: 'Advanced code analysis, debugging assistance, and performance optimization',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-900 dark:to-dark-800">
      <div className="flex min-h-screen">
        {/* Left side - Features */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold text-dark-900 dark:text-dark-100 mb-6">
                Claude Code
              </h1>
              <p className="text-xl text-dark-600 dark:text-dark-300 mb-12">
                The next generation AI-powered development environment
              </p>
            </motion.div>

            <div className="space-y-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-dark-600 dark:text-dark-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Auth */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-100 mb-2">
                  Welcome Back
                </h2>
                <p className="text-dark-600 dark:text-dark-300">
                  Sign in to access your AI development environment
                </p>
              </div>

              <button
                onClick={handleGitHubSignIn}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-dark-900 hover:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-500 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}