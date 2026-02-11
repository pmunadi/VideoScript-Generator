
import React, { useState, useMemo } from 'react';
import { Upload, FileText, Download, Play, AlertCircle, Loader2, Sparkles, User, FileUp, RefreshCw, Clock } from 'lucide-react';
import { UserInput, GeneratorState, ScriptScene } from './types';
import { generateVideoScript } from './services/geminiService';
import { exportToPdf } from './services/pdfService';

const App: React.FC = () => {
  const [input, setInput] = useState<UserInput>({ name: '', file: null });
  const [state, setState] = useState<GeneratorState>({
    isGenerating: false,
    error: null,
    script: null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!allowed.includes(file.type)) {
        setState(prev => ({ ...prev, error: 'Format file tidak didukung. Harap gunakan PDF atau Word.' }));
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setState(prev => ({ ...prev, error: 'File terlalu besar. Maksimal 50MB.' }));
        return;
      }
      setInput(prev => ({ ...prev, file }));
      setState(prev => ({ ...prev, error: null }));
    }
  };

  const toBase64 = (file: File): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });

  const handleGenerate = async () => {
    if (!input.file) {
      setState(prev => ({ ...prev, error: 'Harap pilih dokumen terlebih dahulu.' }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const base64 = await toBase64(input.file);
      const result = await generateVideoScript(input.name, base64, input.file.type);
      setState(prev => ({ ...prev, script: result, isGenerating: false, error: null }));
    } catch (err: any) {
      console.error('API Error:', err);
      
      let errorMessage = 'Gagal memproses dokumen. Pastikan dokumen terbaca dengan baik atau coba lagi nanti.';
      
      // Handle Specific API Errors
      if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Kuota API telah habis atau terlalu banyak permintaan (Rate Limit). Harap tunggu beberapa menit sebelum mencoba lagi, atau pastikan tagihan akun API Anda aktif.';
      } else if (err.message?.includes('500') || err.message?.includes('503')) {
        errorMessage = 'Server AI sedang sibuk atau mengalami gangguan teknis. Harap coba lagi dalam beberapa saat.';
      }

      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage 
      }));
    }
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin membuat proyek baru? Semua data saat ini akan dihapus.')) {
      setInput({ name: '', file: null });
      setState({
        isGenerating: false,
        error: null,
        script: null
      });
    }
  };

  const handleDownload = () => {
    if (state.script) {
      exportToPdf(state.script, input.name);
    }
  };

  const estimatedDuration = useMemo(() => {
    if (!state.script) return null;
    const totalWords = state.script.reduce((acc, scene) => acc + scene.narasi.split(/\s+/).length, 0);
    const totalSeconds = Math.round((totalWords / 140) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds };
  }, [state.script]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-bg text-white py-12 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            VideoScript Generator
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto opacity-90 leading-relaxed">
            Ubah Dokumen Menjadi Skrip Video
          </p>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 -mt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Input Data
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" /> Nama Pengajar (Opsional)
                  </label>
                  <input
                    type="text"
                    value={input.name}
                    onChange={(e) => setInput(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <FileUp className="w-4 h-4" /> Dokumen Materi
                  </label>
                  <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${input.file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${input.file ? 'text-green-600' : 'text-gray-400'}`} />
                      <p className="text-sm text-gray-600 font-medium">
                        {input.file ? input.file.name : 'Klik atau seret file PDF/Word'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Maksimal 50MB</p>
                    </div>
                  </div>
                </div>

                {state.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                    <div className="flex items-start gap-2 text-red-700 text-sm">
                      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                      <p className="font-medium leading-relaxed">{state.error}</p>
                    </div>
                    {state.error.includes('Kuota') && (
                      <button 
                        onClick={handleGenerate}
                        className="text-xs font-bold text-red-800 underline hover:text-red-900 transition-colors"
                      >
                        Coba Lagi Sekarang
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-2 space-y-3">
                  <button
                    onClick={handleGenerate}
                    disabled={state.isGenerating || !input.file}
                    className="w-full gradient-bg text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                  >
                    {state.isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses Materi...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        Buat Skrip
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Proyek Baru
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-8 flex flex-col">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-[800px] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-600" />
                  Naskah Hasil
                </h2>
                {state.script && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 transition-all shadow-md min-w-[100px]"
                    >
                      <Download className="w-4 h-4" />
                      Unduh
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-grow p-6 overflow-y-auto">
                {state.script && estimatedDuration && (
                  <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 text-indigo-900">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Estimasi Durasi Video</p>
                      <p className="text-lg font-bold text-[#0e0e0e]">
                        {estimatedDuration.minutes} Menit {estimatedDuration.seconds} Detik
                      </p>
                    </div>
                  </div>
                )}

                {!state.script && !state.isGenerating && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-medium text-[#0e0e0e]">Belum ada skrip yang dibuat</p>
                    <p className="text-sm">Unggah dokumen dan klik tombol "Buat Skrip" untuk memulai.</p>
                  </div>
                )}

                {state.isGenerating && (
                  <div className="h-full flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="mt-6 text-indigo-900 font-semibold animate-pulse text-center max-w-xs">
                      Dosen AI sedang merancang skrip terbaik untuk materi Anda...
                    </p>
                  </div>
                )}

                {state.script && !state.isGenerating && (
                  <div className="w-full border rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr>
                          <th className="p-4 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/4">Scene</th>
                          <th className="p-4 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/4">Narasi (Voice Over)</th>
                          <th className="p-4 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/4">Kalimat Kunci</th>
                          <th className="p-4 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/4">Visual (Prompt AI)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {state.script.map((item, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="p-4 align-top font-bold text-[#0e0e0e] break-words">{item.scene}</td>
                            <td className="p-4 align-top text-[#0e0e0e] text-sm leading-relaxed break-words">{item.narasi}</td>
                            <td className="p-4 align-top">
                              <div className="flex flex-col gap-2">
                                {item.kalimatKunci.map((kunci, kIdx) => (
                                  <span key={kIdx} className="inline-block px-2 py-1 bg-yellow-100 text-[#0e0e0e] text-[11px] font-bold rounded border border-yellow-200 shadow-sm leading-tight break-words">
                                    {kunci}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 align-top text-xs text-[#0e0e0e] opacity-80 italic font-mono bg-gray-50/30 break-words">
                              {item.visual}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-white">VideoScript Generator</span>
          </div>
          <p className="text-sm">
            © 2024 Dikembangkan oleh Pramudya | munadipramudya@gmail.com
          </p>
          <div className="flex gap-4">
            <div className="px-2 py-1 border border-gray-700 rounded text-[10px] uppercase font-bold tracking-widest text-indigo-300">v1.4 Ditenagai oleh Gemini AI</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
