const { QueryBuilder, ConnectDB } = require('adodb-query-builder');

/**
 * QueryChain - 查询链类，支持复杂的链式查询操作
 */
class QueryChain {
    constructor(modelClass) {
        this.modelClass = modelClass;
        this.tableName = modelClass.tableName;
        this._select = [];
        this._joins = [];
        this._where = [];
        this._orderBy = [];
        this._limit = null;
        this._offset = null;
    }

    /**
     * 选择字段
     * @param {...string} fields 字段列表，例如 'users.*', 'orders.id'
     * @returns {QueryChain}
     */
    select(...fields) {
        this._select.push(...fields);
        return this;
    }

    /**
     * INNER JOIN
     * @param {string} table 表名
     * @param {string} condition 连接条件，例如 'users.id = orders.user_id'
     * @returns {QueryChain}
     */
    join(table, condition) {
        this._joins.push({ type: 'INNER JOIN', table, condition });
        return this;
    }

    /**
     * LEFT JOIN
     * @param {string} table 表名
     * @param {string} condition 连接条件
     * @returns {QueryChain}
     */
    leftJoin(table, condition) {
        this._joins.push({ type: 'LEFT JOIN', table, condition });
        return this;
    }

    /**
     * RIGHT JOIN
     * @param {string} table 表名
     * @param {string} condition 连接条件
     * @returns {QueryChain}
     */
    rightJoin(table, condition) {
        this._joins.push({ type: 'RIGHT JOIN', table, condition });
        return this;
    }

    /**
     * WHERE 条件
     * @param {string|Object} condition 条件字符串或对象
     * @returns {QueryChain}
     */
    where(condition) {
        if (typeof condition === 'object') {
            for (const attr in condition) {
                const val = (typeof condition[attr] === 'string') ? `'${condition[attr]}'` : condition[attr];
                this._where.push(`${attr} = ${val}`);
            }
        } else {
            this._where.push(condition);
        }
        return this;
    }

    /**
     * 原始 WHERE 条件
     * @param {string} rawCondition 原始 SQL 条件
     * @returns {QueryChain}
     */
    whereRaw(rawCondition) {
        this._where.push(rawCondition);
        return this;
    }

    /**
     * ORDER BY
     * @param {string} field 排序字段
     * @param {string} direction 排序方向 'ASC' 或 'DESC'
     * @returns {QueryChain}
     */
    orderBy(field, direction = 'ASC') {
        this._orderBy.push(`${field} ${direction}`);
        return this;
    }

    /**
     * LIMIT
     * @param {number} limit 限制数量
     * @returns {QueryChain}
     */
    limit(limit) {
        this._limit = limit;
        return this;
    }

    /**
     * OFFSET
     * @param {number} offset 偏移量
     * @returns {QueryChain}
     */
    offset(offset) {
        this._offset = offset;
        return this;
    }

    /**
     * 构建 SQL 查询语句
     * @returns {string}
     */
    buildQuery() {
        let query = 'SELECT ';
        
        // SELECT 子句
        if (this._select.length > 0) {
            query += this._select.join(', ');
        } else {
            query += `${this.tableName}.*`;
        }
        
        // FROM 子句
        query += ` FROM ${this.tableName}`;
        
        // JOIN 子句
        if (this._joins.length > 0) {
            for (const join of this._joins) {
                query += ` ${join.type} ${join.table} ON ${join.condition}`;
            }
        }
        
        // WHERE 子句
        if (this._where.length > 0) {
            query += ' WHERE ' + this._where.join(' AND ');
        }
        
        // ORDER BY 子句
        if (this._orderBy.length > 0) {
            query += ' ORDER BY ' + this._orderBy.join(', ');
        }
        
        // LIMIT 子句（Access 使用 TOP，但这里先用标准 SQL）
        if (this._limit !== null) {
            query += ` LIMIT ${this._limit}`;
        }
        
        // OFFSET 子句
        if (this._offset !== null) {
            query += ` OFFSET ${this._offset}`;
        }
        
        query += ';';
        return query;
    }

    /**
     * 执行查询
     * @returns {Promise<Array>}
     */
    async execute() {
        const query = this.buildQuery();
        try {
            const result = await ConnectDB.connection.query(query);
            return result;
        } catch (err) {
            console.log('Query error:', err);
            console.log('SQL:', query);
            throw err;
        }
    }

    /**
     * 获取单条记录
     * @returns {Promise<Object|null>}
     */
    async first() {
        this.limit(1);
        const results = await this.execute();
        return results.length > 0 ? results[0] : null;
    }

    /**
     * 获取 SQL 字符串（用于调试）
     * @returns {string}
     */
    toSql() {
        return this.buildQuery();
    }
}

class Model extends QueryBuilder {
    /**
     * 启动查询链
     * @returns {QueryChain}
     */
    static newQuery() {
        return new QueryChain(this);
    }

    static async where(conditionals) {
        for (const attr in conditionals) {
            // 处理值：如果是字符串则加单引号
            conditionals[attr] = (typeof conditionals[attr] === 'string') ? `'${conditionals[attr]}'` : conditionals[attr];
        }
        return await super.where(conditionals);
    }

    /**
     * 删除记录
     * @param {Object} where 查询条件，例如 { id: 1 }
     * @returns {Promise}
     */
    static async delete(where) {
        const { tableName } = this;
        let wh = "WHERE ";

        for (const attr in where) {
            wh += (wh === 'WHERE ') ? '' : ' AND ';
            // 处理值：如果是字符串则加单引号
            const val = (typeof where[attr] === 'string') ? `'${where[attr]}'` : where[attr];
            wh += `${attr} = ${val}`;
        }

        this.query = `DELETE FROM ${tableName} ${wh};`;

        try {
            // 使用 ConnectDB.connection.execute 执行删除语句
            return await ConnectDB.connection.execute(this.query);
        } catch (err) {
            console.log('err', err);
            throw err;
        }
    }
}

module.exports = Model;
