# Nguyên tắc: Quản lý Phụ thuộc Tách biệt và An toàn

## 1. Vấn đề

Một hệ thống không thể hoạt động độc lập; nó có các phụ thuộc. Một trong những phụ thuộc khó quản lý nhất trong môi trường web là mã nguồn cho Web Worker. Một quyết định kiến trúc sai lầm trước đây đã cố gắng giải quyết vấn đề này bằng cách nhúng mã worker vào một thẻ `<script>` trong `index.html` và đọc nó bằng `document.getElementById`.

Cách tiếp cận này là một sai lầm nghiêm trọng vì:
- **Phụ thuộc Cứng:** Logic ứng dụng bị ràng buộc chặt chẽ với cấu trúc DOM.
- **Không được Quản lý:** Mã nguồn worker nằm ngoài tầm kiểm soát của các công cụ xây dựng (bundler), không được biên dịch TypeScript, tối ưu hóa, hay phân tích tĩnh.
- **Thiếu An toàn:** Dễ bị tấn công XSS và khó bảo trì.

## 2. Giải pháp Kiến trúc: Coi Mọi thứ là một Module

Nguyên tắc là: **Mọi đoạn mã nguồn thực thi phải được coi là một module trong biểu đồ phụ thuộc của ứng dụng.**

### 2.1. Quy tắc cho Phụ thuộc Mã nguồn

1.  **Không đọc từ DOM:** Cấm tuyệt đối việc truy cập DOM (`getElementById`, `querySelector`) để lấy mã nguồn thực thi.
2.  **Sử dụng Tính năng của Bundler:** Tận dụng các tính năng của các công cụ xây dựng hiện đại để nhập các tài sản phi JavaScript.
    *   **Ví dụ (Vite/Webpack):** Sử dụng các hậu tố nhập đặc biệt như `?raw` để nhập toàn bộ nội dung của một file dưới dạng chuỗi.
    ```typescript
    import code from './worker.ts?raw';
    // `code` bây giờ là một chuỗi chứa mã nguồn đã được biên dịch của worker.ts
    ```
3.  **Mã nguồn Worker là một Dependency:** Bằng cách này, file `worker.ts` trở thành một phần của biểu đồ phụ thuộc. Nó sẽ được TypeScript biên dịch, được bundler tối ưu hóa, và mọi thay đổi sẽ được theo dõi một cách chính xác.

### 2.2. Áp dụng cho `Conductor`

Lớp `Conductor` được thiết kế lại để nhận một chuỗi mã nguồn trong `constructor`. Bằng cách kết hợp với quy tắc trên, luồng khởi tạo trở nên an toàn, tách biệt và bền vững.

```typescript
// file: app.tsx
import { Conductor } from './conductor';
import code from './conductor/worker.ts?raw'; // Bước 1: Nhập an toàn

// ...
const conductor = new Conductor(code); // Bước 2: Truyền dependency
```

## 3. Kết quả

Kiến trúc này đảm bảo:
- **Tách biệt Hoàn toàn:** `Conductor` không biết mã nguồn đến từ đâu. `App` không biết `Conductor` làm gì với mã nguồn đó.
- **An toàn và Bền vững:** Toàn bộ mã nguồn được quản lý bởi cùng một chuỗi công cụ, đảm bảo chất lượng và tính nhất quán.
- **Tuân thủ Triết lý:** Các khái niệm (`Conductor`, `App`) được giữ thuần khiết và chỉ tương tác thông qua các API đã được định nghĩa rõ ràng, truyền các phụ thuộc cần thiết một cách minh bạch.