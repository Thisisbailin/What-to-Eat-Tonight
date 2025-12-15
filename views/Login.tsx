import React, { useState } from 'react';
import { Icons } from '../components/Icons';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === '001' && password === '001') {
      onLogin();
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>

      <div className="w-full max-w-sm mx-auto z-10 animate-fade-in">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-primary to-purple-400 rounded-[2rem] mx-auto shadow-ios-lg mb-6 flex items-center justify-center transform rotate-3">
             <Icons.Utensils className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">欢迎回来</h1>
          <p className="text-text-secondary text-base">记录每一餐的温暖与美好</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface rounded-3xl shadow-ios p-2 space-y-1">
            <div className="relative group">
               <div className="absolute left-4 top-4 text-gray-400">
                  <Icons.User size={20} />
               </div>
               <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-b border-gray-100 focus:border-primary/50 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="用户名 (001)"
               />
            </div>
            <div className="relative group">
               <div className="absolute left-4 top-4 text-gray-400">
                  <Icons.Lock size={20} />
               </div>
               <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
                  placeholder="密码 (001)"
               />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-primary bg-primary-subtle p-3 rounded-2xl text-sm justify-center">
               <Icons.AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-black text-white font-semibold text-lg py-4 rounded-3xl shadow-lg active:scale-95 transition-all duration-200 hover:shadow-xl"
          >
            开始记录
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by Pudding AI
        </p>
      </div>
    </div>
  );
};