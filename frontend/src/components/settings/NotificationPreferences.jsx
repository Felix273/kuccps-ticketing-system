import React, { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, AlertTriangle, MessageSquare, Save, Send, CheckCircle } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    emailOnAssignment: true,
    emailOnStatusChange: true,
    emailOnNewComment: true,
    dailyDigest: true,
    escalationAlerts: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const result = await notificationService.getPreferences();
      if (result.success && result.preferences) {
        setPreferences(result.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const result = await notificationService.updatePreferences(preferences);
      if (result.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setMessage(null);
    
    try {
      const result = await notificationService.sendTestNotification();
      if (result.success) {
        setMessage({ type: 'success', text: 'Test email sent! Check your inbox.' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test:', error);
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setIsTesting(false);
    }
  };

  const notificationOptions = [
    {
      key: 'emailOnAssignment',
      icon: <Mail className="w-5 h-5" />,
      title: 'Ticket Assignment',
      description: 'Get notified when a ticket is assigned to you',
      color: 'text-blue-600'
    },
    {
      key: 'emailOnStatusChange',
      icon: <Bell className="w-5 h-5" />,
      title: 'Status Changes',
      description: 'Get notified when ticket status changes',
      color: 'text-purple-600'
    },
    {
      key: 'emailOnNewComment',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'New Comments',
      description: 'Get notified when someone comments on your tickets',
      color: 'text-green-600'
    },
    {
      key: 'dailyDigest',
      icon: <Calendar className="w-5 h-5" />,
      title: 'Daily Digest',
      description: 'Receive a daily summary of your active tickets',
      color: 'text-orange-600'
    },
    {
      key: 'escalationAlerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: 'Escalation Alerts',
      description: 'Get urgent alerts for overdue high-priority tickets',
      color: 'text-red-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#911414]" />
            Email Notifications
          </h3>
          <p className="text-gray-600 mt-1 text-sm">
            Manage your email notification preferences
          </p>
        </div>
        <button
          onClick={handleTestNotification}
          disabled={isTesting}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Send className="w-4 h-4" />
          {isTesting ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {/* Notification Options */}
      <div className="space-y-3">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-[#911414] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`${option.color} bg-white p-2 rounded-lg border border-gray-200`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm">{option.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(option.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#911414] focus:ring-offset-2 ${
                  preferences[option.key]
                    ? 'bg-[#911414]'
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[option.key]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4" />
          About Email Notifications
        </h4>
        <div className="space-y-1 text-xs text-blue-800">
          <p>
            <strong>Daily Digest:</strong> Sent every morning at 8:00 AM with a summary of your active tickets.
          </p>
          <p>
            <strong>Escalation Alerts:</strong> Sent every 2 hours for high/critical priority tickets that are more than 2 days old.
          </p>
          <p>
            <strong>Instant Notifications:</strong> Sent immediately when tickets are assigned or status changes occur.
          </p>
        </div>
      </div>
    </div>
  );
};
