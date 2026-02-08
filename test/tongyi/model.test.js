const { expect } = require('chai');
const sinon = require('sinon');
const { ConnectDB } = require('../../src/index');
const Model = require('../../src/Model');

// 模拟的数据库连接
const mockConnection = {
    query: sinon.stub(),
    execute: sinon.stub()
};

describe('Model', function() {
    
    beforeEach(function() {
        // 重置所有模拟
        sinon.restore();
        // 设置模拟连接
        ConnectDB.connection = mockConnection;
    });

    describe('静态方法测试', function() {
        
        describe('#newQuery()', function() {
            it('应该返回一个新的QueryChain实例', function() {
                class TestModel extends Model {
                    static tableName = 'test_table';
                }
                
                const queryChain = TestModel.newQuery();
                
                expect(queryChain).to.be.an('object');
                expect(queryChain.constructor.name).to.equal('QueryChain');
                expect(queryChain.tableName).to.equal('test_table');
            });
        });

        describe('#where()', function() {
            it('应该正确处理字符串条件并调用父类方法', async function() {
                class TestModel extends Model {
                    static tableName = 'users';
                }
                
                // 模拟父类QueryBuilder的where方法
                const parentWhereStub = sinon.stub(Model.__proto__, 'where').resolves([{ id: 1, name: 'John' }]);
                
                const result = await TestModel.where({ userName: "John" });
                
                expect(parentWhereStub.calledOnce).to.be.true;
                expect(parentWhereStub.firstCall.args[0]).to.deep.equal({ userName: "'John'" });
                expect(result).to.deep.equal([{ id: 1, name: 'John' }]);
            });

            it('应该正确处理数字条件', async function() {
                class TestModel extends Model {
                    static tableName = 'users';
                }
                
                const parentWhereStub = sinon.stub(Model.__proto__, 'where').resolves([{ id: 1, age: 25 }]);
                
                const result = await TestModel.where({ age: 25 });
                
                expect(parentWhereStub.firstCall.args[0]).to.deep.equal({ age: 25 });
                expect(result).to.deep.equal([{ id: 1, age: 25 }]);
            });
        });

        describe('#delete()', function() {
            it('应该构建正确的DELETE SQL语句并执行', async function() {
                class TestModel extends Model {
                    static tableName = 'users';
                }
                
                mockConnection.execute.resolves({ recordsAffected: 1 });
                
                const result = await TestModel.delete({ id: 1 });
                
                expect(mockConnection.execute.calledOnce).to.be.true;
                expect(mockConnection.execute.firstCall.args[0]).to.equal("DELETE FROM users WHERE id = 1;");
                expect(result.recordsAffected).to.equal(1);
            });

            it('应该正确处理字符串值的删除条件', async function() {
                class TestModel extends Model {
                    static tableName = 'users';
                }
                
                mockConnection.execute.resolves({ recordsAffected: 1 });
                
                const result = await TestModel.delete({ userName: "John" });
                
                expect(mockConnection.execute.firstCall.args[0]).to.equal("DELETE FROM users WHERE userName = 'John';");
            });

            it('应该处理多个删除条件', async function() {
                class TestModel extends Model {
                    static tableName = 'users';
                }
                
                mockConnection.execute.resolves({ recordsAffected: 1 });
                
                const result = await TestModel.delete({ userName: "John", age: 25 });
                
                const sql = mockConnection.execute.firstCall.args[0];
                expect(sql).to.include("userName = 'John'");
                expect(sql).to.include("age = 25");
                expect(sql).to.include("AND");
            });

            it('应该在执行失败时抛出错误', async function() {
                class TestModel extends Model {
                    static tableName = 'users';
                }
                
                const error = new Error('Database error');
                mockConnection.execute.rejects(error);
                
                try {
                    await TestModel.delete({ id: 1 });
                    expect.fail('应该抛出错误');
                } catch (err) {
                    expect(err).to.equal(error);
                }
            });
        });
    });

    describe('实例方法继承测试', function() {
        it('应该继承QueryBuilder的基本功能', function() {
            class TestModel extends Model {
                constructor() {
                    super();
                    this.id = this.Column('integer');
                    this.name = this.Column('string');
                }
            }
            
            TestModel.tableName = 'test_table';
            const instance = new TestModel();
            
            expect(instance).to.be.an.instanceof(Model);
            expect(instance).to.have.property('id');
            expect(instance).to.have.property('name');
        });
    });
});