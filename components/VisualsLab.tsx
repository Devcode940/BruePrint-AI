
import React, { useState } from 'react';
import { generateImage, generateVideo } from '../services/gemini';

const VisualsLab: React.FC<{ productName: string }> = ({ productName }) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState(`A professional high-tech dashboard UI for ${productName}, sleek modern design, 4k resolution`);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      if (activeTab === 'image') {
        const url = await generateImage(prompt, aspectRatio, imageSize);
        setResult(url);
      } else {
        // Veo key selection check
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
        const url = await generateVideo(prompt, aspectRatio as '16:9' | '9:16');
        setResult(url);
      }
    } catch (err) {
      console.error(err);
      alert("Generation failed. Ensure you have selected an API key if required.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Media Lab: Brand Assets</h3>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            Image
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'video' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            Video (Veo)
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
              >
                {activeTab === 'image' ? (
                  <>
                    <option value="1:1">1:1 Square</option>
                    <option value="3:4">3:4 Portrait</option>
                    <option value="4:3">4:3 Landscape</option>
                    <option value="9:16">9:16 Mobile</option>
                    <option value="16:9">16:9 Cinema</option>
                    <option value="21:9">21:9 Ultrawide</option>
                  </>
                ) : (
                  <>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                  </>
                )}
              </select>
            </div>
            {activeTab === 'image' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quality</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="1K">1K (Standard)</option>
                  <option value="2K">2K (High)</option>
                  <option value="4K">4K (Ultra)</option>
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Processing...
              </span>
            ) : `Generate ${activeTab}`}
          </button>
        </div>

        {result && (
          <div className="mt-6 animate-in zoom-in duration-300">
            {activeTab === 'image' ? (
              <img src={result} className="w-full rounded-xl border border-slate-200 shadow-md" alt="Generated asset" />
            ) : (
              <video src={result} controls className="w-full rounded-xl border border-slate-200 shadow-md" />
            )}
            <a
              href={result}
              download={`${productName}-asset`}
              className="mt-2 block text-center text-xs font-bold text-indigo-600 hover:underline"
            >
              Download Asset
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualsLab;
