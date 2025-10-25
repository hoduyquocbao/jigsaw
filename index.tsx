import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Conductor } from './backend/conductor';
import { Store } from './backend/jigsaw/store';
import * as schema from './backend/jigsaw/schema';
import { Invert } from './backend/jigsaw/index/invert';
import { Tree } from './backend/jigsaw/index/tree';
import { Runner } from './test';
import type { Report as Test } from './test';
import { Card as Testcard } from './ui/report';
import { Telemetry } from './backend/telemetry';

// Import tests to register them with the runner
import './backend/tests.ts';

const WORKER_URL = 'https://raw.githubusercontent.com/hoduyquocbao/jigsaw/main/backend/conductor/worker.ts';

const telemetry = new Telemetry();

const Indicator = ({ status }: { status: string }) => {
    let colors = 'bg-yellow-500 border-yellow-400';
    let pulse = true;

    if (status === 'Chưa khởi tạo' || status === 'Lỗi khởi tạo') {
        colors = 'bg-slate-500 border-slate-400';
        if (status === 'Lỗi khởi tạo') {
            colors = 'bg-red-500 border-red-400';
        }
        pulse = false;
    } else if (status === 'Sẵn sàng') {
        colors = 'bg-green-500 border-green-400';
        pulse = false;
    }
    
    return (
        <div className="font-mono mt-4 px-4 py-2 bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-full inline-flex items-center gap-3 shadow-md">
            <span className="relative flex h-3 w-3">
                {pulse && <span className={`${colors.split(' ')[0]} animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${colors}`}></span>
            </span>
            <span className="text-slate-300">Trạng thái: {status}</span>
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
    const [result, setResult] = useState<any>(null);
    
    const [test, setTest] = useState<Test | null>(null);
    const [testing, setTesting] = useState<'idle' | 'running' | 'finished'>('idle');
    const [report, setReport] = useState<Record<string, number> | null>(null);
    const [busy, setBusy] = useState(false);

    const [version, setVersion] = useState<number | null>(null);
    const [logstatus, setLogstatus] = useState('Chép');
    const [querystatus, setQuerystatus] = useState('Chép');

    const write = (message: string) => {
        console.log(message);
        const timestamp = new Date();
        const time = `${timestamp.toLocaleTimeString()}.${timestamp.getMilliseconds().toString().padStart(3, '0')}`;
        setLog(prev => [`[${time}] ${message}`, ...prev].slice(0, 100));
    };

    const setup = async () => {
        let conductor: Conductor | null = null;
        try {
            telemetry.reset();
            write("Bắt đầu khởi tạo...");
            setStatus('Đang khởi tạo...');
            telemetry.start('total');
    
            const now = Date.now();
            setVersion(now);
            write(`Đang tải mã nguồn worker (phiên bản ${now}) và khởi tạo Conductor...`);
            setStatus('Khởi tạo Conductor...');
            telemetry.start('conductor');
            
            conductor = await Conductor.create(`${WORKER_URL}?v=${now}`, navigator.hardwareConcurrency);
            telemetry.end('conductor');
            write("Conductor đã sẵn sàng.");
            
            setStatus('Đang tạo dữ liệu song song...');
            telemetry.start('generation');
            const chunks = Array(navigator.hardwareConcurrency).fill(Math.ceil(1_000_000 / navigator.hardwareConcurrency));
            
            const promises = chunks.map(count => conductor!.submit('generate', count));
            const results = await Promise.all(promises);
            const data = ([] as any[]).concat(...results);

            telemetry.end('generation');
            write(`Đã tạo ${data.length.toLocaleString()} bản ghi giao dịch.`);
            setStatus('Đang nạp dữ liệu vào Store...');
            telemetry.start('loading');
    
            const kind = schema.record({
                id: schema.integer(32, true),
                user: schema.integer(32, true),
                product: schema.integer(32, true),
                amount: schema.scalar(32),
                timestamp: schema.integer(64, false)
            });
    
            const newstore = new Store(kind, data.length + 10);
            newstore.add(data);
            telemetry.end('loading');
            write('Nạp dữ liệu vào Store thành công.');
            
            setStatus('Đang xây dựng chỉ mục (nền)...');
            telemetry.start('indexing');
    
            // Invert index xây dựng nhanh, có thể làm trên luồng chính
            newstore.indexer.build('user', new Invert());
            write("Đã xây dựng chỉ mục Invert trên cột 'user'.");
            
            // Tree index xây dựng chậm, chuyển sang worker để tránh đóng băng UI
            await newstore.indexer.build('timestamp', new Tree(), conductor);
            write("Đã xây dựng chỉ mục Tree trên cột 'timestamp' (chạy nền).");
            
            telemetry.end('indexing');
            telemetry.end('total');
            setReport(telemetry.report());
    
            setStore(newstore);
            setStatus('Sẵn sàng');
        } catch (e: any) {
            const message = `Lỗi nghiêm trọng trong quá trình khởi tạo: ${e.message}`;
            write(message);
            setStatus('Lỗi khởi tạo');
            console.error(e);
        } finally {
            if (conductor) {
                conductor.terminate();
                write("Conductor đã dừng để giải phóng tài nguyên.");
            }
        }
    };

    const query = (planner: boolean) => {
        if (!store || busy) return;
        
        setBusy(true);
        setResult(null);
        
        setTimeout(() => {
            const user = 42;
            const start = BigInt(new Date('2023-01-01').getTime());
            const end = BigInt(new Date('2023-03-31').getTime());
    
            const request = {
                filter: [
                    { column: 'user', op: 'eq', value: user },
                    { column: 'timestamp', op: 'gte', value: start },
                    { column: 'timestamp', op: 'lte', value: end },
                ],
                aggregate: { type: 'sum', column: 'amount' }
            };
    
            write(`Đang chạy truy vấn cho user ${user} với planner=${planner}...`);
            const response = store.query(request, planner);
            
            setResult(response);
            write(`Truy vấn hoàn tất sau ${(response.planning + response.execution).toFixed(2)}ms. (Lập kế hoạch: ${response.planning.toFixed(2)}ms, Thực thi: ${response.execution.toFixed(2)}ms)`);
            setBusy(false);
        }, 50);
    };

    const verify = async () => {
        setTesting('running');
        setTest(null);
        write("Bắt đầu chạy bộ kiểm thử backend...");
        const runner = new Runner();
        const report = await runner.run();
        setTest(report);
        setTesting('finished');
        write(`Kiểm thử hoàn tất. ${report.passed} thành công, ${report.failed} thất bại.`);
    };

    const copy = (target: 'log' | 'query') => {
        let text = '';
        if (target === 'log' && log.length > 0) {
            text = [...log].reverse().join('\n');
            navigator.clipboard.writeText(text).then(() => {
                setLogstatus('Đã chép!');
                setTimeout(() => setLogstatus('Chép'), 2000);
            }).catch(() => write('Lỗi: Không thể sao chép nhật ký.'));
        } else if (target === 'query' && result) {
            text += `Tổng cộng: ${result.total.toFixed(2)}\n`;
            text += `Số hàng quét: ${result.scanned.toLocaleString()}\n\n`;
            text += `Lập kế hoạch: ${result.planning.toFixed(2)}ms\n`;
            text += `Thực thi: ${result.execution.toFixed(2)}ms\n\n`;
            text += 'Kế hoạch thực thi:\n';
            text += JSON.stringify(result.plan, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2);
            navigator.clipboard.writeText(text).then(() => {
                setQuerystatus('Đã chép!');
                setTimeout(() => setQuerystatus('Chép'), 2000);
            }).catch(() => write('Lỗi: Không thể sao chép kết quả.'));
        }
    };
    
    const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
        <div className={`bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg transition-all duration-300 hover:border-slate-600/80 hover:shadow-cyan-500/10 ${className}`}>
            {children}
        </div>
    );
    
    const Button = ({ children, action, disabled, className = '' }: { children: React.ReactNode, action: () => void, disabled: boolean, className?: string }) => (
         <button 
            onClick={action} 
            disabled={disabled} 
            className={`font-semibold py-2.5 px-4 rounded-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl shadow-md disabled:opacity-50 disabled:transform-none disabled:shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base ${className}`}>
            {disabled && (status.startsWith('Đang') || testing === 'running' || busy) && (
                 <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );

    const Telemetry = ({ report }: { report: Record<string, number> | null }) => {
        if (!report) return null;
        return (
            <div className="fade-in">
            <Card className="p-5">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Hiệu suất Khởi tạo
                    </h2>
                </div>
                <div className="space-y-2 text-sm font-mono">
                    {Object.entries(report).map(([key, value]) => (
                         <p key={key} className="flex justify-between items-baseline border-b border-slate-700/50 pb-1.5">
                            <span className="capitalize text-slate-400">{key.replace(/_/g, ' ')}:</span> 
                            <span className="text-cyan-400 font-bold text-base">{value.toLocaleString()} ms</span>
                         </p>
                    ))}
                </div>
            </Card>
            </div>
        )
    };
    
    const Result = ({ data }: { data: any }) => {
        if (!data) return null;
        return (
            <div className="fade-in">
                <Card className="p-5">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 014 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2z" /></svg>
                            Kết quả Truy vấn
                        </h2>
                        <button onClick={() => copy('query')} className="bg-slate-700/80 hover:bg-slate-600/80 text-xs text-slate-300 font-bold py-1.5 px-4 rounded-md transition-all duration-200 transform hover:scale-105">
                            {querystatus}
                        </button>
                    </div>
                    <div className="space-y-2 text-base font-mono">
                        <p className="flex justify-between items-baseline"><span className="text-slate-400">Tổng cộng:</span> <span className="text-yellow-400 font-bold text-xl">{data.total.toFixed(2)}</span></p>
                        <p className="flex justify-between items-baseline"><span className="text-slate-400">Số hàng quét:</span> <span className="text-yellow-400 font-bold text-xl">{data.scanned.toLocaleString()}</span></p>
                        <hr className="border-slate-700/60 my-2"/>
                        <p className="flex justify-between items-baseline text-sm"><span className="text-slate-500">Lập kế hoạch:</span> <span className="text-slate-400">{data.planning.toFixed(2)}ms</span></p>
                        <p className="flex justify-between items-baseline text-sm"><span className="text-slate-500">Thực thi:</span> <span className="text-slate-400">{data.execution.toFixed(2)}ms</span></p>
                    </div>
                    <details className="mt-4 text-xs text-slate-500 cursor-pointer group">
                        <summary className="font-semibold group-hover:text-slate-300 transition">Xem kế hoạch thực thi</summary>
                        <pre className="bg-slate-900/70 p-3 rounded-md mt-2 whitespace-pre-wrap selection:bg-cyan-500/20">{JSON.stringify(data.plan, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
                    </details>
                </Card>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 md:p-8 max-w-7xl">
            <header className="text-center mb-10">
                <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2">Jigsaw 9.0</h1>
                <p className="text-xl text-slate-400">Động cơ CSDL In-Memory Dạng cột & Tối ưu hóa Truy vấn</p>
                <Indicator status={status} />
                 {version && (
                    <p className="text-xs text-slate-500 font-mono mt-2">Phiên bản Worker: {version}</p>
                )}
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-1 space-y-6">
                    <Card className="p-5">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                          Bảng điều khiển
                        </h2>
                        <Button action={setup} disabled={status !== 'Chưa khởi tạo' && status !== 'Sẵn sàng' && status !== 'Lỗi khởi tạo'} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                            {status === 'Chưa khởi tạo' || status === 'Lỗi khởi tạo' ? '1. Khởi tạo & Nạp 1M bản ghi' : 'Khởi tạo lại'}
                        </Button>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                             <Button action={() => query(false)} disabled={!store || busy} className="bg-orange-600 hover:bg-orange-500 text-white">
                                {busy ? 'Đang chạy...' : '2. Quét Toàn bộ'}
                            </Button>
                            <Button action={() => query(true)} disabled={!store || busy} className="bg-green-600 hover:bg-green-500 text-white">
                                {busy ? 'Đang chạy...' : '3. Dùng Chỉ mục'}
                            </Button>
                        </div>
                    </Card>
                     <Card className="p-5">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Xác minh Hệ thống
                        </h2>
                        <Button action={verify} disabled={testing === 'running'} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                           {testing === 'running' ? 'Đang chạy...' : 'Chạy Kiểm thử Backend'}
                        </Button>
                    </Card>
                    <Telemetry report={report} />
                    <Result data={result} />
                </section>
                
                <section className="lg:col-span-2">
                    <Card className="p-5 h-full flex flex-col">
                        {test && (
                            <div className="fade-in">
                                <Testcard report={test} />
                                <div className="my-4 border-t border-slate-700/60" />
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                               Nhật ký Hoạt động
                            </h2>
                            <button onClick={() => copy('log')} className="bg-slate-700/80 hover:bg-slate-600/80 text-xs text-slate-300 font-bold py-1.5 px-4 rounded-md transition-all duration-200 transform hover:scale-105">
                                {logstatus}
                            </button>
                        </div>
                        <div className="font-mono text-sm text-slate-400 space-y-2 overflow-y-auto flex-grow bg-slate-900/70 p-4 rounded-md min-h-[400px]">
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