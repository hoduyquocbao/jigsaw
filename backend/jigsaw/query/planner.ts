import { Pointer } from '../store/pointer';
import { Invert } from '../index/invert';
import { Tree } from '../index/tree';

/**
 * @description  Bộ tối ưu hóa truy vấn, phân tích một truy vấn và tạo ra một kế hoạch thực thi hiệu quả.
 * @purpose      Chọn chiến lược tốt nhất để lấy dữ liệu, ưu tiên sử dụng chỉ mục thay vì quét toàn bộ.
 * @solves       Vấn đề thực thi truy vấn một cách "ngây thơ" bằng cách luôn quét toàn bộ dữ liệu.
 * @model        Bộ tối ưu hóa Truy vấn dựa trên Quy tắc (Rule-Based Query Optimizer).
 * @complexity   O(F) với F là số bộ lọc trong truy vấn.
 * @rationale    Sự tồn tại của Planner tách biệt hoàn toàn logic "người dùng muốn gì" (truy vấn) khỏi "hệ thống nên làm như thế nào" (kế hoạch). Phiên bản này áp dụng chiến lược "chọn chỉ mục có độ chọn lọc cao nhất" (most selective index first). Quy tắc heuristic là: một chỉ mục Invert cho toán tử `eq` được ưu tiên hơn một chỉ mục Tree cho các toán tử phạm vi. Đây là một phương pháp đơn giản nhưng cực kỳ hiệu quả.
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
        let best: any = null;

        // Ưu tiên 1: Tìm bộ lọc `eq` có thể sử dụng chỉ mục Invert
        for (const f of filter) {
            if (f.op === 'eq') {
                const index = indexer.get(f.column);
                if (index instanceof Invert) {
                    best = { filter: f, type: 'invert' };
                    break; 
                }
            }
        }

        // Ưu tiên 2: Nếu không có, tìm bộ lọc phạm vi có thể dùng chỉ mục Tree
        if (!best) {
            for (const f of filter) {
                if (f.op === 'gte' || f.op === 'lte') {
                     const index = indexer.get(f.column);
                     if (index instanceof Tree) {
                         best = { filter: f, type: 'tree' };
                         break;
                     }
                }
            }
        }
        
        if (!best) {
            return { strategy: 'fullscan', query, filters: filter };
        }
        
        const index_plan = {
            type: best.type,
            column: best.filter.column,
            value: undefined,
            min: undefined,
            max: undefined,
        };

        if (best.type === 'invert') {
            index_plan.value = best.filter.value;
        } else if (best.type === 'tree') {
            // Tìm tất cả các bộ lọc phạm vi cho cùng một cột
            const range = filter.filter((f: any) => f.column === best.filter.column && (f.op === 'gte' || f.op === 'lte'));
            const gte = range.find((f: any) => f.op === 'gte');
            const lte = range.find((f: any) => f.op === 'lte');
            index_plan.min = gte?.value;
            index_plan.max = lte?.value;
        }

        // Các bộ lọc chưa được sử dụng bởi chỉ mục sẽ được áp dụng sau
        const remainder = filter.filter((f: any) => f.column !== best.filter.column);

        return { 
            strategy: 'index', 
            index: index_plan,
            filters: remainder, 
            query 
        };
    }
}