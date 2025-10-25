// A unique ID for tasks
let counter = 0;

interface Taskable {
    id: number;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    worker?: number;
}

/**
 * @description  Một toolkit hiệu suất cao để quản lý một bể chứa worker cho các tác vụ song song.
 * @purpose      Trừu tượng hóa sự phức tạp của việc tạo, giao tiếp và quản lý vòng đời của worker.
 * @solves       1. Chặn luồng chính (event loop) do các tác vụ tính toán nặng.
 *               2. Sử dụng không hiệu quả CPU đa lõi.
 *               3. Lỗi bảo mật và phân giải đường dẫn khi tạo worker.
 * @model        Mô hình Bể chứa Worker (Worker Pool Pattern) và Nhà sản xuất-Người tiêu dùng (Producer-Consumer).
 * @algorithm    1. Lập lịch tác vụ bằng hàng đợi FIFO (First-In, First-Out).
 *               2. Phân tán dữ liệu song song theo mô hình Map.
 * @complexity   - Gửi tác vụ (submit): O(1).
 *               - Xử lý map song song: Lý tưởng là O(N/P) với N là kích thước dữ liệu và P là số worker.
 * @rationale    Loại bỏ phương thức `create` bất đồng bộ và `fetch`. Worker giờ được tạo từ một chuỗi mã nguồn được cung cấp trực tiếp, đảm bảo mã nguồn đã được biên dịch bởi bundler. Việc tạo worker từ Blob URL là phương pháp an toàn và linh hoạt nhất, giải quyết triệt để các vấn đề về cross-origin và phân giải module.
 */
export class Conductor {
    private workers: Worker[] = [];
    private idle: number[] = [];
    private queue: { name: string; args: any[]; task: Taskable }[] = [];
    private pending: Map<number, Taskable> = new Map();
    private url?: string;

    /**
     * @description Khởi tạo Conductor và tạo ra bể chứa worker.
     * @param {string} code Chuỗi mã nguồn JavaScript đã được biên dịch cho worker.
     * @param {number} size Kích thước của bể chứa, mặc định là số lõi logic của CPU.
     */
    constructor(code: string, size: number = navigator.hardwareConcurrency) {
        const blob = new Blob([code], { type: 'application/javascript' });
        this.url = URL.createObjectURL(blob);

        for (let i = 0; i < size; i++) {
            const worker = new Worker(this.url);
            worker.onmessage = (event) => this.finish(event.data);
            worker.onerror = (error) => this.error(i, error);
            this.workers.push(worker);
            this.idle.push(i);
        }
    }

    /**
     * @description Gửi một tác vụ đã đăng ký để thực thi trên một worker rảnh rỗi.
     * @param {string} name Tên của tác vụ trong registry của worker.
     * @param {any[]} args Các đối số cho tác vụ.
     * @returns {Promise<any>} Một promise sẽ resolve với kết quả của tác vụ.
     */
    submit(name: string, ...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++counter;
            const task: Taskable = { id, resolve, reject };
            this.pending.set(id, task);
            this.queue.push({ name, args, task });
            this.dispatch();
        });
    }

    /**
     * @description Xử lý một mảng dữ liệu song song trên tất cả các worker.
     * @param {Array<any>} data Mảng dữ liệu cần xử lý.
     * @param {string} name Tên của hàm xử lý cho mỗi phần dữ liệu (chunk).
     * @returns {Promise<any[]>} Một promise resolve với mảng kết quả đã được gộp lại.
     */
    async map(data: any[], name: string): Promise<any[]> {
        const size = this.workers.length;
        if (size === 0) return [];
        
        const chunksize = Math.ceil(data.length / size);
        const promises = [];

        for (let i = 0; i < size; i++) {
            const start = i * chunksize;
            const end = start + chunksize;
            const chunk = data.slice(start, end);
            if (chunk.length > 0) {
                promises.push(this.submit(name, chunk));
            }
        }

        const results = await Promise.all(promises);
        return ([] as any[]).concat(...results);
    }

    /**
     * @description Chấm dứt hoạt động của tất cả các worker và dọn dẹp Blob URL.
     */
    terminate(): void {
        this.workers.forEach(worker => worker.terminate());
        if (this.url) {
            URL.revokeObjectURL(this.url);
        }
        this.workers = [];
        this.idle = [];
        this.queue = [];
        this.pending.clear();
    }

    /**
     * @description Phân phối một tác vụ từ hàng đợi đến một worker rảnh rỗi.
     * @private
     */
    private dispatch(): void {
        if (this.queue.length > 0 && this.idle.length > 0) {
            const { name, args, task } = this.queue.shift()!;
            const worker = this.idle.shift()!;
            
            task.worker = worker;

            const transferables = args.filter((arg: any) => 
                arg instanceof ArrayBuffer || arg instanceof MessagePort
            );
            this.workers[worker].postMessage({ name, args, id: task.id }, transferables);
        }
    }

    /**
     * @description Xử lý khi một worker hoàn thành tác vụ.
     * @param {any} response Phản hồi từ worker.
     * @private
     */
    private finish(response: any): void {
        const { id, result, error } = response;
        const task = this.pending.get(id);

        if (task) {
            if (error) {
                task.reject(new Error(error));
            } else {
                task.resolve(result);
            }
            this.pending.delete(id);
            if (task.worker !== undefined) {
                this.idle.push(task.worker);
                delete task.worker;
            }
            this.dispatch();
        }
    }

    /**
     * @description Xử lý lỗi nghiêm trọng từ một worker bằng cách khởi động lại nó.
     * @param {number} index Chỉ số của worker.
     * @param {ErrorEvent} event Sự kiện lỗi.
     * @private
     */
    private error(index: number, event: ErrorEvent): void {
        console.error(`Lỗi nghiêm trọng từ worker ${index}: ${event.message}. Sẽ khởi động lại worker.`);

        // Tìm và reject tác vụ đang chạy trên worker bị lỗi
        let id: number | null = null;
        for (const [key, task] of this.pending.entries()) {
            if (task.worker === index) {
                task.reject(new Error(`Worker ${index} failed: ${event.message}`));
                id = key;
                break;
            }
        }
        if (id) {
            this.pending.delete(id);
        }
        
        // Chấm dứt worker hỏng và tạo một worker mới thay thế
        try {
            this.workers[index].terminate();
        } catch (e) {
            // Bỏ qua lỗi nếu worker đã bị chấm dứt
        }

        if (this.url) {
            const worker = new Worker(this.url);
            worker.onmessage = (e) => this.finish(e.data);
            worker.onerror = (e) => this.error(index, e);
            this.workers[index] = worker;
        }

        // Đưa worker mới trở lại pool và tiếp tục công việc
        this.idle.push(index);
        this.dispatch();
    }
}