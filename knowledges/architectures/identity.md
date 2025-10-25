# Nguyên tắc: Sự thuần khiết của Định danh và Phân rã Cấu trúc

## 1. Vấn đề

Mã nguồn ban đầu chứa nhiều vi phạm quy tắc định danh đơn từ, chẳng hạn như `camelCase` cho biến (`workerCode`) và `PascalCase` đa từ cho các thành phần React (`TelemetryDisplay`). Những vi phạm này, mặc dù có vẻ nhỏ, là triệu chứng của một vấn đề kiến trúc sâu sắc hơn: không phân rã đủ các khái niệm. Việc cố gắng mô tả chức năng của một thành phần bằng cách ghép nhiều từ lại với nhau thường dẫn đến các lớp/hàm làm quá nhiều việc và khó bảo trì.

## 2. Giải pháp Kiến trúc

Chúng tôi thực thi nghiêm ngặt **Luật về Định danh Đơn từ** như một công cụ để thúc đẩy thiết kế module tốt hơn. Nguyên tắc là:

> Nếu một khái niệm cần nhiều hơn một từ để mô tả, nó không phải là một khái niệm đơn lẻ. Nó phải được phân rã.

### 2.1. Phân rã Cấu trúc Module

Thay vì một thành phần `TelemetryDisplay`, chúng ta nên có một module `telemetry` chứa một thành phần `View` hoặc `Display`. Tuy nhiên, trong cấu trúc file hiện tại, chúng tôi chọn một giải pháp đơn giản hơn là đổi tên thành `Telemetry`, ngụ ý rằng đây là thành phần trực quan cho khái niệm `telemetry`.

### 2.2. Nâng cấp Kiểu nguyên thủy thành Khái niệm

Các biến như `caseStart` vi phạm quy tắc. Thay vì tìm một từ ghép, chúng ta sử dụng một từ đơn `start` và dựa vào ngữ cảnh (bên trong một vòng lặp `case`) để cung cấp ý nghĩa. Điều này buộc mã nguồn phải ngắn gọn và dễ đọc hơn.

### 2.3. Loại bỏ `camelCase` trong State Management

Việc sử dụng `useState` của React (`const [value, setValue] = useState()`) là một nguồn vi phạm `camelCase` lớn. Để giải quyết triệt để, chúng tôi đã tái cấu trúc `App` component để sử dụng `useReducer`. Điều này tập trung toàn bộ logic cập nhật trạng thái vào một hàm `reducer` duy nhất và một hàm `dispatch` duy nhất, cả hai đều tuân thủ quy tắc định danh đơn từ.

## 3. Kết quả

Bằng cách áp dụng các quy tắc này một cách không khoan nhượng, chúng tôi không chỉ sửa lỗi cú pháp mà còn cải thiện cấu trúc của mã nguồn, làm cho nó trở nên modular hơn, dễ hiểu hơn và tuân thủ chặt chẽ triết lý thiết kế đã đề ra.
