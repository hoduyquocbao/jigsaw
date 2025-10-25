# Tái cấu trúc Tuân thủ Chỉ thị Tối cao

*   **ID:** `20240524-refactor-compliance`
*   **Trạng thái:** `Complete`
*   **Độ ưu tiên:** `Critical`

## Mô tả

Mã nguồn ban đầu chứa các vi phạm phổ biến đối với **Luật về Định danh Đơn từ** và **Luật về Mã nguồn Tự biện luận**. Nhiệm vụ này bao gồm việc rà soát và sửa chữa toàn bộ mã nguồn để đảm bảo tuân thủ 100%.

## Các hạng mục công việc

-   [x] **Rà soát `index.tsx`:**
    -   [x] Tái cấu trúc state management từ `useState` sang `useReducer` để loại bỏ các hàm setter `camelCase`.
    -   [x] Đổi tên các component `PascalCase` đa từ (`TestCard`, `TelemetryDisplay`, `ResultDisplay`) thành các định danh đơn từ (`Report`, `Telemetry`, `Outcome`).
    -   [x] Đổi tên các interface `...Props` thành `...able` (ví dụ: `Cardable`).
    -   [x] Sửa các biến cục bộ `camelCase` (`workerCode`).
    -   [x] Bổ sung các chú thích biện luận kiến trúc Cấp 1 cho tất cả các component.

-   [x] **Rà soát `index.html` (Worker Script):**
    -   [x] Đổi tên hàm `buildTree` thành `build`.
    -   [x] Đổi tên các biến `camelCase` (`startDate`, `sortedValues`) thành các định danh đơn từ hợp lệ.

-   [x] **Rà soát Module `conductor`:**
    -   [x] Đổi tên interface `Task` thành `Taskable`.
    -   [x] Sửa các biến cục bộ `camelCase` (`workerIndex`, `newWorker`).

-   [x] **Rà soát Module `jigsaw`:**
    -   [x] Đổi tên hàm `gettype` thành `resolve`.
    -   [x] Tái cấu trúc logic đo lường thời gian trong `Store.query` để loại bỏ các biến `camelCase`.

-   [x] **Rà soát Module `test` và `ui`:**
    -   [x] Sửa các biến `camelCase` trong `test/index.ts`.
    -   [x] Đổi tên component `Card` trong `ui/report.tsx` thành `Report` để tránh nhầm lẫn và cụ thể hóa mục đích.
    -   [x] Sửa hàm `getWorkerCode` trong `backend/tests.ts`.
