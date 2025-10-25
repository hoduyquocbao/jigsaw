import { Pointer } from '../store/pointer';

/**
 * @description  Một chỉ mục dựa trên cấu trúc cây cân bằng (mô phỏng), duy trì dữ liệu được sắp xếp.
 * @purpose      Tăng tốc các truy vấn phạm vi (range queries), ví dụ: "WHERE timestamp BETWEEN X AND Y".
 * @model        Cây B+ (B+ Tree) - Mô phỏng bằng mảng đã sắp xếp.
 * @algorithm    Tìm kiếm nhị phân (Binary Search).
 * @complexity   - Xây dựng (Worker): O(N log N).
 *               - Tìm kiếm phạm vi: O(log N + K) với K là số kết quả.
 * @rationale    Một Cây B+ thực sự rất phức tạp. Sử dụng một mảng đã sắp xếp kết hợp với tìm kiếm nhị phân cung cấp một sự mô phỏng đủ tốt về mặt độ phức tạp tính toán cho mục đích trình diễn. Việc chuyển logic sắp xếp sang Worker là tối quan trọng để không làm đóng băng UI.
 */
export class Tree {
    private values: any[] = [];
    private pointers: Pointer[] = [];

    constructor() {
        // Constructor giờ đây trống, việc build sẽ được thực hiện riêng.
    }
    
    /**
     * @description Nạp dữ liệu đã được sắp xếp trước từ worker.
     * @param {any[]} sortedValues Mảng các giá trị đã sắp xếp.
     * @param {number[]} sortedIndices Mảng các chỉ số gốc tương ứng.
     * @param {Pointer[]} originalPointers Mảng con trỏ gốc.
     */
    load(sortedValues: any[], sortedIndices: number[], originalPointers: Pointer[]): void {
        this.values = sortedValues.map(v => BigInt(v));
        this.pointers = sortedIndices.map(i => originalPointers[i]);
    }


    /**
     * @description Tìm kiếm nhị phân để tìm chỉ số của phần tử đầu tiên >= giá trị cho trước.
     * @param {any} value Giá trị cần tìm.
     * @returns {number} Chỉ số của phần tử tìm thấy.
     */
    private findStart(value: any): number {
        let low = 0;
        let high = this.values.length;
        while (low < high) {
            const mid = Math.floor(low + (high - low) / 2);
            if (this.values[mid] < value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }

    /**
     * @description Tìm tập hợp các con trỏ trong một phạm vi.
     * @param {any} min Giá trị nhỏ nhất.
     * @param {any} max Giá trị lớn nhất.
     * @returns {Set<Pointer>} Tập hợp các con trỏ.
     */
    find(min: any, max: any): Set<Pointer> {
        const results = new Set<Pointer>();
        const minVal = min !== undefined && min !== null ? BigInt(min) : null;
        const maxVal = max !== undefined && max !== null ? BigInt(max) : null;
        
        if (minVal === null && maxVal === null) return new Set();

        const start = minVal !== null ? this.findStart(minVal) : 0;

        for (let i = start; i < this.values.length; i++) {
            const value = this.values[i];
            
            if (maxVal !== null && value > maxVal) {
                break; // Tối ưu hóa: dừng sớm khi đã vượt qua phạm vi
            }

            results.add(this.pointers[i]);
        }
        
        return results;
    }
}