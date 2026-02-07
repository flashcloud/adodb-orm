# ADODB Query Builder - Model 扩展库

基于 [adodb-query-builder](https://www.npmjs.com/package/adodb-query-builder) 的增强 ORM 库，提供更强大的数据库操作能力，支持复杂的多表 JOIN 查询和链式调用。

## 目录

- [特性](#特性)
- [安装](#安装)
- [快速开始](#快速开始)
- [Model 类](#model-类)
- [QueryChain 查询链](#querychain-查询链)
- [API 文档](#api-文档)
- [使用示例](#使用示例)

---

## 特性

✨ **增强功能**
- 🔗 支持复杂的多表 JOIN 查询（INNER/LEFT/RIGHT JOIN）
- ⛓️ 优雅的链式调用 API
- 🎯 灵活的查询条件构建
- 🗑️ 扩展的 `delete` 方法
- 🔍 自动处理字符串值的引号转义
- 🐛 调试友好的 `toSql()` 方法

---

## 安装

```bash
npm install adodb-query-builder
```

---

## 快速开始

### 1. 创建数据模型

```javascript
// userModel.js
const Model = require('./Model.js');

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

module.exports = UserModel;
```

### 2. 连接数据库

```javascript
const ConnectDB = require('adodb-query-builder').ConnectDB;

ConnectDB.connect("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=/path/to/database.mdb;Persist Security Info=False;");
```

### 3. 执行查询

```javascript
const UserModel = require('./userModel');

// 基础查询
const users = await UserModel.where({ userName: "John" });

// 链式查询
const results = await UserModel.query()
    .select('users.*', 'orders.amount')
    .join('orders', 'users.id = orders.user_id')
    .where({ 'users.sex': '男' })
    .orderBy('orders.amount', 'DESC')
    .execute();
```

---

## Model 类

`Model` 类是所有数据模型的基类，继承自 `QueryBuilder`，提供了增强的数据库操作方法。

### 静态方法

#### `Model.query()`
启动查询链，返回 `QueryChain` 实例。

```javascript
UserModel.query()
    .select('*')
    .where({ age: 25 })
    .execute();
```

#### `Model.where(conditionals)`
查询记录（自动处理字符串引号）。

```javascript
const users = await UserModel.where({ userName: "Mike" });
```

#### `Model.delete(where)`
删除记录。

```javascript
await UserModel.delete({ userName: "Mike" });
```

---

## QueryChain 查询链

`QueryChain` 类提供了强大的链式查询构建能力，支持复杂的多表查询。

### 方法列表

| 方法 | 说明 | 示例 |
|------|------|------|
| `select(...fields)` | 选择字段 | `.select('users.*', 'orders.id')` |
| `join(table, condition)` | INNER JOIN | `.join('orders', 'users.id = orders.user_id')` |
| `leftJoin(table, condition)` | LEFT JOIN | `.leftJoin('orders', 'users.id = orders.user_id')` |
| `rightJoin(table, condition)` | RIGHT JOIN | `.rightJoin('orders', 'users.id = orders.user_id')` |
| `where(condition)` | WHERE 条件 | `.where({ userName: 'Mike' })` |
| `whereRaw(rawCondition)` | 原始 SQL 条件 | `.whereRaw("amount > 100")` |
| `orderBy(field, direction)` | 排序 | `.orderBy('age', 'DESC')` |
| `limit(n)` | 限制数量 | `.limit(10)` |
| `offset(n)` | 偏移量 | `.offset(20)` |
| `execute()` | 执行查询 | `.execute()` |
| `first()` | 获取第一条记录 | `.first()` |
| `toSql()` | 输出 SQL（调试用） | `.toSql()` |

---

## API 文档

### select(...fields)

选择要返回的字段。

```javascript
// 选择所有字段
UserModel.query().select('*').execute();

// 选择特定字段
UserModel.query().select('userName', 'age').execute();

// 多表字段
UserModel.query()
    .select('users.userName', 'orders.amount')
    .join('orders', 'users.id = orders.user_id')
    .execute();

// 字段别名
UserModel.query()
    .select('users.id as user_id', 'orders.id as order_id')
    .join('orders', 'users.id = orders.user_id')
    .execute();
```

### join(table, condition)

执行 INNER JOIN。

```javascript
UserModel.query()
    .join('orders', 'users.id = orders.user_id')
    .execute();
```

### leftJoin(table, condition)

执行 LEFT JOIN（包含左表所有记录，即使右表没有匹配）。

```javascript
UserModel.query()
    .leftJoin('orders', 'users.id = orders.user_id')
    .execute();
```

### rightJoin(table, condition)

执行 RIGHT JOIN（包含右表所有记录，即使左表没有匹配）。

```javascript
UserModel.query()
    .rightJoin('orders', 'users.id = orders.user_id')
    .execute();
```

### where(condition)

添加 WHERE 条件，支持对象或字符串。

```javascript
// 对象形式（自动处理引号）
UserModel.query()
    .where({ userName: 'Mike', sex: '男' })
    .execute();

// 字符串形式
UserModel.query()
    .where("age > 18")
    .execute();
```

### whereRaw(rawCondition)

添加原始 SQL WHERE 条件。

```javascript
UserModel.query()
    .whereRaw("amount > 100 AND status = 'active'")
    .execute();
```

### orderBy(field, direction)

设置排序，direction 可以是 `'ASC'` 或 `'DESC'`（默认 `'ASC'`）。

```javascript
UserModel.query()
    .orderBy('age', 'DESC')
    .execute();

// 多个排序条件
UserModel.query()
    .orderBy('sex', 'ASC')
    .orderBy('age', 'DESC')
    .execute();
```

### limit(n) / offset(n)

设置分页。

```javascript
// 获取前 10 条记录
UserModel.query().limit(10).execute();

// 跳过前 20 条，获取接下来的 10 条
UserModel.query().limit(10).offset(20).execute();
```

### execute()

执行查询并返回结果数组。

```javascript
const results = await UserModel.query()
    .select('*')
    .where({ sex: '男' })
    .execute();

console.log(results); // [{ id: 1, userName: 'Mike', ... }, ...]
```

### first()

获取第一条记录，如果没有记录则返回 `null`。

```javascript
const user = await UserModel.query()
    .where({ userName: 'Mike' })
    .first();

console.log(user); // { id: 1, userName: 'Mike', ... } 或 null
```

### toSql()

返回生成的 SQL 字符串，用于调试。

```javascript
const sql = UserModel.query()
    .select('users.*', 'orders.amount')
    .join('orders', 'users.id = orders.user_id')
    .where({ 'users.userName': 'Mike' })
    .toSql();

console.log(sql);
// 输出: SELECT users.*, orders.amount FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.userName = 'Mike';
```

---

## 使用示例

### 示例 1: 基础 JOIN 查询

查询用户及其订单信息。

```javascript
const results = await UserModel.query()
    .select('users.*', 'orders.id as order_id', 'orders.amount')
    .join('orders', 'users.id = orders.user_id')
    .where({ 'users.userName': 'Mike' })
    .execute();

console.log(results);
```

**生成的 SQL:**
```sql
SELECT users.*, orders.id as order_id, orders.amount 
FROM users 
INNER JOIN orders ON users.id = orders.user_id 
WHERE users.userName = 'Mike';
```

---

### 示例 2: LEFT JOIN 多表查询

查询所有用户，包括没有订单的用户。

```javascript
const results = await UserModel.query()
    .select('users.userName', 'orders.amount')
    .leftJoin('orders', 'users.id = orders.user_id')
    .orderBy('users.userName', 'ASC')
    .execute();
```

**生成的 SQL:**
```sql
SELECT users.userName, orders.amount 
FROM users 
LEFT JOIN orders ON users.id = orders.user_id 
ORDER BY users.userName ASC;
```

---

### 示例 3: 复杂条件查询

多条件、多表连接。

```javascript
const results = await UserModel.query()
    .select('users.*', 'orders.amount', 'products.name')
    .join('orders', 'users.id = orders.user_id')
    .join('products', 'orders.product_id = products.id')
    .whereRaw("orders.amount > 100")
    .where({ 'users.sex': '男' })
    .orderBy('orders.amount', 'DESC')
    .limit(10)
    .execute();
```

**生成的 SQL:**
```sql
SELECT users.*, orders.amount, products.name 
FROM users 
INNER JOIN orders ON users.id = orders.user_id 
INNER JOIN products ON orders.product_id = products.id 
WHERE orders.amount > 100 AND users.sex = '男' 
ORDER BY orders.amount DESC 
LIMIT 10;
```

---

### 示例 4: 获取单条记录

```javascript
const user = await UserModel.query()
    .join('orders', 'users.id = orders.user_id')
    .where({ 'orders.id': 123 })
    .first();

if (user) {
    console.log('找到用户:', user.userName);
} else {
    console.log('未找到用户');
}
```

---

### 示例 5: 调试 SQL

使用 `toSql()` 查看生成的 SQL 语句。

```javascript
const sql = UserModel.query()
    .select('users.*', 'orders.amount')
    .join('orders', 'users.id = orders.user_id')
    .where({ 'users.userName': 'Mike' })
    .orderBy('orders.amount', 'DESC')
    .toSql();

console.log('生成的 SQL:', sql);
// 输出: SELECT users.*, orders.amount FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.userName = 'Mike' ORDER BY orders.amount DESC;
```

---

### 示例 6: 分页查询

```javascript
// 获取第 3 页，每页 10 条记录
const page = 3;
const pageSize = 10;

const results = await UserModel.query()
    .select('*')
    .orderBy('id', 'ASC')
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute();

console.log(`第 ${page} 页数据:`, results);
```

---

### 示例 7: 统计查询（使用原始条件）

```javascript
// 查询年龄大于 25 岁的男性用户
const results = await UserModel.query()
    .select('userName', 'age')
    .where({ sex: '男' })
    .whereRaw("age > 25")
    .orderBy('age', 'DESC')
    .execute();
```

---

### 示例 8: 多表关联复杂查询

假设有三个表：`users`（用户）、`orders`（订单）、`products`（产品）

```javascript
// 查询购买了特定产品的用户信息
const results = await UserModel.query()
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
    .execute();

console.log('购买了 iPhone 的用户:', results);
```

---

## 架构优势

1. **链式调用**：优雅的 API 设计，代码可读性强
2. **类型丰富**：支持 INNER/LEFT/RIGHT JOIN
3. **灵活条件**：支持对象和原始 SQL 混合使用
4. **易于扩展**：可以继续添加 `groupBy`、`having` 等功能
5. **调试友好**：提供 `toSql()` 方法查看生成的 SQL
6. **自动转义**：自动处理字符串值的引号

---

## 注意事项

1. **Access 数据库限制**：某些高级 SQL 功能可能不被 Access 支持（如 `LIMIT`/`OFFSET`）
2. **字段引用**：在多表查询时，建议使用完整的字段引用（如 `users.userName`）避免歧义
3. **SQL 注入**：在使用 `whereRaw()` 时，请确保参数安全，避免 SQL 注入风险

---

## 许可证

MIT

---

## 贡献

欢迎提交 Issue 和 Pull Request！
