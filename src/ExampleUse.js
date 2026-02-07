const { ConnectDB } = require('./index');
const UserModel  = require('./ModelExample');

//ConnectDB.connect("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\\dev\\test\\adodb\\example.mdb;Persist Security Info=False;")
ConnectDB.connect("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./test/example.mdb;Persist Security Info=False;")

async function saveUser() {
    var user = new UserModel();
    user.userName = "John Doe";
    user.sex = "男";
    user.age = 25;

    const id = await user.save();
    console.log('User saved with id: ' + id);
}

async function whereUser() {
    var users = await UserModel.where({userName: "John Doe"});
    console.log('User found: ' + users[0].userName);
}

async function updateUser() {
    var user = await UserModel.update({userName: "Mike"}, {userName: "'John Doe'"});
    console.log('User updated: ' + user);
}

async function deleteUser() {
    var user = await UserModel.delete({userName: "Mike"});
    console.log('User deleted: ' + user);
}

(async()=>{
    await saveUser();
    await whereUser();
    await updateUser();
    await deleteUser(); 
})()


