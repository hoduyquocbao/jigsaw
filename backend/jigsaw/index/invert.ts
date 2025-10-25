import { Pointer } from '../store/pointer';

/**
 * @description  Một chỉ mục ngược, ánh xạ một giá trị cột tới danh sách các con trỏ chứa giá trị đó.
 * @purpose      Tăng tốc tối đa các truy vấn tìm kiếm bằng nhau (equality lookups), ví dụ: "WHERE user = 5".
 * @model        Chỉ mục Ngược (Inverted Index).
 * @complexity   - Xây dựng: O(N).
 *               - Tìm kiếm: O(1) để lấy danh sách các con trỏ.
 * @rationale    Đây là cấu trúc dữ liệu cốt lõi đằng sau các công cụ tìm kiếm. Nó cực kỳ hiệu quả cho các cột có số lượng giá trị riêng biệt thấp đến trung bình (low to medium cardinality) và các truy vấn tìm kiếm chính xác.
 */
export class Invert {
    private map: Map<any, Set<Pointer>>;

    constructor(column?: any[], pointers?: Pointer[]) {
        this.map = new Map();
        if (column && pointers) {
            this.build(column, pointers);
        }
    }
    
    private build(column: any[], pointers: Pointer[]): void {
        for (let i = 0; i < column.length; i++) {
            const value = column[i];
            const pointer = pointers[i];
            if (!this.map.has(value)) {
                this.map.set(value, new Set());
            }
            this.map.get(value)!.add(pointer);
        }
    }

    /**
     * @description Tìm tập hợp các con trỏ khớp với một giá trị.
     * @param {any} value Giá trị cần tìm.
     * @returns {Set<Pointer>} Tập hợp các con trỏ.
     */
    find(value: any): Set<Pointer> {
        return this.map.get(value) || new Set();
    }
}
