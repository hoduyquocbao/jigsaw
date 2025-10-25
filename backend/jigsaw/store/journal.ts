/**
 * @description  Một cấu trúc dữ liệu chỉ ghi (append-only) để lưu trữ các thay đổi (cập nhật, xóa).
 * @purpose      Ghi lại các đột biến dữ liệu một cách nhanh chóng mà không cần sửa đổi Store chính.
 * @solves       Vấn đề chi phí cao của việc cập nhật và xóa tại chỗ.
 * @model        Log-Structured Merge-Tree (LSM-Tree) - Lớp MemTable.
 * @rationale    Ghi tuần tự vào một cấu trúc log là một trong những thao tác nhanh nhất có thể. Journal biến các thao tác ghi ngẫu nhiên đắt đỏ thành các thao tác ghi tuần tự rẻ tiền, tối đa hóa thông lượng ghi.
 */
export class Journal {
    private log: any[];

    constructor() {
        this.log = [];
    }
    /**
     * @description Ghi lại một thao tác cập nhật (bản chất là một bản ghi mới).
     * @param {object} record Bản ghi mới.
     */
    update(record: object): void {
        this.log.push({ type: 'update', record });
    }

    /**
     * @description Ghi lại một thao tác xóa (bản chất là một "tombstone").
     * @param {any} key Khóa của bản ghi cần xóa.
     */
    delete(key: any): void {
        this.log.push({ type: 'delete', key });
    }
}
