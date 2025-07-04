import React, { useState, useEffect } from 'react';
import { Dictionary } from '../types';

const DictionaryDebugPage: React.FC = () => {
  const [baseDict, setBaseDict] = useState<Dictionary>({});
  const [customDict, setCustomDict] = useState<Dictionary>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseResponse = await fetch('/dictionaries/base.json');
        if (!baseResponse.ok) throw new Error('Failed to load base dictionary');
        const baseData = await baseResponse.json();
        setBaseDict(baseData);

        const customResponse = await fetch('/dictionaries/custom.json');
        if (!customResponse.ok) {
            // custom.json可能不存在，这是正常情况
            console.warn('Custom dictionary not found. This is normal if no new words have been added.');
            setCustomDict({});
        } else {
            const customData = await customResponse.json();
            setCustomDict(customData);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDictionaries();
  }, []);

  const filteredBase = Object.keys(baseDict).filter(word => word.includes(searchTerm));
  const filteredCustom = Object.keys(customDict).filter(word => word.includes(searchTerm));

  if (loading) {
    return <div className="p-8">Loading dictionaries...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">词典调试页面</h1>
        <p className="mb-6 text-gray-600">在这里，您可以查看、搜索和管理内置词典与用户自定义词典的内容。</p>

        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索单词..."
            className="w-full max-w-md p-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Base Dictionary Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-3 text-blue-600">
              基础词典 (base.json)
            </h2>
            <p className="mb-4 text-gray-500">
              共包含 <span className="font-bold text-blue-700">{Object.keys(baseDict).length}</span> 个单词。
              搜索结果: <span className="font-bold">{filteredBase.length}</span>
            </p>
            <div className="h-96 overflow-y-auto border rounded-md p-2 bg-gray-50">
              <ul>
                {filteredBase.map(word => (
                  <li key={word} className="p-2 border-b hover:bg-gray-100">
                    {word}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Custom Dictionary Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-3 text-green-600">
              自定义词典 (custom.json)
            </h2>
             <p className="mb-4 text-gray-500">
              共包含 <span className="font-bold text-green-700">{Object.keys(customDict).length}</span> 个单词。
              搜索结果: <span className="font-bold">{filteredCustom.length}</span>
            </p>
            <div className="h-96 overflow-y-auto border rounded-md p-2 bg-gray-50">
              {Object.keys(customDict).length === 0 ? (
                <p className="text-gray-500 p-4 text-center">自定义词典为空。</p>
              ) : (
                <ul>
                  {filteredCustom.map(word => (
                    <li key={word} className="p-2 border-b hover:bg-gray-100">
                      {word}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DictionaryDebugPage; 