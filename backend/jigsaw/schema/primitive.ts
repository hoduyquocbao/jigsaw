import { Kind } from './kind';

/**
 * @description  Đại diện cho một kiểu số nguyên có dấu hoặc không dấu với độ rộng bit tùy chỉnh.
 */
export class Integer extends Kind {
    readonly bits: 8 | 16 | 32 | 64;
    readonly signed: boolean;

    constructor(bits: 8 | 16 | 32 | 64, signed: boolean) {
        super();
        this.bits = bits;
        this.signed = signed;
    }
}

/**
 * @description  Đại diện cho một kiểu số thực dấu phẩy động (vô hướng).
 * @solves       Sự xung đột ngữ nghĩa và rủi ro từ khóa tương lai của tên 'Float'.
 * @rationale    'Scalar' là một thuật ngữ chính xác về mặt kỹ thuật, không xung đột, và phù hợp hoàn hảo với các khái niệm trong thiết kế hướng dữ liệu.
 */
export class Scalar extends Kind {
    readonly precision: 32 | 64;

    constructor(precision: 32 | 64) {
        super();
        this.precision = precision;
    }
}

/**
 * @description  Đại diện cho một kiểu boolean.
 * @purpose      Hoàn thiện bộ kiểu nguyên thủy của hệ thống.
 * @rationale    Là một kiểu dữ liệu cơ bản, không thể thiếu trong bất kỳ hệ thống schema nào.
 */
export class Boolean extends Kind {}
