# Nguyên tắc: Sự Kín kẽ của Lớp Trừu tượng (Airtight Abstractions)

## 1. Vấn đề

Một trong những sai lầm kiến trúc nghiêm trọng nhất là tạo ra một "lớp trừu tượng bị rò rỉ" (leaky abstraction). Một ví dụ điển hình là việc phơi bày tham số `useplanner: boolean` từ `Store` lên tận lớp giao diện người dùng. Điều này buộc client phải đưa ra một quyết định về tối ưu hóa mà nó không có đủ thông tin và cũng không nên có trách nhiệm phải thực hiện.

Hành động này vi phạm nguyên tắc đóng gói (encapsulation) một cách cơ bản.

## 2. Giải pháp Kiến trúc: API phải là Hộp đen

Nguyên tắc là: **Một API phải mô tả "ý định" (what), không phải "cách thực hiện" (how).**

### 2.1. Quy tắc cho Thiết kế API

1.  **Không phơi bày Chi tiết Triển khai:** Các tham số của một phương thức không bao giờ được phép chứa các cờ (flags) để bật/tắt hoặc thay đổi các chiến lược tối ưu hóa nội bộ.
2.  **Quyền quyết định thuộc về Chủ thể:** Module sở hữu logic (ví dụ: `Store`) phải chịu trách nhiệm 100% về cách nó thực thi một yêu cầu. Nó có thể sử dụng các module con (`Planner`, `Indexer`) để đưa ra quyết định đó, nhưng quyết định cuối cùng là của nó.
3.  **Client chỉ định Ý định:** Client chỉ nên cung cấp thông tin cần thiết để mô tả *ý định* của mình.
    *   **Tồi:** `store.query(myQuery, useIndex: true, cache: false)`
    *   **Tốt:** `store.query(myQuery)`

### 2.2. Áp dụng cho `Store`

Phương thức `query` của `Store` được tái cấu trúc để loại bỏ hoàn toàn tham số `useplanner`.

**Luồng logic mới (bên trong `Store.query`):**
1.  Luôn luôn gọi `planner.plan(query, this.indexer)`.
2.  Nhận một `plan` từ `Planner`.
3.  Gọi `engine.execute(plan, this)` để thực thi kế hoạch đó.

Bằng cách này, `Store` hoạt động như một hộp đen đúng nghĩa. Nó nhận một `Query` và trả về một kết quả. Toàn bộ sự phức tạp của việc lập kế hoạch và tối ưu hóa được che giấu hoàn toàn khỏi client.

## 3. Kết quả

Kiến trúc này mang lại:
- **Đóng gói Mạnh mẽ:** Client không thể và không cần phải can thiệp vào hoạt động nội bộ của `Store`.
- **Bảo trì Dễ dàng:** Đội ngũ phát triển có thể thay đổi hoàn toàn logic của `Planner` hoặc `Engine` mà không làm ảnh hưởng đến bất kỳ client nào đang sử dụng `Store`, miễn là hợp đồng của `query` được giữ nguyên.
- **API Rõ ràng:** API trở nên đơn giản hơn, dễ sử dụng hơn và ít gây lỗi hơn.

Đây là sự tuân thủ thực sự của **Sự Thông thái của Thiết kế**, nơi sự phức tạp được quản lý một cách có chủ đích bên trong các lớp trừu tượng, không bị rò rỉ ra ngoài.