var Model = require('./Model.js')
class UserModel extends Model {
    //static tableName = 'users';

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
