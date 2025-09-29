"use client";

import { useState, useEffect } from "react";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  htmlBody: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTemplate),
      });

      if (response.ok) {
        await fetchTemplates();
        setIsEditing(false);
        alert('Template saved successfully!');
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: '',
      key: 'new-template',
      subject: 'New Email Template',
      htmlBody: '<p>Hello {{artistName}}!</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  const availableVariables = [
    'artistName',
    'artistEmail',
    'submissionId',
    'submissionStatus',
    'submissionDate',
    'feedback',
    'reviewerName',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Page Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
                <p className="text-sm text-gray-600 mt-1">Manage email templates for artist communications</p>
              </div>
              <div className="w-32 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading templates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-sm text-gray-600 mt-1">Manage email templates for artist communications</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
                  <button
                    onClick={handleCreateTemplate}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    + New
                  </button>
                </div>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditing(false);
                      }}
                    >
                      <h3 className="font-medium text-gray-900 text-sm">{template.key}</h3>
                      <p className="text-xs text-gray-600 mt-1 truncate">{template.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No templates found</p>
                      <p className="text-gray-400 text-xs mt-1">Create your first template</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                {selectedTemplate ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedTemplate.id ? 'Edit Template' : 'Create Template'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedTemplate.id ? `Template: ${selectedTemplate.key}` : 'Create a new email template'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {selectedTemplate.id && (
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                        )}
                        {(isEditing || !selectedTemplate.id) && (
                          <button
                            onClick={handleSaveTemplate}
                            disabled={saving}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : selectedTemplate.id ? 'Save Changes' : 'Create Template'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Key
                          </label>
                          <input
                            type="text"
                            value={selectedTemplate.key}
                            onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, key: e.target.value } : null)}
                            disabled={selectedTemplate.id ? !isEditing : false}
                            placeholder="e.g., confirmation, approval, rejection"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Unique identifier for this template
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject Line
                          </label>
                          <input
                            type="text"
                            value={selectedTemplate.subject}
                            onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                            disabled={selectedTemplate.id ? !isEditing : false}
                            placeholder="Email subject line"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          HTML Content
                        </label>
                        <textarea
                          value={selectedTemplate.htmlBody}
                          onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, htmlBody: e.target.value } : null)}
                          disabled={selectedTemplate.id ? !isEditing : false}
                          rows={12}
                          placeholder="Enter your HTML email template here..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use HTML tags for formatting. Variables will be replaced automatically.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Available Variables
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableVariables.map((variable) => (
                            <span
                              key={variable}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => {
                                const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const text = textarea.value;
                                  const before = text.substring(0, start);
                                  const after = text.substring(end);
                                  const newText = before + `{{${variable}}}` + after;
                                  setSelectedTemplate(prev => prev ? { ...prev, htmlBody: newText } : null);
                                }
                              }}
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Click on a variable to insert it into your template at the cursor position.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
                    <p className="text-gray-500 mb-4">Select a template from the list or create a new one</p>
                    <button
                      onClick={handleCreateTemplate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create New Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
