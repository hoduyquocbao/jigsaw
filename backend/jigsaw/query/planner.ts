
import { Pointer } from '../store/pointer';
import { Invert } from '../index/invert';
import { Tree } from '../index/tree';

/**
 * @description  Bộ tối ưu hóa truy vấn, phân tích một truy vấn và tạo ra một kế hoạch thực thi hiệu quả.
 * @purpose      Chọn chiến lược tốt nhất để lấy dữ liệu, ưu tiên sử dụng chỉ mục thay vì quét toàn bộ.
 * @solves       Vấn đề thực thi truy vấn một cách "ngây thơ" bằng cách luôn quét toàn bộ dữ liệu.
 * @model        Bộ tối ưu hóa Truy vấn dựa trên Quy tắc (Rule-Based Query Optimizer).
 * @complexity   O(F * I) với F là số bộ lọc, I là số chỉ mục.
 * @rationale    Sự tồn tại của Planner tách biệt hoàn toàn logic "người dùng muốn gì" (truy vấn) khỏi "hệ thống nên làm như thế nào" (kế hoạch). Phiên bản này sử dụng quy tắc "chỉ mục chọn lọc nhất" để giảm nhanh tập dữ liệu cần quét, một heuristic hiệu quả để tăng tốc độ truy vấn mà không cần thống kê phức tạp.
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
        const filtersByColumn: { [key: string]: any[] } = {};

        for (const f of filter) {
            if (!filtersByColumn[f.column]) {
                filtersByColumn[f.column] = [];
            }
            filtersByColumn[f.column].push(f);
        }

        for (const column in filtersByColumn) {
            const index = indexer.get(column);
            if (!index) continue;

            const columnFilters = filtersByColumn[column];
            
            if (index instanceof Invert && columnFilters.some(f => f.op === 'eq')) {
                // Ưu tiên cao nhất cho tìm kiếm bằng nhau trên Invert
                candidates.push({ column, cost: 1, type: 'invert' });
            } else if (index instanceof Tree) {
                // Ưu tiên thấp hơn cho quét phạm vi trên Tree
                candidates.push({ column, cost: 10, type: 'tree' });
            }
        }
        
        if (candidates.length === 0) {
            return { strategy: 'fullscan', query };
        }
        
        // Sắp xếp các ứng viên, chọn cái có chi phí thấp nhất
        candidates.sort((a, b) => a.cost - b.cost);
        const best = candidates[0];
        
        let pointers: Set<Pointer>;
        const index = indexer.get(best.column);

        if (best.type === 'invert' && index instanceof Invert) {
            const eqFilter = filtersByColumn[best.column].find(f => f.op === 'eq');
            pointers = index.find(eqFilter.value);
        } else if (best.type === 'tree' && index instanceof Tree) {
            const range = filtersByColumn[best.column];
            const gte = range.find(f => f.op === 'gte');
            const lte = range.find(f => f.op === 'lte');
            pointers = index.find(gte?.value, lte?.value);
        } else {
             // Fallback
            return { strategy: 'fullscan', query };
        }

        // Các bộ lọc còn lại sẽ được áp dụng sau
        const postFilters = filter.filter(f => f.column !== best.column);

        return { 
            strategy: 'index', 
            pointers, 
            filters: postFilters, // Post-filters
            query 
        };
    }
}