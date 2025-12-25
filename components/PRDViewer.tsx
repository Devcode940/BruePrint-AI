
import React, { useState, useMemo } from 'react';
import { PRDData, PRDComment } from '../types';
import CollaborationPanel from './CollaborationPanel';

interface PRDViewerProps {
  data: PRDData;
  comments: PRDComment[];
  onAddComment: (sectionId: string, text: string) => void;
  onUpdateRequirementPriority: (reqId: string, priority: 'High' | 'Medium' | 'Low') => void;
}

const PRDViewer: React.FC<PRDViewerProps> = ({ data, comments, onAddComment, onUpdateRequirementPriority }) => {
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getPriorityClasses = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500';
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500';
    }
  };

  const filteredRequirements = useMemo(() => {
    if (!searchQuery) return data.functionalRequirements;
    const q = searchQuery.toLowerCase();
    return data.functionalRequirements.filter(req => 
      req.title.toLowerCase().includes(q) || 
      req.description.toLowerCase().includes(q) ||
      req.subTasks.some(st => 
        st.title.toLowerCase().includes(q) || 
        st.description.toLowerCase().includes(q) ||
        st.acceptanceCriteria.some(ac => ac.toLowerCase().includes(q))
      )
    );
  }, [data.functionalRequirements, searchQuery]);

  const copyToClipboard = () => {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    alert('PRD data copied to clipboard!');
  };

  const CommentTrigger = ({ sectionId }: { sectionId: string }) => (
    <button
      onClick={() => setActiveCommentSection(sectionId)}
      className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
      </svg>
      {comments.filter(c => c.sectionId === sectionId).length || ''}
    </button>
  );

  return (
    <div className="flex gap-4 relative">
      <div className={`space-y-8 pb-12 transition-all duration-300 ${activeCommentSection ? 'flex-1 pr-4' : 'w-full'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{data.productName}</h1>
                <p className="text-slate-500 text-sm mt-1">Generated Professional Blueprint</p>
              </div>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0 shadow-sm"
              >
                Copy JSON
              </button>
            </div>
            
            <div className="mt-6 relative">
              <input
                type="text"
                placeholder="Search within this PRD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Vision & Strategy */}
        <section className={`bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative group transition-all animate-in fade-in slide-in-from-bottom-6 duration-700 ${searchQuery && !data.vision.toLowerCase().includes(searchQuery.toLowerCase()) ? 'opacity-30' : ''}`}>
          <div className="absolute top-4 right-4 flex items-center">
            <CommentTrigger sectionId="Vision" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Product Vision & Strategy
          </h3>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">{data.vision}</p>
        </section>

        {/* Functional Requirements */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative group animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="absolute top-6 right-6 flex items-center">
            <CommentTrigger sectionId="Requirements" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-6">Functional Requirements</h3>
          <div className="space-y-8">
            {filteredRequirements.map((req, idx) => (
              <div key={idx} className="p-6 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-tighter">{req.id}</span>
                    <h4 className="font-bold text-slate-900 text-lg">{req.title}</h4>
                  </div>
                  <select
                    value={req.priority}
                    onChange={(e) => onUpdateRequirementPriority(req.id, e.target.value as any)}
                    className={`text-[10px] px-2 py-1 rounded-full border font-bold uppercase cursor-pointer outline-none transition-all ${getPriorityClasses(req.priority)}`}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <p className="text-sm text-slate-600 mb-6">{req.description}</p>
                
                <div className="grid grid-cols-1 gap-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Execution Sub-tasks</h5>
                  {req.subTasks.map((task, tidx) => (
                    <div key={tidx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                      <h6 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h6>
                      <p className="text-xs text-slate-500 mb-3">{task.description}</p>
                      <ul className="space-y-2">
                        {task.acceptanceCriteria.map((ac, acIdx) => (
                          <li key={acIdx} className="flex items-start gap-2 text-xs text-slate-600">
                            <div className="w-1.5 h-1.5 border border-slate-300 rounded-sm mt-0.5 shrink-0"></div>
                            {ac}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap Visualization */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative group animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="absolute top-6 right-6 flex items-center">
            <CommentTrigger sectionId="Roadmap" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-6">Release Roadmap</h3>
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-slate-100 hidden md:block"></div>
            <div className="space-y-12 relative">
              {data.roadmap.map((phase, idx) => (
                <div key={idx} className="relative pl-10 md:pl-12">
                  <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {idx + 1}
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-900 text-lg">{phase.phase}</h4>
                      <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{phase.duration}</span>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {phase.milestones.map((milestone, mIdx) => (
                        <li key={mIdx} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {activeCommentSection && (
        <div className="fixed inset-y-0 right-0 z-50 flex items-center">
          <CollaborationPanel
            sectionId={activeCommentSection}
            comments={comments.filter(c => c.sectionId === activeCommentSection)}
            onAddComment={(text) => onAddComment(activeCommentSection, text)}
            onClose={() => setActiveCommentSection(null)}
          />
        </div>
      )}
    </div>
  );
};

export default PRDViewer;
