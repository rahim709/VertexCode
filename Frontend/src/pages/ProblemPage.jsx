import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import Editorial from '../components/Editorial';
import Navbar from '../components/Navbar';

const langMap = {
  cpp: 'c++',
  java: 'java',
  javascript: 'javascript'
};

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let {problemId}  = useParams();

  const { handleSubmit } = useForm();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;
        setProblem(response.data);
        setCode(initialCode);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code:code,
        language: selectedLanguage
      });
      console.log(response.data);
      setSubmitResult(response.data);
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
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

  if (loading && !problem) {
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
      
      {/* Left Panel */}
      {/* Added flex-shrink-0 and explicit height for mobile so it doesn't collapse */}
      <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-base-300/50 h-[60vh] md:h-full">
        {/* Left Tabs */}
        {/* Added overflow-x-auto to tabs for small mobile screens */}
        <div className="flex gap-1 bg-base-200/50 px-4 py-3 border-b border-base-300/50 overflow-x-auto no-scrollbar whitespace-nowrap">
          {[
            { id: 'description', label: 'Description' },
            { id: 'editorial', label: 'Editorial' },
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

        {/* Left Content */}
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
              {/* Other tabs remain logically same, just contained in the responsive flex-1 div */}
              {activeLeftTab === 'editorial' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-base-content">Editorial</h2>
                  <div className="bg-base-200/50 border border-base-300/50 rounded-xl p-4 md:p-6">
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration}/>
                  </div>
                </div>
              )}

              {activeLeftTab === 'solutions' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-base-content">Solutions</h2>
                  <div className="space-y-4">
                    {problem.referenceSolution?.map((solution, index) => (
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
                    )) || (
                      <div className="text-center py-12 text-base-content/60">
                        <p>Solutions will be available after you solve the problem.</p>
                      </div>
                    )}
                  </div>
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

      {/* Right Panel */}
      {/* Explicit height for mobile h-[70vh] so editor is usable */}
      <div className="w-full md:w-1/2 flex flex-col h-[70vh] md:h-full">
        {/* Right Tabs */}
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

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Language Selector */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-base-300/50 bg-base-200/30 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 whitespace-nowrap">
                  {[
                    { id: 'javascript', label: 'JavaScript' },
                    { id: 'java', label: 'Java' },
                    { id: 'cpp', label: 'C++' }
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

              {/* Monaco Editor Container */}
              <div className="flex-1 relative min-h-0">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
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

              {/* Action Buttons */}
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
                    className={`btn btn-outline btn-sm hover:bg-base-300 ${loading ? 'loading' : ''}`}
                    onClick={handleRun}
                    disabled={loading}
                  >
                    {!loading && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Run
                  </button>
                  <button
                    className={`btn btn-primary btn-sm shadow-lg shadow-primary/20 ${loading ? 'loading' : ''}`}
                    onClick={handleSubmitCode}
                    disabled={loading}
                  >
                    {!loading && (
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
                        {/* Red Error UI content stays the same, contained in responsive div */}
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg text-red-500">Test Failed</h4>
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
                      {/* Submission Failure Result UI Logic */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-xl text-red-500 wrap-break-words">{submitResult.error}</h4>
                      </div>
                      <div className="bg-base-200/50 rounded-lg p-4 border border-base-300/50">
                        <p className="text-xs text-base-content/60 mb-1">Test Cases Passed</p>
                        <p className="text-2xl font-bold text-base-content">{submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                      </div>
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