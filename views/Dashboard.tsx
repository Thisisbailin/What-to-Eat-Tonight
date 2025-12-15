import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, MealType, MealEntry, DayLog, UserProfile } from '../types';
import { Avatar } from '../components/Avatar';
import { Icons } from '../components/Icons';
import * as GeminiService from '../services/geminiService';
import { searchRecipes, PredefinedRecipe } from '../data/recipes';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  state: AppState;
  updateLog: (date: string, log: DayLog) => void;
  updateUser: (user: UserProfile) => void;
}

const MOODS = [
  { value: 'happy', icon: <Icons.Smile className="w-6 h-6" />, label: '开心', color: 'bg-yellow-100 text-yellow-600' },
  { value: 'calm', icon: <Icons.Meh className="w-6 h-6" />, label: '平静', color: 'bg-blue-100 text-blue-600' },
  { value: 'tired', icon: <Icons.Moon className="w-6 h-6" />, label: '疲惫', color: 'bg-purple-100 text-purple-600' },
  { value: 'sad', icon: <Icons.Frown className="w-6 h-6" />, label: '难过', color: 'bg-gray-100 text-gray-600' },
];

export const Dashboard: React.FC<DashboardProps> = ({ state, updateLog, updateUser }) => {
  // View State
  const [showStats, setShowStats] = useState(false); 
  const [viewDate, setViewDate] = useState(state.currentDate); 
  const [scrolled, setScrolled] = useState(false);

  // Logic State
  const [currentMealType, setCurrentMealType] = useState<MealType | null>(null);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecModal, setShowRecModal] = useState(false);
  const [dailyReport, setDailyReport] = useState<string>('');
  const [chatMode, setChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<PredefinedRecipe[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Scroll listener for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentLog = state.logs[viewDate] || { 
    date: viewDate, 
    mood: 'calm', 
    meals: [] 
  };

  // --- Calendar Logic ---
  const weekDates = useMemo(() => {
    const curr = new Date(viewDate);
    const day = curr.getDay(); // 0 is Sun, 1 is Mon
    // Adjust to Monday as start of week
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(curr);
    monday.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      week.push(next.toISOString().split('T')[0]);
    }
    return week;
  }, [viewDate]);

  const getDayName = (dateStr: string) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(dateStr).getDay()];
  };

  // --- Time Logic ---
  useEffect(() => {
    const checkTime = () => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 11) setCurrentMealType(MealType.BREAKFAST);
        else if (hour >= 11 && hour < 16) setCurrentMealType(MealType.LUNCH);
        else setCurrentMealType(MealType.DINNER);
    };
    checkTime();
    const timer = setInterval(checkTime, 60000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentLog.meals.length > 0 && !dailyReport && state.user && viewDate === state.currentDate) {
        GeminiService.getDailyReport(currentLog, state.user).then(setDailyReport);
    }
  }, [currentLog.meals.length, viewDate]);

  // Handlers
  const handleMoodChange = (mood: any) => updateLog(viewDate, { ...currentLog, mood });
  const handleWeightUpdate = () => {
     const w = prompt("更新今日体重 (kg):", (state.user?.weight || "").toString());
     if (w && state.user) {
         updateUser({ ...state.user, weight: parseFloat(w) });
         updateLog(viewDate, { ...currentLog, weight: parseFloat(w) });
     }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputText(val);
      if (val.trim()) {
          const results = searchRecipes(val);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
      } else {
          setShowSuggestions(false);
      }
  };

  const selectSuggestion = (recipe: PredefinedRecipe) => {
      setInputText(recipe.name);
      setShowSuggestions(false);
  };

  const handleMealSubmit = async () => {
    if (!inputText.trim() || !state.user) return;
    setIsAnalyzing(true);
    setShowSuggestions(false);
    try {
      const analysis = await GeminiService.analyzeMeal(inputText, state.user);
      const newMeal: MealEntry = {
        id: Date.now().toString(),
        date: viewDate,
        type: currentMealType || MealType.SNACK,
        description: inputText,
        nutrition: analysis || undefined,
        isRecommended: false
      };
      const updatedMeals = [...currentLog.meals, newMeal];
      updateLog(viewDate, { ...currentLog, meals: updatedMeals });
      setInputText('');
      if (viewDate === state.currentDate) GeminiService.getDailyReport({ ...currentLog, meals: updatedMeals }, state.user).then(setDailyReport);
    } catch (e) { alert("AI分析失败"); } 
    finally { setIsAnalyzing(false); }
  };

  const fetchRecommendations = async (type: MealType) => {
    if (!state.user) return;
    setIsAnalyzing(true);
    setShowRecModal(true);
    setChatMode(false);
    try {
      const history = (Object.values(state.logs) as DayLog[]).slice(-7);
      const recs = await GeminiService.getMealRecommendation(type, state.user, history);
      setRecommendations(recs);
    } finally { setIsAnalyzing(false); }
  };

  const acceptRecommendation = (rec: any) => {
      setInputText(rec.name);
      setShowRecModal(false);
  };

  const chartData = (Object.values(state.logs) as DayLog[])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(log => ({
      name: log.date.slice(5),
      health: log.meals.reduce((acc, m) => acc + (m.nutrition?.healthScore || 0), 0) / (log.meals.length || 1),
      weight: log.weight || state.user?.weight
    }));

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-background pb-32">
      {/* Sticky Header */}
      <div className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'glass border-b border-gray-200' : 'bg-transparent'}`}>
         <div className="px-6 py-4 flex justify-between items-end">
             <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {new Date(viewDate).getFullYear()}年
                </div>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                    {new Date(viewDate).getMonth() + 1}月{new Date(viewDate).getDate()}日
                </h1>
             </div>
             <div 
                className="cursor-pointer transition-transform active:scale-95" 
                onClick={() => setShowStats(!showStats)}
             >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showStats ? 'bg-black text-white' : 'bg-white text-gray-900 shadow-ios'}`}>
                    {showStats ? <Icons.Calendar size={20} /> : <Icons.BarChart2 size={20} />}
                </div>
             </div>
         </div>
         
         {/* Calendar Strip */}
         {!showStats && (
            <div className="px-4 pb-4 overflow-x-auto no-scrollbar">
                <div className="flex justify-between items-center gap-2">
                    {weekDates.map((dateStr) => {
                        const isSelected = dateStr === viewDate;
                        const isToday = dateStr === state.currentDate;
                        const dateObj = new Date(dateStr);
                        
                        return (
                            <button
                                key={dateStr}
                                onClick={() => setViewDate(dateStr)}
                                className={`flex flex-col items-center justify-center min-w-[3rem] h-16 rounded-2xl transition-all duration-300 ${
                                    isSelected 
                                    ? 'bg-primary text-white shadow-lg scale-105' 
                                    : 'bg-white text-gray-400'
                                }`}
                            >
                                <span className={`text-[10px] font-medium ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                                    {getDayName(dateStr)}
                                </span>
                                <span className="text-lg font-bold">
                                    {dateObj.getDate()}
                                </span>
                                {isToday && !isSelected && <div className="w-1 h-1 bg-primary rounded-full mt-1"></div>}
                            </button>
                        );
                    })}
                </div>
            </div>
         )}
      </div>

      <div className="px-6 mt-6 space-y-8 animate-fade-in">
        {!showStats ? (
        <>
            {/* Avatar & Report Widget */}
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <Avatar mood={isAnalyzing ? 'thinking' : currentLog.mood === 'happy' ? 'happy' : 'idle'} size="sm" />
                </div>
                <div className="flex-1 bg-white p-4 rounded-3xl rounded-tl-none shadow-ios text-sm text-gray-600 leading-relaxed border border-gray-50">
                     {dailyReport || "今天也要好好吃饭，好好爱自己哦！ ✨"}
                </div>
            </div>

            {/* Mood & Weight Widget */}
            <div className="bg-white p-5 rounded-[2rem] shadow-ios">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">今日状态</h3>
                    <button onClick={handleWeightUpdate} className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-medium">
                        {currentLog.weight || state.user?.weight} kg
                    </button>
                </div>
                <div className="flex justify-between gap-2">
                    {MOODS.map(m => {
                        const active = currentLog.mood === m.value;
                        return (
                            <button 
                                key={m.value}
                                onClick={() => handleMoodChange(m.value)}
                                className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-all duration-300 ${
                                    active ? `${m.color} shadow-sm scale-105` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                            >
                                {m.icon}
                                <span className="text-[10px] font-medium">{m.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Meals Timeline */}
            <div className="space-y-6">
                {[MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER].map((type) => {
                    const mealsForType = currentLog.meals.filter(m => m.type === type);
                    const isCurrent = type === currentMealType && viewDate === state.currentDate;
                    const showRecommendBtn = mealsForType.length === 0 && isCurrent;

                    return (
                        <div key={type} className="group">
                             <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className={`text-lg font-bold ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>{type}</h3>
                                {showRecommendBtn && (
                                    <button 
                                        onClick={() => fetchRecommendations(type)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-black px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform"
                                    >
                                        <Icons.Utensils size={12} />
                                        推荐
                                    </button>
                                )}
                             </div>

                             <div className="space-y-3">
                                {mealsForType.map(meal => (
                                    <div key={meal.id} className="bg-white p-5 rounded-3xl shadow-ios border border-gray-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900 text-lg">{meal.description}</span>
                                            {meal.nutrition && (
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                                    meal.nutrition.healthScore >= 80 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                    {meal.nutrition.healthScore}
                                                </div>
                                            )}
                                        </div>
                                        {meal.nutrition && (
                                            <>
                                                <div className="flex gap-2 mb-3">
                                                    {meal.nutrition.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] font-medium bg-gray-50 text-gray-500 px-2 py-1 rounded-lg">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-2xl mb-3">
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-gray-400 mb-0.5">热量</div>
                                                        <div className="text-xs font-bold text-gray-800">{meal.nutrition.calories}</div>
                                                    </div>
                                                    <div className="text-center border-l border-gray-200">
                                                        <div className="text-[10px] text-gray-400 mb-0.5">蛋白质</div>
                                                        <div className="text-xs font-bold text-gray-800">{meal.nutrition.protein}</div>
                                                    </div>
                                                    <div className="text-center border-l border-gray-200">
                                                        <div className="text-[10px] text-gray-400 mb-0.5">碳水</div>
                                                        <div className="text-xs font-bold text-gray-800">{meal.nutrition.carbs}</div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 italic">
                                                    "{meal.nutrition.feedback}"
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* Input Field */}
                                {viewDate === state.currentDate && (isCurrent || mealsForType.length > 0) && (
                                    <div className="relative mt-3">
                                        <div className="flex items-center gap-2 bg-white p-2 pr-2 rounded-[20px] shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
                                            <input 
                                                type="text" 
                                                value={inputText}
                                                onChange={handleInputChange}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                placeholder="吃了什么？"
                                                className="flex-1 px-4 py-2 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                                                onKeyDown={(e) => e.key === 'Enter' && handleMealSubmit()}
                                            />
                                            <button 
                                                onClick={handleMealSubmit}
                                                disabled={isAnalyzing}
                                                className="bg-primary text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-md disabled:opacity-50 hover:bg-rose-600 transition-colors"
                                            >
                                                {isAnalyzing ? <Icons.Loader2 className="animate-spin w-5 h-5"/> : <Icons.ArrowRight className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {showSuggestions && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                                                {suggestions.map((s, i) => (
                                                    <div 
                                                        key={i}
                                                        onClick={() => selectSuggestion(s)}
                                                        className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer text-gray-700 flex justify-between items-center border-b border-gray-50 last:border-0"
                                                    >
                                                        <span className="font-medium">{s.name}</span>
                                                        <span className="text-xs text-gray-400 font-mono">{s.calories} kcal</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                        </div>
                    )
                })}
            </div>
        </>
        ) : (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-ios">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary">
                            <Icons.Activity size={16}/> 
                        </div>
                        健康分趋势
                    </h3>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF2D55" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#FF2D55" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#E5E5EA" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="health" stroke="#FF2D55" strokeWidth={3} fillOpacity={1} fill="url(#colorHealth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 <div className="bg-white p-6 rounded-[2.5rem] shadow-ios">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-secondary">
                            <Icons.User size={16}/> 
                        </div>
                        体重变化
                    </h3>
                    <div className="h-56 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="name" stroke="#E5E5EA" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}/>
                                <Line type="monotone" dataKey="weight" stroke="#5856D6" strokeWidth={3} dot={{fill: '#5856D6', r: 4, strokeWidth: 0}} activeDot={{r: 6}}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Modern Modal */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowRecModal(false)}></div>
            <div className="relative bg-surface w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slide-up">
                <div className="p-6 pb-2 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <Avatar mood="talking" size="sm" /> 
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">Pudding's Picks</h3>
                            <p className="text-xs text-gray-400">专属于你的推荐</p>
                        </div>
                    </div>
                    <button onClick={() => setShowRecModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                        <Icons.ChevronLeft className="rotate-[-90deg]" size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-background">
                    {isAnalyzing && !recommendations.length ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                             <Icons.Loader2 className="w-10 h-10 animate-spin text-primary"/>
                             <p className="text-sm font-medium">正在思考完美的搭配...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!chatMode ? (
                                <>
                                    {recommendations.map((rec, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => acceptRecommendation(rec)}
                                            className="bg-white p-5 rounded-3xl shadow-sm border border-transparent hover:border-primary/20 transition-all active:scale-98 cursor-pointer relative overflow-hidden group"
                                        >
                                            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 transition-colors group-hover:bg-primary/10"></div>
                                            
                                            <div className="flex justify-between items-start mb-2 relative z-10">
                                                <h4 className="font-bold text-gray-900 text-lg">{rec.name}</h4>
                                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                    <Icons.Plus size={16}/>
                                                </div>
                                            </div>
                                            <p className="text-sm text-primary mb-3 font-medium">{rec.reason}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {rec.tags?.map((t: string) => (
                                                    <span key={t} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-md">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setChatMode(true)}
                                        className="w-full py-4 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-3xl hover:bg-gray-50 transition-colors mt-4"
                                    >
                                        想吃别的？和我聊聊
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col h-[50vh]">
                                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 flex-shrink-0 mt-1"><Avatar mood="happy" size="sm"/></div>
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[85%] border border-gray-100">
                                                还有什么特别想吃的口味吗？比如甜的，辣的？
                                            </div>
                                        </div>
                                        {chatHistory.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'}`}>
                                                 {msg.role === 'ai' && <div className="w-8 h-8 flex-shrink-0 mt-1"><Avatar mood="talking" size="sm"/></div>}
                                                 <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                                                     msg.role === 'user' 
                                                     ? 'bg-primary text-white rounded-tr-none' 
                                                     : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                                                 }`}>
                                                    {msg.text}
                                                 </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <input 
                                            className="flex-1 bg-white border-0 ring-1 ring-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none shadow-sm" 
                                            placeholder="比如：我想喝汤..."
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter') {
                                                    const val = e.currentTarget.value;
                                                    setChatHistory([...chatHistory, {role: 'user', text: val}]);
                                                    e.currentTarget.value = '';
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