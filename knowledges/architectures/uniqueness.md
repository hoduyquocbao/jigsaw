# Nguyên tắc: Tính Đơn nhất Ngữ nghĩa trong Phạm vi

## 1. Vấn đề

Quy tắc "Sự thuần khiết của Định danh" (định danh đơn từ) là nền tảng, nhưng việc áp dụng một cách máy móc có thể dẫn đến các vấn đề không lường trước. Một thất bại gần đây đã xảy ra khi component `TelemetryDisplay` được đổi tên thành `Telemetry`, gây ra xung đột trực tiếp với lớp `Telemetry` được import từ backend trong cùng một file. Điều này cho thấy chỉ một từ là không đủ; từ đó cũng phải là **duy nhất về mặt ngữ nghĩa** trong phạm vi hoạt động của nó.

## 2. Giải pháp Kiến trúc

**Luật về Định danh Đơn từ** được bổ sung một điều khoản làm rõ:

> Một định danh không chỉ phải là một từ đơn, mà còn phải duy trì một ngữ nghĩa duy nhất và không gây mơ hồ trong phạm vi (scope) mà nó được sử dụng.

### 2.1. Quy tắc cụ thể cho UI Component

Để giải quyết vấn đề phổ biến này trong các framework UI như React, một quy tắc cụ thể được áp dụng:

*   Khi một UI component có vai trò chính là **hiển thị (view)** một thực thể dữ liệu hoặc một module logic, và có nguy cơ xung đột tên với thực thể đó, component sẽ được đặt tên theo mẫu `[TênThựcThể]View`.

*   **Ví dụ:**
    *   Lớp logic: `Telemetry`
    *   Component hiển thị: `TelemetryView` (thay vì `Telemetry`)

    *   Lớp dữ liệu: `Report`
    *   Component hiển thị: `ReportView` (hoặc giữ `Report` nếu không có xung đột)

### 3. Lý do

Quy tắc bổ sung này là một sự đánh đổi thực dụng. Nó có vẻ như vi phạm quy tắc "đơn từ" một cách bề mặt, nhưng thực chất nó lại củng cố nguyên tắc cốt lõi hơn: **sự rõ ràng và không mơ hồ**.

*   **Bảo vệ sự Rõ ràng:** `TelemetryView` ngay lập tức cho người đọc biết vai trò của nó là một thành phần hiển thị, phân biệt rõ ràng với `Telemetry` là một lớp xử lý dữ liệu.
*   **Tránh Lỗi:** Loại bỏ hoàn toàn một lớp lỗi phổ biến trong các ứng dụng hiện đại.
*   **Tính nhất quán:** Cung cấp một mẫu thiết kế có thể dự đoán được để giải quyết các xung đột tương tự trong tương lai.