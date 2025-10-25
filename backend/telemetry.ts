/**
 * @description  Một hệ thống thu thập và báo cáo các chỉ số hiệu suất (đo lường từ xa).
 * @purpose      Cung cấp một API đơn giản để đo lường thời gian thực thi của các hoạt động quan trọng.
 * @solves       Sự thiếu hụt một cơ chế giám sát hiệu suất có cấu trúc trong ứng dụng.
 * @model        Mô hình Singleton/Service.
 * @rationale    Một lớp Telemetry tập trung giúp chuẩn hóa cách đo lường hiệu suất trên toàn bộ ứng dụng. Nó tách biệt logic đo lường khỏi logic nghiệp vụ, giúp mã nguồn sạch sẽ hơn và dễ dàng mở rộng để gửi dữ liệu đến các hệ thống giám sát bên ngoài trong tương lai.
 */
export class Telemetry {
    private timings: Map<string, { start: number; end: number }>;

    constructor() {
        this.timings = new Map();
    }

    /**
     * @description Bắt đầu một bộ đếm thời gian cho một hoạt động.
     * @param {string} name Tên định danh của hoạt động.
     */
    start(name: string): void {
        this.timings.set(name, { start: performance.now(), end: 0 });
    }

    /**
     * @description Dừng một bộ đếm thời gian và ghi lại kết quả.
     * @param {string} name Tên định danh của hoạt động đã bắt đầu trước đó.
     */
    end(name: string): void {
        const timing = this.timings.get(name);
        if (timing && timing.end === 0) {
            timing.end = performance.now();
        }
    }

    /**
     * @description Xóa tất cả các chỉ số đã ghi.
     */
    reset(): void {
        this.timings.clear();
    }

    /**
     * @description Tạo một báo cáo từ các chỉ số đã thu thập.
     * @returns {Record<string, number>} Một đối tượng chứa thời gian thực thi (ms) của mỗi hoạt động.
     */
    report(): Record<string, number> {
        const result: Record<string, number> = {};
        for (const [name, { start, end }] of this.timings.entries()) {
            if (end > start) {
                result[name] = parseFloat((end - start).toFixed(2));
            }
        }
        return result;
    }
}
