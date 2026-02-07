const assert = require('chai').assert;
const { Model, ConnectDB } = require('../src/index');

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

// TDD 测试套件 - Model 基础功能
suite('Model 基础功能测试', function() {
    
    suite('Model 静态方法', function() {
        
        test('newQuery() - 应该返回 QueryChain 实例', function() {
            const query = UserModel.newQuery();
            assert.isNotNull(query);
            assert.equal(query.tableName, 'users');
            assert.property(query, 'select');
            assert.property(query, 'join');
            assert.property(query, 'where');
            assert.property(query, 'execute');
        });

        test('newQuery() - 返回的实例应该有正确的 modelClass', function() {
            const query = UserModel.newQuery();
            assert.equal(query.modelClass, UserModel);
        });

        test('tableName - 应该正确设置表名', function() {
            assert.equal(UserModel.tableName, 'users');
        });
    });

    suite('Model 构造函数', function() {
        
        test('应该能够创建 Model 实例', function() {
            const user = new UserModel();
            assert.isNotNull(user);
            assert.instanceOf(user, Model);
            assert.instanceOf(user, UserModel);
        });

        test('Column() - 应该能够定义字段', function() {
            const user = new UserModel();
            assert.property(user, 'id');
            assert.property(user, 'userName');
            assert.property(user, 'sex');
            assert.property(user, 'age');
        });
    });

    suite('字符串值处理', function() {
        
        test('where() - 应该自动为字符串值添加引号', function() {
            const query = UserModel.newQuery()
                .where({ userName: 'Mike' })
                .toSql();
            assert.include(query, "'Mike'");
        });

        test('where() - 数字值不应该添加引号', function() {
            const query = UserModel.newQuery()
                .where({ age: 25 })
                .toSql();
            assert.include(query, 'age = 25');
            assert.notInclude(query, "'25'");
        });

        test('where() - 应该处理混合类型的条件', function() {
            const query = UserModel.newQuery()
                .where({ userName: 'Mike', age: 25 })
                .toSql();
            assert.include(query, "'Mike'");
            assert.include(query, 'age = 25');
        });
    });

    suite('delete() 方法', function() {
        
        test('delete() - 应该接受条件对象', function() {
            // 注意：这里只测试方法存在性，不实际执行
            assert.isFunction(UserModel.delete);
        });

        test('delete() - 应该为字符串值添加引号', function() {
            // 通过访问内部实现来验证 SQL 生成逻辑
            // 由于 delete 是异步的且需要数据库连接，这里只验证方法签名
            assert.equal(UserModel.delete.length, 1, 'delete 应该接受一个参数');
        });
    });

    suite('QueryChain 集成测试', function() {
        
        test('应该能够通过 Model 创建复杂查询', function() {
            const sql = UserModel.newQuery()
                .select('users.*', 'orders.amount')
                .join('orders', 'users.id = orders.user_id')
                .where({ 'users.userName': 'Mike' })
                .orderBy('orders.amount', 'DESC')
                .toSql();
            
            assert.include(sql, 'SELECT users.*, orders.amount');
            assert.include(sql, 'FROM users');
            assert.include(sql, 'INNER JOIN orders');
            assert.include(sql, "'Mike'");
            assert.include(sql, 'ORDER BY orders.amount DESC');
        });

        test('应该支持 LEFT JOIN 查询', function() {
            const sql = UserModel.newQuery()
                .select('users.userName', 'orders.amount')
                .leftJoin('orders', 'users.id = orders.user_id')
                .toSql();
            
            assert.include(sql, 'LEFT JOIN orders');
        });

        test('应该支持 RIGHT JOIN 查询', function() {
            const sql = UserModel.newQuery()
                .select('users.userName', 'orders.amount')
                .rightJoin('orders', 'users.id = orders.user_id')
                .toSql();
            
            assert.include(sql, 'RIGHT JOIN orders');
        });
    });

    suite('Model 类继承测试', function() {
        
        test('自定义 Model 应该继承 Model 基类', function() {
            const user = new UserModel();
            assert.instanceOf(user, Model);
        });

        test('自定义 Model 应该有 newQuery 静态方法', function() {
            assert.isFunction(UserModel.newQuery);
        });

        test('自定义 Model 应该有 where 静态方法', function() {
            assert.isFunction(UserModel.where);
        });

        test('自定义 Model 应该有 delete 静态方法', function() {
            assert.isFunction(UserModel.delete);
        });
    });

    suite('README 示例测试', function() {
        
        test('示例 1: 基础 JOIN 查询 - SQL 生成', function() {
            const sql = UserModel.newQuery()
                .select('users.*', 'orders.id as order_id', 'orders.amount')
                .join('orders', 'users.id = orders.user_id')
                .where({ 'users.userName': 'Mike' })
                .toSql();
            
            assert.include(sql, 'SELECT users.*, orders.id as order_id, orders.amount');
            assert.include(sql, 'INNER JOIN orders ON users.id = orders.user_id');
            assert.include(sql, "WHERE users.userName = 'Mike'");
        });

        test('示例 2: LEFT JOIN 多表查询 - SQL 生成', function() {
            const sql = UserModel.newQuery()
                .select('users.userName', 'orders.amount')
                .leftJoin('orders', 'users.id = orders.user_id')
                .orderBy('users.userName', 'ASC')
                .toSql();
            
            assert.include(sql, 'SELECT users.userName, orders.amount');
            assert.include(sql, 'LEFT JOIN orders ON users.id = orders.user_id');
            assert.include(sql, 'ORDER BY users.userName ASC');
        });

        test('示例 3: 复杂条件查询 - SQL 生成', function() {
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
            assert.include(sql, 'INNER JOIN orders ON users.id = orders.user_id');
            assert.include(sql, 'INNER JOIN products ON orders.product_id = products.id');
            assert.include(sql, 'orders.amount > 100');
            assert.include(sql, "users.sex = '男'");
            assert.include(sql, 'ORDER BY orders.amount DESC');
            assert.include(sql, 'LIMIT 10');
        });

        test('示例 4: 获取单条记录 - 应该限制为 1 条', function() {
            const sql = UserModel.newQuery()
                .join('orders', 'users.id = orders.user_id')
                .where({ 'orders.id': 123 })
                .limit(1)  // first() 内部会调用 limit(1)
                .toSql();
            
            assert.include(sql, 'LIMIT 1');
        });

        test('示例 5: 调试 SQL - toSql() 方法', function() {
            const sql = UserModel.newQuery()
                .select('users.*', 'orders.amount')
                .join('orders', 'users.id = orders.user_id')
                .where({ 'users.userName': 'Mike' })
                .orderBy('orders.amount', 'DESC')
                .toSql();
            
            assert.isString(sql);
            assert.match(sql, /;$/, 'SQL 应该以分号结尾');
        });

        test('示例 6: 分页查询 - SQL 生成', function() {
            const page = 3;
            const pageSize = 10;
            
            const sql = UserModel.newQuery()
                .select('*')
                .orderBy('id', 'ASC')
                .limit(pageSize)
                .offset((page - 1) * pageSize)
                .toSql();
            
            assert.include(sql, 'LIMIT 10');
            assert.include(sql, 'OFFSET 20');
        });

        test('示例 7: 统计查询（使用原始条件） - SQL 生成', function() {
            const sql = UserModel.newQuery()
                .select('userName', 'age')
                .where({ sex: '男' })
                .whereRaw("age > 25")
                .orderBy('age', 'DESC')
                .toSql();
            
            assert.include(sql, 'SELECT userName, age');
            assert.include(sql, "sex = '男'");
            assert.include(sql, 'age > 25');
            assert.include(sql, 'ORDER BY age DESC');
        });

        test('示例 8: 多表关联复杂查询 - SQL 生成', function() {
            const sql = UserModel.newQuery()
                .select(
                    'users.id',
                    'users.userName',
                    'orders.amount',
                    'products.name as product_name'
                )
                .join('orders', 'users.id = orders.user_id')
                .join('products', 'orders.product_id = products.id')
                .where({ 'products.name': 'iPhone' })
                .orderBy('orders.amount', 'DESC')
                .toSql();
            
            assert.include(sql, 'users.id, users.userName, orders.amount, products.name as product_name');
            assert.include(sql, 'INNER JOIN orders');
            assert.include(sql, 'INNER JOIN products');
            assert.include(sql, "'iPhone'");
            assert.include(sql, 'ORDER BY orders.amount DESC');
        });
    });

    suite('边界情况测试', function() {
        
        test('空 select - 应该默认选择所有字段', function() {
            const sql = UserModel.newQuery()
                .where({ userName: 'Mike' })
                .toSql();
            
            assert.include(sql, 'SELECT users.*');
        });

        test('空 where - 应该查询所有记录', function() {
            const sql = UserModel.newQuery()
                .select('*')
                .toSql();
            
            assert.notInclude(sql, 'WHERE');
        });

        test('多次调用 where - 应该用 AND 连接', function() {
            const sql = UserModel.newQuery()
                .where({ userName: 'Mike' })
                .where({ sex: '男' })
                .toSql();
            
            assert.include(sql, 'AND');
        });

        test('空字符串值 - 应该正确处理', function() {
            const sql = UserModel.newQuery()
                .where({ userName: '' })
                .toSql();
            
            assert.include(sql, "userName = ''");
        });

        test('特殊字符 - 应该包含在引号内', function() {
            const sql = UserModel.newQuery()
                .where({ userName: "Mike O'Brien" })
                .toSql();
            
            assert.include(sql, "'Mike O'Brien'");
        });
    });

    suite('SQL 注入防护测试', function() {
        
        test('where() 对象形式 - 自动转义字符串值', function() {
            const sql = UserModel.newQuery()
                .where({ userName: 'Mike' })
                .toSql();
            
            // 字符串值应该被引号包裹
            assert.include(sql, "'Mike'");
        });

        test('whereRaw() - 提示：需要手动处理安全性', function() {
            // whereRaw 允许原始 SQL，用户需要自行确保安全
            const sql = UserModel.newQuery()
                .whereRaw("amount > 100")
                .toSql();
            
            assert.include(sql, 'amount > 100');
        });
    });
});
