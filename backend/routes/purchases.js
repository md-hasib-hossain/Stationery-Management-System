const crudFactory = require("./_crudFactory");
module.exports = crudFactory("purchases", ["date", "item", "amount", "note"]);
