import React, { useState, useEffect, useRef } from 'react';
import { AppState, MealType, MealEntry, DayLog, UserProfile, NutritionData } from '../types';
import { Avatar } from '../components/Avatar';
import { Icons } from '../components/Icons';
import * as GeminiService from '../services/geminiService';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  state: AppState;
  updateLog: (date: string, log: DayLog) => void;
  updateUser: (user: UserProfile) => void;
}

const MOODS = [
  { value: 'happy', icon: <Icons.Smile className="w-6 h-6 text-green-500" />, label: '开心' },
  { value: 'calm', icon: <Icons.Meh className="w-6 h-6 text-blue-400" />, label: '平静' },
  { value: 'tired', icon: <Icons.Moon className="w-6 h-6 text-purple-400" />, label: '疲惫' },
  { value: 'sad', icon: <Icons.Frown className="w-6 h-6 text-gray-400" />, label: '难过' },
];

export const Dashboard: React.FC<DashboardProps> = ({ state, updateLog, updateUser }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');
  const [currentMealType, setCurrentMealType] = useState<MealType | null>(null);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecModal, setShowRecModal] = useState(false);
  const [dailyReport, setDailyReport] = useState<string>('');
  const [chatMode, setChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);

  const today = state.currentDate;
  const currentLog = state.logs[today] || { 
    date: today, 
    mood: 'calm', 
    meals: [] 
  };

  // Determine current meal time based on real time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setCurrentMealType(MealType.BREAKFAST);
    else if (hour >= 11 && hour < 16) setCurrentMealType(MealType.LUNCH);
    else if (hour >= 16 && hour < 22) setCurrentMealType(MealType.DINNER);
    else setCurrentMealType(MealType.SNACK);
    
    // Generate daily report on mount if meals exist
    if (currentLog.meals.length > 0 && !dailyReport && state.user) {
        GeminiService.getDailyReport(currentLog, state.user).then(setDailyReport);
    }
  }, []);

  const handleMoodChange = (mood: any) => {
    updateLog(today, { ...currentLog, mood });
  };

  const handleWeightUpdate = (w: string) => {
     if (state.user) {
         updateUser({ ...state.user, weight: parseFloat(w) });
         // Also update daily log if we tracked it there (optional, sticking to user profile for simplicity)
         updateLog(today, { ...currentLog, weight: parseFloat(w) });
     }
  };

  const handleMealSubmit = async () => {
    if (!inputText.trim() || !state.user) return;
    setIsAnalyzing(true);
    
    try {
      const analysis = await GeminiService.analyzeMeal(inputText, state.user);
      
      const newMeal: MealEntry = {
        id: Date.now().toString(),
        date: today,
        type: currentMealType || MealType.SNACK,
        description: inputText,
        nutrition: analysis,
        isRecommended: false
      };
      
      const updatedMeals = [...currentLog.meals, newMeal];
      updateLog(today, { ...currentLog, meals: updatedMeals });
      setInputText('');
      
      // Refresh report
      GeminiService.getDailyReport({ ...currentLog, meals: updatedMeals }, state.user).then(setDailyReport);

    } catch (e) {
      alert("AI分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchRecommendations = async (type: MealType) => {
    if (!state.user) return;
    setIsAnalyzing(true);
    setShowRecModal(true);
    setChatMode(false);
    try {
      // Pass last 7 days logs
      const history = (Object.values(state.logs) as DayLog[]).slice(-7);
      const recs = await GeminiService.getMealRecommendation(type, state.user, history);
      setRecommendations(recs);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const acceptRecommendation = (rec: any) => {
      setInputText(rec.name);
      setShowRecModal(false);
  };

  // Chart Data Preparation
  const chartData = (Object.values(state.logs) as DayLog[])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(log => ({
      name: log.date.slice(5), // MM-DD
      health: log.meals.reduce((acc, m) => acc + (m.nutrition?.healthScore || 0), 0) / (log.meals.length || 1),
      weight: log.weight || state.user?.weight
    }));

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-rose-50 pb-20 relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4 rounded-b-3xl shadow-sm border-b border-rose-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">今晚吃什么</h1>
          <p className="text-xs text-gray-500">{new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric'})}</p>
        </div>
        <div className="cursor-pointer">
            <Avatar mood={isAnalyzing ? 'thinking' : currentLog.mood === 'happy' ? 'happy' : 'idle'} size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        
        {/* Toggle View */}
        <div className="flex bg-white rounded-full p-1 shadow-sm">
            <button 
                onClick={() => setActiveTab('today')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'today' ? 'bg-primary text-white shadow' : 'text-gray-500'}`}
            >
                今日日记
            </button>
            <button 
                onClick={() => setActiveTab('weekly')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'weekly' ? 'bg-primary text-white shadow' : 'text-gray-500'}`}
            >
                周报 & 趋势
            </button>
        </div>

        {activeTab === 'today' ? (
        <>
            {/* Mood Tracker */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-rose-100">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-semibold text-gray-700">今天心情怎么样？</h2>
                <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Icons.Activity size={12}/>
                    <span>{currentLog.weight || state.user?.weight} kg</span>
                </div>
            </div>
            <div className="flex justify-between">
                {MOODS.map(m => (
                <button 
                    key={m.value}
                    onClick={() => handleMoodChange(m.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentLog.mood === m.value ? 'bg-rose-100 scale-110' : 'opacity-60 grayscale'}`}
                >
                    {m.icon}
                    <span className="text-[10px]">{m.label}</span>
                </button>
                ))}
                <button 
                    onClick={() => {
                        const w = prompt("更新今日体重 (kg):", (state.user?.weight || "").toString());
                        if (w) handleWeightUpdate(w);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl opacity-60"
                >
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">...</div>
                    <span className="text-[10px]">更多</span>
                </button>
            </div>
            </div>

            {/* AI Report Card */}
            {dailyReport && (
                <div className="bg-gradient-to-r from-indigo-50 to-rose-50 p-4 rounded-3xl border border-indigo-100 flex items-start gap-3">
                    <div className="mt-1"><Icons.Heart className="w-5 h-5 text-primary" /></div>
                    <div>
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Pudding's Note</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{dailyReport}</p>
                    </div>
                </div>
            )}

            {/* Meal Timeline */}
            <div className="space-y-4">
                {[MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER].map((type) => {
                    const mealsForType = currentLog.meals.filter(m => m.type === type);
                    const isCurrent = type === currentMealType;

                    return (
                        <div key={type} className={`relative pl-4 border-l-2 ${isCurrent ? 'border-primary' : 'border-gray-200'}`}>
                            {/* Dot */}
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${isCurrent ? 'bg-primary shadow-lg shadow-pink-200' : 'bg-gray-200'}`}></div>
                            
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${isCurrent ? 'text-gray-800 text-lg' : 'text-gray-500'}`}>{type}</h3>
                                {isCurrent && mealsForType.length === 0 && (
                                    <button 
                                        onClick={() => fetchRecommendations(type)}
                                        className="text-xs bg-gradient-to-r from-primary to-purple-400 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse-slow"
                                    >
                                        <Icons.Utensils size={12}/> 推荐吃什么?
                                    </button>
                                )}
                            </div>

                            {/* Existing Logs */}
                            <div className="space-y-3">
                                {mealsForType.map(meal => (
                                    <div key={meal.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-gray-800">{meal.description}</span>
                                            {meal.nutrition && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${meal.nutrition.healthScore > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {meal.nutrition.healthScore}分
                                                </span>
                                            )}
                                        </div>
                                        {meal.nutrition && (
                                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                                                <div className="flex gap-2 flex-wrap">
                                                    {meal.nutrition.tags.map(tag => (
                                                        <span key={tag} className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">#{tag}</span>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                                                    <span>🔥 {meal.nutrition.calories} kcal</span>
                                                    <span>🥩 {meal.nutrition.protein}</span>
                                                    <span>🍞 {meal.nutrition.carbs}</span>
                                                </div>
                                                <div className="bg-rose-50 p-2 rounded-lg mt-2 text-rose-700 italic">
                                                    "{meal.nutrition.feedback}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Input Area for Current Meal */}
                                {isCurrent && (
                                    <div className="mt-2 flex gap-2">
                                        <input 
                                            type="text" 
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder={`记录一下${type}吃了什么...`}
                                            className="flex-1 bg-white border border-rose-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            onKeyDown={(e) => e.key === 'Enter' && handleMealSubmit()}
                                        />
                                        <button 
                                            onClick={handleMealSubmit}
                                            disabled={isAnalyzing}
                                            className="bg-primary text-white p-2 rounded-xl shadow-md disabled:opacity-50"
                                        >
                                            {isAnalyzing ? <Icons.Loader2 className="animate-spin w-5 h-5"/> : <Icons.Send className="w-5 h-5" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
        ) : (
            /* Weekly View */
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Icons.Activity className="text-primary"/> 健康分趋势
                    </h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="health" stroke="#F472B6" strokeWidth={3} dot={{ fill: '#F472B6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Icons.User className="text-purple-400"/> 体重变化
                    </h3>
                    <div className="h-48 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="weight" stroke="#818cf8" strokeWidth={3} dot={{fill: '#818cf8'}}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Recommendation Modal */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-rose-50 p-4 border-b border-rose-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Avatar mood="talking" size="sm" /> Pudding 的建议
                    </h3>
                    <button onClick={() => setShowRecModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    {isAnalyzing && !recommendations.length ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                             <Icons.Loader2 className="w-8 h-8 animate-spin mb-2"/>
                             <p>正在分析你的营养档案...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!chatMode ? (
                                <>
                                    <p className="text-sm text-gray-600 mb-2">根据你最近的情况，我推荐这些：</p>
                                    {recommendations.map((rec, idx) => (
                                        <div key={idx} className="border border-gray-100 rounded-2xl p-4 hover:border-primary transition-colors cursor-pointer group" onClick={() => acceptRecommendation(rec)}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-800">{rec.name}</h4>
                                                <Icons.Plus className="w-5 h-5 text-gray-300 group-hover:text-primary"/>
                                            </div>
                                            <p className="text-xs text-rose-500 mb-2">{rec.reason}</p>
                                            <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-500">
                                                {rec.nutritionHighlights}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setChatMode(true)}
                                        className="w-full py-3 text-sm text-primary font-medium border border-primary rounded-xl mt-2"
                                    >
                                        想吃别的？和我聊聊
                                    </button>
                                </>
                            ) : (
                                <div className="h-64 flex flex-col">
                                    <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-xl mb-3">
                                        <div className="flex gap-2">
                                            <div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%]">
                                                还有什么特别想吃的口味吗？比如甜的，辣的？
                                            </div>
                                        </div>
                                        {/* Simplified Chat UI for Demo */}
                                        {chatHistory.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                 <div className={`p-2 rounded-lg text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white shadow-sm rounded-tl-none'}`}>
                                                    {msg.text}
                                                 </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 border rounded-xl px-3 text-sm" 
                                            placeholder="比如：我想喝汤..."
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter') {
                                                    const val = e.currentTarget.value;
                                                    setChatHistory([...chatHistory, {role: 'user', text: val}]);
                                                    e.currentTarget.value = '';
                                                    // Simulation of AI reply
                                                    setTimeout(() => {
                                                        setChatHistory(prev => [...prev, {role: 'ai', text: '既然想喝汤，那推荐这道「玉米排骨汤」，温润滋补，很适合现在喝哦。'}]);
                                                    }, 1000);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};