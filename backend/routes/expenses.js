const crudFactory = require("./_crudFactory");
module.exports = crudFactory("expenses", ["date", "category", "amount", "note"]);
