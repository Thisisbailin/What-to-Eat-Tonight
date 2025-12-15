import React, { useState } from 'react';
import { UserProfile, AppView } from '../types';
import { Icons } from '../components/Icons';
import { Avatar } from '../components/Avatar';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  setView: (view: AppView) => void;
  currentPhase: AppView;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, setView, currentPhase }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: 'female',
    goal: 'maintain',
    recentAppetite: 'normal',
    sleepQuality: 'good',
    energyLevel: 'normal'
  });

  const updateForm = (key: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentPhase === AppView.ONBOARDING_PHASE_1) {
      setView(AppView.ONBOARDING_PHASE_2);
    } else {
      onComplete(formData as UserProfile);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 scale-110">
        <Avatar mood="happy" size="md" />
      </div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 space-y-6 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
           <div 
             className="h-full bg-primary transition-all duration-500" 
             style={{ width: currentPhase === AppView.ONBOARDING_PHASE_1 ? '50%' : '100%' }}
           ></div>
        </div>

        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
                {currentPhase === AppView.ONBOARDING_PHASE_1 ? '建立你的专属档案' : '最近感觉如何？'}
            </h2>
            <p className="text-sm text-gray-500">
                {currentPhase === AppView.ONBOARDING_PHASE_1 ? '让我更了解你的身体基础信息' : '这些信息能帮我做出更贴心的建议'}
            </p>
        </div>

        {currentPhase === AppView.ONBOARDING_PHASE_1 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">身高 (cm)</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="165"
                            onChange={e => updateForm('height', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">体重 (kg)</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="55"
                            onChange={e => updateForm('weight', parseFloat(e.target.value))}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">年龄</label>
                    <input 
                        type="number" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="24"
                        onChange={e => updateForm('age', parseFloat(e.target.value))}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">生理期情况</label>
                    <div className="flex gap-2">
                        {['regular', 'irregular', 'none'].map((status) => (
                            <button
                                key={status}
                                onClick={() => updateForm('periodStatus', status)}
                                className={`flex-1 py-2 text-xs rounded-xl border ${formData.periodStatus === status ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                {status === 'regular' ? '规律' : status === 'irregular' ? '不规律' : '无/保密'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">最近食欲</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['good', 'normal', 'poor', 'cravings'].map((opt) => (
                             <button
                                key={opt}
                                onClick={() => updateForm('recentAppetite', opt)}
                                className={`py-2 text-[10px] rounded-xl border ${formData.recentAppetite === opt ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                {opt === 'good' ? '胃口好' : opt === 'normal' ? '正常' : opt === 'poor' ? '没胃口' : '嘴馋'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">睡眠质量</label>
                    <div className="flex gap-2">
                        {['good', 'fair', 'poor'].map((opt) => (
                             <button
                                key={opt}
                                onClick={() => updateForm('sleepQuality', opt)}
                                className={`flex-1 py-2 text-xs rounded-xl border ${formData.sleepQuality === opt ? 'bg-purple-400 text-white border-purple-400' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                {opt === 'good' ? '香甜' : opt === 'fair' ? '一般' : '失眠'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">最近目标</label>
                    <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none"
                        onChange={e => updateForm('goal', e.target.value)}
                    >
                        <option value="maintain">保持健康</option>
                        <option value="lose_weight">温和减脂</option>
                        <option value="gain_muscle">增肌塑形</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">备注 (选填)</label>
                    <textarea 
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none text-sm h-20"
                         placeholder="最近有没有哪里不舒服，或者特别想吃的？"
                         onChange={e => updateForm('healthStatus', e.target.value)}
                    />
                </div>
            </div>
        )}

        <button 
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-primary to-rose-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
            {currentPhase === AppView.ONBOARDING_PHASE_1 ? '下一步' : '开启旅程'} <Icons.ArrowRight size={20}/>
        </button>

      </div>
    </div>
  );
};