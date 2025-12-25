
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import PRDForm from './components/PRDForm';
import PRDViewer from './components/PRDViewer';
import ChatBot from './components/ChatBot';
import VisualsLab from './components/VisualsLab';
import { PRDData, PRDFormInputs, PRDComment, GeminiError } from './types';
import { generatePRD, getFastResponse } from './services/gemini';

const App: React.FC = () => {
  const [prdData, setPrdData] = useState<PRDData | null>(null);
  const [comments, setComments] = useState<PRDComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ status: string; message: string } | null>(null);
  const [quickTip, setQuickTip] = useState<string | null>(null);
  
  const syncChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    syncChannel.current = new BroadcastChannel('blueprint_ai_sync');
    
    const savedPrd = localStorage.getItem('current_prd');
    if (savedPrd) setPrdData(JSON.parse(savedPrd));
    
    const savedComments = localStorage.getItem('prd_comments');
    if (savedComments) setComments(JSON.parse(savedComments));

    syncChannel.current.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === 'SYNC_PRD') setPrdData(data);
      if (type === 'SYNC_COMMENTS') setComments(data);
    };

    return () => syncChannel.current?.close();
  }, []);

  const handleFormSubmit = useCallback(async (inputs: PRDFormInputs) => {
    setIsLoading(true);
    setError(null);
    setQuickTip(null);
    try {
      getFastResponse(`Provide a one-sentence high-level product strategy tip for a product named ${inputs.name} that ${inputs.description}`)
        .then(setQuickTip)
        .catch(() => {});

      const result = await generatePRD(inputs);
      setPrdData(result);
      setComments([]);
      
      localStorage.setItem('current_prd', JSON.stringify(result));
      localStorage.setItem('prd_comments', JSON.stringify([]));
      syncChannel.current?.postMessage({ type: 'SYNC_PRD', data: result });
      syncChannel.current?.postMessage({ type: 'SYNC_COMMENTS', data: [] });
      
      setTimeout(() => {
        document.getElementById('prd-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      if (err instanceof GeminiError) {
        setError({ status: err.status, message: err.message });
      } else {
        setError({ status: 'UNKNOWN', message: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddComment = (sectionId: string, text: string) => {
    const newComment: PRDComment = {
      id: Date.now().toString(),
      sectionId,
      author: 'Collaborator',
      text,
      timestamp: Date.now()
    };
    const updated = [...comments, newComment];
    setComments(updated);
    localStorage.setItem('prd_comments', JSON.stringify(updated));
    syncChannel.current?.postMessage({ type: 'SYNC_COMMENTS', data: updated });
  };

  const handleUpdateRequirementPriority = (reqId: string, priority: 'High' | 'Medium' | 'Low') => {
    if (!prdData) return;
    
    const updatedPrd = {
      ...prdData,
      functionalRequirements: prdData.functionalRequirements.map(req => 
        req.id === reqId ? { ...req, priority } : req
      )
    };
    
    setPrdData(updatedPrd);
    localStorage.setItem('current_prd', JSON.stringify(updatedPrd));
    syncChannel.current?.postMessage({ type: 'SYNC_PRD', data: updatedPrd });
  };

  const reset = () => {
    setPrdData(null);
    setError(null);
    setQuickTip(null);
    localStorage.removeItem('current_prd');
    syncChannel.current?.postMessage({ type: 'SYNC_PRD', data: null });
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top duration-500">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-900">Blueprint Generation Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-4 text-xs font-bold text-red-900 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className={`${prdData ? 'lg:col-span-4' : 'lg:col-span-8 lg:col-start-3'}`}>
            <div className="sticky top-24">
              {!prdData ? (
                <PRDForm onSubmit={handleFormSubmit} isLoading={isLoading} />
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 text-center lg:text-left">Blueprint Control</h2>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active & Synced</span>
                    </div>
                    <button 
                      onClick={reset}
                      className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Concept
                    </button>
                  </div>

                  {quickTip && (
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Strategy Byte</h4>
                      <p className="text-sm text-emerald-700 italic">"{quickTip}"</p>
                    </div>
                  )}

                  <VisualsLab productName={prdData.productName} />
                </div>
              )}
            </div>
          </div>

          {prdData && (
            <div id="prd-result" className="lg:col-span-8">
              <PRDViewer 
                data={prdData} 
                comments={comments} 
                onAddComment={handleAddComment}
                onUpdateRequirementPriority={handleUpdateRequirementPriority}
              />
            </div>
          )}

          {!prdData && !isLoading && (
            <div className="hidden lg:block lg:col-span-4">
               <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl h-[600px] flex flex-col items-center justify-center p-8 text-center animate-pulse">
                  <h3 className="text-lg font-bold text-slate-400">Concept Preview</h3>
                  <p className="text-slate-400 mt-2 max-w-[200px]">Waiting for your input to architect the future.</p>
               </div>
            </div>
          )}

          {isLoading && !prdData && (
            <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 italic text-center">Breaking down requirements...</h2>
              <p className="text-slate-500 mb-4 text-center">Gemini is defining actionable sub-tasks for your blueprint.</p>
            </div>
          )}
        </div>
      </main>

      <ChatBot />

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">BlueprintAI</span>
            </div>
            <p className="text-slate-500 text-sm">© 2024 BlueprintAI Inc. Powered by Gemini Pro.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
