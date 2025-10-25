import { Pointer } from '../store/pointer';
import { Invert } from '../index/invert';
import { Tree } from '../index/tree';

/**
 * @description  Bộ tối ưu hóa truy vấn, phân tích một truy vấn và tạo ra một kế hoạch thực thi hiệu quả.
 * @purpose      Chọn chiến lược tốt nhất để lấy dữ liệu, ưu tiên sử dụng chỉ mục thay vì quét toàn bộ.
 * @solves       Vấn đề thực thi truy vấn một cách "ngây thơ" bằng cách luôn quét toàn bộ dữ liệu.
 * @model        Bộ tối ưu hóa Truy vấn dựa trên Quy tắc (Rule-Based Query Optimizer).
 * @complexity   O(F * I) với F là số bộ lọc, I là số chỉ mục.
 * @rationale    Sự tồn tại của Planner tách biệt hoàn toàn logic "người dùng muốn gì" (truy vấn) khỏi "hệ thống nên làm như thế nào" (kế hoạch). Phiên bản này áp dụng chiến lược "chọn chỉ mục tốt nhất, sau đó lọc" (index-then-filter), một heuristic cực kỳ hiệu quả giúp giảm nhanh tập dữ liệu cần quét mà không cần các phép tính giao tập hợp (set intersection) tốn kém trong giai đoạn lập kế hoạch.
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
        const candidates = [];
        const groups: { [key: string]: any[] } = {};

        for (const f of filter) {
            if (!groups[f.column]) {
                groups[f.column] = [];
            }
            groups[f.column].push(f);
        }

        for (const column in groups) {
            const index = indexer.get(column);
            if (!index) continue;

            const filters = groups[column];
            
            if (index instanceof Invert && filters.some(f => f.op === 'eq')) {
                // Chi phí 1: Tìm kiếm bằng nhau trên Invert là lựa chọn có chọn lọc nhất.
                candidates.push({ column, cost: 1, type: 'invert' });
            } else if (index instanceof Tree) {
                // Chi phí 10: Quét phạm vi trên Tree ít chọn lọc hơn.
                candidates.push({ column, cost: 10, type: 'tree' });
            }
        }
        
        if (candidates.length === 0) {
            return { strategy: 'fullscan', query, filters: filter };
        }
        
        // Sắp xếp các ứng viên, chọn cái có chi phí thấp nhất (chọn lọc nhất)
        candidates.sort((a, b) => a.cost - b.cost);
        const best = candidates[0];
        
        let pointers: Set<Pointer>;
        const index = indexer.get(best.column);

        if (best.type === 'invert' && index instanceof Invert) {
            const filter = groups[best.column].find(f => f.op === 'eq');
            pointers = index.find(filter.value);
        } else if (best.type === 'tree' && index instanceof Tree) {
            const range = groups[best.column];
            const gte = range.find(f => f.op === 'gte');
            const lte = range.find(f => f.op === 'lte');
            pointers = index.find(gte?.value, lte?.value);
        } else {
             // Dự phòng nếu có lỗi logic
            return { strategy: 'fullscan', query, filters: filter };
        }

        // Các bộ lọc chưa được sử dụng bởi chỉ mục sẽ được áp dụng sau
        const remainder = filter.filter(f => f.column !== best.column);

        return { 
            strategy: 'index', 
            pointers, 
            filters: remainder, // Chuyển các bộ lọc còn lại cho giai đoạn thực thi
            query 
        };
    }
}