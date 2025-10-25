# Ký ức: Thất bại do Xung đột Định danh trong React Component

**Ngày:** 2024-05-25

## 1. Bối cảnh

Trong một nỗ lực tái cấu trúc để tuân thủ **Luật về Định danh Đơn từ**, component React `TelemetryDisplay` đã được đổi tên thành `Telemetry`. Hành động này được thực hiện một cách máy móc dựa trên quy tắc.

## 2. Thất bại

Quyết định này là một **sai lầm nghiêm trọng**. File `index.tsx` đã import lớp logic `Telemetry` từ `backend/telemetry.ts`. Việc đổi tên component đã tạo ra một cuộc xung đột định danh (name collision) trực tiếp trong cùng một phạm vi file, khiến cho trình biên dịch TypeScript và React không thể phân biệt giữa lớp logic và component giao diện người dùng.

Điều này dẫn đến các lỗi biên dịch, khiến ứng dụng không thể hoạt động.

## 3. Phân tích Nguyên nhân Gốc rễ

1.  **Phân tích Thiếu sót:** Tôi đã không kiểm tra đầy đủ phạm vi của file trước khi thực hiện đổi tên. Tôi chỉ tập trung vào việc loại bỏ định danh đa từ mà bỏ qua các xung đột tiềm ẩn mà nó có thể tạo ra.
2.  **Áp dụng Quy tắc một cách Mù quáng:** Tôi đã tuân thủ "câu chữ" của luật (một từ) mà vi phạm "tinh thần" của luật (sự rõ ràng, không mơ hồ).
3.  **Thiếu Quy tắc Bổ sung:** Hệ thống kiến trúc chưa có hướng dẫn cụ thể cho các trường hợp phổ biến như xung đột giữa model và view.

## 4. Hành động Khắc phục

1.  **Sửa lỗi ngay lập tức:** Đổi tên component xung đột thành `TelemetryView` để giải quyết vấn đề và tuân theo một quy ước rõ ràng.
2.  **Cập nhật Kiến trúc:** Tạo một tài liệu kiến trúc mới (`knowledges/architectures/uniqueness.md`) để chính thức hóa quy tắc về "Tính Đơn nhất Ngữ nghĩa trong Phạm vi" và hướng dẫn xử lý các trường hợp tương tự.
3.  **Ghi lại Bài học:** Tạo file ký ức này để đảm bảo sai lầm này không bao giờ được lặp lại.

## 5. Bài học Kinh nghiệm

**Sự thuần khiết của định danh không chỉ là về hình thức (một từ) mà còn về bản chất (ý nghĩa duy nhất trong ngữ cảnh).** Trước khi thực hiện bất kỳ thay đổi nào, phải luôn phân tích tác động của nó trong phạm vi mà nó tồn tại. Các quy ước đặt tên (như hậu tố `View`) là công cụ hữu ích và cần thiết để duy trì sự rõ ràng khi các quy tắc cơ bản dẫn đến sự mơ hồ.