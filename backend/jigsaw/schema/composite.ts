import { Kind } from './kind';

/**
 * @description  Đại diện cho một danh sách/mảng động chứa các phần tử cùng chủng loại. Tương đương với List<T>.
 * @purpose      Cho phép định nghĩa các trường dữ liệu có số lượng phần tử thay đổi.
 * @solves       Cung cấp khả năng biểu diễn các mối quan hệ một-nhiều trong schema.
 * @model        Kiểu Generic (Parametric Polymorphism).
 * @rationale    Là một khối xây dựng thiết yếu cho bất kỳ hệ thống kiểu nào, cho phép tạo ra các cấu trúc dữ liệu lồng nhau phức tạp.
 */
export class List extends Kind {
    readonly element: Kind;

    constructor(element: Kind) {
        super();
        this.element = element;
    }
}

/**
 * @description  Đại diện cho một cấu trúc có các trường được đặt tên. Tương đương với một record/struct.
 * @purpose      Định nghĩa cấu trúc của một thực thể hoặc đối tượng dữ liệu.
 * @solves       Cung cấp một cách để nhóm các trường dữ liệu liên quan lại với nhau.
 * @model        Kiểu Tích (Product Type).
 * @rationale    Là khối xây dựng cơ bản nhất cho dữ liệu có cấu trúc. Sử dụng Map đảm bảo thứ tự các trường được giữ nguyên và cung cấp khả năng truy cập O(1) vào định nghĩa của một trường.
 */
export class Record extends Kind {
    readonly fields: Map<string, Kind>;

    constructor(fields: { [key: string]: Kind }) {
        super();
        this.fields = new Map(Object.entries(fields));
    }
}

/**
 * @description  Một Kind bao bọc, biểu thị rằng một giá trị có thể là null. Tương đương Optional<T>.
 * @purpose      Cung cấp khả năng biểu diễn các trường dữ liệu không bắt buộc.
 * @solves       Vấn đề thiếu vắng nullability trong hệ thống schema, loại bỏ nhu cầu về các "giá trị ma thuật".
 * @model        Kiểu Tổng (Sum Type), cụ thể là Maybe Monad.
 * @rationale    Việc chính thức hóa nullability ở cấp độ kiểu giúp hệ thống an toàn hơn và cho phép các tối ưu hóa lưu trữ (ví dụ: sử dụng bitmask) thay vì lãng phí không gian cho các giá trị mặc định.
 */
export class Optional extends Kind {
    readonly kind: Kind;

    constructor(kind: Kind) {
        super();
        this.kind = kind;
    }
}

/**
 * @description  Một tham chiếu trễ (lazy reference) đến một Kind khác được định nghĩa trong Schema bằng tên.
 * @purpose      Cho phép định nghĩa các cấu trúc dữ liệu đệ quy như cây hoặc danh sách liên kết.
 * @solves       Vấn đề phụ thuộc vòng (circular dependency) khi định nghĩa các kiểu tự tham chiếu.
 * @model        Tham chiếu Trễ (Lazy Reference) hoặc Con trỏ Tượng trưng (Symbolic Pointer).
 * @rationale    Bằng cách trì hoãn việc giải quyết (resolving) kiểu cho đến giai đoạn biên dịch, chúng ta cho phép các định nghĩa schema trở nên linh hoạt và mạnh mẽ hơn nhiều, có khả năng mô tả bất kỳ cấu trúc dữ liệu nào.
 */
export class Reference extends Kind {
    readonly name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }
}
