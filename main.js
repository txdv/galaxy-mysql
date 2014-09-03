(function () {
	var galaxy = require('galaxy');
	var mysql  = require('mysql');

	require('galaxy-augment');

	function augmentConnection(connection) {
		connection.queryAsync   = galaxy.star(galaxy.nova(connection, connection.query, ["rows", "fields"]));

		['connect', 'ping', 'statistics', 'end'].forEach(function (obj) {
			connection[obj + 'Async'] = galaxy.star(connection[obj]);
		});

		return connection;
	}
	

	galaxy.augment(mysql, "createConnection", augmentConnection);

	galaxy.augment(mysql, "createPool", function (pool) {

		galaxy.augment(pool, "getConnection", null, augmentConnection);

		pool.getConnectionAsync = galaxy.star(pool.getConnection);
	});


	if (module.parent) {
		module.exports = mysql;
		return;
	}
	
	var connection = mysql.createConnection(
		JSON.parse(require('fs').readFileSync('mysql.json', 'utf8'))
	);

	galaxy.main(function *() {
		try {
			connection.connect();
			var res = yield connection.queryAsync('SELECT 1 + 1 AS solution');
			console.log(res.rows[0].solution);
			console.log(yield connection.statisticsAsync());
			connection.end();
		} catch (ex) {
			console.log(ex);
		}
	});
})();
