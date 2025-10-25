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
        <div className="p-4 bg-gray-800 rounded-lg font-mono text-sm max-h-screen overflow-y-auto">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2">Kết quả Kiểm thử Backend</h3>
                <p className={`text-base ${report.failed > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {summary}
                </p>
            </div>
            {report.results.map((result, index) => (
                <div key={index} className="border-b border-gray-700 py-2">
                    <div className="flex items-center">
                        {result.status === 'passed' ? (
                            <span className="text-green-500 mr-2">✓</span>
                        ) : (
                            <span className="text-red-500 mr-2">✗</span>
                        )}
                        <span className="text-gray-500">{result.suite} &gt;</span>
                        <span className="text-gray-300 ml-1">{result.name}</span>
                        <span className="text-gray-600 ml-auto">{result.duration.toFixed(2)}ms</span>
                    </div>
                    {result.status === 'failed' && (
                        <div className="mt-2 ml-5 p-2 bg-red-900/20 text-red-300 rounded">
                            <pre className="whitespace-pre-wrap break-words">{result.error}</pre>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
