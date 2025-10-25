/**
 * @description  Một đơn vị công việc đã được biên dịch, sẵn sàng để thực thi.
 * @purpose      Đại diện cho kết quả của quá trình biên dịch (JIT hoặc AOT).
 * @solves       Sự vi phạm quy tắc và sự không rõ ràng về danh tính của các biến như 'jitFunction'.
 * @model        Functional Interface.
 * @rationale    Tách biệt khái niệm "cái gì" (một Executable) khỏi "như thế nào" (được tạo ra bởi JIT hoặc Interpreter) giúp mã nguồn sạch sẽ và tuân thủ triết lý. Nó định nghĩa một hợp đồng rõ ràng cho kết quả của quá trình lập kế hoạch và biên dịch.
 */
export interface Executable {
    (): any;
}
