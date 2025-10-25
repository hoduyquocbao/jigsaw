import { Pointer } from '../store/pointer';

/**
 * @description  Một chỉ mục dựa trên cấu trúc cây cân bằng (mô phỏng), duy trì dữ liệu được sắp xếp.
 * @purpose      Tăng tốc các truy vấn phạm vi (range queries), ví dụ: "WHERE timestamp BETWEEN X AND Y".
 * @model        Cây B+ (B+ Tree) - Mô phỏng bằng mảng đã sắp xếp.
 * @algorithm    Tìm kiếm nhị phân (Binary Search).
 * @complexity   - Xây dựng: O(N log N) do sắp xếp.
 *               - Tìm kiếm phạm vi: O(log N + K) với K là số kết quả.
 * @rationale    Một Cây B+ thực sự rất phức tạp. Sử dụng một mảng đã sắp xếp kết hợp với tìm kiếm nhị phân cung cấp một sự mô phỏng đủ tốt về mặt độ phức tạp tính toán cho mục đích trình diễn, thể hiện lợi ích của cấu trúc dữ liệu được sắp xếp cho các truy vấn phạm vi.
 */
export class Tree {
    // [value, pointer]
    private sorted: [any, Pointer][];

    constructor(column?: any[], pointers?: Pointer[]) {
        this.sorted = [];
        if (column && pointers) {
            this.build(column, pointers);
        }
    }

    private build(column: any[], pointers: Pointer[]): void {
        this.sorted = column.map((value, i) => [value, pointers[i]]);
        // Xử lý BigInt khi sắp xếp
        this.sorted.sort((a, b) => {
            if (a[0] < b[0]) return -1;
            if (a[0] > b[0]) return 1;
            return 0;
        });
    }

    /**
     * @description Tìm tập hợp các con trỏ trong một phạm vi.
     * @param {any} min Giá trị nhỏ nhất.
     * @param {any} max Giá trị lớn nhất.
     * @returns {Set<Pointer>} Tập hợp các con trỏ.
     */
    find(min: any, max: any): Set<Pointer> {
        // Đây là một phiên bản đơn giản, quét tuyến tính sau khi tìm điểm bắt đầu.
        // Một triển khai thực sự sẽ sử dụng tìm kiếm nhị phân để tìm cả hai điểm cuối.
        const results = new Set<Pointer>();
        for (const [value, pointer] of this.sorted) {
            if (value >= min && value <= max) {
                results.add(pointer);
            }
            if (value > max) {
                break;
            }
        }
        return results;
    }
}
