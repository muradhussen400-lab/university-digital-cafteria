import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, KeyRound, Download, Plus, X, UserPlus } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../services/api/apiClient';

export const StudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [resettingFor, setResettingFor] = useState<string | null>(null);
  const [removingFor, setRemovingFor] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{id: string, code: string, type: 'activation' | 'reset'} | null>(null);

  // New Student Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/admin/activations');
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newStudentId.trim() || !newFullName.trim()) {
      setAddError('Both Student ID and Full Name are required.');
      return;
    }
    setIsAdding(true);
    try {
      await apiClient.post('/admin/students', {
        student_id: newStudentId.trim(),
        full_name: newFullName.trim()
      });
      setShowAddModal(false);
      setNewStudentId('');
      setNewFullName('');
      fetchStudents();
    } catch (err: any) {
      setAddError(err.response?.data?.detail || 'Failed to add student');
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleGenerateCode = async (studentId: string) => {
    setGeneratingFor(studentId);
    try {
      const response = await apiClient.post('/admin/activations/generate', { student_id: studentId });
      setGeneratedCode({ id: studentId, code: response.data.activation_code, type: 'activation' });
      fetchStudents(); // refresh status
    } catch (err) {
      console.error("Failed to generate code", err);
      alert("Failed to generate activation code.");
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleResetPassword = async (studentId: string) => {
    setResettingFor(studentId);
    try {
      const response = await apiClient.post(`/admin/students/${studentId}/reset-password-code`);
      setGeneratedCode({ id: studentId, code: response.data.reset_code, type: 'reset' });
    } catch (err) {
      console.error("Failed to generate reset code", err);
      alert("Failed to generate password reset code.");
    } finally {
      setResettingFor(null);
    }
  };

  const handleRemoveStudent = async (studentId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}? They will no longer be able to log in or scan QR codes.`)) {
      return;
    }
    
    setRemovingFor(studentId);
    try {
      await apiClient.post(`/admin/students/${studentId}/deactivate`);
      fetchStudents();
    } catch (err) {
      console.error("Failed to remove student", err);
      alert("Failed to remove student.");
    } finally {
      setRemovingFor(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await apiClient.post('/admin/activations/export-pdf', {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'activation_codes.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export PDF.");
    }
  };

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Students Management</h2>
          <p className="text-text-muted">Manage student records and activation status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowAddModal(true)} variant="primary" className="flex items-center gap-2">
            <Plus size={20} />
            Add Student
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
            <Download size={20} />
            Export Codes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Students</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <Input 
                placeholder="Search by name or ID..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border text-text-muted text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Student Info</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-text-muted animate-pulse">Loading students...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-text-muted">No students found.</td></tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-secondary">{student.full_name}</p>
                          <p className="text-sm text-text-muted">{student.student_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 items-start">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-text-muted w-24">University:</span>
                            <Badge variant={student.status === 'ACTIVE' ? 'success' : 'default'}>
                              {student.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-text-muted w-24">Account:</span>
                            <Badge variant={student.is_activated ? 'success' : 'warning'}>
                              {student.is_activated ? 'ACTIVATED' : 'NOT ACTIVATED'}
                            </Badge>
                          </div>
                          {!student.is_activated && student.activation_code && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <span className="text-text-muted w-24">Code:</span>
                              <code className="bg-surface px-1 text-primary border border-border rounded">{student.activation_code}</code>
                              <span className="text-xs text-text-muted">
                                {student.expires_at ? `(Exp: ${new Date(student.expires_at).toLocaleDateString()})` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        {generatedCode?.id === student.student_id && (
                          <div className="mt-3 p-3 bg-surface rounded text-sm border border-border">
                            <span className="font-semibold text-primary block mb-1">
                              {generatedCode?.type === 'reset' ? 'Password Reset Code:' : 'New Activation Code:'}
                            </span>
                            <code className="bg-primary/10 text-primary px-2 py-1 rounded select-all font-mono block text-center text-lg mt-2 mb-1">
                              {generatedCode?.code}
                            </code>
                            {generatedCode?.type === 'reset' && (
                              <p className="text-xs text-text-muted text-center">Give this code to the student to reset their password.</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col gap-2 items-end">
                          {!student.is_activated ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateCode(student.student_id)}
                              isLoading={generatingFor === student.student_id}
                              className="w-full justify-center"
                            >
                              <KeyRound size={16} className="mr-2" /> {student.activation_code ? 'Regenerate Code' : 'Generate Code'}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResetPassword(student.student_id)}
                              isLoading={resettingFor === student.student_id}
                              className="w-full justify-center"
                            >
                              <KeyRound size={16} className="mr-2" /> Reset Password
                            </Button>
                          )}
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRemoveStudent(student.student_id, student.full_name)}
                            isLoading={removingFor === student.student_id}
                            className="w-full justify-center bg-danger/10 text-danger hover:bg-danger hover:text-white"
                          >
                            Remove Student
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border border-border animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-secondary">Add New Student</h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setAddError(''); }} 
                className="text-text-muted hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                  {addError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Student ID Number</label>
                <Input 
                  placeholder="e.g. 1802999 or DBU1802999" 
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Full Name</label>
                <Input 
                  placeholder="e.g. Abebe Bikila" 
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setShowAddModal(false); setAddError(''); }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  isLoading={isAdding}
                >
                  Save Student
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

