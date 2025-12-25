
import React, { useState } from 'react';
import { PRDComment } from '../types';

interface CollaborationPanelProps {
  sectionId: string;
  comments: PRDComment[];
  onAddComment: (text: string) => void;
  onClose: () => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ sectionId, comments, onAddComment, onClose }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddComment(text);
      setText('');
    }
  };

  return (
    <div className="bg-white border-l border-slate-200 w-80 h-full flex flex-col shadow-xl animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800 text-sm">Comments: {sectionId}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-xs italic">No comments yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-indigo-600">{c.author}</span>
                <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-slate-700">{c.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100">
        <textarea
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none"
        />
        <button
          type="submit"
          className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
        >
          Post Comment
        </button>
      </form>
    </div>
  );
};

export default CollaborationPanel;
