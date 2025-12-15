import React, { useState } from 'react';
import { UserProfile, AppView } from '../types';
import { Icons } from '../components/Icons';
import { Avatar } from '../components/Avatar';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  setView: (view: AppView) => void;
  currentPhase: AppView;
}

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}

const OptionButton: React.FC<OptionButtonProps> = ({ selected, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center justify-center gap-2 py-4 px-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
      selected 
        ? 'bg-black text-white shadow-lg scale-105' 
        : 'bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

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
    <div className="min-h-screen bg-background flex flex-col p-6 safe-area-bottom">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 mb-8 animate-fade-in">
         <Avatar mood="happy" size="md" />
         <div className="mt-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
                {currentPhase === AppView.ONBOARDING_PHASE_1 ? '关于你' : '最近状态'}
            </h2>
            <p className="text-gray-500 mt-2">
                {currentPhase === AppView.ONBOARDING_PHASE_1 ? '建立你的专属健康档案' : '帮助 Pudding 给你更精准的建议'}
            </p>
         </div>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto space-y-6">
        {currentPhase === AppView.ONBOARDING_PHASE_1 ? (
            <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-3xl shadow-sm">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">身高 (cm)</label>
                        <input 
                            type="number" 
                            className="w-full text-3xl font-bold bg-transparent outline-none placeholder-gray-200 text-gray-900"
                            placeholder="165"
                            onChange={e => updateForm('height', parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">体重 (kg)</label>
                        <input 
                            type="number" 
                            className="w-full text-3xl font-bold bg-transparent outline-none placeholder-gray-200 text-gray-900"
                            placeholder="55"
                            onChange={e => updateForm('weight', parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <label className="block text-sm font-semibold text-gray-900">生理期情况</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['regular', 'irregular', 'none'].map((status) => (
                            <OptionButton
                                key={status}
                                selected={formData.periodStatus === status}
                                onClick={() => updateForm('periodStatus', status)}
                                label={status === 'regular' ? '规律' : status === 'irregular' ? '不规律' : '保密'}
                            />
                        ))}
                    </div>
                </div>
                 
                 <div className="bg-white p-4 rounded-3xl shadow-sm">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">年龄</label>
                        <input 
                            type="number" 
                            className="w-full text-2xl font-bold bg-transparent outline-none placeholder-gray-200 text-gray-900"
                            placeholder="24"
                            onChange={e => updateForm('age', parseFloat(e.target.value))}
                        />
                </div>
            </div>
        ) : (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <label className="block text-sm font-semibold text-gray-900">最近食欲</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['good', 'normal', 'poor', 'cravings'].map((opt) => (
                             <OptionButton
                                key={opt}
                                selected={formData.recentAppetite === opt}
                                onClick={() => updateForm('recentAppetite', opt)}
                                label={opt === 'good' ? '胃口好' : opt === 'normal' ? '正常' : opt === 'poor' ? '没胃口' : '嘴馋'}
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <label className="block text-sm font-semibold text-gray-900">睡眠质量</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['good', 'fair', 'poor'].map((opt) => (
                             <OptionButton
                                key={opt}
                                selected={formData.sleepQuality === opt}
                                onClick={() => updateForm('sleepQuality', opt)}
                                label={opt === 'good' ? '香甜' : opt === 'fair' ? '一般' : '失眠'}
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                     <label className="block text-sm font-semibold text-gray-900">近期目标</label>
                     <div className="flex flex-col gap-2">
                         {[
                             {id: 'maintain', label: '保持健康'},
                             {id: 'lose_weight', label: '温和减脂'},
                             {id: 'gain_muscle', label: '增肌塑形'}
                         ].map(g => (
                             <button
                                key={g.id}
                                onClick={() => updateForm('goal', g.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                                    formData.goal === g.id 
                                    ? 'bg-primary/10 text-primary font-bold' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                             >
                                 {g.label}
                             </button>
                         ))}
                     </div>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8 w-full max-w-md mx-auto">
        <button 
            onClick={handleNext}
            className="w-full bg-black text-white font-bold text-lg py-4 rounded-3xl shadow-lg shadow-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
            {currentPhase === AppView.ONBOARDING_PHASE_1 ? '下一步' : '开启旅程'} <Icons.ArrowRight size={20}/>
        </button>
      </div>
    </div>
  );
};