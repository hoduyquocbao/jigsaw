/**
 * @description  Thực thi các tác vụ được đăng ký, được gửi từ luồng chính.
 * @purpose      Là đơn vị thực thi độc lập, an toàn, chạy trong một luồng riêng biệt.
 * @solves       Tách biệt việc tính toán nặng ra khỏi luồng chính một cách an toàn.
 * @model        Mô hình Actor.
 * @rationale    Worker import trực tiếp registry, đảm bảo type-safety và cho phép bundler đóng gói các phụ thuộc một cách chính xác. Việc gọi hàm qua một khóa chuỗi là một cơ chế điều phối (dispatch) an toàn và hiệu quả. Bằng cách nhúng registry trực tiếp, chúng ta loại bỏ các vấn đề về tải module trong môi trường worker.
 */

// --- Registry được nhúng trực tiếp để tránh lỗi bảo mật khi import ---

/**
 * @description  Một registry tập trung cho tất cả các hàm có thể được thực thi bởi Conductor.
 * @purpose      Loại bỏ rủi ro an ninh và các vấn đề bảo trì của việc thực thi mã động (`new Function`).
 * @solves       Cung cấp một "allow-list" các tác vụ, đảm bảo chỉ mã nguồn đã được kiểm duyệt mới có thể chạy.
 * @model        Mô hình Registry.
 * @rationale    Đây là một mẫu thiết kế bảo mật tiêu chuẩn. Bằng cách định nghĩa trước các tác vụ, chúng ta cho phép các công cụ như TypeScript và Webpack phân tích, tối ưu hóa và đóng gói mã nguồn một cách chính xác, đồng thời ngăn chặn hoàn toàn các cuộc tấn công chèn mã.
 */

// Tác vụ nặng để trình diễn xử lý song song
function heavy(chunk: number[]): number {
    // Một phép tính vô nghĩa nhưng tốn thời gian
    return chunk.reduce((s, v) => s + Math.sqrt(v), 0);
}

// Tác vụ tạo dữ liệu mẫu
function generate(count: number): any[] {
    const data = [];
    const startDate = new Date(2020, 0, 1).getTime();
    const endDate = new Date(2024, 11, 31).getTime();
    for (let i = 0; i < count; i++) {
        data.push({
            id: i,
            user: Math.floor(Math.random() * 100),
            product: Math.floor(Math.random() * 1000),
            amount: Math.random() * 200,
            timestamp: BigInt(startDate + Math.random() * (endDate - startDate)),
        });
    }
    return data;
}

const registry = {
    heavy,
    generate,
};

// --- Kết thúc registry được nhúng ---


self.onmessage = async (event: MessageEvent) => {
    const { name, args, id } = event.data;

    const task = registry[name];

    if (!task) {
        self.postMessage({ id, error: `Task '${name}' not found in registry.` });
        return;
    }

    try {
        const result = await task(...args);
        
        // Phản hồi có thể chứa Transferable Objects, nhưng ở đây chúng ta chỉ trả về kết quả
        self.postMessage({ id, result });

    } catch (e: any) {
        self.postMessage({ id, error: e.message });
    }
};
