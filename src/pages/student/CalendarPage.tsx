import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { apiClient } from '../../services/api/apiClient';

export const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/student/history');
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const renderDays = () => {
    const days = [];
    const today = new Date();

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 sm:p-4 min-h-[80px] sm:min-h-[100px] border border-border/50 bg-surface/30"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === today.getDate() && 
        currentDate.getMonth() === today.getMonth() && 
        currentDate.getFullYear() === today.getFullYear();
        
      // Match history records for this day by formatting locally to avoid UTC offset issues
      const localMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const localDay = String(day).padStart(2, '0');
      const dayDate = `${year}-${localMonth}-${localDay}`;
      const dayRecords = history.filter(h => h.date && h.date.startsWith(dayDate));
      
      const hasBreakfast = dayRecords.some(h => h.meal_type === 'BREAKFAST');
      const hasLunch = dayRecords.some(h => h.meal_type === 'LUNCH');
      const hasDinner = dayRecords.some(h => h.meal_type === 'DINNER');

      days.push(
        <div 
          key={day} 
          className={`p-1 sm:p-2 min-h-[80px] sm:min-h-[100px] border border-border/50 transition-colors ${isToday ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-white hover:bg-surface/50'}`}
        >
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <span className={`text-sm sm:text-base font-medium w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-secondary'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            <div className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded flex items-center justify-between ${hasBreakfast ? 'bg-success/10 text-success' : 'text-text-muted bg-surface/50'}`}>
              <span className="hidden sm:inline">Breakfast</span><span className="sm:hidden">BF</span>
              {hasBreakfast ? <Check size={12} /> : <span>—</span>}
            </div>
            <div className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded flex items-center justify-between ${hasLunch ? 'bg-success/10 text-success' : 'text-text-muted bg-surface/50'}`}>
              <span className="hidden sm:inline">Lunch</span><span className="sm:hidden">L</span>
              {hasLunch ? <Check size={12} /> : <span>—</span>}
            </div>
            <div className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded flex items-center justify-between ${hasDinner ? 'bg-success/10 text-success' : 'text-text-muted bg-surface/50'}`}>
              <span className="hidden sm:inline">Dinner</span><span className="sm:hidden">D</span>
              {hasDinner ? <Check size={12} /> : <span>—</span>}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="p-2 hover:bg-surface rounded-full transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-secondary">Meal Calendar</h1>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-secondary">{monthName} {year}</h2>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth}
                className="p-1.5 sm:p-2 rounded-lg border border-border hover:bg-surface transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1.5 sm:p-2 rounded-lg border border-border hover:bg-surface transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border/50 rounded-lg overflow-hidden border border-border/50">
            {weekDays.map(day => (
              <div key={day} className="bg-surface p-2 text-center text-xs sm:text-sm font-semibold text-text-muted">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
            
            {loading ? (
                <div className="col-span-7 h-64 flex items-center justify-center text-text-muted animate-pulse bg-white">
                    Loading calendar data...
                </div>
            ) : renderDays()}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-text-muted items-center justify-center sm:justify-start border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success/20 border border-success/30 rounded-sm"></div>
              <span>Meal Claimed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 border border-primary/30 rounded-full"></div>
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
