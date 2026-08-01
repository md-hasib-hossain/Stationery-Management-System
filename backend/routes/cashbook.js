const crudFactory = require("./_crudFactory");
module.exports = crudFactory("cash_book", ["date", "type", "amount", "remarks"]);
