/**
 * @description  Một tham chiếu bất biến đến một thực thể duy nhất trong Store.
 * @purpose      Trừu tượng hóa khái niệm về "vị trí", thay thế cho việc sử dụng các chỉ mục số nguyên thô.
 * @solves       Sự mơ hồ và vi phạm quy tắc của các biến như 'rowIndex'.
 * @model        Value Object.
 * @rationale    Bằng cách nâng cấp một số nguyên thành một đối tượng có kiểu, chúng ta làm cho mã nguồn an toàn hơn, dễ đọc hơn và hoàn toàn tuân thủ quy tắc định danh.
 */
export class Pointer {
    /**
     * @description Chỉ mục nội bộ, không thể truy cập công khai.
     * @type {number}
     */
    private readonly index: number;

    /**
     * @description Tạo một Pointer mới. Chỉ nên được gọi bởi các hệ thống nội bộ như Indexer.
     * @param {number} index Chỉ mục số nguyên.
     */
    constructor(index: number) {
        if (index < 0 || !Number.isInteger(index)) {
            throw new Error("Pointer index must be a non-negative integer.");
        }
        this.index = index;
    }

    /**
     * @description Lấy giá trị chỉ mục nội bộ.
     * @returns {number}
     */
    value(): number {
        return this.index;
    }

    /**
     * @description So sánh sự bằng nhau với một Pointer khác.
     * @param {Pointer} other Pointer để so sánh.
     * @returns {boolean}
     */
    equals(other: Pointer): boolean {
        // Để sử dụng trong Set, chúng ta cần một cách để định danh duy nhất.
        // Trong trường hợp này, chỉ mục là đủ.
        return this.index === other.index;
    }
    
    /**
     * @description Cung cấp giá trị cho việc băm trong Map và Set.
     * @returns {number}
     */
    valueOf(): number {
        return this.index;
    }
}
