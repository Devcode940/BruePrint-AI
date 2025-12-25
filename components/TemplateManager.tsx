
import React, { useState, useEffect } from 'react';
import { PRDFormInputs } from '../types';

interface TemplateManagerProps {
  onLoad: (inputs: PRDFormInputs) => void;
  currentInputs: PRDFormInputs;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onLoad, currentInputs }) => {
  const [templates, setTemplates] = useState<{ id: string; name: string; data: PRDFormInputs }[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('prd_templates');
    if (saved) setTemplates(JSON.parse(saved));
  }, []);

  const saveTemplate = () => {
    if (!templateName) return;
    const newTemplates = [...templates, { id: Date.now().toString(), name: templateName, data: currentInputs }];
    setTemplates(newTemplates);
    localStorage.setItem('prd_templates', JSON.stringify(newTemplates));
    setTemplateName('');
    setShowSave(false);
  };

  const deleteTemplate = (id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    localStorage.setItem('prd_templates', JSON.stringify(newTemplates));
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.data.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Saved Templates</h3>
        <button
          onClick={() => setShowSave(!showSave)}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          {showSave ? 'Cancel' : '+ Save Current'}
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {showSave && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={saveTemplate}
            className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            Save
          </button>
        </div>
      )}

      {filteredTemplates.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          {searchQuery ? 'No templates matching search.' : 'No templates saved yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredTemplates.map(t => (
            <div key={t.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all">
              <button
                onClick={() => onLoad(t.data)}
                className="text-sm text-slate-600 hover:text-indigo-600 font-medium truncate text-left"
              >
                {t.name}
              </button>
              <button onClick={() => deleteTemplate(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
