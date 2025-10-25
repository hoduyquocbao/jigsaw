/**
 * @description  Một framework kiểm thử đơn vị siêu nhẹ, không có phụ thuộc, được thiết kế để chạy trong trình duyệt.
 * @purpose      Cung cấp một phương tiện để xác minh tính đúng đắn của mã nguồn backend trong môi trường bị hạn chế.
 * @solves       Vấn đề không có môi trường dòng lệnh (CLI) hoặc các công cụ test như Jest/Mocha.
 * @model        Mô hình xUnit (lấy cảm hứng từ Jest).
 * @rationale    Một API đơn giản (`suite`, `test`, `expect`) cung cấp một cấu trúc quen thuộc cho việc viết test. Runner thu thập kết quả vào một cấu trúc dữ liệu có thể tuần tự hóa, cho phép giao diện người dùng hiển thị một báo cáo chi tiết, thay thế cho đầu ra của terminal.
 */

class Failure extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Failure';
    }
}

class Assertion {
    constructor(private value: any) {}

    equal(expected: any): void {
        const actual = JSON.stringify(this.value);
        const expect = JSON.stringify(expected);
        if (actual !== expect) {
            throw new Failure(`Expected ${expect}, but got ${actual}`);
        }
    }

    truthy(): void {
        if (!this.value) {
            throw new Failure(`Expected value to be truthy, but got ${this.value}`);
        }
    }
    
    throws(message?: string): void {
        if (typeof this.value !== 'function') {
            throw new Failure('Expected value to be a function to test for throws.');
        }
        try {
            this.value();
            throw new Failure('Expected function to throw, but it did not.');
        } catch (e: any) {
            if (message && !e.message.includes(message)) {
                throw new Failure(`Expected error message to include "${message}", but got "${e.message}".`);
            }
        }
    }
}

export const expect = (value: any) => new Assertion(value);

type Case = {
    name: string;
    fn: () => void | Promise<void>;
};

class Suite {
    public cases: Case[] = [];
    constructor(public name: string) {}
    
    test(name: string, fn: () => void | Promise<void>): void {
        this.cases.push({ name, fn });
    }
}

const suites: Suite[] = [];
let current: Suite | null = null;

export const suite = (name: string, fn: () => void) => {
    current = new Suite(name);
    suites.push(current);
    fn();
    current = null;
};

export const test = (name: string, fn: () => void | Promise<void>) => {
    if (!current) {
        throw new Error("`test` must be called inside a `suite` block.");
    }
    current.test(name, fn);
};

export type Result = {
    suite: string;
    name: string;
    status: 'passed' | 'failed';
    error?: string;
    duration: number;
};

export type Report = {
    passed: number;
    failed: number;
    total: number;
    duration: number;
    results: Result[];
};

export class Runner {
    async run(): Promise<Report> {
        const start = performance.now();
        const report: Report = {
            passed: 0,
            failed: 0,
            total: 0,
            duration: 0,
            results: [],
        };

        for (const s of suites) {
            for (const c of s.cases) {
                const caseStart = performance.now();
                try {
                    await c.fn();
                    report.passed++;
                    report.results.push({
                        suite: s.name,
                        name: c.name,
                        status: 'passed',
                        duration: performance.now() - caseStart,
                    });
                } catch (e: any) {
                    report.failed++;
                    report.results.push({
                        suite: s.name,
                        name: c.name,
                        status: 'failed',
                        error: e.message,
                        duration: performance.now() - caseStart,
                    });
                }
                report.total++;
            }
        }
        
        report.duration = performance.now() - start;
        return report;
    }
}
