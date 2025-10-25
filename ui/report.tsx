
import React from 'react';
import type { Report, Result } from '../test';

/**
 * @description  Một component React để hiển thị báo cáo kết quả kiểm thử.
 * @purpose      Cung cấp một giao diện người dùng rõ ràng và trực quan cho kết quả của bộ test.
 * @solves       Vấn đề thiếu terminal để hiển thị output của test runner.
 * @rationale    Một giao diện đồ họa cho phép phân loại, tô màu và định dạng kết quả, giúp việc xác định các bài test thất bại và gỡ lỗi trở nên nhanh chóng và hiệu quả hơn nhiều so với việc đọc văn bản thuần túy.
 */
export function Report({ report }: { report: Report }) {
    if (!report) return null;

    const summary = `Hoàn thành sau ${report.duration.toFixed(2)}ms. Tổng: ${report.total}, Thành công: ${report.passed}, Thất bại: ${report.failed}.`;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/80 p-5 rounded-xl shadow-lg font-mono text-sm">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2">Kết quả Kiểm thử Backend</h3>
                <p className={`text-base ${report.failed > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {summary}
                </p>
            </div>
            <div className="space-y-3">
                {report.results.map((result, index) => (
                    <div key={index} className="border-t border-gray-700/80 pt-3">
                        <div className="flex items-center">
                            {result.status === 'passed' ? (
                                <span className="text-green-400 mr-3 font-bold text-lg">✓</span>
                            ) : (
                                <span className="text-red-400 mr-3 font-bold text-lg">✗</span>
                            )}
                            <div className="flex-1">
                                <span className="text-gray-500">{result.suite} &gt;</span>
                                <span className="text-gray-200 ml-2">{result.name}</span>
                            </div>
                            <span className="text-gray-500 ml-4">{result.duration.toFixed(2)}ms</span>
                        </div>
                        {result.status === 'failed' && (
                            <div className="mt-2 ml-8 pl-4 border-l-2 border-red-500/50 text-red-300">
                                <pre className="whitespace-pre-wrap break-words">{result.error}</pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
