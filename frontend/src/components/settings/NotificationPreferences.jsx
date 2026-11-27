import React, { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, AlertTriangle, MessageSquare, Save, Send, CheckCircle } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { accessControlService } from '../../services/accessControlService';

export const NotificationPreferences = () => {
  const [permissions, setPermissions] = useState(null);
  const [preferences, setPreferences] = useState({
    emailOnAssignment: true,
    emailOnStatusChange: true,
    emailOnNewComment: true,
    dailyDigest: false,
    escalationAlerts: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    accessControlService.getMyAccess()
      .then(access => {
        if (active) setPermissions(access.permissions || []);
      })
      .catch(error => {
        console.error('Unable to load notification preference permissions:', error);
        if (active) setPermissions([]);
      });
    return () => { active = false; };
  }, []);

  const canView = permissions?.includes('settings.notifications.view') || false;
  const canEdit = permissions?.includes('settings.notifications.update') || false;
  const canTest = permissions?.includes('settings.notifications.test') || false;

  useEffect(() => {
    if (canView) fetchPreferences();
    else if (permissions) setIsLoading(false);
  }, [canView, permissions]);

  if (permissions && !canView) return null;

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
      title: 'Ticket Assignments',
      description: 'Get an email when a ticket is assigned to you',
      color: 'text-[#990024]'
    },
    {
      key: 'emailOnStatusChange',
      icon: <Bell className="w-5 h-5" />,
      title: 'Status Changes',
      description: 'Get notified when ticket status changes',
      color: 'text-[#990024]'
    },
    {
      key: 'emailOnNewComment',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'New Comments',
      description: 'Get notified when someone comments on your tickets',
      color: 'text-[#990024]'
    },
    {
      key: 'dailyDigest',
      icon: <Calendar className="w-5 h-5" />,
      title: 'Daily Digest',
      description: 'Receive a daily summary of your active tickets at 8:00 AM',
      color: 'text-[#990024]'
    },
    {
      key: 'escalationAlerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: 'Escalation Alerts',
      description: 'Get alerts every two hours for high-priority tickets over two days past SLA',
      color: 'text-[#990024]'
    }
  ];

  if (isLoading) {
    return (
      <div className="admin-settings flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 admin-settings text-zinc-800">
      {/* Header */}
      <div className="settings-shell-card p-4 sm:p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#990024]" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                Email Notifications
              </h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your email notification preferences
            </p>
          </div>
          {canTest && <button
            onClick={handleTestNotification}
            type="button"
            disabled={isTesting || isLoading}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990024] focus-visible:ring-offset-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isTesting ? 'Sending...' : 'Send Test Email'}</span>
          </button>}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div role="status" className={`settings-shell-card p-4 flex items-center gap-3 ${
          message.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'
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
      <div className="settings-shell-card p-4 sm:p-6">
        <div className="settings-content-inner">
          <div className="space-y-3">
            {notificationOptions.map((option) => (
              <div
                key={option.key}
                className="border border-zinc-200 rounded-lg p-4 hover:border-[#990024] transition-colors bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`${option.color} bg-zinc-50 p-2 rounded-lg border border-zinc-200`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-900 text-sm">{option.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle(option.key)}
                    aria-label={`${option.title}: ${preferences[option.key] ? 'enabled' : 'disabled'}`}
                    aria-pressed={Boolean(preferences[option.key])}
                    disabled={isSaving || !canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990024] focus-visible:ring-offset-2 ${
                      preferences[option.key]
                        ? 'bg-[#990024]'
                        : 'bg-zinc-300'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
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

          {/* Info Box */}
          <div className="mt-6 border border-zinc-200 rounded-lg p-4 bg-zinc-50">
            <h4 className="font-medium text-zinc-900 mb-2 flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-[#990024]" aria-hidden="true" />
              About Email Notifications
            </h4>
            <div className="space-y-1 text-xs text-zinc-600">
              <p>
                <strong>Daily Digest:</strong> Sent every morning at 8:00 AM Nairobi time with a summary of up to 50 active tickets assigned to you or created by you.
              </p>
              <p>
                <strong>Escalation Alerts:</strong> Sent every 2 hours for high/critical priority tickets more than 2 days past their SLA due time.
              </p>
              <p>
                <strong>Instant Notifications:</strong> Delivered when a ticket is assigned to you, its status changes, a new comment is added, or it is escalated to you.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || !canEdit}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990024] focus-visible:ring-offset-2 bg-[#990024] text-white hover:bg-[#80001e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
