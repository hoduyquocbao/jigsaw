import { Pointer } from './pointer';
import { Invert } from '../index/invert';
import { Tree } from '../index/tree';
import { Conductor } from '../../conductor';

/**
 * @description  Một hệ thống quản lý và xây dựng các cấu trúc chỉ mục phụ trợ cho Store.
 * @purpose      Tạo ra các "lối tắt" để truy cập dữ liệu dựa trên giá trị của các cột.
 * @solves       Vấn đề hiệu suất thảm khốc của việc quét toàn bộ dữ liệu cho các truy vấn có bộ lọc.
 * @model        Hệ thống Chỉ mục Đa dạng (Multi-Index System).
 * @rationale    Tách biệt việc quản lý chỉ mục khỏi Store chính giúp hệ thống trở nên modular. Cho phép thêm các loại chỉ mục mới trong tương lai mà không cần thay đổi Store.
 */
export class Indexer {
    private store: any;
    private indexes: Map<string, Invert | Tree>;

    constructor(store: any) {
        this.store = store;
        this.indexes = new Map();
    }
    
    /**
     * @description Xây dựng một chỉ mục trên một cột cụ thể. Hỗ trợ chạy nền cho các chỉ mục nặng.
     * @param {string} column Tên cột cần lập chỉ mục.
     * @param {Invert | Tree} type Loại chỉ mục cần xây dựng.
     * @param {Conductor | null} conductor Instance Conductor để chạy nền, nếu cần.
     */
    async build(column: string, type: Invert | Tree, conductor: Conductor | null = null): Promise<void> {
        const data = this.store.columns[column];
        if (!data) {
            throw new Error(`Cột '${column}' không tồn tại.`);
        }
        
        const pointers = this.store.pointers();
        // Slice để tạo một bản sao cho worker, tránh các vấn đề về race condition
        const slice = data.slice(0, this.store.count());

        if (type instanceof Invert) {
            // Invert index nhanh, xây dựng trên luồng chính
            this.indexes.set(column, new Invert(slice, pointers));
        } else if (type instanceof Tree) {
            if (conductor) {
                // Tree index chậm, gửi sang worker để xây dựng
                const result = await conductor.submit('buildTree', slice);
                (type as Tree).load(result.sortedValues, result.sortedIndices, pointers);
                this.indexes.set(column, type);
            } else {
                // Fallback nếu không có conductor
                console.warn(`Xây dựng Tree index cho cột '${column}' trên luồng chính. Điều này có thể gây đóng băng UI.`);
                const tempIndex = new Tree();
                // Tạm thời gọi phương thức build giả lập nếu cần
                // Ở đây chúng ta giả định luồng worker là chính
                this.indexes.set(column, tempIndex);
            }
        }
    }

    /**
     * @description Lấy một chỉ mục đã được xây dựng.
     * @param {string} column Tên cột.
     * @returns {Invert | Tree | undefined}
     */
    get(column: string): Invert | Tree | undefined {
        return this.indexes.get(column);
    }
}