
import React, { useCallback } from 'react';
import { PRDFormInputs, RoadmapInputPhase, FileContext } from '../types';
import TemplateManager from './TemplateManager';

interface PRDFormProps {
  onSubmit: (data: PRDFormInputs) => void;
  isLoading: boolean;
  initialData?: PRDFormInputs | null;
}

const PRDForm: React.FC<PRDFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const [formData, setFormData] = React.useState<PRDFormInputs>({
    name: '',
    description: '',
    targetAudience: '',
    primaryGoals: '',
    keyFeatures: '',
    roadmapPhases: [],
    contextFiles: []
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addPhase = () => {
    setFormData(prev => ({
      ...prev,
      roadmapPhases: [...prev.roadmapPhases, { name: '', keyGoals: '' }]
    }));
  };

  const removePhase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roadmapPhases: prev.roadmapPhases.filter((_, i) => i !== index)
    }));
  };

  const handlePhaseChange = (index: number, field: keyof RoadmapInputPhase, value: string) => {
    const newPhases = [...formData.roadmapPhases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setFormData(prev => ({ ...prev, roadmapPhases: newPhases }));
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newContextFiles: FileContext[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });

      newContextFiles.push({
        name: file.name,
        type: file.type,
        data: fileData
      });
    }

    setFormData(prev => ({
      ...prev,
      contextFiles: [...prev.contextFiles, ...newContextFiles]
    }));
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contextFiles: prev.contextFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <TemplateManager currentInputs={formData} onLoad={(data) => setFormData(data)} />
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Blueprint</h2>
          <p className="text-slate-500">Provide the core details and upload context files for the AI.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name</label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., TaskMaster Pro"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Brief Description</label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="What does your product do? What problem does it solve?"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
              <input
                required
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                placeholder="e.g., Remote software engineers"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Goals</label>
              <input
                required
                type="text"
                name="primaryGoals"
                value={formData.primaryGoals}
                onChange={handleChange}
                placeholder="e.g., Increase team productivity by 30%"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Key Features</label>
            <textarea
              required
              name="keyFeatures"
              value={formData.keyFeatures}
              onChange={handleChange}
              rows={3}
              placeholder="List key features here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* Context Files Section */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-slate-700">Context Files (Grounding)</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,.txt,.md,.json"
                className="hidden"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.contextFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 group">
                  <div className="w-4 h-4 text-slate-400">
                    {file.type.startsWith('image/') ? (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                  </div>
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {formData.contextFiles.length === 0 && (
                <p className="text-xs text-slate-400 italic">No files attached. Upload images or text for grounding.</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? "Architecting PRD..." : "Generate PRD"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PRDForm;
