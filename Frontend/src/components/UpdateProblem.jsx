import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedlist', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

const languageOrder = ['C++', 'Java', 'JavaScript'];

// Normalize any language string variant coming from the backend
// ('cpp', 'c++', 'CPP', 'javascript', 'JS', etc.) to a canonical label
const normalizeLang = (lang) => {
  if (!lang) return '';
  const l = lang.toString().trim().toLowerCase().replace(/\s+/g, '');
  if (l === 'c++' || l === 'cpp' || l === 'cplusplus') return 'C++';
  if (l === 'java') return 'Java';
  if (l === 'javascript' || l === 'js') return 'JavaScript';
  return lang;
};

// codeKey = 'initialCode' for startCode, 'completeCode' for referenceSolution
const sortByLanguage = (arr, codeKey) => {
  if (!Array.isArray(arr)) return [];
  return languageOrder.map(lang => {
    const found = arr.find(item => normalizeLang(item.language) === lang);
    if (!found) {
      return { language: lang, [codeKey]: '' };
    }
    return {
      language: lang,
      // fall back to alternate key names in case backend uses different field names
      [codeKey]: found[codeKey] ?? found.code ?? found.solution ?? found.content ?? ''
    };
  });
};

const fetchProblem = async (id) => {
  const { data } = await axiosClient.get(`/problem/problemById/${id}`);
  return data;
};

function UpdateProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [],
      hiddenTestCases: [],
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const { data: problemData, isLoading, error } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => fetchProblem(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (problemData) {
      reset({
        title: problemData.title || '',
        description: problemData.description || '',
        difficulty: problemData.difficulty || 'easy',
        tags: problemData.tags || 'array',
        visibleTestCases: problemData.visibleTestCases || [],
        hiddenTestCases: problemData.hiddenTestCases || [],
        startCode: sortByLanguage(problemData.startCode, 'initialCode'),
        referenceSolution: sortByLanguage(problemData.referenceSolution, 'completeCode')
      });
    }
  }, [problemData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data) => axiosClient.put(`/problem/update/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['problem', id] });
      alert('Problem updated successfully!');
      navigate('/admin/update');
    },
    onError: (error) => {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const loading = isLoading;
  const fetchError = error ? (error.response?.data?.message || error.message || 'Failed to fetch problem') : null;
  const dataLoaded = !!problemData;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="font-bold tracking-widest text-primary uppercase text-xs">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        <div className="alert alert-error shadow-lg max-w-md">
          <span>{fetchError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Update Problem</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                {...register('title')}
                className={`input input-bordered ${errors.title && 'input-error'}`}
              />
              {errors.title && (
                <span className="text-error">{errors.title.message}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                {...register('description')}
                className={`textarea textarea-bordered h-32 ${errors.description && 'textarea-error'}`}
              />
              {errors.description && (
                <span className="text-error">{errors.description.message}</span>
              )}
            </div>

            <div className="flex gap-4">
              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text">Difficulty</span>
                </label>
                <select
                  {...register('difficulty')}
                  className={`select select-bordered ${errors.difficulty && 'select-error'}`}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text">Tag</span>
                </label>
                <select
                  {...register('tags')}
                  className={`select select-bordered ${errors.tags && 'select-error'}`}
                >
                  <option value="array">Array</option>
                  <option value="linkedlist">Linked List</option>
                  <option value="graph">Graph</option>
                  <option value="dp">DP</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Cases</h2>

          {/* Visible Test Cases */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Visible Test Cases</h3>
              <button
                type="button"
                onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Visible Case
              </button>
            </div>

            {visibleFields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeVisible(index)}
                    className="btn btn-xs btn-error"
                  >
                    Remove
                  </button>
                </div>

                <input
                  {...register(`visibleTestCases.${index}.input`)}
                  placeholder="Input"
                  className="input input-bordered w-full"
                />

                <input
                  {...register(`visibleTestCases.${index}.output`)}
                  placeholder="Output"
                  className="input input-bordered w-full"
                />

                <textarea
                  {...register(`visibleTestCases.${index}.explanation`)}
                  placeholder="Explanation"
                  className="textarea textarea-bordered w-full"
                />
              </div>
            ))}
          </div>

          {/* Hidden Test Cases */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Hidden Test Cases</h3>
              <button
                type="button"
                onClick={() => appendHidden({ input: '', output: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Hidden Case
              </button>
            </div>

            {hiddenFields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeHidden(index)}
                    className="btn btn-xs btn-error"
                  >
                    Remove
                  </button>
                </div>

                <input
                  {...register(`hiddenTestCases.${index}.input`)}
                  placeholder="Input"
                  className="input input-bordered w-full"
                />

                <input
                  {...register(`hiddenTestCases.${index}.output`)}
                  placeholder="Output"
                  className="input input-bordered w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Code Templates */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Code Templates</h2>

          {!dataLoaded ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <span className="ml-3 text-sm text-base-content/60">Loading code templates...</span>
            </div>
          ) : (
          <div className="space-y-6">
            {[0, 1, 2].map((index) => {
              const languageLabel = index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript';
              const monacoLanguage = index === 0 ? 'cpp' : index === 1 ? 'java' : 'javascript';

              return (
                <div key={index} className="space-y-2">
                  <h3 className="font-medium">{languageLabel}</h3>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Initial Code</span>
                    </label>
                    <div className="rounded-lg overflow-hidden border border-base-300">
                      <Controller
                        name={`startCode.${index}.initialCode`}
                        control={control}
                        render={({ field }) => (
                          <Editor
                            key={`start-${index}-${id}-${dataLoaded}`}
                            height="200px"
                            language={monacoLanguage}
                            value={field.value || ''}
                            defaultValue={field.value || ''}
                            onChange={(value) => field.onChange(value || '')}
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
                              readOnly: false,
                              padding: { top: 16, bottom: 16 }
                            }}
                          />
                        )}
                      />
                    </div>
                    {errors.startCode?.[index]?.initialCode && (
                      <span className="text-error text-sm">{errors.startCode[index].initialCode.message}</span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Reference Solution</span>
                    </label>
                    <div className="rounded-lg overflow-hidden border border-base-300">
                      <Controller
                        name={`referenceSolution.${index}.completeCode`}
                        control={control}
                        render={({ field }) => (
                          <Editor
                            key={`ref-${index}-${id}-${dataLoaded}`}
                            height="250px"
                            language={monacoLanguage}
                            value={field.value || ''}
                            defaultValue={field.value || ''}
                            onChange={(value) => field.onChange(value || '')}
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
                              readOnly: false,
                              padding: { top: 16, bottom: 16 }
                            }}
                          />
                        )}
                      />
                    </div>
                    {errors.referenceSolution?.[index]?.completeCode && (
                      <span className="text-error text-sm">{errors.referenceSolution[index].completeCode.message}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/update')}
            className="btn btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={isSubmitting || updateMutation.isPending}
          >
            {isSubmitting || updateMutation.isPending ? 'Updating...' : 'Update Problem'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UpdateProblem;