import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Plus, Check, X, Trash2, Loader, User
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface MeetingUser { _id: string; name: string; email: string; avatar?: string; }
interface Meeting {
  _id: string;
  title: string;
  description: string;
  organizer: MeetingUser;
  participant: MeetingUser;
  date: string;
  duration: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  roomId: string;
}

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'pending' | 'past'>('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    participantId: '',
    date: '',
    time: '',
    duration: 30,
  });

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/meetings');
      setMeetings(data.meetings);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setAllUsers(data.users);
    } catch {
      // silent
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.participantId || !form.date || !form.time) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      await api.post('/meetings/create', {
        title: form.title,
        description: form.description,
        participantId: form.participantId,
        date: dateTime,
        duration: form.duration,
      });
      toast.success('Meeting scheduled!');
      setShowModal(false);
      setForm({ title: '', description: '', participantId: '', date: '', time: '', duration: 30 });
      fetchMeetings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/meetings/${id}/status`, { status });
      toast.success(`Meeting ${status}`);
      fetchMeetings();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Cancel this meeting?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Meeting cancelled');
      setMeetings(prev => prev.filter(m => m._id !== id));
    } catch {
      toast.error('Failed to cancel meeting');
    }
  };

  const now = new Date();

  const filteredMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.date);
    if (activeTab === 'upcoming') return meetingDate >= now && m.status === 'accepted';
    if (activeTab === 'pending') return m.status === 'pending';
    if (activeTab === 'past') return meetingDate < now || m.status === 'completed' || m.status === 'rejected';
    return true; // 'all'
  });

  const statusVariant = (status: Meeting['status']) => {
    if (status === 'accepted') return 'success';
    if (status === 'rejected') return 'error';
    if (status === 'completed') return 'secondary';
    return 'warning';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'pending', label: 'Pending' },
    { key: 'past', label: 'Past' },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setShowModal(true)}>
          Schedule Meeting
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && meetings.filter(m => m.status === 'pending').length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">
                {meetings.filter(m => m.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Meetings list */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            {filteredMeetings.length} Meeting{filteredMeetings.length !== 1 ? 's' : ''}
          </h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader size={32} className="animate-spin text-primary-600" />
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No {activeTab} meetings</p>
              <p className="text-sm mt-1">
                {activeTab === 'all' || activeTab === 'upcoming' ? 'Schedule a meeting to get started' : ''}
              </p>
              {(activeTab === 'all' || activeTab === 'upcoming') && (
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowModal(true)}>
                  Schedule Meeting
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map(meeting => {
                const isOrganizer = meeting.organizer._id === user?.id;
                const otherPerson = isOrganizer ? meeting.participant : meeting.organizer;

                return (
                  <div
                    key={meeting._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 rounded-xl">
                        <Calendar size={22} className="text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                          <Badge variant={statusVariant(meeting.status)} size="sm">
                            {meeting.status}
                          </Badge>
                        </div>
                        {meeting.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{meeting.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(meeting.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatTime(meeting.date)} · {meeting.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {isOrganizer ? `With ${otherPerson?.name}` : `From ${otherPerson?.name}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                      {!isOrganizer && meeting.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            leftIcon={<Check size={14} />}
                            onClick={() => handleStatus(meeting._id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            leftIcon={<X size={14} />}
                            onClick={() => handleStatus(meeting._id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {isOrganizer && meeting.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 p-2"
                          onClick={() => handleDelete(meeting._id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Schedule Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Schedule a Meeting</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Investment Discussion"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="What is this meeting about?"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Participant *</label>
                <select
                  value={form.participantId}
                  onChange={e => setForm({ ...form, participantId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select a user --</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                isLoading={submitting}
                leftIcon={<Calendar size={16} />}
              >
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};