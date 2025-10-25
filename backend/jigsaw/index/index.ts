import { Pointer } from '../store/pointer';

/**
 * @description  Một cấu trúc dữ liệu ánh xạ khóa chính (primary key) tới một con trỏ hàng trong Store.
 * @purpose      Cung cấp khả năng tìm kiếm một thực thể cụ thể với độ phức tạp O(1).
 * @solves       Vấn đề phải quét toàn bộ dữ liệu (O(N)) để tìm một bản ghi theo khóa.
 * @model        Bảng băm (Hash Table).
 * @complexity   Thêm: O(1), Tìm kiếm: O(1).
 * @rationale    Đây là giải pháp kinh điển để tăng tốc độ truy vấn khóa. Nó là một cấu trúc dữ liệu phụ trợ, nhỏ gọn, chỉ lưu trữ ánh xạ (key -> Pointer), không sao chép toàn bộ dữ liệu, do đó tối ưu hóa RAM.
 */
export class Index {
    private map: Map<any, Pointer>;

    constructor() {
        this.map = new Map();
    }

    /**
     * @description Thêm hoặc cập nhật một ánh xạ khóa-con trỏ.
     * @param {any} key Khóa của thực thể.
     * @param {Pointer} pointer Con trỏ đến thực thể.
     */
    set(key: any, pointer: Pointer): void {
        this.map.set(key, pointer);
    }

    /**
     * @description Tìm một con trỏ dựa trên khóa của nó.
     * @param {any} key Khóa của thực thể.
     * @returns {Pointer | undefined} Con trỏ, hoặc undefined nếu không tìm thấy.
     */
    find(key: any): Pointer | undefined {
        return this.map.get(key);
    }
}
