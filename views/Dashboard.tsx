import React, { useState, useEffect, useRef } from 'react';
import { AppState, MealType, MealEntry, DayLog, UserProfile } from '../types';
import { Avatar } from '../components/Avatar';
import { Icons } from '../components/Icons';
import * as GeminiService from '../services/geminiService';
import { searchRecipes, PredefinedRecipe } from '../data/recipes';

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
  // --- State ---
  const [viewDate, setViewDate] = useState(state.currentDate); 
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Input State
  const [activeInputType, setActiveInputType] = useState<MealType | null>(null); 
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<PredefinedRecipe[]>([]);
  
  // Async State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecModal, setShowRecModal] = useState(false);
  const [dailyReport, setDailyReport] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLog = state.logs[viewDate] || { 
    date: viewDate, 
    mood: 'calm', 
    meals: [] 
  };

  const isToday = viewDate === state.currentDate;

  // --- Effects ---

  useEffect(() => {
    const handleScroll = () => {
       setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate Report
  useEffect(() => {
    if (currentLog.meals.length > 0 && !dailyReport && state.user && isToday) {
        GeminiService.getDailyReport(currentLog, state.user).then(setDailyReport);
    }
  }, [currentLog.meals.length, viewDate, isToday]);

  useEffect(() => {
    if (activeInputType && inputRef.current) {
        inputRef.current.focus();
    }
  }, [activeInputType]);

  // --- Handlers ---

  const handleMoodChange = (mood: any) => updateLog(viewDate, { ...currentLog, mood });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputText(val);
      if (val.trim()) {
          const results = searchRecipes(val);
          setSuggestions(results);
      } else {
          setSuggestions([]);
      }
  };

  const submitMeal = async (type: MealType, text: string) => {
    if (!text.trim() || !state.user) return;
    setIsAnalyzing(true);
    setSuggestions([]);

    try {
      const analysis = await GeminiService.analyzeMeal(text, state.user);
      const newMeal: MealEntry = {
        id: Date.now().toString(),
        date: viewDate,
        type: type,
        description: text,
        nutrition: analysis || undefined,
        isRecommended: false
      };
      const updatedMeals = [...currentLog.meals, newMeal];
      updateLog(viewDate, { ...currentLog, meals: updatedMeals });
      setInputText('');
      setActiveInputType(null);
    } catch (e) { alert("AI分析失败，请重试"); } 
    finally { setIsAnalyzing(false); }
  };

  const handleRecommendClick = async (type: MealType) => {
      if (!state.user) return;
      setIsAnalyzing(true);
      setShowRecModal(true);
      try {
        const history = (Object.values(state.logs) as DayLog[]).slice(-7);
        const recs = await GeminiService.getMealRecommendation(type, state.user, history);
        setRecommendations(recs);
      } finally { setIsAnalyzing(false); }
  };

  // --- Render Helpers ---

  const renderCalendarStrip = () => {
      const dates = [];
      for (let i = -2; i <= 2; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          dates.push(d);
      }

      return (
          <div className="flex justify-between items-center gap-2 px-1">
              {dates.map((d) => {
                  const dStr = d.toISOString().split('T')[0];
                  const isSelected = dStr === viewDate;
                  const isTodayDate = dStr === state.currentDate;
                  
                  return (
                      <button 
                          key={dStr}
                          onClick={() => setViewDate(dStr)}
                          className={`flex flex-col items-center justify-center w-[18%] h-16 rounded-2xl transition-all duration-300 ${
                              isSelected 
                                ? 'bg-black text-white shadow-lg scale-105' 
                                : 'bg-transparent text-text-tertiary hover:bg-white/50'
                          }`}
                      >
                          <span className={`text-[10px] font-medium uppercase tracking-wide ${isSelected ? 'text-white/70' : ''}`}>
                             {isTodayDate ? '今天' : ['日','一','二','三','四','五','六'][d.getDay()]}
                          </span>
                          <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-text'}`}>
                              {d.getDate()}
                          </span>
                      </button>
                  )
              })}
          </div>
      );
  };

  const renderBackground = () => (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Subtle blurred blobs */}
          <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-blue-100 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] bg-pink-100 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[70vw] h-[70vw] bg-purple-50 rounded-full blur-[120px] opacity-50"></div>
      </div>
  );

  return (
    <div className="relative min-h-screen pb-32 safe-top">
      {renderBackground()}

      {/* --- Sticky Header --- */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-gray-100/50' : 'bg-transparent'}`}>
         <div className="max-w-md mx-auto px-4 py-2">
            {/* Top Bar: Month & Stats Icon */}
            <div className="flex justify-between items-center mb-2 px-2">
                <h2 className="text-xl font-bold text-text font-sans">
                    {new Date(viewDate).getMonth() + 1}月
                </h2>
                <div className="flex gap-3">
                   {/* Mood Toggle (Mini) */}
                   <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-text-secondary">
                        {MOODS.find(m => m.value === currentLog.mood)?.icon || <Icons.Smile size={18}/>}
                   </button>
                   {/* Stats */}
                   <button className="w-8 h-8 rounded-full bg-black text-white shadow-sm flex items-center justify-center">
                        <Icons.BarChart2 size={16} />
                   </button>
                </div>
            </div>
            {/* Date Strip */}
            {renderCalendarStrip()}
         </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-5 pt-6 space-y-8">
        
        {/* --- Hero: Conversation --- */}
        <section className="flex flex-col items-center animate-fade-in">
             <div className="relative mb-4">
                 <Avatar mood={isAnalyzing ? 'thinking' : currentLog.mood === 'happy' ? 'happy' : 'idle'} size="md" />
                 {/* Status Indicator */}
                 <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                     currentLog.mood === 'happy' ? 'bg-yellow-200' : 'bg-blue-200'
                 }`}>
                     <span className="text-[10px]">✨</span>
                 </div>
             </div>
             
             {/* Speech Bubble */}
             <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-[2rem] rounded-t-sm shadow-card max-w-[90%] transform transition-all hover:scale-[1.02]">
                <p className="text-text text-sm leading-relaxed text-center font-medium">
                    {dailyReport || "今天也要好好吃饭，好好爱自己哦！"}
                </p>
             </div>
        </section>

        {/* --- Meals Stack --- */}
        <section className="space-y-6 pb-10">
            {[MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK].map((type, idx) => {
                const meals = currentLog.meals.filter(m => m.type === type);
                const hasMeals = meals.length > 0;
                const isInputting = activeInputType === type;
                const totalCals = meals.reduce((acc, m) => acc + (m.nutrition?.calories || 0), 0);

                return (
                    <div 
                        key={type} 
                        className="animate-slide-up"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-3 px-2">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                {type === MealType.BREAKFAST && <Icons.Sun size={14} />}
                                {type === MealType.LUNCH && <Icons.Sun size={14} />}
                                {type === MealType.DINNER && <Icons.Moon size={14} />}
                                {type === MealType.SNACK && <Icons.Coffee size={14} />}
                                {type}
                            </h3>
                            {hasMeals && (
                                <span className="text-xs font-semibold text-text-tertiary bg-white px-2 py-0.5 rounded-md shadow-sm">
                                    {totalCals} kcal
                                </span>
                            )}
                        </div>

                        {/* Card Container */}
                        <div className={`bg-white rounded-[2rem] shadow-card overflow-hidden transition-all duration-300 ${isInputting ? 'ring-2 ring-primary/20 scale-[1.01]' : ''}`}>
                            
                            {/* Meal Items List */}
                            {hasMeals && (
                                <div className="divide-y divide-gray-50">
                                    {meals.map(meal => (
                                        <div key={meal.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                            <div>
                                                <p className="text-base font-semibold text-text">{meal.description}</p>
                                                {meal.nutrition && (
                                                    <p className="text-xs text-text-secondary mt-1 max-w-[200px] truncate">
                                                        {meal.nutrition.tags.join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                            {meal.nutrition && (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    meal.nutrition.healthScore >= 80 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                    {meal.nutrition.healthScore}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Input Area (Collapsible) */}
                            {isInputting ? (
                                <div className="p-4 bg-gray-50/50">
                                    <div className="relative flex items-center">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputText}
                                            onChange={handleInputChange}
                                            placeholder={`描述一下${type}...`}
                                            className="w-full bg-white py-3 pl-4 pr-12 rounded-2xl text-text placeholder-text-tertiary shadow-sm focus:ring-0 text-base"
                                            onKeyDown={(e) => e.key === 'Enter' && submitMeal(type, inputText)}
                                        />
                                        <button 
                                            onClick={() => submitMeal(type, inputText)}
                                            className="absolute right-2 p-2 bg-black text-white rounded-xl shadow-md disabled:opacity-50"
                                            disabled={!inputText.trim() || isAnalyzing}
                                        >
                                            {isAnalyzing ? <Icons.Loader2 className="animate-spin" size={16} /> : <Icons.ArrowRight size={16} />}
                                        </button>
                                    </div>
                                    
                                    {/* Suggestions */}
                                    {suggestions.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setInputText(s.name); setSuggestions([]); inputRef.current?.focus(); }}
                                                    className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs text-text-secondary shadow-sm active:scale-95 transition-transform"
                                                >
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-3 flex justify-end">
                                        <button onClick={() => setActiveInputType(null)} className="text-xs text-text-tertiary px-2 py-1">取消</button>
                                    </div>
                                </div>
                            ) : (
                                /* Action Bar (Add / Recommend) */
                                <div className={`flex ${hasMeals ? 'border-t border-gray-50' : ''}`}>
                                    {/* Only show "Recommend" if it's today and empty (or specific logic) */}
                                    {(!hasMeals && isToday) && (
                                        <button 
                                            onClick={() => handleRecommendClick(type)}
                                            className="flex-1 py-4 flex items-center justify-center gap-2 text-primary font-medium text-sm hover:bg-primary/5 transition-colors active:bg-primary/10 relative overflow-hidden group"
                                        >
                                            <Icons.Sparkles size={16} className="transition-transform group-hover:scale-110" />
                                            <span>吃什么?</span>
                                        </button>
                                    )}
                                    
                                    {/* Add Button */}
                                    <button 
                                        onClick={() => setActiveInputType(type)}
                                        className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium text-sm transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                                            !hasMeals && isToday ? 'text-text border-l border-gray-50' : 'text-text-secondary w-full'
                                        }`}
                                    >
                                        <Icons.Plus size={16} />
                                        <span>{hasMeals ? '再记一项' : '我吃过了'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </section>

      </main>

      {/* --- Recommendation Modal (Bottom Sheet Style) --- */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setShowRecModal(false)}></div>
            
            {/* Sheet */}
            <div className="relative bg-[#F2F2F7] w-full max-w-md rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>
                
                {/* Header */}
                <div className="px-6 py-4">
                    <h3 className="text-xl font-bold text-text">Pudding 的建议</h3>
                    <p className="text-sm text-text-secondary mt-1">根据你的状态精心挑选</p>
                </div>

                <div className="px-6 pb-8 overflow-y-auto flex-1 space-y-4">
                    {isAnalyzing && !recommendations.length ? (
                        <div className="py-12 flex flex-col items-center justify-center text-text-tertiary gap-3">
                            <Icons.Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-sm">正在思考...</p>
                        </div>
                    ) : (
                        recommendations.map((rec, idx) => (
                            <div 
                                key={idx}
                                onClick={() => { setInputText(rec.name); setActiveInputType(activeInputType || MealType.LUNCH); setShowRecModal(false); }}
                                className="bg-white p-5 rounded-[1.5rem] shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-text">{rec.name}</h4>
                                    <div className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-bold">
                                        推荐
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary leading-snug mb-3">{rec.reason}</p>
                                <div className="flex flex-wrap gap-2">
                                    {rec.tags?.map((t: string) => (
                                        <span key={t} className="text-[10px] bg-gray-100 text-text-secondary px-2 py-1 rounded-md">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};