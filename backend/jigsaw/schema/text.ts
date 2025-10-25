import { Kind } from './kind';

/**
 * @description  Đại diện cho một chuỗi ký tự UTF-8.
 * @solves       Sự xung đột tên với kiểu `string` gốc của JavaScript/TypeScript.
 * @rationale    'Text' là một từ đồng nghĩa phổ biến và an toàn, loại bỏ sự mơ hồ và đảm bảo tính nhất quán của API.
 */
export class Text extends Kind {}
