import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Sparkles } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import Navbar from '../components/Navbar';

const langMap = {
  cpp: 'c++',
  java: 'java',
  javascript: 'javascript'
};

// Normalize backend language strings (e.g. 'C++', 'Java', 'JavaScript')
// to the frontend keys used in langMap.
const normalizeLang = (lang) => {
  if (!lang) return '';
  const l = lang.toString().trim().toLowerCase();
  if (l === 'c++' || l === 'cpp' || l === 'cplusplus') return 'cpp';
  if (l === 'java') return 'java';
  if (l === 'javascript' || l === 'js') return 'javascript';
  return '';
};

const fetchProblem = async (problemId) => {
  const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);
  const initialCodeMap = {};
  Object.keys(langMap).forEach(key => {
    const found = data.startCode?.find(sc => normalizeLang(sc.language) === key);
    initialCodeMap[key] = found ? found.initialCode : '';
  });
  return { problem: data, initialCodeMap };
};

const ProblemPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const [codeMap, setCodeMap] = useState({});
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [solutions, setSolutions] = useState([]);
  const [solutionsLoading, setSolutionsLoading] = useState(false);
  const [solutionsError, setSolutionsError] = useState('');
  const editorRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  let {problemId}  = useParams();

  const { data: problemData, isLoading } = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => fetchProblem(problemId),
    enabled: !!problemId,
  });

  const problem = problemData?.problem || null;
  const baseCodeMap = problemData?.initialCodeMap || {};
  const isPro = user?.subscription?.active || user?.role === 'admin';

  useEffect(() => {
    if (activeLeftTab !== 'solutions' || !problemId || !isPro) {
      return;
    }

    const loadSolutions = async () => {
      setSolutionsLoading(true);
      setSolutionsError('');
      try {
        const { data } = await axiosClient.get(`/problem/solution/${problemId}`);
        setSolutions(data.referenceSolution || []);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load solutions';
        setSolutionsError(message);
      } finally {
        setSolutionsLoading(false);
      }
    };

    loadSolutions();
  }, [activeLeftTab, problemId, isPro]);

  const runMutation = useMutation({
    mutationFn: ({ code, language }) => axiosClient.post(`/submission/run/${problemId}`, { code, language }),
    onSuccess: (response) => {
      setRunResult({
        success: response.data.success ?? false,
        runtime: response.data.runtime ?? 0,
        memory: response.data.memory ?? 0,
        testCases: Array.isArray(response.data.testCases) ? response.data.testCases : [],
        error: null
      });
    },
    onError: (error) => {
      console.error("Error running code:", error);
      setRunResult({
        success: false,
        error: "Internal server error",
        testCases: []
      });
    },
    onSettled: () => {
      setActiveRightTab("testcase");
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ code, language }) => axiosClient.post(`/submission/submit/${problemId}`, { code, language }),
    onSuccess: (response) => {
      setSubmitResult({
        accepted: !!response.data.accepted,
        passedTestCases: response.data.passedTestCases ?? 0,
        totalTestCases: response.data.totalTestCases ?? 0,
        runtime: response.data.runtime ?? 0,
        memory: response.data.memory ?? 0,
        error: response.data.errorMessage || null
      });
      queryClient.invalidateQueries({ queryKey: ['submissions', problemId] });
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['profileStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: (error) => {
      console.error("Error submitting code:", error);
      setSubmitResult({
        accepted: false,
        passedTestCases: 0,
        totalTestCases: 0,
        runtime: 0,
        memory: 0,
        error: "Internal server error"
      });
    },
    onSettled: () => {
      setActiveRightTab("result");
    },
  });

  const handleEditorChange = (value) => {
    setCodeMap(prev => ({ ...prev, [selectedLanguage]: value || '' }));
  };

  const handleLanguageChange = (language) => {
    if (language === selectedLanguage) return;
    setSelectedLanguage(language);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const currentCode = codeMap[selectedLanguage] ?? baseCodeMap[selectedLanguage] ?? '';
  const isRunning = runMutation.isPending;
  const isSubmitting = submitMutation.isPending;
  const actionLoading = isRunning || isSubmitting;

  const handleRun = () => {
    if (!currentCode || !currentCode.trim()) {
      return alert("Please write some code before running.");
    }
    setRunResult(null);
    runMutation.mutate({ code: currentCode, language: selectedLanguage });
  };

  const handleSubmitCode = () => {
    if (!currentCode || !currentCode.trim()) {
      return alert("Please write some code before submitting.");
    }
    setSubmitResult(null);
    submitMutation.mutate({ code: currentCode, language: selectedLanguage });
  };


  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'hard': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-sm text-base-content/60">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    // Changed h-screen to min-h-screen for mobile scrolling flexibility
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-base-100 pt-18 overflow-x-hidden">
      
      <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-base-300/50 h-[60vh] md:h-full">
        <div className="flex gap-1 bg-base-200/50 px-4 py-3 border-b border-base-300/50 overflow-x-auto no-scrollbar whitespace-nowrap">
          {[
            { id: 'description', label: 'Description' },
            { id: 'solutions', label: 'Solutions' },
            { id: 'submissions', label: 'Submissions' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
                activeLeftTab === tab.id
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'
              }`}
              onClick={() => setActiveLeftTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-base-content leading-tight">{problem.title}</h1>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {problem.tags}
                        </span>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <div className="text-base-content/80 leading-relaxed whitespace-pre-wrap wrap-break-words">
                      {problem.description}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-base-content">Examples</h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="bg-base-200/50 backdrop-blur-sm border border-base-300/50 rounded-xl p-4 md:p-5 hover:border-base-300 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <h4 className="font-semibold text-base-content">Example {index + 1}</h4>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <span className="font-semibold text-base-content/60 min-w-20">Input:</span>
                              <code className="flex-1 font-mono text-base-content bg-base-300/50 px-2 py-1 rounded break-all">{example.input}</code>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <span className="font-semibold text-base-content/60 min-w-20">Output:</span>
                              <code className="flex-1 font-mono text-base-content bg-base-300/50 px-2 py-1 rounded break-all">{example.output}</code>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <span className="font-semibold text-base-content/60 min-w-20">Explanation:</span>
                              <span className="flex-1 text-base-content/70">{example.explanation}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeLeftTab === 'solutions' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-base-content">Solutions</h2>

                  {!isPro ? (
                    <div className="card bg-base-200/50 border border-base-300/50">
                      <div className="card-body items-center text-center py-12">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Lock className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-base-content mb-2">
                          Pro subscription required
                        </h3>
                        <p className="text-base-content/70 max-w-md mb-6">
                          Subscribe to Pro to unlock reference solutions, editorial code, and optimal approaches for every problem.
                        </p>
                        <button
                          onClick={() => navigate('/pricing')}
                          className="btn btn-primary gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Subscribe to Unlock
                        </button>
                      </div>
                    </div>
                  ) : solutionsLoading ? (
                    <div className="flex justify-center py-12">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                  ) : solutionsError ? (
                    <div className="text-center py-12 text-error">
                      <p>{solutionsError}</p>
                    </div>
                  ) : solutions.length === 0 ? (
                    <div className="text-center py-12 text-base-content/60">
                      <p>No solutions available for this problem yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {solutions.map((solution, index) => (
                        <div key={index} className="border border-base-300/50 rounded-xl overflow-hidden hover:border-base-300 transition-colors">
                          <div className="bg-base-200/80 px-5 py-3 border-b border-base-300/50">
                            <h3 className="font-semibold text-base-content flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              {problem?.title} - {solution?.language}
                            </h3>
                          </div>
                          <div className="p-4 md:p-5">
                            <pre className="bg-base-300/50 p-4 rounded-lg text-sm overflow-x-auto border border-base-300/50">
                              <code className="text-base-content">{solution?.completeCode}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-base-content">My Submissions</h2>
                  <SubmissionHistory problemId={problemId} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col h-[70vh] md:h-full">
        <div className="flex gap-1 bg-base-200/50 px-4 py-3 border-b border-base-300/50 overflow-x-auto no-scrollbar whitespace-nowrap">
          {[
            { id: 'code', label: 'Code' },
            { id: 'testcase', label: 'Test Cases' },
            { id: 'result', label: 'Result' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
                activeRightTab === tab.id
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'
              }`}
              onClick={() => setActiveRightTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center px-4 py-3 border-b border-base-300/50 bg-base-200/30 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 whitespace-nowrap">
                  {[
                    { id: 'cpp', label: 'C++' },
                    { id: 'java', label: 'Java' },
                    { id: 'javascript', label: 'JavaScript' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedLanguage === lang.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'
                      }`}
                      onClick={() => handleLanguageChange(lang.id)}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 relative min-h-0">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={currentCode}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              </div>

              <div className="px-4 py-4 border-t border-base-300/50 bg-base-200/30 flex justify-between items-center gap-3">
                <button 
                  className="btn btn-ghost btn-sm hover:bg-base-300/50 px-2"
                  onClick={() => setActiveRightTab('testcase')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline ml-1">Console</span>
                </button>
                <div className="flex gap-2 md:gap-3">
                  <button
                    className={`btn btn-outline btn-sm hover:bg-base-300 ${isRunning ? 'loading' : ''}`}
                    onClick={handleRun}
                    disabled={actionLoading}
                  >
                    {!isRunning && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Run
                  </button>
                  <button
                    className={`btn btn-primary btn-sm shadow-lg shadow-primary/20 ${isSubmitting ? 'loading' : ''}`}
                    onClick={handleSubmitCode}
                    disabled={actionLoading}
                  >
                    {!isSubmitting && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <h3 className="text-xl font-bold mb-5 text-base-content">Test Results</h3>
              {runResult ? (
                <div className={`rounded-xl border-2 p-4 md:p-6 ${runResult.success ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                  {runResult.success ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg text-green-500">Passed!</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="px-4 py-2 bg-base-200/50 rounded-lg">
                          <span className="text-base-content/60">Runtime: </span>
                          <span className="font-semibold text-base-content">{runResult.runtime}s</span>
                        </div>
                        <div className="px-4 py-2 bg-base-200/50 rounded-lg">
                          <span className="text-base-content/60">Memory: </span>
                          <span className="font-semibold text-base-content">{runResult.memory}KB</span>
                        </div>
                      </div>
                      <div className="space-y-3 mt-4">
                        {runResult.testCases.map((tc, i) => (
                          <div key={i} className="bg-base-100 border border-base-300/50 rounded-lg p-3 md:p-4 overflow-hidden">
                            <div className="font-mono text-xs space-y-2">
                              <div className="flex flex-col gap-1"><span className="text-base-content/60 font-semibold">Input:</span><span className="text-base-content break-all">{tc.stdin}</span></div>
                              <div className="flex flex-col gap-1"><span className="text-base-content/60 font-semibold">Expected:</span><span className="text-base-content break-all">{tc.expected_output}</span></div>
                              <div className="flex flex-col gap-1"><span className="text-base-content/60 font-semibold">Output:</span><span className="text-base-content break-all">{tc.stdout}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg text-red-500">{runResult.error}</h4>
                      </div>
                      <div className="space-y-3">
                        {runResult.testCases.map((tc, i) => (
                          <div key={i} className="bg-base-100 border border-base-300/50 rounded-lg p-3 md:p-4 overflow-hidden">
                            <div className="font-mono text-xs space-y-2">
                              <div className="flex flex-col gap-1"><span className="text-base-content/60 font-semibold">Input:</span><span className="text-base-content break-all">{tc.stdin}</span></div>
                              <div className="flex flex-col gap-1"><span className="text-base-content/60 font-semibold">Expected:</span><span className="text-base-content break-all">{tc.expected_output}</span></div>
                              <div className="flex flex-col gap-1"><span className="text-base-content/60 font-semibold">Output:</span><span className="text-base-content break-all">{tc.stdout}</span></div>
                              <div className={`flex items-center gap-2 font-semibold ${tc.status_id === 3 ? 'text-green-600' : 'text-red-600'}`}>
                                {tc.status_id === 3 ? 'Passed' : 'Failed'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-base-content/60">Click "Run Code" to test</p>
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <h3 className="text-xl font-bold mb-5 text-base-content">Submission Result</h3>
              {submitResult ? (
                <div className={`rounded-xl border-2 p-4 md:p-6 ${submitResult.accepted ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                  {submitResult.accepted ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-xl md:text-2xl text-green-500">Accepted!</h4>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-base-200/50 rounded-lg p-3 border border-base-300/50">
                          <p className="text-[10px] text-base-content/60 mb-1">Passed</p>
                          <p className="text-lg font-bold text-base-content">{submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                        </div>
                        <div className="bg-base-200/50 rounded-lg p-3 border border-base-300/50">
                          <p className="text-[10px] text-base-content/60 mb-1">Runtime</p>
                          <p className="text-lg font-bold text-base-content">{submitResult.runtime}s</p>
                        </div>
                        <div className="bg-base-200/50 rounded-lg p-3 border border-base-300/50">
                          <p className="text-[10px] text-base-content/60 mb-1">Memory</p>
                          <p className="text-lg font-bold text-base-content">{submitResult.memory}KB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-xl text-red-500 wrap-break-words">{submitResult.error}</h4>
                      </div>
                      {submitResult.error !== "Internal server error" && (
                        <div className="bg-base-200/50 rounded-lg p-4 border border-base-300/50">
                          <p className="text-xs text-base-content/60 mb-1">Test Cases Passed</p>
                          <p className="text-2xl font-bold text-base-content">{submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-base-content/60">Click "Submit" to evaluate</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;