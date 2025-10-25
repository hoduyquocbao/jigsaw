/**
 * @description  Một bộ thực thi truy vấn dựa trên việc duyệt cây (tree-walking).
 * @purpose      Cung cấp một kết quả ngay lập tức cho một truy vấn mà không cần chờ biên dịch.
 * @solves       Vấn đề độ trễ "khởi động lạnh" (cold start) của Engine JIT.
 * @model        Mô hình Interpreter.
 * @complexity   Chậm hơn mã JIT-compiled do chi phí trừu tượng, nhưng chi phí khởi tạo bằng không.
 * @rationale    Đối với các truy vấn phức tạp hoặc các truy vấn đã được chỉ mục lọc còn rất ít dữ liệu, chi phí chạy Interpreter là chấp nhận được và tránh được độ trễ của JIT. Đây là nền tảng của mô hình thực thi phân tầng.
 */
export class Interpreter {
    /**
     * @description Thực thi một kế hoạch truy vấn.
     * @param {any} plan Kế hoạch được tạo bởi Planner.
     * @param {any} store Kho dữ liệu.
     * @returns {any} Kết quả truy vấn.
     */
    run(plan: any, store: any): any {
        const { pointers } = plan;
        const { aggregate } = plan.query;
        const columns = store.columns;
        let total = 0;

        for (const pointer of pointers) {
            const index = pointer.value();
            if (aggregate.type === 'sum') {
                total += columns[aggregate.column][index];
            }
        }

        return { total, scanned: pointers.size };
    }
}