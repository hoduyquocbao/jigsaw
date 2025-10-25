import { Pointer } from './pointer';
import { Invert } from '../index/invert';
import { Tree } from '../index/tree';

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
     * @description Xây dựng một chỉ mục trên một cột cụ thể.
     * @param {string} column Tên cột cần lập chỉ mục.
     * @param {Invert | Tree} type Loại chỉ mục cần xây dựng.
     */
    build(column: string, type: Invert | Tree): void {
        const columnData = this.store.columns[column];
        if (!columnData) {
            throw new Error(`Column '${column}' does not exist.`);
        }
        
        // Tạo một mảng con trỏ mới mỗi lần build
        const pointers = Array.from({ length: this.store.count() }, (_, i) => new Pointer(i));

        if (type instanceof Invert) {
            this.indexes.set(column, new Invert(columnData, pointers));
        } else if (type instanceof Tree) {
             this.indexes.set(column, new Tree(columnData, pointers));
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
