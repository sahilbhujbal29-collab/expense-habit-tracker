import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Plus, X, Download, Check, Trash2, AlertTriangle, Coffee, Book, Dumbbell, Heart, Clock, Moon, Sun, Zap, Music, Target, Brain, Droplet, Activity, Award, Star, Timer } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AVAILABLE_ICONS = {
  coffee: Coffee,
  book: Book,
  dumbbell: Dumbbell,
  heart: Heart,
  moon: Moon,
  sun: Sun,
  zap: Zap,
  music: Music,
  target: Target,
  brain: Brain,
  droplet: Droplet,
  activity: Activity,
  award: Award,
  star: Star,
  timer: Timer
};

const ExpenseHabitTracker = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenses, setExpenses] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitCompletions, setHabitCompletions] = useState({});
  const [tags, setTags] = useState(['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const HABIT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

  useEffect(() => {
    const loadData = () => {
      try {
        const expensesData = localStorage.getItem('expenses');
        const habitsData = localStorage.getItem('habits');
        const completionsData = localStorage.getItem('habitCompletions');
        const tagsData = localStorage.getItem('tags');
        if (expensesData) setExpenses(JSON.parse(expensesData));
        if (habitsData) setHabits(JSON.parse(habitsData));
        if (completionsData) setHabitCompletions(JSON.parse(completionsData));
        if (tagsData) setTags(JSON.parse(tagsData));
      } catch (error) {
        console.log('No data found');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('habitCompletions', JSON.stringify(habitCompletions));
    localStorage.setItem('tags', JSON.stringify(tags));
  }, [expenses, habits, habitCompletions, tags]);

  const addExpense = useCallback((expenseData) => {
    if (!expenseData.amount) return;
    setExpenses(prev => [...prev, { id: Date.now(), ...expenseData, amount: parseFloat(expenseData.amount) }]);
  }, []);

  const deleteExpense = useCallback((id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const addHabit = useCallback((habitName, color) => {
    if (!habitName.trim()) return;
    setHabits(prev => [...prev, { id: Date.now(), name: habitName, color: color || HABIT_COLORS[prev.length % HABIT_COLORS.length] }]);
  }, []);

  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitCompletions(prev => {
      const newCompletions = { ...prev };
      Object.keys(newCompletions).forEach(date => { delete newCompletions[date][id]; });
      return newCompletions;
    });
  }, []);

  const updateHabitColor = useCallback((id, color) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, color } : h));
  }, []);

  const updateHabitIcon = useCallback((id, icon) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, icon } : h));
  }, []);

  const toggleHabit = useCallback((habitId, date) => {
    setHabitCompletions(prev => {
      const newCompletions = { ...prev };
      if (!newCompletions[date]) newCompletions[date] = {};
      newCompletions[date][habitId] = !newCompletions[date][habitId];
      return newCompletions;
    });
  }, []);

  const addTag = useCallback((tagName) => {
    if (!tagName.trim()) return;
    setTags(prev => prev.includes(tagName) ? prev : [...prev, tagName]);
  }, []);

  const removeTag = useCallback((tagName) => {
    setTags(prev => prev.filter(t => t !== tagName));
  }, []);

  const clearAllData = useCallback(() => {
    setExpenses([]);
    setHabits([]);
    setHabitCompletions({});
    setTags(['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']);
    localStorage.clear();
    setShowClearConfirm(false);
  }, []);

  const isAllHabitsComplete = useCallback((date) => {
    if (habits.length === 0) return false;
    return habits.every(habit => habitCompletions[date]?.[habit.id]);
  }, [habits, habitCompletions]);

  const getCompletedHabitsForDate = useCallback((date) => {
    if (!habitCompletions[date]) return [];
    return habits.filter(habit => habitCompletions[date][habit.id]);
  }, [habits, habitCompletions]);

  const getExpensesForDate = useCallback((date) => expenses.filter(e => e.date === date), [expenses]);

  const getTotalForDate = useCallback((date) => {
    const dayExpenses = getExpensesForDate(date);
    const spent = dayExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const earned = dayExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    return { spent, earned, net: earned - spent };
  }, [getExpensesForDate]);

  const getExpensesByTag = useCallback(() => {
    const byTag = {};
    expenses.filter(e => e.type === 'expense').forEach(e => { byTag[e.tag] = (byTag[e.tag] || 0) + e.amount; });
    return Object.entries(byTag).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const getMonthlyData = useCallback(() => {
    const monthlyData = {};
    expenses.forEach(e => {
      const month = e.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { expenses: 0, income: 0 };
      if (e.type === 'expense') monthlyData[month].expenses += e.amount;
      else monthlyData[month].income += e.amount;
    });
    return Object.entries(monthlyData).map(([month, data]) => ({ month, expenses: data.expenses, income: data.income })).slice(-6);
  }, [expenses]);

  const downloadData = useCallback(() => {
    const data = { expenses, habits, habitCompletions, tags, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [expenses, habits, habitCompletions, tags]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const FireAnimation = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 w-8 h-8 rounded-full animate-fire"
          style={{
            left: `${(i * 12) + 5}%`,
            background: 'linear-gradient(to top, #ff4500, #ffa500, #ffff00)',
            animation: `fire ${1 + Math.random()}s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
            opacity: 0.8
          }}
        />
      ))}
      <style>{`
        @keyframes fire {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-100px) scale(1.2); opacity: 0.6; }
          100% { transform: translateY(-200px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );

  const RainAnimation = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 bg-blue-400 animate-rain"
          style={{
            left: `${Math.random() * 100}%`,
            height: '20px',
            animation: `rain ${0.5 + Math.random() * 0.5}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.6
          }}
        />
      ))}
      <style>{`
        @keyframes rain {
          0% { transform: translateY(-20px); }
          100% { transform: translateY(120px); }
        }
      `}</style>
    </div>
  );

  const CalendarView = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
  
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const goToPreviousMonth = () => {
      setCalendarDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
      setCalendarDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
      setCalendarDate(new Date());
    };



    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Previous Month">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={goToToday} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors">Today</button>
          </div>
          <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Next Month">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 p-2">{day}</div>
          ))}
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const today = new Date().toISOString().split('T')[0];
            const isFuture = date > today;

            const { spent, earned } = getTotalForDate(date);
            const allComplete = isAllHabitsComplete(date);
            const completedHabits = getCompletedHabitsForDate(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            const noHabitsCompleted = habits.length > 0 && completedHabits.length === 0;
            const someHabitsCompleted = completedHabits.length > 0 && !allComplete;
            let dayClass ='p-2 rounded-lg border-2 relative transition-all text-black ';

            if (isFuture) {
              dayClass += 'bg-gray-200 border-gray-300 cursor-not-allowed';
            } else if (allComplete) {
              dayClass += 'bg-orange-50 border-orange-400 cursor-pointer hover:shadow-md';
            } else if (noHabitsCompleted) {
              dayClass += 'bg-blue-50 border-blue-300 cursor-pointer hover:shadow-md';
            } else {
              dayClass += 'bg-gray-50 border-gray-200 cursor-pointer hover:shadow-md';
            }

            if (isToday) {
              dayClass += ' ring-2 ring-blue-500';
            }
            return (
             <div key={idx} className={dayClass} onClick={() => {if(!isFuture) { setSelectedDate(date); setCurrentView('daily'); }}}>
              {!isFuture && allComplete && <FireAnimation />}
              {!isFuture && noHabitsCompleted && <RainAnimation />}
              {!isFuture && someHabitsCompleted &&  (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {completedHabits.map((habit, idx) => (
                      <div
                        key={habit.id}
                        className="absolute w-1 h-1 rounded-full animate-float"
                        style={{
                          backgroundColor: habit.color,
                          left: `${20 + (idx * 15)}%`,
                          animation: `float ${2 + Math.random()}s ease-in-out infinite`,
                          animationDelay: `${idx * 0.3}s`,
                          top: '10%'
                        }}
                      />
                    ))}
                    <style>{`
                      @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-15px); }
                      }
                    `}</style>
                  </div>
                )}

                {isFuture && (
                  <div className="absolute inset-0 pointer-events-none z-0">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, rgba(6, 198, 223, 0.08) 0, rgba(28, 69, 182, 0.08) 5px, transparent 1px, transparent 8px)'
                      }}
                    />
                  </div>
                )}
                {isFuture && (
                  <div className="absolute top-1 right-1 text-gray-500 text-xs z-10">
                    <Clock size={14} />
                  </div>
                )}
                <div className="text-center font-semibold mb-1 relative z-10">{day}</div>
                {!isFuture && completedHabits.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mb-1 relative z-10">
                    {completedHabits.slice(0, 6).map(habit => (
                      <div key={habit.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color }} title={habit.name} />
                    ))}
                  </div>
                )}
                {!isFuture &&(spent > 0 || earned > 0) && (
                  <div className="text-xs relative z-10">
                    {spent > 0 && <div className="text-red-600 truncate">-₹{spent.toFixed(0)}</div>}
                    {earned > 0 && <div className="text-green-600 truncate">+₹{earned.toFixed(0)}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {habits.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2">Habit Legend</h3>
            <div className="flex flex-wrap gap-2">
              {habits.map(habit => (
                <div key={habit.id} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                  <span>{habit.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const OverviewView = () => {
    const monthlyData = getMonthlyData();
    const expensesByTag = getExpensesByTag();
    const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-600 text-sm">Total Expenses</p><p className="text-2xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</p></div>
              <TrendingDown className="text-red-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-600 text-sm">Total Income</p><p className="text-2xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p></div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-600 text-sm">Net Balance</p><p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{(totalIncome - totalExpenses).toFixed(2)}</p></div>
            </div>
          </div>
        </div>
        <CalendarView />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-x1 font-bold mb-4">Monthly Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Bar dataKey="income" fill="#10b981" name="Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expensesByTag} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {expensesByTag.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const DailyView = () => {
    const [newExpense, setNewExpense] = useState({ amount: '', type: 'expense', tag: 'Food', description: '', date: selectedDate });
    const dayExpenses = getExpensesForDate(selectedDate);
    const { spent, earned, net } = getTotalForDate(selectedDate);

    const handleAddExpense = () => {
      addExpense(newExpense);
      setNewExpense({ amount: '', type: 'expense', tag: 'Food', description: '', date: selectedDate });
    };

    useEffect(() => { setNewExpense(prev => ({ ...prev, date: selectedDate })); }, [selectedDate]);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg"><p className="text-sm text-gray-600">Spent</p><p className="text-xl font-bold text-red-600">₹{spent.toFixed(2)}</p></div>
            <div className="text-center p-4 bg-green-50 rounded-lg"><p className="text-sm text-gray-600">Earned</p><p className="text-xl font-bold text-green-600">₹{earned.toFixed(2)}</p></div>
            <div className="text-center p-4 bg-blue-50 rounded-lg"><p className="text-sm text-gray-600">Net</p><p className={`text-xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{net.toFixed(2)}</p></div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Type</label><select value={newExpense.type} onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="expense">Expense</option><option value="income">Income</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Amount (₹)</label><input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" /></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={newExpense.tag} onChange={(e) => setNewExpense({ ...newExpense, tag: e.target.value })} className="w-full px-3 py-2 border rounded-lg">{tags.map(tag => (<option key={tag} value={tag}>{tag}</option>))}</select></div>
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Description</label><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Optional description" /></div>
            </div>
            <button onClick={handleAddExpense} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><Plus size={20} />Add Transaction</button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Transactions</h3>
          <div className="space-y-2">
            {dayExpenses.length === 0 ? (<p className="text-gray-500 text-center py-4">No transactions for this day</p>) : (dayExpenses.map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${expense.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>{expense.type === 'expense' ? '-' : '+'}₹{expense.amount.toFixed(2)}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{expense.tag}</span>
                  </div>
                  {expense.description && (<p className="text-sm text-gray-600 mt-1">{expense.description}</p>)}
                </div>
                <button onClick={() => deleteExpense(expense.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
              </div>
            )))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Habits for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
          <div className="space-y-2">
            {habits.length === 0 ? (<p className="text-gray-500 text-center py-4">No habits yet. Add some in Settings!</p>) : (habits.map(habit => {
              const IconComponent = AVAILABLE_ICONS[habit.icon] || Star;
              return (
                <div key={habit.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${habitCompletions[selectedDate]?.[habit.id] ? 'border-2' : 'bg-gray-50 border-2 border-gray-200'}`} style={{ backgroundColor: habitCompletions[selectedDate]?.[habit.id] ? `${habit.color}20` : undefined, borderColor: habitCompletions[selectedDate]?.[habit.id] ? habit.color : undefined }} onClick={() => toggleHabit(habit.id, selectedDate)}>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: habit.color }}>
                      <IconComponent className="text-white" size={20} />
                    </div>
                    <span className="font-medium">{habit.name}</span>
                  </div>
                  {habitCompletions[selectedDate]?.[habit.id] && (<Check className="text-green-600" size={20} />)}
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    const [newHabit, setNewHabit] = useState('');
    const [newTag, setNewTag] = useState('');
    const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState('star');

    const handleAddHabit = () => {
      addHabit(newHabit, selectedColor, selectedIcon);
      setNewHabit('');
      setSelectedColor(HABIT_COLORS[habits.length % HABIT_COLORS.length]);
      setSelectedIcon('star');
    };

    const handleAddTag = () => { addTag(newTag); setNewTag(''); };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Manage Habits</h3>
          <div className="space-y-4 mb-4">
            <input type="text" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()} className="w-full px-3 py-2 border rounded-lg" placeholder="New habit name" />
            
            <div>
              <label className="block text-sm font-medium mb-2">Choose Color</label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-10 h-10 rounded-full cursor-pointer"
                  title="Custom color"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Choose Icon</label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(AVAILABLE_ICONS).map(([key, IconComponent]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedIcon(key)}
                    className={`p-3 rounded-lg border-2 transition-all ${selectedIcon === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    title={key}
                  >
                    <IconComponent size={24} className="mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAddHabit} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Plus size={20} />Add Habit
            </button>
          </div>
          
          <div className="space-y-2">
            {habits.map(habit => {
              const IconComponent = AVAILABLE_ICONS[habit.icon] || Star;
              return (
                <div key={habit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: habit.color }}>
                      <IconComponent className="text-white" size={20} />
                    </div>
                    <span>{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={habit.icon}
                      onChange={(e) => updateHabitIcon(habit.id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {Object.keys(AVAILABLE_ICONS).map(iconKey => (
                        <option key={iconKey} value={iconKey}>{iconKey}</option>
                      ))}
                    </select>
                    <input
                      type="color"
                      value={habit.color}
                      onChange={(e) => updateHabitColor(habit.id, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Change color"
                    />
                    <button onClick={() => deleteHabit(habit.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Manage Categories</h3>
          <div className="flex gap-2 mb-4">
            <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTag()} className="flex-1 px-3 py-2 border rounded-lg" placeholder="New category name" />
            <button onClick={handleAddTag} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Plus size={20} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <div key={tag} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                <span>{tag}</span>
                {!['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'].includes(tag) && (<button onClick={() => removeTag(tag)} className="hover:text-red-600"><X size={14} /></button>)}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Data Management</h3>
          <div className="space-y-3">
            <button onClick={downloadData} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"><Download size={20} />Download All Data (JSON)</button>
            {!showClearConfirm ? (
              <button onClick={() => setShowClearConfirm(true)} className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"><Trash2 size={20} />Clear All Data</button>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                  <div><p className="font-semibold text-red-800">Are you sure?</p><p className="text-sm text-red-700">This will permanently delete all data.</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearAllData} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Yes, Delete Everything</button>
                  <button onClick={() => setShowClearConfirm(false)} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Expense & Habit Tracker</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCurrentView('overview')} className={`px-4 py-2 rounded-lg ${currentView === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Overview</button>
            <button onClick={() => setCurrentView('daily')} className={`px-4 py-2 rounded-lg ${currentView === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Daily View</button>
            <button onClick={() => setCurrentView('settings')} className={`px-4 py-2 rounded-lg ${currentView === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Settings</button>
          </div>
        </div>
        {currentView === 'overview' && <OverviewView />}
        {currentView === 'daily' && <DailyView />}
        {currentView === 'settings' && <SettingsView />}
      </div>
    </div>
  );
};

export default ExpenseHabitTracker;