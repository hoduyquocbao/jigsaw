# Sửa chữa các Lỗi Kiến trúc và Sự Đạo đức giả

*   **ID:** `20240526-purge-hypocrisy`
*   **Trạng thái:** `Complete`
*   **Độ ưu tiên:** `Blocker`

## Mô tả

Một cuộc rà soát đã phát hiện ra các sai lầm kiến trúc nghiêm trọng và sự không nhất quán trong việc áp dụng triết lý, dẫn đến mã nguồn mỏng manh, không an toàn và tự mâu thuẫn. Nhiệm vụ này là để sửa chữa triệt để các vấn đề này.

## Các hạng mục công việc

-   [x] **Kiến thức:**
    -   [x] Ghi lại toàn bộ các thất bại vào một file ký ức mới (`knowledges/memories/hypocrisy.md`).
    -   [x] Thiết lập các nguyên tắc kiến trúc mới để quản lý dependency (`dependency.md`) và thiết kế API (`abstraction.md`).

-   [x] **Tái cấu trúc Giao diện Người dùng (`index.tsx`):**
    -   [x] Sửa lỗi xung đột tên: đổi tên component `Report` thành `Reportview`. Cập nhật `Testview` thành `Reportview` cho nhất quán.
    -   [x] Loại bỏ logic nạp worker từ DOM (`getElementById`).
    -   [x] Import mã nguồn worker trực tiếp dưới dạng chuỗi (`?raw`).
    -   [x] Đơn giản hóa giao diện: loại bỏ hai nút "Quét Toàn bộ" và "Dùng Chỉ mục", thay bằng một nút "Thực thi Truy vấn" duy nhất.
    -   [x] Xóa tham số `useplanner` khỏi lời gọi `store.query`.

-   [x] **Tái cấu trúc `index.html`:**
    -   [x] Xóa hoàn toàn thẻ `<script id="worker">`.

-   [x] **Tái cấu trúc `backend/jigsaw/store/index.ts`:**
    -   [x] Xóa tham số `useplanner` khỏi phương thức `query`. Logic giờ sẽ luôn sử dụng `Planner`.

-   [x] **Tái cấu trúc `backend/jigsaw/query/planner.ts`:**
    -   [x] Loại bỏ hệ thống "chi phí" giả mạo.
    -   [x] Tái cấu trúc thành một bộ tối ưu hóa dựa trên quy tắc đơn giản và trung thực.
    -   [x] Cập nhật chú thích biện luận để phản ánh đúng bản chất của nó.

-   [x] **Dọn dẹp:**
    -   [x] Xóa file `backend/conductor/tasks.ts` không còn sử dụng.
    
-   [x] **Sửa lỗi `backend/tests.ts`:**
    -   [x] Cập nhật hàm `getcode` để import mã nguồn worker một cách an toàn.
    -   [x] Loại bỏ `async/await` không cần thiết trong bài test xây dựng `Tree` index.

-   [x] **Sửa lỗi `ui/report.tsx`:**
    -   [x] Đổi tên component `Report` thành `Reportview`.