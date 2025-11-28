import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, TrendingUp, Calendar, Award } from 'lucide-react';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toDateString();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await window.storage.get('habits-data', true);
      if (result && result.value) {
        setHabits(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No existing data, starting fresh');
    }
    setLoading(false);
  };

  const saveData = async (updatedHabits) => {
    try {
      await window.storage.set('habits-data', JSON.stringify(updatedHabits), true);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit = {
        id: Date.now(),
        name: newHabitName.trim(),
        completions: {}
      };
      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      saveData(updatedHabits);
      setNewHabitName('');
    }
  };

  const toggleHabit = (habitId) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completions = { ...habit.completions };
        if (completions[today]) {
          delete completions[today];
        } else {
          completions[today] = true;
        }
        return { ...habit, completions };
      }
      return habit;
    });
    setHabits(updatedHabits);
    saveData(updatedHabits);
  };

  const deleteHabit = (habitId) => {
    const updatedHabits = habits.filter(h => h.id !== habitId);
    setHabits(updatedHabits);
    saveData(updatedHabits);
    if (selectedHabit?.id === habitId) {
      setSelectedHabit(null);
    }
  };

  const calculateStreak = (habit) => {
    let streak = 0;
    let date = new Date();
    
    while (true) {
      const dateStr = date.toDateString();
      if (habit.completions[dateStr]) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateTotalCompletions = (habit) => {
    return Object.keys(habit.completions).length;
  };

  const calculateSuccessRate = (habit) => {
    const completionDates = Object.keys(habit.completions);
    if (completionDates.length === 0) return 0;
    
    const firstDate = new Date(Math.min(...completionDates.map(d => new Date(d))));
    const daysSinceStart = Math.ceil((new Date() - firstDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.round((completionDates.length / daysSinceStart) * 100);
  };

  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const isCompletedOnDate = (habit, date) => {
    return habit.completions[date.toDateString()] || false;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Habit Tracker</h1>
        
        {/* Add Habit Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              placeholder="Enter a new habit..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={addHabit}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={20} /> Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habits List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Today's Habits</h2>
            {habits.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No habits yet. Add one to get started!</p>
            ) : (
              <div className="space-y-3">
                {habits.map(habit => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedHabit(habit)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabit(habit.id);
                      }}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        habit.completions[today]
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {habit.completions[today] && <Check size={20} className="text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{habit.name}</p>
                      <p className="text-sm text-gray-500">
                        🔥 {calculateStreak(habit)} day streak
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHabit(habit.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistics Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Statistics</h2>
            {!selectedHabit ? (
              <p className="text-gray-500 text-center py-8">Select a habit to view statistics</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-purple-700">{selectedHabit.name}</h3>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="text-orange-600" size={20} />
                        <p className="text-sm text-orange-800">Current Streak</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-900">{calculateStreak(selectedHabit)}</p>
                      <p className="text-xs text-orange-700">days</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="text-green-600" size={20} />
                        <p className="text-sm text-green-800">Total</p>
                      </div>
                      <p className="text-3xl font-bold text-green-900">{calculateTotalCompletions(selectedHabit)}</p>
                      <p className="text-xs text-green-700">completions</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="text-blue-600" size={20} />
                        <p className="text-sm text-blue-800">Success Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{calculateSuccessRate(selectedHabit)}%</p>
                      <p className="text-xs text-blue-700">since you started</p>
                    </div>
                  </div>

                  {/* Calendar View */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="text-purple-600" size={20} />
                      <h4 className="font-semibold text-gray-800">Last 30 Days</h4>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {getLast30Days().map((date, idx) => (
                        <div
                          key={idx}
                          className={`aspect-square rounded ${
                            isCompletedOnDate(selectedHabit, date)
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                          title={date.toLocaleDateString()}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>30 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}