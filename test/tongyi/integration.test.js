const { expect } = require('chai');
const sinon = require('sinon');
const { ConnectDB } = require('../../src/index');
const Model = require('../../src/Model');

// 集成测试 - 测试完整的CRUD操作流程
describe('ADODB ORM 集成测试', function() {
    
    beforeEach(function() {
        sinon.restore();
    });

    describe('完整的用户管理流程', function() {
        
        // 创建测试模型
        class UserModel extends Model {
            constructor() {
                super();
                this.id = this.Column('integer');
                this.userName = this.Column('string');
                this.email = this.Column('string');
                this.age = this.Column('integer');
                this.createdAt = this.Column('datetime');
            }
        }
        
        UserModel.tableName = 'users';

        it('应该完成用户的增删改查完整流程', async function() {
            // 模拟数据库连接
            const mockConnection = {
                query: sinon.stub(),
                execute: sinon.stub()
            };
            ConnectDB.connection = mockConnection;

            // 1. 创建用户 (save)
            const newUser = new UserModel();
            newUser.userName = "Alice Smith";
            newUser.email = "alice@example.com";
            newUser.age = 28;
            
            // 模拟save方法的行为（假设在父类中实现）
            const saveStub = sinon.stub(newUser, 'save').resolves(1);

            const userId = await newUser.save();
            expect(saveStub.calledOnce).to.be.true;
            expect(userId).to.equal(1);

            // 2. 查询用户 (where)
            const whereResults = [{ 
                id: 1, 
                userName: "Alice Smith", 
                email: "alice@example.com", 
                age: 28 
            }];
            mockConnection.query.resolves(whereResults);

            const foundUsers = await UserModel.where({ userName: "Alice Smith" });
            expect(foundUsers).to.deep.equal(whereResults);
            expect(mockConnection.query.firstCall.args[0]).to.include("WHERE userName = 'Alice Smith'");

            // 3. 更新用户 (update)
            const updateStub = sinon.stub(UserModel, 'update').resolves({ recordsAffected: 1 });
            
            const updateResult = await UserModel.update(
                { age: 29 }, 
                { userName: "'Alice Smith'" }
            );
            
            expect(updateStub.calledOnce).to.be.true;
            expect(updateResult.recordsAffected).to.equal(1);

            // 4. 使用查询链进行复杂查询
            const chainResults = [{
                id: 1,
                userName: "Alice Smith",
                email: "alice@example.com",
                orderCount: 5
            }];
            
            mockConnection.query.onSecondCall().resolves(chainResults);

            const complexQuery = await UserModel.newQuery()
                .select('users.*', 'COUNT(orders.id) as orderCount')
                .leftJoin('orders', 'users.id = orders.user_id')
                .where({ 'users.age': 29 })
                .groupBy('users.id')
                .orderBy('orderCount', 'DESC')
                .limit(10)
                .execute();

            expect(complexQuery).to.deep.equal(chainResults);
            
            const executedSql = mockConnection.query.secondCall.args[0];
            expect(executedSql).to.include('SELECT users.*, COUNT(orders.id) as orderCount');
            expect(executedSql).to.include('LEFT JOIN orders ON users.id = orders.user_id');
            expect(executedSql).to.include('WHERE users.age = 29');
            expect(executedSql).to.include('ORDER BY orderCount DESC');
            expect(executedSql).to.include('LIMIT 10');

            // 5. 删除用户
            mockConnection.execute.resolves({ recordsAffected: 1 });
            
            const deleteResult = await UserModel.delete({ id: 1 });
            
            expect(deleteResult.recordsAffected).to.equal(1);
            expect(mockConnection.execute.firstCall.args[0]).to.equal("DELETE FROM users WHERE id = 1;");
        });
    });
})
