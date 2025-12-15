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
      setError('用户名或密码错误 (提示: 001/001)');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 z-10 border border-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">今晚吃什么</h1>
          <p className="text-gray-500">你的AI美食心情日记</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 pl-1">用户名</label>
            <div className="relative">
              <Icons.User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-700"
                placeholder="001"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 pl-1">密码</label>
             <div className="relative">
              <Icons.Utensils className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-700"
                placeholder="001"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all transform active:scale-95"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
};