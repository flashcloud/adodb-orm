const assert = require('chai').assert;
const { Model } = require('../src/index');

// 创建测试用的 UserModel
class UserModel extends Model {
    constructor() {
        super();
        this.id = this.Column('integer');
        this.userName = this.Column('string');
        this.sex = this.Column('string');
        this.age = this.Column('integer');
    }
}
UserModel.tableName = 'users';

// TDD 测试套件 - QueryChain 链式查询功能
suite('QueryChain 链式查询功能测试', function() {
    
    suite('基础查询构建', function() {
        
        test('应该能够创建新的查询链', function() {
            const query = UserModel.newQuery();
            assert.isNotNull(query);
            assert.equal(query.tableName, 'users');
        });

        test('select() - 应该能够选择特定字段', function() {
            const sql = UserModel.newQuery()
                .select('userName', 'age')
                .toSql();
            assert.include(sql, 'SELECT userName, age');
            assert.include(sql, 'FROM users');
        });

        test('select() - 应该能够选择所有字段', function() {
            const sql = UserModel.newQuery()
                .select('*')
                .toSql();
            assert.include(sql, 'SELECT *');
        });

        test('select() - 默认选择表的所有字段', function() {
            const sql = UserModel.newQuery()
                .toSql();
            assert.include(sql, 'SELECT users.*');
        });

        test('select() - 应该能够选择多表字段', function() {
            const sql = UserModel.newQuery()
                .select('users.userName', 'orders.amount')
                .toSql();
            assert.include(sql, 'SELECT users.userName, orders.amount');
        });

        test('select() - 应该支持字段别名', function() {
            const sql = UserModel.newQuery()
                .select('users.id as user_id', 'orders.id as order_id')
                .toSql();
            assert.include(sql, 'users.id as user_id');
            assert.include(sql, 'orders.id as order_id');
        });
    });

    suite('JOIN 查询', function() {
        
        test('join() - 应该能够执行 INNER JOIN', function() {
            const sql = UserModel.newQuery()
                .join('orders', 'users.id = orders.user_id')
                .toSql();
            assert.include(sql, 'INNER JOIN orders ON users.id = orders.user_id');
        });

        test('leftJoin() - 应该能够执行 LEFT JOIN', function() {
            const sql = UserModel.newQuery()
                .leftJoin('orders', 'users.id = orders.user_id')
                .toSql();
            assert.include(sql, 'LEFT JOIN orders ON users.id = orders.user_id');
        });

        test('rightJoin() - 应该能够执行 RIGHT JOIN', function() {
            const sql = UserModel.newQuery()
                .rightJoin('orders', 'users.id = orders.user_id')
                .toSql();
            assert.include(sql, 'RIGHT JOIN orders ON users.id = orders.user_id');
        });

        test('join() - 应该支持多个 JOIN', function() {
            const sql = UserModel.newQuery()
                .join('orders', 'users.id = orders.user_id')
                .join('products', 'orders.product_id = products.id')
                .toSql();
            assert.include(sql, 'INNER JOIN orders ON users.id = orders.user_id');
            assert.include(sql, 'INNER JOIN products ON orders.product_id = products.id');
        });

        test('join() - 应该支持混合不同类型的 JOIN', function() {
            const sql = UserModel.newQuery()
                .join('orders', 'users.id = orders.user_id')
                .leftJoin('products', 'orders.product_id = products.id')
                .toSql();
            assert.include(sql, 'INNER JOIN orders');
            assert.include(sql, 'LEFT JOIN products');
        });
    });

    suite('WHERE 条件', function() {
        
        test('where() - 应该支持对象形式的条件', function() {
            const sql = UserModel.newQuery()
                .where({ userName: 'Mike' })
                .toSql();
            assert.include(sql, "WHERE userName = 'Mike'");
        });

        test('where() - 应该支持多个对象条件', function() {
            const sql = UserModel.newQuery()
                .where({ userName: 'Mike', sex: '男' })
                .toSql();
            assert.include(sql, "userName = 'Mike'");
            assert.include(sql, "sex = '男'");
            assert.include(sql, 'AND');
        });

        test('where() - 应该支持字符串形式的条件', function() {
            const sql = UserModel.newQuery()
                .where("age > 18")
                .toSql();
            assert.include(sql, 'WHERE age > 18');
        });

        test('where() - 应该支持数字类型的值（不加引号）', function() {
            const sql = UserModel.newQuery()
                .where({ age: 25 })
                .toSql();
            assert.include(sql, 'age = 25');
            assert.notInclude(sql, "age = '25'");
        });

        test('where() - 应该支持带表名前缀的字段', function() {
            const sql = UserModel.newQuery()
                .where({ 'users.userName': 'Mike' })
                .toSql();
            assert.include(sql, "users.userName = 'Mike'");
        });

        test('whereRaw() - 应该支持原始 SQL 条件', function() {
            const sql = UserModel.newQuery()
                .whereRaw("amount > 100 AND status = 'active'")
                .toSql();
            assert.include(sql, "amount > 100 AND status = 'active'");
        });

        test('where() + whereRaw() - 应该支持混合使用', function() {
            const sql = UserModel.newQuery()
                .where({ sex: '男' })
                .whereRaw("age > 25")
                .toSql();
            assert.include(sql, "sex = '男'");
            assert.include(sql, 'age > 25');
            assert.include(sql, 'AND');
        });
    });

    suite('ORDER BY 排序', function() {
        
        test('orderBy() - 应该支持升序排序', function() {
            const sql = UserModel.newQuery()
                .orderBy('age', 'ASC')
                .toSql();
            assert.include(sql, 'ORDER BY age ASC');
        });

        test('orderBy() - 应该支持降序排序', function() {
            const sql = UserModel.newQuery()
                .orderBy('age', 'DESC')
                .toSql();
            assert.include(sql, 'ORDER BY age DESC');
        });

        test('orderBy() - 默认使用升序', function() {
            const sql = UserModel.newQuery()
                .orderBy('age')
                .toSql();
            assert.include(sql, 'ORDER BY age ASC');
        });

        test('orderBy() - 应该支持多个排序条件', function() {
            const sql = UserModel.newQuery()
                .orderBy('sex', 'ASC')
                .orderBy('age', 'DESC')
                .toSql();
            assert.include(sql, 'ORDER BY sex ASC, age DESC');
        });
    });

    suite('LIMIT 和 OFFSET', function() {
        
        test('limit() - 应该能够限制返回数量', function() {
            const sql = UserModel.newQuery()
                .limit(10)
                .toSql();
            assert.include(sql, 'LIMIT 10');
        });

        test('offset() - 应该能够设置偏移量', function() {
            const sql = UserModel.newQuery()
                .offset(20)
                .toSql();
            assert.include(sql, 'OFFSET 20');
        });

        test('limit() + offset() - 应该支持分页查询', function() {
            const sql = UserModel.newQuery()
                .limit(10)
                .offset(20)
                .toSql();
            assert.include(sql, 'LIMIT 10');
            assert.include(sql, 'OFFSET 20');
        });
    });

    suite('复杂链式查询', function() {
        
        test('应该支持完整的链式查询组合', function() {
            const sql = UserModel.newQuery()
                .select('users.*', 'orders.amount')
                .join('orders', 'users.id = orders.user_id')
                .where({ 'users.userName': 'Mike' })
                .orderBy('orders.amount', 'DESC')
                .toSql();
            
            assert.include(sql, 'SELECT users.*, orders.amount');
            assert.include(sql, 'FROM users');
            assert.include(sql, 'INNER JOIN orders ON users.id = orders.user_id');
            assert.include(sql, "WHERE users.userName = 'Mike'");
            assert.include(sql, 'ORDER BY orders.amount DESC');
        });

        test('应该支持多表复杂查询', function() {
            const sql = UserModel.newQuery()
                .select('users.*', 'orders.amount', 'products.name')
                .join('orders', 'users.id = orders.user_id')
                .join('products', 'orders.product_id = products.id')
                .whereRaw("orders.amount > 100")
                .where({ 'users.sex': '男' })
                .orderBy('orders.amount', 'DESC')
                .limit(10)
                .toSql();
            
            assert.include(sql, 'SELECT users.*, orders.amount, products.name');
            assert.include(sql, 'INNER JOIN orders');
            assert.include(sql, 'INNER JOIN products');
            assert.include(sql, 'orders.amount > 100');
            assert.include(sql, "users.sex = '男'");
            assert.include(sql, 'ORDER BY orders.amount DESC');
            assert.include(sql, 'LIMIT 10');
        });

        test('应该支持 LEFT JOIN 复杂查询', function() {
            const sql = UserModel.newQuery()
                .select('users.userName', 'orders.amount')
                .leftJoin('orders', 'users.id = orders.user_id')
                .orderBy('users.userName', 'ASC')
                .toSql();
            
            assert.include(sql, 'LEFT JOIN orders');
            assert.include(sql, 'ORDER BY users.userName ASC');
        });
    });

    suite('SQL 生成测试', function() {
        
        test('toSql() - 应该返回有效的 SQL 字符串', function() {
            const sql = UserModel.newQuery()
                .select('*')
                .where({ userName: 'Mike' })
                .toSql();
            
            assert.isString(sql);
            assert.include(sql, 'SELECT');
            assert.include(sql, 'FROM');
            assert.include(sql, 'WHERE');
            assert.match(sql, /;$/); // 应该以分号结尾
        });

        test('buildQuery() - 应该生成正确的 SQL 结构', function() {
            const query = UserModel.newQuery()
                .select('users.*', 'orders.amount')
                .join('orders', 'users.id = orders.user_id')
                .where({ 'users.userName': 'Mike' })
                .orderBy('orders.amount', 'DESC');
            
            const sql = query.buildQuery();
            
            // 验证 SQL 结构顺序
            const selectPos = sql.indexOf('SELECT');
            const fromPos = sql.indexOf('FROM');
            const joinPos = sql.indexOf('JOIN');
            const wherePos = sql.indexOf('WHERE');
            const orderPos = sql.indexOf('ORDER BY');
            
            assert.isTrue(selectPos < fromPos, 'SELECT 应该在 FROM 之前');
            assert.isTrue(fromPos < joinPos, 'FROM 应该在 JOIN 之前');
            assert.isTrue(joinPos < wherePos, 'JOIN 应该在 WHERE 之前');
            assert.isTrue(wherePos < orderPos, 'WHERE 应该在 ORDER BY 之前');
        });
    });

    suite('链式调用返回值测试', function() {
        
        test('所有方法应该返回 QueryChain 实例以支持链式调用', function() {
            const query = UserModel.newQuery();
            
            assert.equal(query.select('*'), query, 'select() 应该返回 QueryChain');
            assert.equal(query.join('orders', 'users.id = orders.user_id'), query, 'join() 应该返回 QueryChain');
            assert.equal(query.leftJoin('products', 'orders.product_id = products.id'), query, 'leftJoin() 应该返回 QueryChain');
            assert.equal(query.rightJoin('categories', 'products.category_id = categories.id'), query, 'rightJoin() 应该返回 QueryChain');
            assert.equal(query.where({ userName: 'Mike' }), query, 'where() 应该返回 QueryChain');
            assert.equal(query.whereRaw('age > 18'), query, 'whereRaw() 应该返回 QueryChain');
            assert.equal(query.orderBy('age', 'DESC'), query, 'orderBy() 应该返回 QueryChain');
            assert.equal(query.limit(10), query, 'limit() 应该返回 QueryChain');
            assert.equal(query.offset(20), query, 'offset() 应该返回 QueryChain');
        });
    });
});
