import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Clock, Users, X, Edit, Trash2, Play } from 'lucide-react';
import { apiClient } from '../../services/api/apiClient';

export const MealsPage = () => {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMeal, setEditMeal] = useState<any>(null);

  // Form state
  const [newMealData, setNewMealData] = useState({ meal_name: 'BREAKFAST', start_time: '06:00', end_time: '09:00' });
  const [editMealData, setEditMealData] = useState({ start_time: '', end_time: '' });
  const [formError, setFormError] = useState('');

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/meals');
      setMeals(response.data);
    } catch (err) {
      console.error("Failed to load meals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await apiClient.post('/admin/meals', newMealData);
      setShowNewModal(false);
      fetchMeals();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create schedule');
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editMeal) return;
    try {
      await apiClient.put(`/admin/meals/${editMeal.id}`, editMealData);
      setShowEditModal(false);
      fetchMeals();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (mealId: string, mealName: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${mealName} session?`)) {
      return;
    }
    setActionLoading(mealId);
    try {
      await apiClient.delete(`/admin/meals/${mealId}`);
      fetchMeals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete meal session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenNow = async (mealId: string) => {
    setActionLoading(mealId);
    try {
      await apiClient.post(`/admin/meals/${mealId}/open-now`);
      fetchMeals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to open meal session');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (meal: any) => {
    setEditMeal(meal);
    
    // Convert 12h AM/PM to 24h format for input type="time"
    const convertTime = (timeStr: string) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12 + '';
      return `${hours.padStart(2, '0')}:${minutes}`;
    };

    setEditMealData({
      start_time: convertTime(meal.startTime),
      end_time: convertTime(meal.endTime)
    });
    setFormError('');
    setShowEditModal(true);
  };

  if (loading && meals.length === 0) {
    return <div className="p-8 text-center animate-pulse text-text-muted">Loading meal sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Meal Sessions</h2>
          <p className="text-text-muted">Manage daily meal schedules and monitor active sessions.</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="flex items-center gap-2">
          <Plus size={20} />
          New Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {meals.map((meal) => (
          <Card key={meal.id} className={meal.status === 'OPEN' ? 'border-primary ring-1 ring-primary/20' : ''}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Meal Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-secondary">{meal.name}</h3>
                    <Badge 
                      variant={
                        meal.status === 'OPEN' ? 'success' : 
                        meal.status === 'UPCOMING' ? 'default' : 'neutral'
                      }
                    >
                      {meal.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} />
                      <span>{meal.startTime} - {meal.endTime}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 flex items-center md:justify-center gap-8 border-y md:border-y-0 md:border-x border-border py-4 md:py-0 md:px-8">
                  <div>
                    <p className="text-sm text-text-muted mb-1 flex items-center gap-1.5">
                      <Users size={16} />
                      Served
                    </p>
                    <p className="text-2xl font-bold text-secondary">
                      {meal.served} <span className="text-sm font-normal text-text-muted">/ {meal.total}</span>
                    </p>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2 max-w-[100px] mt-2 hidden md:block">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${meal.total > 0 ? (meal.served / meal.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 flex-1 flex-wrap">
                  {meal.status !== 'OPEN' && (
                    <Button 
                      onClick={() => handleOpenNow(meal.id)} 
                      isLoading={actionLoading === meal.id}
                      variant="primary" 
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Play size={16} />
                      Start Now
                    </Button>
                  )}
                  <Button onClick={() => openEditModal(meal)} variant="outline" className="flex items-center gap-1.5">
                    <Edit size={16} />
                    Edit Time
                  </Button>
                  <Button 
                    onClick={() => handleDeleteSchedule(meal.id, meal.name)} 
                    isLoading={actionLoading === meal.id}
                    variant="danger" 
                    className="flex items-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-0"
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
                
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Schedule Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border border-border animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Create New Schedule</h3>
              <button onClick={() => setShowNewModal(false)} className="text-text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                  {formError}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Meal Type</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={newMealData.meal_name}
                  onChange={e => setNewMealData({...newMealData, meal_name: e.target.value})}
                  required
                >
                  <option value="BREAKFAST">BREAKFAST</option>
                  <option value="LUNCH">LUNCH</option>
                  <option value="DINNER">DINNER</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Start Time</label>
                <Input 
                  type="time" 
                  value={newMealData.start_time}
                  onChange={e => setNewMealData({...newMealData, start_time: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">End Time</label>
                <Input 
                  type="time" 
                  value={newMealData.end_time}
                  onChange={e => setNewMealData({...newMealData, end_time: e.target.value})}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Schedule</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && editMeal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border border-border animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Edit {editMeal.name} Time</h3>
              <button onClick={() => setShowEditModal(false)} className="text-text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSchedule} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Start Time</label>
                <Input 
                  type="time" 
                  value={editMealData.start_time}
                  onChange={e => setEditMealData({...editMealData, start_time: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">End Time</label>
                <Input 
                  type="time" 
                  value={editMealData.end_time}
                  onChange={e => setEditMealData({...editMealData, end_time: e.target.value})}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
