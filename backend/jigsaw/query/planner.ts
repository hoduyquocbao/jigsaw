import { Pointer } from '../store/pointer';
import { Invert } from '../index/invert';
import { Tree } from '../index/tree';

/**
 * @description  Bộ tối ưu hóa truy vấn, phân tích một truy vấn và tạo ra một kế hoạch thực thi hiệu quả.
 * @purpose      Chọn chiến lược tốt nhất để lấy dữ liệu, ưu tiên sử dụng chỉ mục thay vì quét toàn bộ.
 * @solves       Vấn đề thực thi truy vấn một cách "ngây thơ" bằng cách luôn quét toàn bộ dữ liệu.
 * @model        Bộ tối ưu hóa Truy vấn dựa trên Quy tắc (Rule-Based Query Optimizer).
 * @complexity   O(F * I) với F là số bộ lọc, I là số chỉ mục.
 * @rationale    Sự tồn tại của Planner tách biệt hoàn toàn logic "người dùng muốn gì" (truy vấn) khỏi "hệ thống nên làm như thế nào" (kế hoạch). Đây là dấu hiệu của một hệ thống cơ sở dữ liệu trưởng thành. Phiên bản này sử dụng các quy tắc đơn giản (ví dụ: "nếu có chỉ mục, hãy dùng nó") để chọn kế hoạch tốt nhất.
 */
export class Planner {
     /**
     * @description Tạo một kế hoạch thực thi cho một truy vấn.
     * @param {any} query Truy vấn của người dùng.
     * @param {any} indexer Hệ thống chỉ mục có sẵn.
     * @returns {any} Một kế hoạch thực thi đã được tối ưu hóa.
     */
    plan(query: any, indexer: any): any {
        const { filter } = query;
        let candidates = [];

        // Tìm các chỉ mục phù hợp cho từng bộ lọc
        for (const f of filter) {
            const index = indexer.get(f.column);
            if (!index) continue;

            if (f.op === 'eq' && index instanceof Invert) {
                candidates.push({ ...f, cost: 1, type: 'invert' }); // Chi phí rất thấp
            }
            if ((f.op === 'gte' || f.op === 'lte') && index instanceof Tree) {
                // Ước tính chi phí dựa trên phạm vi (cần thống kê, ở đây giả định)
                candidates.push({ ...f, cost: 10, type: 'tree' });
            }
        }
        
        // Nếu không có chỉ mục nào phù hợp
        if (candidates.length === 0) {
            return { strategy: 'fullscan', query };
        }
        
        // Chọn các chỉ mục tốt nhất để sử dụng (ở đây là logic đơn giản)
        // Một planner thực sự sẽ có logic phức tạp hơn để kết hợp các chỉ mục
        let pointers: Set<Pointer> | null = null;

        const processedColumns = new Set<string>();

        for (const c of candidates) {
            if (processedColumns.has(c.column)) continue;

            let result: Set<Pointer> | undefined;
            const index = indexer.get(c.column);

            if (c.type === 'invert' && index instanceof Invert) {
                result = index.find(c.value);
                processedColumns.add(c.column);
            } else if (c.type === 'tree' && index instanceof Tree) {
                const range = filter.filter(f => f.column === c.column);
                const gte = range.find(f => f.op === 'gte');
                const lte = range.find(f => f.op === 'lte');
                result = index.find(gte?.value, lte?.value);
                processedColumns.add(c.column);
            }

            if (result) {
                if (!pointers) {
                    pointers = result;
                } else {
                    // Giao của hai tập hợp con trỏ
                    pointers = new Set([...pointers].filter(p => result!.has(p)));
                }
            }
        }
        
        return { strategy: 'index', pointers, query };
    }
}
