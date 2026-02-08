# ADODB-ORM 测试套件文档

## 目录

- [概述](#概述)
- [测试环境配置](#测试环境配置)
- [运行测试](#运行测试)
- [测试覆盖率](#测试覆盖率)
- [测试文件结构](#测试文件结构)
- [Model 类测试详解](#model-类测试详解)
- [QueryChain 类测试详解](#querychain-类测试详解)
- [测试用例分类](#测试用例分类)
- [最佳实践](#最佳实践)

---

## 概述

本测试由Qoder IDE生成。ADODB-ORM 测试套件采用 TDD（测试驱动开发）模式，使用 Mocha 作为测试框架，Chai 作为断言库。测试主要覆盖以下两个核心组件：

1. **Model 类测试** ([model.test.js](file:///Users/flashcloud/dev/workspace/grsoft/node-modules/adodb-orm/test/model.test.js)) - 测试数据模型的基础功能和静态方法
2. **QueryChain 类测试** ([querychain.test.js](file:///Users/flashcloud/dev/workspace/grsoft/node-modules/adodb-orm/test/querychain.test.js)) - 测试链式查询构建器的各种功能

---

## 测试环境配置

### 依赖项

```json
{
  "devDependencies": {
    "mocha": "^10.0.0",
    "chai": "^4.3.0"
  }
}
```

### 测试数据库

测试使用 ```example.mdb``` 作为示例 Access 数据库文件

## 运行测试

### 基本测试运行

```bash
# 运行所有测试
npm test

# 或者直接使用 mocha
npx mocha test/*.test.js --ui tdd
```

### 监听模式

```bash
# 监听文件变化并自动重新运行测试
npm run test:watch

# 或者
npx mocha test/*.test.js --ui tdd --watch
```

### 测试覆盖率

```bash
# 生成测试覆盖率报告
npm run test:coverage

# 或者
npx nyc mocha test/*.test.js --ui tdd
```

## 测试文件结构
test/
├── model.test.js          # Model 类测试
├── querychain.test.js     # QueryChain 类测试
├── example.mdb           # 测试数据库文件
└── README.md             # 本文档

### 测试工具类

两个测试文件都使用相同的测试 UserModel：

```javascript
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
```

## Model 类测试详解

### 测试套件结构

Model 基础功能测试
├── Model 静态方法
├── Model 构造函数
├── 字符串值处理
├── delete() 方法
├── QueryChain 集成测试
├── Model 类继承测试
├── README 示例测试
├── 边界情况测试
└── SQL 注入防护测试

### 核心测试用例

1. 测试 Model 静态方法：

```javascript
// 测试 newQuery() 方法
test('newQuery() - 应该返回 QueryChain 实例', function() {
    const query = UserModel.newQuery();
    assert.isNotNull(query);
    assert.equal(query.tableName, 'users');
    assert.property(query, 'select');
    assert.property(query, 'join');
    assert.property(query, 'where');
    assert.property(query, 'execute');
});
```

2. 字符串值处理测试

```javascript
// 自动为字符串值添加引号
test('where() - 应该自动为字符串值添加引号', function() {
    const query = UserModel.newQuery()
        .where({ userName: 'Mike' })
        .toSql();
    assert.include(query, "'Mike'");
});

// 数字值不添加引号
test('where() - 数字值不应该添加引号', function() {
    const query = UserModel.newQuery()
        .where({ age: 25 })
        .toSql();
    assert.include(query, 'age = 25');
    assert.notInclude(query, "'25'");
});
```

3. README 示例验证测试

包含对 README.md 文档中所有示例的自动化验证：

```javascript
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
```

## QueryChain 类测试详解

### 测试套件结构

QueryChain 链式查询功能测试
├── 基础查询构建
├── JOIN 查询
├── WHERE 条件
├── ORDER BY 排序
├── LIMIT 和 OFFSET
├── 复杂链式查询
├── SQL 生成测试
└── 链式调用返回值测试

### 核心测试用例

1. SELECT 查询测试

```javascript
test('select() - 应该能够选择特定字段', function() {
    const sql = UserModel.newQuery()
        .select('userName', 'age')
        .toSql();
    assert.include(sql, 'SELECT userName, age');
    assert.include(sql, 'FROM users');
});

test('select() - 应该支持字段别名', function() {
    const sql = UserModel.newQuery()
        .select('users.id as user_id', 'orders.id as order_id')
        .toSql();
    assert.include(sql, 'users.id as user_id');
    assert.include(sql, 'orders.id as order_id');
});
```

2. JOIN 查询测试

```javascript
// INNER JOIN 测试
test('join() - 应该能够执行 INNER JOIN', function() {
    const sql = UserModel.newQuery()
        .join('orders', 'users.id = orders.user_id')
        .toSql();
    assert.include(sql, 'INNER JOIN orders ON users.id = orders.user_id');
});

// LEFT JOIN 测试
test('leftJoin() - 应该能够执行 LEFT JOIN', function() {
    const sql = UserModel.newQuery()
        .leftJoin('orders', 'users.id = orders.user_id')
        .toSql();
    assert.include(sql, 'LEFT JOIN orders ON users.id = orders.user_id');
});
```

3. WHERE 条件测试

```javascript
// 对象形式条件
test('where() - 应该支持对象形式的条件', function() {
    const sql = UserModel.newQuery()
        .where({ userName: 'Mike' })
        .toSql();
    assert.include(sql, "WHERE userName = 'Mike'");
});

// 原始 SQL 条件
test('whereRaw() - 应该支持原始 SQL 条件', function() {
    const sql = UserModel.newQuery()
        .whereRaw("amount > 100 AND status = 'active'")
        .toSql();
    assert.include(sql, "amount > 100 AND status = 'active'");
});
```

4. 排序和分页测试

```javascript
// 排序测试
test('orderBy() - 应该支持降序排序', function() {
    const sql = UserModel.newQuery()
        .orderBy('age', 'DESC')
        .toSql();
    assert.include(sql, 'ORDER BY age DESC');
});

// 分页测试
test('limit() + offset() - 应该支持分页查询', function() {
    const sql = UserModel.newQuery()
        .limit(10)
        .offset(20)
        .toSql();
    assert.include(sql, 'LIMIT 10');
    assert.include(sql, 'OFFSET 20');
});
```

## 测试用例分类

### 功能测试

测试类别	测试数量	描述
基础功能	15+	Model 和 QueryChain 的基本方法测试
JOIN 查询	8+	各种 JOIN 类型的功能验证
条件查询	12+	WHERE 条件的不同使用场景
排序分页	6+	ORDER BY、LIMIT、OFFSET 功能
链式调用	9+	方法链式调用的返回值验证

### 边界测试

```javascript
// 空值处理
test('空 select - 应该默认选择所有字段', function() {
    const sql = UserModel.newQuery()
        .where({ userName: 'Mike' })
        .toSql();
    assert.include(sql, 'SELECT users.*');
});

// 特殊字符处理
test('特殊字符 - 应该包含在引号内', function() {
    const sql = UserModel.newQuery()
        .where({ userName: "Mike O'Brien" })
        .toSql();
    assert.include(sql, "'Mike O'Brien'");
});
```

### 安全性测试

```javascript
// SQL 注入防护
test('where() 对象形式 - 自动转义字符串值', function() {
    const sql = UserModel.newQuery()
        .where({ userName: 'Mike' })
        .toSql();
    assert.include(sql, "'Mike'"); // 自动添加引号
});
```

## 最佳实践

### 1. 测试编写规范

- 使用描述性的测试名称
- 每个测试用例只测试一个功能点
- 包含正向和负向测试用例
- 测试边界条件和异常情况

### 2. 断言使用指南

```javascript
// 正确的断言方式
assert.isNotNull(result);           // 非空检查
assert.equal(actual, expected);     // 相等性检查
assert.include(string, substring);  // 包含检查
assert.property(obj, 'prop');       // 属性存在检查// 正确的断言方式
assert.isNotNull(result);           // 非空检查
assert.equal(actual, expected);     // 相等性检查
assert.include(string, substring);  // 包含检查
assert.property(obj, 'prop');       // 属性存在检查
```

### 3. 测试维护建议

- 定期更新测试用例以匹配功能变更
- 保持测试数据的一致性和独立性
- 使用有意义的测试数据
- 及时清理废弃的测试用例

### 4. 覆盖率目标

建议测试覆盖率应达到：

- 行覆盖率：≥ 85%
- 函数覆盖率：≥ 90%
- 分支覆盖率：≥ 80%

## 故障排除

### 常见问题

**1. 测试失败但功能正常**

- 检查测试数据是否与预期一致
- 验证断言条件是否正确

**2. 覆盖率报告不准确**

- 确保所有源文件都被正确引入
- 检查 ```.nycrc``` 配置文件

**3. 测试运行缓慢**

- 考虑使用 ```--parallel``` 参数
- 优化测试数据准备过程

### 调试技巧

```bash
# 运行特定测试文件
npx mocha test/model.test.js --ui tdd

# 运行特定测试套件
npx mocha test/*.test.js --ui tdd --grep "Model 静态方法"

# 详细输出模式
npx mocha test/*.test.js --ui tdd --reporter spec
```





