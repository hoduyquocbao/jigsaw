# Ký ức: Thất bại do Đạo đức giả và các Quyết định Kiến trúc Sai lầm

**Ngày:** 2024-05-26

## 1. Bối cảnh

Sau một giai đoạn tái cấu trúc, một cuộc rà soát sâu hơn đã được thực hiện và phát hiện ra rằng tôi, với tư cách là agent, đã mắc phải những sai lầm kiến trúc nghiêm trọng. Những sai lầm này không chỉ là lỗi đơn lẻ mà còn cho thấy sự thất bại trong việc áp dụng triết lý một cách nhất quán và sâu sắc.

## 2. Các Thất bại được Phát hiện

### 2.1. Sự Đạo đức giả trong Quy tắc `...View`

Tôi đã tạo ra quy tắc `[Entity]View` để giải quyết xung đột tên cho `Telemetry`, nhưng lại hoàn toàn bỏ qua hoặc áp dụng sai cho các trường hợp tương tự khác:
- **Xung đột trực tiếp:** Component `Report` trong `ui/report.tsx` vẫn xung đột với kiểu `Report` từ `test/index.ts`.
- **Thiếu nhất quán:** Component `Testview` được đặt tên với chữ 'v' viết thường, vi phạm quy ước `PascalCase`.

**Nguyên nhân gốc rễ:** Tôi đã hành động như một "linter" máy móc thay vì một kiến trúc sư. Tôi đã sửa chữa triệu chứng (`Telemetry`) mà không giải quyết vấn đề gốc rễ (thiếu một quy trình nhất quán để xử lý xung đột model-view).

### 2.2. Sự Mỏng manh của Cơ chế Nạp Worker

Quyết định nạp mã nguồn worker bằng cách đọc một thẻ `<script>` từ DOM (`document.getElementById('worker')`) là một sai lầm thảm hại.
- **Vi phạm Tách biệt Mối quan tâm:** Nó tạo ra một sự phụ thuộc cứng nhắc giữa logic ứng dụng và cấu trúc HTML.
- **Thiếu An toàn và Bền vững:** Nó phụ thuộc vào sự tồn tại của một ID cụ thể và không được hỗ trợ bởi các công cụ build hiện đại (bundler, tree-shaking, HMR).

**Nguyên nhân gốc rễ:** Tôi đã chọn một "mánh khóe" (hack) để giải quyết vấn đề về đường dẫn worker thay vì một giải pháp kiến trúc thực sự (coi mã worker như một dependency được quản lý).

### 2.3. Sự Dối trá của Bộ Lập kế hoạch "Dựa trên Chi phí"

`Planner` sử dụng các con số chi phí (`cost: 1`, `cost: 10`) được mã hóa cứng, không phản ánh chi phí thực tế.
- **Vi phạm "Sự Thông thái của Thiết kế":** Đây là một giải pháp ngây thơ, không dựa trên mô hình toán học thực sự.
- **Chú thích Sai lệch:** Chú thích và mã nguồn đã mô tả sai về khả năng của nó, gây hiểu lầm cho người bảo trì trong tương lai.

**Nguyên nhân gốc rễ:** Tôi đã ưu tiên việc làm cho mã "trông có vẻ" thông minh hơn là làm cho nó "thực sự" trung thực và đơn giản.

### 2.4. Sự Rò rỉ Trừu tượng qua `useplanner`

Việc phơi bày một tham số `useplanner: boolean` lên tận lớp UI là một vi phạm nghiêm trọng nguyên tắc đóng gói.
- **Phá vỡ Đóng gói:** Nó buộc client phải biết về chi tiết triển khai của server.
- **API Tồi:** Một API tốt nên trừu tượng hóa sự phức tạp, không phải đẩy sự lựa chọn phức tạp cho người dùng.

**Nguyên nhân gốc rễ:** Tôi đã nhầm lẫn giữa việc "cung cấp khả năng demo" với "thiết kế một API tốt".

## 3. Hành động Khắc phục

1.  **Tái cấu trúc Toàn diện:** Thực hiện một gói phát hành để sửa chữa tất cả các vấn đề trên.
2.  **Cập nhật Kiến trúc:** Tạo các tài liệu kiến trúc mới (`dependency.md`, `abstraction.md`) để chính thức hóa các bài học này thành các quy tắc, ngăn chặn sự tái diễn.
3.  **Ghi lại Thất bại:** File ký ức này là một lời thú nhận về sự thất bại và là một cam kết sẽ duy trì một tiêu chuẩn kỷ luật cao hơn trong tương lai.

## 4. Bài học Kinh nghiệm

**Triết lý chỉ có giá trị khi được áp dụng một cách nhất quán, trung thực và sâu sắc.** Việc tuân thủ bề mặt mà không hiểu tinh thần sẽ dẫn đến những kiến trúc tồi tệ, thậm chí còn nguy hiểm hơn cả việc không có triết lý nào cả. Kỷ luật đòi hỏi sự cảnh giác không ngừng.