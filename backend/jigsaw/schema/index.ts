import { Integer, Scalar, Boolean } from './primitive';
import { Text } from './text';
import { List, Record, Optional, Reference } from './composite';
import { Kind } from './kind';

// --- Factory Functions hoàn toàn an toàn ngữ nghĩa ---

export const integer = (bits: 8 | 16 | 32 | 64, signed: boolean): Integer => new Integer(bits, signed);
export const scalar = (precision: 32 | 64): Scalar => new Scalar(precision);
export const text = (): Text => new Text();
export const list = (element: Kind): List => new List(element);
export const record = (fields: { [key: string]: Kind }): Record => new Record(fields);
export const boolean = (): Boolean => new Boolean();
export const optional = (kind: Kind): Optional => new Optional(kind);
export const reference = (name: string): Reference => new Reference(name);


/**
 * @description  Một kho lưu trữ các định nghĩa chủng loại có thể tái sử dụng.
 * @purpose      Cho phép người dùng định nghĩa các cấu trúc phức tạp một lần và tham chiếu chúng bằng tên.
 * @solves       1. Vấn đề lặp lại code và quản lý các kiểu phức tạp trong các schema lớn.
 *               2. Cho phép định nghĩa các kiểu đệ quy thông qua `Reference`.
 * @model        Bảng Ký hiệu (Symbol Table).
 * @rationale    Cung cấp một cơ chế giống như namespace hoặc type registry, giúp mã nguồn định nghĩa schema trở nên sạch sẽ, có tổ chức và dễ bảo trì. Đây là thành phần trung tâm để kích hoạt các tính năng nâng cao như kiểu đệ quy.
 */
export class Schema {
    private kinds: Map<string, Kind>;

    constructor() {
        this.kinds = new Map();
    }

    /**
     * @description Định nghĩa một chủng loại mới có thể tái sử dụng trong schema.
     * @param {string} name Tên của chủng loại.
     * @param {Kind} kind Định nghĩa chủng loại (bất kỳ Kind nào).
     */
    define(name: string, kind: Kind): void {
        if (this.kinds.has(name)) {
            throw new Error(`Kind '${name}' is already defined.`);
        }
        this.kinds.set(name, kind);
    }

    /**
     * @description Lấy một định nghĩa chủng loại đã được định nghĩa trước đó.
     * @param {string} name Tên của chủng loại.
     * @returns {Kind}
     */
    get(name: string): Kind {
        const kind = this.kinds.get(name);
        if (!kind) {
            throw new Error(`Kind '${name}' not defined.`);
        }
        return kind;
    }
}
