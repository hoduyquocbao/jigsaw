/**
 * @description  Một mô tả nền tảng, bất biến về chủng loại của dữ liệu.
 * @purpose      Đóng vai trò là khối xây dựng cơ bản cho toàn bộ hệ thống schema.
 * @solves       Sự xung đột tên và sự mơ hồ ngữ nghĩa của tên 'Type' trong bối cản TS/JS.
 * @model        Lý thuyết Kiểu (Type Theory). 'Kind' là một thuật ngữ chuẩn để phân loại các kiểu.
 * @rationale    Sử dụng 'Kind' thay cho 'Type' loại bỏ hoàn toàn nguy cơ xung đột với từ khóa 'type' hoặc các thuộc tính 'type' phổ biến, đồng thời mang lại một ngữ nghĩa chính xác hơn về mặt học thuật.
 */
export abstract class Kind {}
