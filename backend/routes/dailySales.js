const crudFactory = require("./_crudFactory");
module.exports = crudFactory("daily_sales", ["date", "purpose", "stationery", "profit", "note"]);
