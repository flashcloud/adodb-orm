const { expect } = require('chai');
const sinon = require('sinon');
const { ConnectDB } = require('../../src/index');
const Model = require('../../src/Model');

// 模拟的数据库连接
const mockConnection = {
    query: sinon.stub(),
    execute: sinon.stub()
};

describe('QueryChain', function() {
    
    beforeEach(function() {
        sinon.restore();
        ConnectDB.connection = mockConnection;
    });

    describe('链式方法测试', function() {
        
        class TestModel extends Model {
            static tableName = 'users';
        }

        describe('#select()', function() {
            it('应该添加选择字段到查询链', function() {
                const query = TestModel.newQuery()
                    .select('id', 'name', 'email');
                
                expect(query._select).to.deep.equal(['id', 'name', 'email']);
                expect(query.toSql()).to.include('SELECT id, name, email');
            });

            it('应该支持多次调用select方法', function() {
                const query = TestModel.newQuery()
                    .select('id', 'name')
                    .select('email', 'created_at');
                
                expect(query._select).to.deep.equal(['id', 'name', 'email', 'created_at']);
            });
        });

        describe('#join()', function() {
            it('应该添加INNER JOIN到查询链', function() {
                const query = TestModel.newQuery()
                    .join('orders', 'users.id = orders.user_id');
                
                expect(query._joins).to.deep.equal([{
                    type: 'INNER JOIN',
                    table: 'orders',
                    condition: 'users.id = orders.user_id'
                }]);
                expect(query.toSql()).to.include('INNER JOIN orders ON users.id = orders.user_id');
            });
        });

        describe('#leftJoin()', function() {
            it('应该添加LEFT JOIN到查询链', function() {
                const query = TestModel.newQuery()
                    .leftJoin('profiles', 'users.id = profiles.user_id');
                
                expect(query._joins).to.deep.equal([{
                    type: 'LEFT JOIN',
                    table: 'profiles',
                    condition: 'users.id = profiles.user_id'
                }]);
                expect(query.toSql()).to.include('LEFT JOIN profiles ON users.id = profiles.user_id');
            });
        });

        describe('#rightJoin()', function() {
            it('应该添加RIGHT JOIN到查询链', function() {
                const query = TestModel.newQuery()
                    .rightJoin('permissions', 'users.role_id = permissions.role_id');
                
                expect(query._joins).to.deep.equal([{
                    type: 'RIGHT JOIN',
                    table: 'permissions',
                    condition: 'users.role_id = permissions.role_id'
                }]);
                expect(query.toSql()).to.include('RIGHT JOIN permissions ON users.role_id = permissions.role_id');
            });
        });

        describe('#where()', function() {
            it('应该处理对象形式的WHERE条件', function() {
                const query = TestModel.newQuery()
                    .where({ name: 'John', age: 25 });
                
                expect(query._where).to.deep.equal(["name = 'John'", "age = 25"]);
                expect(query.toSql()).to.include("WHERE name = 'John' AND age = 25");
            });

            it('应该处理字符串形式的WHERE条件', function() {
                const query = TestModel.newQuery()
                    .where("age > 18");
                
                expect(query._where).to.deep.equal(["age > 18"]);
                expect(query.toSql()).to.include("WHERE age > 18");
            });

            it('应该支持多次调用where方法', function() {
                const query = TestModel.newQuery()
                    .where({ status: 'active' })
                    .where("age > 18");
                
                expect(query._where).to.deep.equal(["status = 'active'", "age > 18"]);
            });
        });

        describe('#whereRaw()', function() {
            it('应该添加原始WHERE条件', function() {
                const query = TestModel.newQuery()
                    .whereRaw("(name LIKE '%John%' OR email LIKE '%john%')");
                
                expect(query._where).to.deep.equal(["(name LIKE '%John%' OR email LIKE '%john%')"]);
                expect(query.toSql()).to.include("WHERE (name LIKE '%John%' OR email LIKE '%john%')");
            });
        });

        describe('#orderBy()', function() {
            it('应该添加ORDER BY子句', function() {
                const query = TestModel.newQuery()
                    .orderBy('created_at', 'DESC');
                
                expect(query._orderBy).to.deep.equal(['created_at DESC']);
                expect(query.toSql()).to.include('ORDER BY created_at DESC');
            });

            it('应该默认使用ASC排序', function() {
                const query = TestModel.newQuery()
                    .orderBy('name');
                
                expect(query._orderBy).to.deep.equal(['name ASC']);
                expect(query.toSql()).to.include('ORDER BY name ASC');
            });

            it('应该支持多个排序条件', function() {
                const query = TestModel.newQuery()
                    .orderBy('priority', 'DESC')
                    .orderBy('created_at', 'ASC');
                
                expect(query._orderBy).to.deep.equal(['priority DESC', 'created_at ASC']);
            });
        });

        describe('#limit()', function() {
            it('应该设置LIMIT值', function() {
                const query = TestModel.newQuery()
                    .limit(10);
                
                expect(query._limit).to.equal(10);
                expect(query.toSql()).to.include('LIMIT 10');
            });
        });

        describe('#offset()', function() {
            it('应该设置OFFSET值', function() {
                const query = TestModel.newQuery()
                    .offset(20);
                
                expect(query._offset).to.equal(20);
                expect(query.toSql()).to.include('OFFSET 20');
            });
        });
    });

    describe('SQL构建测试', function() {
        
        class TestModel extends Model {
            static tableName = 'users';
        }

        it('应该构建基本的SELECT查询', function() {
            const query = TestModel.newQuery().toSql();
            expect(query).to.equal('SELECT users.* FROM users;');
        });

        it('应该构建带WHERE条件的查询', function() {
            const query = TestModel.newQuery()
                .where({ status: 'active' })
                .toSql();
            
            expect(query).to.equal("SELECT users.* FROM users WHERE status = 'active';");
        });

        it('应该构建带JOIN的复杂查询', function() {
            const query = TestModel.newQuery()
                .select('users.name', 'orders.total')
                .join('orders', 'users.id = orders.user_id')
                .where({ 'users.status': 'active' })
                .orderBy('orders.created_at', 'DESC')
                .limit(5)
                .toSql();
            
            expect(query).to.include('SELECT users.name, orders.total');
            expect(query).to.include('FROM users');
            expect(query).to.include('INNER JOIN orders ON users.id = orders.user_id');
            expect(query).to.include("WHERE users.status = 'active'");
            expect(query).to.include('ORDER BY orders.created_at DESC');
            expect(query).to.include('LIMIT 5');
        });

        it('应该处理多个JOIN条件', function() {
            const query = TestModel.newQuery()
                .leftJoin('profiles', 'users.id = profiles.user_id')
                .rightJoin('roles', 'users.role_id = roles.id')
                .toSql();
            
            expect(query).to.include('LEFT JOIN profiles ON users.id = profiles.user_id');
            expect(query).to.include('RIGHT JOIN roles ON users.role_id = roles.id');
        });
    });

    describe('执行方法测试', function() {
        
        class TestModel extends Model {
            static tableName = 'users';
        }

        describe('#execute()', function() {
            it('应该执行查询并返回结果', async function() {
                const expectedResult = [{ id: 1, name: 'John' }];
                mockConnection.query.resolves(expectedResult);
                
                const query = TestModel.newQuery().where({ name: 'John' });
                const result = await query.execute();
                
                expect(mockConnection.query.calledOnce).to.be.true;
                expect(result).to.deep.equal(expectedResult);
            });

            it('应该在查询失败时记录错误并重新抛出', async function() {
                const error = new Error('Database connection failed');
                mockConnection.query.rejects(error);
                
                const consoleSpy = sinon.spy(console, 'log');
                const query = TestModel.newQuery();
                
                try {
                    await query.execute();
                    expect.fail('应该抛出错误');
                } catch (err) {
                    expect(err).to.equal(error);
                    expect(consoleSpy.calledTwice).to.be.true;
                    expect(consoleSpy.firstCall.args[0]).to.equal('Query error:');
                    expect(consoleSpy.secondCall.args[0]).to.equal('SQL:');
                }
            });
        });

        describe('#first()', function() {
            it('应该返回第一条记录', async function() {
                const testData = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
                mockConnection.query.resolves(testData);
                
                const query = TestModel.newQuery();
                const result = await query.first();
                
                expect(mockConnection.query.calledOnce).to.be.true;
                expect(result).to.deep.equal({ id: 1, name: 'John' });
                expect(query._limit).to.equal(1);
            });

            it('应该在没有结果时返回null', async function() {
                mockConnection.query.resolves([]);
                
                const query = TestModel.newQuery();
                const result = await query.first();
                
                expect(result).to.be.null;
            });
        });
    });

    describe('边界情况测试', function() {
        
        class TestModel extends Model {
            static tableName = 'users';
        }

        it('应该处理空的选择字段', function() {
            const query = TestModel.newQuery().select();
            expect(query.toSql()).to.equal('SELECT users.* FROM users;');
        });

        it('应该处理空的WHERE条件', function() {
            const query = TestModel.newQuery().where({});
            expect(query.toSql()).to.equal('SELECT users.* FROM users;');
        });

        it('应该处理特殊字符的字符串值', function() {
            const query = TestModel.newQuery().where({ name: "John's Account" });
            expect(query.toSql()).to.include("name = 'John''s Account'");
        });
    });
});