import React, { useState } from 'react';
import type { Report as Reportable, Result } from '../test';

/**
 * @description  Một component React để hiển thị báo cáo kết quả kiểm thử dưới dạng thẻ.
 * @purpose      Cung cấp một giao diện người dùng rõ ràng và trực quan cho kết quả của bộ test.
 * @solves       Vấn đề thiếu terminal để hiển thị output của test runner.
 * @model        View Component.
 * @rationale    Một giao diện đồ họa cho phép phân loại, tô màu và định dạng kết quả, giúp việc xác định các bài test thất bại và gỡ lỗi trở nên nhanh chóng và hiệu quả hơn nhiều so với việc đọc văn bản thuần túy.
 */
export function Report({ report }: { report: Reportable }) {
    const [status, setStatus] = useState('Chép');

    if (!report) return null;

    const summary = `Hoàn thành sau ${report.duration.toFixed(2)}ms. Tổng: ${report.total}, Thành công: ${report.passed}, Thất bại: ${report.failed}.`;

    const copy = () => {
        const text = JSON.stringify(report, null, 2);
        navigator.clipboard.writeText(text).then(() => {
            setStatus('Đã chép!');
            setTimeout(() => setStatus('Chép'), 2000);
        }).catch(err => {
            console.error('Lỗi khi sao chép báo cáo kiểm thử: ', err);
        });
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-lg">
            <div className="mb-4 flex justify-between items-start">
                <div>
                     <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Kết quả Kiểm thử Backend
                    </h3>
                    <p className={`text-base ${report.failed > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {summary}
                    </p>
                </div>
                <button 
                    onClick={copy} 
                    className="bg-slate-700/80 hover:bg-slate-600/80 text-xs text-slate-300 font-bold py-1.5 px-4 rounded-md transition-all duration-200 transform hover:scale-105 flex-shrink-0 ml-4"
                >
                    {status}
                </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {report.results.map((result, index) => (
                    <div key={index} className="border-t border-slate-700/60 pt-3">
                        <div className="flex items-center">
                            {result.status === 'passed' ? (
                                <span className="text-green-400 mr-3 font-bold text-lg">✓</span>
                            ) : (
                                <span className="text-red-400 mr-3 font-bold text-lg">✗</span>
                            )}
                            <div className="flex-1">
                                <span className="text-slate-500">{result.suite} &gt;</span>
                                <span className="text-slate-200 ml-2">{result.name}</span>
                            </div>
                            <span className="text-slate-500 ml-4 text-xs">{result.duration.toFixed(2)}ms</span>
                        </div>
                        {result.status === 'failed' && (
                            <div className="mt-2 ml-8 pl-4 border-l-2 border-red-500/50 text-red-300 font-mono text-xs">
                                <pre className="whitespace-pre-wrap break-words">{result.error}</pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}