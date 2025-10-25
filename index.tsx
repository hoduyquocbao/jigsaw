import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Conductor } from './backend/conductor';
import { Store } from './backend/jigsaw/store';
import * as schema from './backend/jigsaw/schema';
// FIX: Changed import path to point to the correct files for Invert and Tree.
import { Invert } from './backend/jigsaw/index/invert';
import { Tree } from './backend/jigsaw/index/tree';
import { Runner } from './test';
import type { Report } from './test';
import { Report as ReportUI } from './ui/report';

// Import tests to register them with the runner
import './backend/tests.ts';

/**
 * @description  Component chính của ứng dụng, trình diễn kiến trúc Jigsaw và Conductor.
 * @purpose      Cung cấp một giao diện người dùng tương tác để chạy các tác vụ nặng, thực hiện truy vấn, và xác minh tính đúng đắn của hệ thống backend thông qua bộ test tích hợp.
 * @solves       Tạo ra một môi trường "live demo" cho một kiến trúc backend phức tạp.
 * @model        Model-View-Controller (MVC), trong đó App là Controller, Jigsaw/Conductor là Model, và JSX là View.
 * @rationale    Sử dụng React và state management (`useState`) cung cấp một cách hiệu quả để quản lý và hiển thị trạng thái của các hoạt động bất đồng bộ phức tạp như tạo dữ liệu, lập chỉ mục và chạy truy vấn. Việc tích hợp bộ test vào UI là một giải pháp thực tế cho môi trường không có terminal.
 */
function App() {
    const [store, setStore] = useState<Store | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const [status, setStatus] = useState('Chưa khởi tạo');
    const [queryResult, setQueryResult] = useState<any>(null);
    
    const [testReport, setTestReport] = useState<Report | null>(null);
    const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'finished'>('idle');

    const addLog = (message: string) => {
        console.log(message);
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 100));
    };

    const setup = async () => {
        addLog("Bắt đầu khởi tạo...");
        setStatus('Đang tạo dữ liệu...');

        addLog("Đang tải mã nguồn worker và khởi tạo Conductor...");
        const conductor = await Conductor.create('/backend/conductor/worker.ts', navigator.hardwareConcurrency);
        addLog("Conductor đã sẵn sàng.");
        
        const chunks = Array(navigator.hardwareConcurrency).fill(Math.ceil(1_000_000 / navigator.hardwareConcurrency));
        
        const results = await conductor.map(chunks, 'generate');
        const data = ([] as any[]).concat(...results);
        conductor.terminate();
        
        addLog(`Đã tạo ${data.length.toLocaleString()} bản ghi giao dịch.`);
        setStatus('Đang nạp dữ liệu vào Store...');

        const kind = schema.record({
            id: schema.integer(32, true),
            user: schema.integer(32, true),
            product: schema.integer(32, true),
            amount: schema.scalar(32),
            timestamp: schema.integer(64, false)
        });

        const newStore = new Store(kind, data.length + 10);
        newStore.add(data);
        addLog('Nạp dữ liệu vào Store thành công.');
        setStatus('Đang xây dựng chỉ mục...');

        newStore.indexer.build('user', new Invert());
        addLog("Đã xây dựng chỉ mục Invert trên cột 'user'.");
        
        newStore.indexer.build('timestamp', new Tree());
        addLog("Đã xây dựng chỉ mục Tree trên cột 'timestamp'.");

        setStore(newStore);
        setStatus('Sẵn sàng');
    };

    const runQuery = (usePlanner: boolean) => {
        if (!store) return;
        
        const user = 42;
        const start = BigInt(new Date('2023-01-01').getTime());
        const end = BigInt(new Date('2023-03-31').getTime());

        const query = {
            filter: [
                { column: 'user', op: 'eq', value: user },
                { column: 'timestamp', op: 'gte', value: start },
                { column: 'timestamp', op: 'lte', value: end },
            ],
            aggregate: { type: 'sum', column: 'amount' }
        };

        addLog(`Đang chạy truy vấn cho user ${user} với planner=${usePlanner}...`);
        const startTime = performance.now();
        const result = store.query(query, usePlanner);
        const duration = performance.now() - startTime;
        
        setQueryResult(result);
        addLog(`Truy vấn hoàn tất sau ${duration.toFixed(2)}ms.`);
    };

    const runTests = async () => {
        setTestStatus('running');
        addLog("Bắt đầu chạy bộ kiểm thử backend...");
        const runner = new Runner();
        const report = await runner.run();
        setTestReport(report);
        setTestStatus('finished');
        addLog(`Kiểm thử hoàn tất. ${report.passed} thành công, ${report.failed} thất bại.`);
    };


    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <header className="text-center mb-6">
                <h1 className="text-4xl font-bold text-cyan-400">Jigsaw 8.0</h1>
                <p className="text-lg text-gray-400">Động cơ CSDL In-Memory Dạng cột & JIT-Optimized</p>
                <p className="text-md font-mono mt-2 px-2 py-1 bg-gray-800 rounded-md inline-block">Trạng thái: {status}</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <section className="md:col-span-1 space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h2 className="text-xl font-semibold text-white mb-3">Bảng điều khiển</h2>
                        <button onClick={setup} disabled={status !== 'Chưa khởi tạo'} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed">
                            1. Khởi tạo & Nạp 1M bản ghi
                        </button>
                        <div className="flex space-x-2 mt-2">
                             <button onClick={() => runQuery(false)} disabled={!store} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed">
                                2. Quét toàn bộ
                            </button>
                            <button onClick={() => runQuery(true)} disabled={!store} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed">
                                3. Dùng Chỉ mục
                            </button>
                        </div>
                    </div>
                     <div className="bg-gray-800 p-4 rounded-lg">
                        <h2 className="text-xl font-semibold text-white mb-3">Xác minh Hệ thống</h2>
                        <button onClick={runTests} disabled={testStatus === 'running'} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed">
                           {testStatus === 'running' ? 'Đang chạy...' : 'Chạy Kiểm thử Backend'}
                        </button>
                    </div>
                    {queryResult && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                             <h2 className="text-xl font-semibold text-white mb-3">Kết quả Truy vấn</h2>
                             <p><span className="font-bold text-gray-400">Tổng cộng:</span> <span className="text-yellow-400 font-mono">{queryResult.total.toFixed(2)}</span></p>
                             <p><span className="font-bold text-gray-400">Số hàng đã quét:</span> <span className="text-yellow-400 font-mono">{queryResult.scanned.toLocaleString()}</span></p>
                             <details className="mt-2 text-xs text-gray-500">
                                <summary>Xem kế hoạch thực thi</summary>
                                <pre className="bg-gray-900 p-2 rounded mt-1 whitespace-pre-wrap">{JSON.stringify(queryResult.plan, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
                             </details>
                        </div>
                    )}
                </section>
                
                <section className="md:col-span-2">
                   {testStatus === 'idle' && (
                     <div className="bg-gray-800 p-4 rounded-lg h-full">
                        <h2 className="text-xl font-semibold text-white mb-3">Nhật ký Hoạt động</h2>
                        <div className="font-mono text-sm text-gray-400 space-y-1 overflow-y-auto h-[calc(100vh-200px)]">
                            {log.map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                   )}
                   {testStatus !== 'idle' && testReport && (
                       <ReportUI report={testReport} />
                   )}
                </section>
            </main>
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);