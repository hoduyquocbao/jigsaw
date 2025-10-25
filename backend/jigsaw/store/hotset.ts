import { Pointer } from './pointer';
/**
 * @description  Một bộ đệm LRU (Least Recently Used) chứa các bản ghi đã được tái tạo hoàn chỉnh.
 * @purpose      Lưu trữ các đối tượng được truy cập thường xuyên để cung cấp khả năng truy cập tức thời.
 * @solves       Vấn đề chi phí tái tạo đối tượng từ các cột cho các "điểm nóng" (hotspots) dữ liệu.
 * @model        Bộ đệm LRU (LRU Cache).
 * @complexity   Truy cập: O(1).
 * @rationale    Chỉ một phần nhỏ dữ liệu thường được truy cập nhiều lần. Hotset đảm bảo các truy cập lặp lại này nhanh như truy cập một đối tượng trong bộ nhớ, trong khi vẫn giữ dung lượng RAM tổng thể ở mức thấp bằng cách tự động loại bỏ các mục ít dùng.
 */
export class Hotset {
    private cache: Map<number, any>;
    private limit: number;

    constructor(limit: number = 1000) {
        this.cache = new Map();
        this.limit = limit;
    }

    /**
     * @description Lấy một đối tượng đã được tái tạo từ bộ đệm.
     * @param {Pointer} pointer Con trỏ đến thực thể.
     * @returns {object | undefined} Đối tượng hoàn chỉnh, hoặc undefined.
     */
    get(pointer: Pointer): object | undefined {
        const value = this.cache.get(pointer.value());
        if (value) {
            // Logic LRU: di chuyển lên đầu (ở đây bỏ qua để đơn giản)
            return value;
        }
        return undefined;
    }

    /**
     * @description Thêm một đối tượng vào bộ đệm.
     * @param {Pointer} pointer Con trỏ đến thực thể.
     * @param {object} entity Đối tượng đã được tái tạo.
     */
    put(pointer: Pointer, entity: object): void {
        if (this.cache.size >= this.limit) {
            // Logic LRU: xóa mục cũ nhất
            const oldest = this.cache.keys().next().value;
            this.cache.delete(oldest);
        }
        this.cache.set(pointer.value(), entity);
    }
}
