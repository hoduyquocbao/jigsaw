/**
 * @description  Một đối tượng đại diện cho một truy vấn có cấu trúc.
 * @purpose      Cung cấp một cách để người dùng định nghĩa các thao tác họ muốn thực hiện trên dữ liệu.
 * @solves       Tránh việc phải truyền các chuỗi truy vấn hoặc các đối tượng lộn xộn, không có cấu trúc.
 * @model        Đối tượng Truy vấn (Query Object).
 * @rationale    Sử dụng một lớp chuyên dụng cho truy vấn cho phép Planner phân tích nó một cách đáng tin cậy. Nó đóng vai trò là một Cây Cú pháp Trừu tượng (AST) cho một truy vấn, tách biệt "cái gì" (ý định) khỏi "như thế nào" (kế hoạch thực thi).
 */

// Trong một hệ thống sản xuất, đây sẽ là một lớp Query Builder linh hoạt.
// Để đơn giản cho demo, chúng ta sẽ sử dụng một interface đơn giản.
export interface Query {
    filter: { column: string; op: 'eq' | 'gte' | 'lte'; value: any }[];
    aggregate: { type: 'sum'; column: string };
}
