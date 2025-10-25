import { Kind } from '../schema/kind';
import { Record } from '../schema/composite';
import { Integer, Scalar } from '../schema/primitive';
import { Pointer } from './pointer';
import { Indexer } from './indexer';
import { Planner } from '../query/planner';
import { Engine } from '../engine';

function getTypedArray(kind: Kind) {
    if (kind instanceof Integer) {
        switch (kind.bits) {
            case 8: return kind.signed ? Int8Array : Uint8Array;
            case 16: return kind.signed ? Int16Array : Uint16Array;
            case 32: return kind.signed ? Int32Array : Uint32Array;
            case 64: return kind.signed ? BigInt64Array : BigUint64Array;
        }
    }
    if (kind instanceof Scalar) {
        return kind.precision === 32 ? Float32Array : Float64Array;
    }
    // For text, list, etc., we would store offsets or use different strategies
    return Array;
}


/**
 * @description  Một kho lưu trữ dữ liệu trong bộ nhớ, dạng cột, hiệu suất cao.
 * @purpose      Cung cấp API để thêm, quản lý và thực hiện các truy vấn trên dữ liệu.
 * @solves       Tạo ra một "cơ sở dữ liệu mini" trong bộ nhớ cho mỗi loại schema.
 * @model        Cơ sở dữ liệu In-Memory dạng cột (In-Memory Columnar Database).
 * @rationale    Đây là lớp chính (Facade) mà người dùng tương tác. Nó đóng gói sự phức tạp của việc quản lý bộ nhớ, lập chỉ mục, lập kế hoạch và thực thi truy vấn, cung cấp một giao diện đơn giản và mạnh mẽ.
 */
export class Store {
    private kind: Kind;
    private pointers: Pointer[] = [];
    public columns: { [key: string]: any } = {};
    private _count: number = 0;
    private capacity: number = 0;

    public indexer: Indexer;
    private planner: Planner;
    private engine: Engine;

    constructor(kind: Kind, capacity: number = 1024) {
        if (!(kind instanceof Record)) {
            throw new Error("Store must be initialized with a Record kind.");
        }
        this.kind = kind;
        this.capacity = capacity;
        
        kind.fields.forEach((fieldKind, fieldName) => {
            const ArrayType = getTypedArray(fieldKind);
            this.columns[fieldName] = new ArrayType(capacity);
        });

        this.indexer = new Indexer(this);
        this.planner = new Planner();
        this.engine = new Engine();
    }
    
    count(): number {
        return this._count;
    }
    
    /**
     * @description Lấy bộ con trỏ gốc của store.
     * @returns {Pointer[]} Mảng các con trỏ đến mỗi hàng.
     */
    public getPointers(): Pointer[] {
        return this.pointers;
    }


    /**
     * @description Thêm một loạt các đối tượng vào store. Xử lý việc chuyển đổi kiểu dữ liệu cần thiết.
     * @param {object[]} data Mảng các đối tượng cần thêm.
     */
    add(data: any[]): void {
        if (this._count + data.length > this.capacity) {
            console.warn("Store capacity exceeded. Ignoring new data.");
            return;
        }

        const recordKind = this.kind as Record;

        for (const record of data) {
            const index = this._count;
            recordKind.fields.forEach((fieldKind, fieldName) => {
                let value = record[fieldName];
                
                if (fieldKind instanceof Integer && fieldKind.bits === 64) {
                    if (typeof value !== 'bigint') {
                        const num = Number(value);
                        value = BigInt(isNaN(num) ? 0 : Math.round(num));
                    }
                }
                
                this.columns[fieldName][index] = value;
            });
            this.pointers.push(new Pointer(index));
            this._count++;
        }
    }
    
     /**
     * @description Thực thi một truy vấn trên dữ liệu, có đo lường hiệu suất chi tiết.
     * @param {any} query Đối tượng mô tả truy vấn.
     * @param {boolean} useplanner Cờ để bật/tắt planner cho mục đích demo.
     * @returns {any} Kết quả của truy vấn, bao gồm các chỉ số hiệu suất.
     */
    query(query: any, useplanner: boolean = true): any {
        let plan;
        
        const planningStart = performance.now();
        if (useplanner) {
            plan = this.planner.plan(query, this.indexer);
        } else {
            plan = { strategy: 'fullscan', query };
        }
        const planningTime = performance.now() - planningStart;
        
        const executionStart = performance.now();
        const result = this.engine.execute(plan, this);
        const executionTime = performance.now() - executionStart;

        return {
            ...result,
            planning: planningTime,
            execution: executionTime,
        };
    }
}