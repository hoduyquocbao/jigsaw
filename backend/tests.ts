import { suite, test, expect } from '../test';
import * as schema from './jigsaw/schema';
import { Store } from './jigsaw/store';
// FIX: Changed import path to point to the correct files for Invert and Tree.
import { Invert } from './jigsaw/index/invert';
import { Tree } from './jigsaw/index/tree';
import { Conductor } from './conductor';

const WORKER_URL = 'https://raw.githubusercontent.com/hoduyquocbao/jigsaw/main/backend/conductor/worker.ts';

suite("Jigsaw Schema", () => {
    test("should define and get kinds correctly", () => {
        const s = new schema.Schema();
        const kind = schema.record({ id: schema.integer(32, true) });
        s.define("User", kind);
        
        expect(s.get("User")).equal(kind);
    });

    test("should throw error for duplicate kind definitions", () => {
        const s = new schema.Schema();
        s.define("User", schema.record({}));
        
        expect(() => s.define("User", schema.record({}))).throws("already defined");
    });
});

suite("Jigsaw Store & Query Engine", () => {
    const kind = schema.record({
        id: schema.integer(32, true),
        user: schema.integer(32, true),
        amount: schema.scalar(32),
        timestamp: schema.integer(64, false)
    });

    const data = [
        { id: 1, user: 10, amount: 100.5, timestamp: BigInt(1704067200000) }, // 2024-01-01
        { id: 2, user: 20, amount: 50.0,  timestamp: BigInt(1706745600000) }, // 2024-02-01
        { id: 3, user: 10, amount: 25.25, timestamp: BigInt(1709251200000) }, // 2024-03-01
    ];
    
    test("should add data and maintain correct count", () => {
        const store = new Store(kind, 10);
        store.add(data);
        expect(store.count()).equal(3);
    });

    test("should perform a full scan query correctly", () => {
        const store = new Store(kind, 10);
        store.add(data);
        
        const query = {
            filter: [{ column: 'user', op: 'eq', value: 10 }],
            aggregate: { type: 'sum', column: 'amount' }
        };

        const result = store.query(query, false);
        expect(result.scanned).equal(3);
        expect(result.total).equal(125.75);
    });

    test("should use Invert index for equality queries", () => {
        const store = new Store(kind, 10);
        store.add(data);
        store.indexer.build('user', new Invert());

        const query = {
            filter: [{ column: 'user', op: 'eq', value: 10 }],
            aggregate: { type: 'sum', column: 'amount' }
        };
        
        const result = store.query(query, true);
        expect(result.plan.strategy).equal('index');
        expect(result.scanned).equal(2);
        expect(result.total).equal(125.75);
    });
    
    test("should use Tree index for range queries", () => {
        const store = new Store(kind, 10);
        store.add(data);
        store.indexer.build('timestamp', new Tree());

        const query = {
            filter: [
                { column: 'timestamp', op: 'gte', value: BigInt(1704067200000) },
                { column: 'timestamp', op: 'lte', value: BigInt(1707004800000) } // 2024-02-04
            ],
            aggregate: { type: 'sum', column: 'amount' }
        };
        
        const result = store.query(query, true);
        expect(result.plan.strategy).equal('index');
        expect(result.scanned).equal(2);
        expect(result.total).equal(150.5);
    });
});

suite("Conductor Worker Pool", () => {
    
    test("should execute a simple task and return a result", async () => {
        const conductor = await Conductor.create(WORKER_URL, 1);
        const result = await conductor.submit('generate', 5);
        conductor.terminate();
        expect(result.length).equal(5);
        expect(result[0].id).equal(0);
    });
    
    test("should execute map operation in parallel", async () => {
        const conductor = await Conductor.create(WORKER_URL, 4);
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const chunks = [data.slice(0, 5), data.slice(5)];
        
        // FIX: The test was misusing `conductor.map`. `map` is for auto-chunking a flat array.
        // To test parallel execution of pre-defined chunks, we should use `submit` with `Promise.all`.
        // This correctly reflects the test's intent and structure.
        const promises = chunks.map(chunk => conductor.submit('heavy', chunk));
        const results = await Promise.all(promises);
        conductor.terminate();
        
        const expected1 = chunks[0].reduce((s, v) => s + Math.sqrt(v), 0);
        const expected2 = chunks[1].reduce((s, v) => s + Math.sqrt(v), 0);

        expect(results.length).equal(2);
        
        // Use a tolerance for floating point comparisons
        const tolerance = 1e-9;
        expect(Math.abs(results[0] - expected1) < tolerance).truthy();
        expect(Math.abs(results[1] - expected2) < tolerance).truthy();
    });
});