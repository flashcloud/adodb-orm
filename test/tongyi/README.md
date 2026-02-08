# ADODB ORM 测试指南

## 概述

本测试由通义灵码插件生成。项目使用 Mocha 测试框架，采用 TDD（测试驱动开发）方式进行测试。测试套件涵盖了 Model 类、QueryChain 查询链以及完整的 CRUD 操作流程。

## 测试文件结构

test/ ├── tongyi/ │ ├── model.test.js # Model类核心功能测试 │ ├── querychain.test.js # QueryChain查询链测试
│ └── integration.test.js # 集成测试

## 测试特点：

- ✅ TDD风格 - 使用describe/it结构，先写测试后验证实现 
- ✅ 全面覆盖 - 包含正常流程、边界情况和错误处理 
- ✅ 使用Sinon进行模拟 - 避免真实数据库依赖 
- ✅ 详细的断言 - 验证方法调用、参数和返回值

这些测试遵循TDD原则，每个测试都明确描述了期望的行为，并且可以独立运行。测试使用了chai断言库和sinon模拟库来确保测试的可靠性和隔离性。

## 测试环境配置

### 依赖安装

测试需要以下开发依赖：
- mocha: 测试框架
- chai: 断言库
- sinon: 模拟库
- nyc: 代码覆盖率工具

### package.json 脚本命令

```json
{
  "scripts": {
    "test": "mocha test/tongyi/*.test.js --ui tdd",
    "test:watch": "mocha test/tongyi/*.test.js --ui tdd --watch",
    "test:coverage": "nyc mocha test/tongyi/*.test.js --ui tdd"
  }
}
```

## 测试运行方式

### 基础测试运行

```bash
npm run test
```

### 监听模式（开发时使用）

```bash
npm run test:watch
```

### 生成覆盖率报告

```bash
npm run test:coverage
```

## 测试内容详解

### 1.Model 类测试 (model.test.js)

**测试的主要功能：**

- ```newQuery()``` 方法返回 QueryChain 实例
- ```where()``` 方法处理不同类型的查询条件（字符串、数字）
- ```delete()``` 方法构建和执行 DELETE 语句
- 错误处理机制

**关键测试用例：**

```javascript
// 测试 newQuery() 返回正确实例
it('应该返回一个新的QueryChain实例', function() {
    const queryChain = TestModel.newQuery();
    expect(queryChain.constructor.name).to.equal('QueryChain');
});

// 测试 where() 方法处理字符串条件
it('应该正确处理字符串条件并调用父类方法', async function() {
    const result = await TestModel.where({ userName: "John" });
    expect(parentWhereStub.firstCall.args[0]).to.deep.equal({ userName: "'John'" });
});
```

### 2.QueryChain 查询链测试 (querychain.test.js)

**测试的链式方法：**

- ```select()``` - 字段选择
- ```join()/leftJoin()/rightJoin()``` - 表连接
- ```where()/whereRaw()``` - 查询条件
- ```orderBy()``` - 排序
- ```limit()/offset()``` - 分页

**测试的执行方法：**

- ```execute()``` - 执行查询
- ```first()``` - 获取单条记录
- ```toSql()``` - SQL 构建

**关键测试用例：**

```javascript
// 测试链式调用
it('应该构建带JOIN的复杂查询', function() {
    const query = TestModel.newQuery()
        .select('users.name', 'orders.total')
        .join('orders', 'users.id = orders.user_id')
        .where({ 'users.status': 'active' })
        .orderBy('orders.created_at', 'DESC')
        .limit(5)
        .toSql();
    
    expect(query).to.include('SELECT users.name, orders.total');
    expect(query).to.include('INNER JOIN orders ON users.id = orders.user_id');
});
```

### 3.集成测试 (integration.test.js)

**测试完整的 CRUD 流程：**

1. 创建 (Create) - 用户保存
2. 读取 (Read) - 用户查询
3. 更新 (Update) - 用户信息修改
4. 删除 (Delete) - 用户删除

**复杂查询测试：**

- 多表连接查询
- 聚合函数使用
- 分组和排序
- 分页限制

**错误处理测试：**

- 数据库连接异常
- SQL 执行错误
- 参数验证

## 测试最佳实践

### 1. 使用 Sinon 进行模拟

```javascript
const mockConnection = {
    query: sinon.stub(),
    execute: sinon.stub()
};
ConnectDB.connection = mockConnection;
```

### 2. TDD 测试结构

```javascript
describe('功能模块', function() {
    beforeEach(function() {
        // 测试前准备
    });
    
    describe('#方法名()', function() {
        it('应该实现某个具体行为', function() {
            // 具体测试逻辑
        });
    });
});
```

### 3. 断言类型

```javascript
// 值相等断言
expect(result).to.equal(expectedValue);

// 对象深度比较
expect(result).to.deep.equal(expectedObject);

// 方法调用验证
expect(stub.calledOnce).to.be.true;
expect(stub.firstCall.args[0]).to.equal(expectedArg);
```

## 测试覆盖率目标

建议达到以下覆盖率指标：

- **行覆盖率: ≥ 80%**
- **函数覆盖率: ≥ 85%**
- **分支覆盖率: ≥ 75%**

## 常见问题解决

### 1. 测试失败排查

- 检查模拟对象是否正确设置
- 确认异步操作使用 ```async/await```
- 验证断言条件是否准确

### 2. 性能优化

- 使用 ```beforeEach``` 重置测试状态
- 避免在测试间共享状态
- 合理使用模拟减少外部依赖

### 3. 调试技巧

```bash
# 运行单个测试文件
mocha test/tongyi/model.test.js

# 运行特定测试用例
mocha test/tongyi/model.test.js --grep "应该返回新的QueryChain实例"

# 详细输出模式
mocha test/tongyi/*.test.js --reporter spec
```

## 贡献指南

### 添加新测试

1. 在相应测试文件中添加 ```describe``` 块
2. 编写具体的 ```it``` 测试用例
3. 确保测试覆盖正常和异常情况
4. 运行完整测试套件验证

### 测试命名规范

- 使用中文描述测试目的
- 采用 "应该 + 动词 + 具体行为" 的格式
- 保持测试名称简洁明确

## 维护建议

- 定期更新测试依赖版本
- 根据代码变更及时调整测试用例
- 保持测试代码的可读性和维护性
- 建立测试文档同步更新机制







