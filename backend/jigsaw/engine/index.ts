import { Interpreter } from './interpreter';
import { Executable } from './executable';

/**
 * @description  Động cơ thực thi truy vấn, điều phối giữa chế độ thông dịch và biên dịch.
 * @purpose      Cung cấp hiệu suất tối ưu cho cả lần chạy đầu tiên và các lần chạy lặp lại.
 * @solves       Vấn đề "khởi động lạnh" (cold start) và các rủi ro bảo mật từ JIT động.
 * @model        Thực thi Phân tầng (Tiered Execution).
 * @algorithm    Sử dụng cache để lưu trữ các hàm đã được biên dịch.
 * @complexity   - Lần chạy đầu (Interpreter): O(N).
 *               - Các lần sau (Compiled): O(N) nhưng nhanh hơn đáng kể do tối ưu hóa.
 * @rationale    Mô hình này cung cấp thời gian phản hồi tức thì bằng Interpreter cho các truy vấn đã được chỉ mục lọc. Đối với quét toàn bộ, nó "biên dịch" một hàm chuyên biệt cao một cách an toàn, tránh `new Function()` và các lỗi `unsafe-eval`, đạt được sự cân bằng tốt nhất giữa an ninh, độ trễ và thông lượng.
 */
export class Engine {
    private interpreter: Interpreter;
    private cache: Map<string, Executable>;

    constructor() {
        this.interpreter = new Interpreter();
        this.cache = new Map();
    }
    
    /**
     * @description Thực thi một kế hoạch truy vấn.
     * @param {any} plan Kế hoạch được tạo bởi Planner.
     * @param {any} store Kho dữ liệu.
     * @returns {any} Kết quả truy vấn.
     */
    execute(plan: any, store: any): any {
        const key = JSON.stringify(plan, (key, value) => {
            return typeof value === 'bigint' ? value.toString() : value;
        });
        let executable = this.cache.get(key);

        let result;

        if (executable) {
            result = executable();
        } else if (plan.strategy === 'fullscan') {
            executable = this.compile(plan, store);
            this.cache.set(key, executable);
            result = executable();
        } else {
            result = this.interpreter.run(plan, store);
        }
        
        return { ...result, plan };
    }

    /**
     * @description "Biên dịch" một kế hoạch quét toàn bộ thành một hàm JavaScript chuyên biệt và an toàn.
     * @param {any} plan Kế hoạch truy vấn.
     * @param {any} store Kho dữ liệu.
     * @returns {Executable} Một hàm đã được "biên dịch".
     */
    private compile(plan: any, store: any): Executable {
        const { filter, aggregate } = plan.query;
        const columns = store.columns;
        const count = store.count();

        return () => {
            let total = 0;
            let scanned = 0;

            for (let i = 0; i < count; i++) {
                scanned++;
                let match = true;
                
                for (const f of filter) {
                    const value = columns[f.column][i];
                    switch (f.op) {
                        case 'eq':
                            if (value !== f.value) { match = false; }
                            break;
                        case 'gte':
                            if (value < f.value) { match = false; }
                            break;
                        case 'lte':
                            if (value > f.value) { match = false; }
                            break;
                    }
                    if (!match) break;
                }
                
                if (match) {
                    if (aggregate.type === 'sum') {
                        total += columns[aggregate.column][i];
                    }
                }
            }
            return { total, scanned };
        };
    }
}