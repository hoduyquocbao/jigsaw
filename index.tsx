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

const WORKER_URL = 'https://raw.githubusercontent.com/hoduyquocbao/jigsaw/main/backend/conductor/worker.ts';

const StatusIndicator = ({ status }: { status: string }) => {
    let colorClasses = 'bg-yellow-500/50 border-yellow-400';
    let pulse = true;

    if (status === 'Chưa khởi tạo' || status === 'Lỗi khởi tạo') {
        colorClasses = 'bg-gray-500/50 border-gray-400';
        if (status === 'Lỗi khởi tạo') {
            colorClasses = 'bg-red-500/50 border-red-400';
        }
        pulse = false;
    } else if (status === 'Sẵn sàng') {
        colorClasses = 'bg-green-500/50 border-green-400';
        pulse = false;
    }
    
    return (
        <div className="font-mono mt-4 px-4 py-2 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-full inline-flex items-center gap-3 shadow-md">
            <span className="relative flex h-3 w-3">
                {pulse && <span className={`${colorClasses.split(' ')[0]} animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses.split(' ')[0]}`}></span>
            </span>
            <span className="text-gray-300">Trạng thái: {status}</span>
        </div>
    );
};


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

    const [workerVersion, setWorkerVersion] = useState<number | null>(null);
    const [copyStatus, setCopyStatus] = useState('Chép');

    const addLog = (message: string) => {
        console.log(message);
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 100));
    };

    const setup = async () => {
        try {
            addLog("Bắt đầu khởi tạo...");
            setStatus('Đang tạo dữ liệu...');
    
            const version = Date.now();
            setWorkerVersion(version);
            addLog(`Đang tải mã nguồn worker (phiên bản ${version}) và khởi tạo Conductor...`);
            
            const conductor = await Conductor.create(`${WORKER_URL}?v=${version}`, navigator.hardwareConcurrency);
            addLog("Conductor đã sẵn sàng.");
            
            const chunks = Array(navigator.hardwareConcurrency).fill(Math.ceil(1_000_000 / navigator.hardwareConcurrency));
            
            const promises = chunks.map(count => conductor.submit('generate', count));
            const results = await Promise.all(promises);
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
        } catch (e: any) {
            const errorMessage = `Lỗi nghiêm trọng trong quá trình khởi tạo: ${e.message}`;
            addLog(errorMessage);
            setStatus('Lỗi khởi tạo');
            console.error(e);
        }
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
        setTestReport(null); // Xóa báo cáo cũ khi bắt đầu chạy
        addLog("Bắt đầu chạy bộ kiểm thử backend...");
        const runner = new Runner();
        const report = await runner.run();
        setTestReport(report);
        setTestStatus('finished');
        addLog(`Kiểm thử hoàn tất. ${report.passed} thành công, ${report.failed} thất bại.`);
    };

    const copyLog = () => {
        if (log.length === 0) return;
        // Đảo ngược lại để có thứ tự thời gian đúng khi sao chép
        const logText = [...log].reverse().join('\n');
        navigator.clipboard.writeText(logText).then(() => {
            setCopyStatus('Đã chép!');
            setTimeout(() => setCopyStatus('Chép'), 2000);
        }).catch(err => {
            console.error('Lỗi khi sao chép nhật ký: ', err);
            addLog('Lỗi: Không thể sao chép nhật ký.');
        });
    };
    
    const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
        <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/80 rounded-xl shadow-lg ${className}`}>
            {children}
        </div>
    );
    
    const Button = ({ children, onClick, disabled, className = '' }: { children: React.ReactNode, onClick: () => void, disabled: boolean, className?: string }) => (
         <button 
            onClick={onClick} 
            disabled={disabled} 
            className={`font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl shadow-md disabled:opacity-50 disabled:transform-none disabled:shadow-md disabled:cursor-not-allowed ${className}`}>
            {children}
        </button>
    );


    return (
        <div className="container mx-auto p-6 md:p-8 max-w-7xl">
            <header className="text-center mb-8">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2">Jigsaw 8.0</h1>
                <p className="text-xl text-gray-400">Động cơ CSDL In-Memory Dạng cột & JIT-Optimized</p>
                <StatusIndicator status={status} />
                 {workerVersion && (
                    <p className="text-xs text-gray-500 font-mono mt-2">Phiên bản Worker: {workerVersion}</p>
                )}
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <section className="md:col-span-1 space-y-6">
                    <Card className="p-5">
                        <h2 className="text-xl font-semibold text-white mb-4">Bảng điều khiển</h2>
                        <Button onClick={setup} disabled={status !== 'Chưa khởi tạo'} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                            1. Khởi tạo & Nạp 1M bản ghi
                        </Button>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                             <Button onClick={() => runQuery(false)} disabled={!store} className="bg-orange-600 hover:bg-orange-500 text-white">
                                2. Quét toàn bộ
                            </Button>
                            <Button onClick={() => runQuery(true)} disabled={!store} className="bg-green-600 hover:bg-green-500 text-white">
                                3. Dùng Chỉ mục
                            </Button>
                        </div>
                    </Card>
                     <Card className="p-5">
                        <h2 className="text-xl font-semibold text-white mb-4">Xác minh Hệ thống</h2>
                        <Button onClick={runTests} disabled={testStatus === 'running'} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                           {testStatus === 'running' ? 'Đang chạy...' : 'Chạy Kiểm thử Backend'}
                        </Button>
                    </Card>
                    {queryResult && (
                        <Card className="p-5">
                             <h2 className="text-xl font-semibold text-white mb-3">Kết quả Truy vấn</h2>
                             <div className="space-y-2 text-lg">
                                <p className="flex justify-between items-baseline"><span className="font-bold text-gray-400">Tổng cộng:</span> <span className="text-yellow-400 font-mono text-2xl">{queryResult.total.toFixed(2)}</span></p>
                                <p className="flex justify-between items-baseline"><span className="font-bold text-gray-400">Số hàng đã quét:</span> <span className="text-yellow-400 font-mono text-2xl">{queryResult.scanned.toLocaleString()}</span></p>
                             </div>
                             <details className="mt-3 text-xs text-gray-500 cursor-pointer">
                                <summary className="font-semibold">Xem kế hoạch thực thi</summary>
                                <pre className="bg-gray-900/70 p-3 rounded-md mt-2 whitespace-pre-wrap selection:bg-cyan-500/20">{JSON.stringify(queryResult.plan, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
                             </details>
                        </Card>
                    )}
                </section>
                
                <section className="md:col-span-2">
                    <Card className="p-5 h-full flex flex-col">
                        {testReport && (
                            <>
                                <ReportUI report={testReport} />
                                <div className="my-4 border-t border-gray-700/60" />
                            </>
                        )}
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-semibold text-white">Nhật ký Hoạt động</h2>
                            <button onClick={copyLog} className="bg-gray-700/80 hover:bg-gray-600/80 text-xs text-gray-300 font-bold py-1.5 px-4 rounded-md transition-all duration-200 transform hover:scale-105">
                                {copyStatus}
                            </button>
                        </div>
                        <div className="font-mono text-sm text-gray-400 space-y-2 overflow-y-auto flex-grow bg-gray-900/70 p-4 rounded-md min-h-[300px]">
                            {log.map((line, i) => <p key={i} className="whitespace-pre-wrap break-words">{line}</p>)}
                        </div>
                    </Card>
                </section>
            </main>
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);