<?php

	if (!defined('JSON_PRETTY_PRINT')) { define('JSON_PRETTY_PRINT', 0); }
	set_error_handler(function ($errno, $errstr, $errfile, $errline) {
	    throw new ErrorException($errstr, $errno, 0, $errfile, $errline);
	});

	class GatewayInterface {

		public static $db = null;
		public static function open_db () {
			try {
				static::$db = new mysqli(
					'welikepie.com',
					'alex',
					'Sannevanwel1j',
					'asos',
					3306
				);
				if (self::$db->connect_error) {
					throw new Exception(sprintf('[%d] %s', self::$db->connect_errno, self::$db->connect_error));
				}
			} catch (Exception $e) {
				self::$db = null;
				throw $e;
			}
		}
		public static function close_db () {
			if (isset(self::$db)) {
				// Kill the thread, thus closing the TCP connection
				self::$db->kill(self::$db->thread_id);
				self::$db->close();
				self::$db = null;
			}
		}
		public static function execute_query ($query, $args, $callback = NULL) {

			if (!self::$db) { throw new Exception('Database connection not opened.'); }

			$stmt = self::$db->prepare($query);
			if (!$stmt) { throw new Exception(sprintf('[%d] %s', self::$db->errno, self::$db->error)); }
			$sig = array(); $arguments = array();
			foreach ($args as &$val) {
				if (is_bool($val)) {
					$sig[] = 'i';
					$arguments[] = $val ? 1 : 0;
				} else if (is_int($val)) {
					$sig[] = 'i';
					$arguments[] = $val;
				} else if (is_float($val)) {
					$sig[] = 'd';
					$arguments[] = $val;
				} else {
					$sig[] = 's';
					$arguments[] = strval($val);
				}
			}
			if (count($args)) {
				$args = array(implode('', $sig));
				for ($i = 0; $i < count($arguments); $i++) {
					$bind_name = 'bind' . $i;
					$$bind_name = $arguments[$i];
					$args[] = &$$bind_name;
				}
				call_user_func_array(array($stmt, 'bind_param'), $args);
			}

			if (method_exists('mysqli_stmt', 'get_result')) {
				if ($stmt->execute()) {
					if ($callback) {
						$rs = $stmt->get_result();
						while ($row = $rs->fetch_assoc()) { call_user_func($callback, $row); }
						$rs->free(); unset($rs);
					}
				} else {
					$error = new Exception(sprintf('[%d] %s', self::$db->errno, self::$db->error));
				}
				$stmt->close(); unset($stmt);
			}

		}

		/* DATA RETRIEVAL
		 * ******************** */
		public static function getCategories ($req, $res) {

			// Check for possible match on specific categories
			if (isset($req->params) && isset($req->params['category_id'])) {
				$id = $req->params['category_id'];
				if (is_numeric($id)) { $id = intval($id, 10); }
				else { $id = null; }
			} else { $id = null; }

			self::open_db();
			$result = null;
			if ($id !== null) {
				self::execute_query('SELECT id, name FROM categories WHERE id = ?', array($id), function ($row) use (&$result) {
					$result = array('id' => intval($row['id'], 10), 'name' => $row['name']);
				});
			} else {
				$result = array();
				self::execute_query('SELECT id, name FROM categories', array(), function ($row) use (&$result) {
					$result[] = array('id' => intval($row['id'], 10), 'name' => $row['name']);
				});
			}
			self::close_db();

			if ($result !== null) {
				$res->setFormat('json');
				$res->add(json_encode($result));
				$res->send(200);
			} else {
				$res->setFormat('json');
				$res->add(json_encode(array('error' => 'No category with such ID')));
				$res->send(204);
			}

		}

		public static $currencies = array('GBP' => '£');
		public static function getProducts ($req, $res) {

			// Check for possible match on specific categories
			if (isset($req->params) && isset($req->params['product_id'])) {
				$id = $req->params['product_id'];
				if (is_numeric($id)) { $id = intval($id, 10); }
				else { $id = null; }
			} else { $id = null; }

			$filters = array(
				'name' => isset($_GET['name']) ? $_GET['name'] : null,
				'gender' => isset($_GET['gender']) && in_array(strtolower($_GET['gender']), array('male', 'female')) ? strtolower($_GET['gender']) : null,
				'category' => isset($_GET['category']) ? array_map(function ($val) { return intval($val, 10); }, explode(',', $_GET['category'])) : null,
				'currency' => isset($_GET['currency']) && array_key_exists(strtoupper($_GET['currency']), self::$currencies) ? strtoupper($_GET['currency']) : 'GBP',
				'limit' => isset($_GET['limit']) && is_numeric($_GET['limit']) ? intval($_GET['limit'], 10) : 1000
			);

			// BUILD SQL QUERY
			$sql_query = array(
				'SELECT',
					'products.id,',
					'products.name,',
					'products.image,',
					'products.description,',
					'categories.id AS category_id,',
					'categories.name AS category_name,',
					'product_prices.price',
				'FROM products',
				'LEFT OUTER JOIN product_categories ON products.id = product_categories.product_id',
				'LEFT OUTER JOIN categories ON product_categories.category_id = categories.id',
				'LEFT OUTER JOIN product_prices ON products.id = product_prices.product_id AND product_prices.currency = ?'
			);
			$sql_params = array($filters['currency']);
			$sql_filters = array();

			// Apply filters
			if ($id) {
				$sql_filters[] = 'products.id = ?';
				$sql_params[] = $id;
			} else {
				if ($filters['name']) {
					preg_match_all('/"[^"]+"|\S+/', $filters['name'], $name_matches);
					foreach ($name_matches[0] as &$sentence) {
						$sql_filters[] = '(products.name LIKE ? OR products.description LIKE ?)';
						$temp = preg_replace('/"?([^"]+)"?/', '%$1%', $sentence);
						$sql_params[] = $temp;
						$sql_params[] = $temp;
					}
					unset($temp); unset($name_matches);
				}
				if ($filters['gender']) {
					$sql_filters[] = 'products.gender = ?';
					$sql_params[] = $filters['gender'];
				}
				if ($filters['category']) {
					$sql_filters[] = 'product_categories.category_id IN (' . implode(', ', $filters['category']) . ')';
				}
			}
			if (count($sql_filters)) { $sql_query = array_merge($sql_query, array('WHERE', implode(' AND ', $sql_filters))); }

			$sql_query = array_merge($sql_query, array(
				'ORDER BY',
					'products.id ASC,',
					'product_categories.category_id ASC',
				'LIMIT ?'
			));
			$sql_params[] = $filters['limit'];

			self::open_db();
			$result = array();
			self::execute_query(implode(' ', $sql_query), $sql_params, function ($row) use (&$result, &$filters) {

				$product_id = intval($row['id'], 10);
				if (!array_key_exists($product_id, $result)) {
					$result[$product_id] = array(
						'id' => $product_id,
						'name' => $row['name'],
						'photo_small' => $row['image'],
						'photo_big' => $row['image'],
						'price' => GatewayInterface::$currencies[$filters['currency']] . number_format(floatval($row['price']), 2),
						'url' => 'http://www.asos.com/pgeproduct.aspx?iid=' . $product_id,
						'description' => ($row['description'] && ($row['description'] !== null) ? $row['description'] : null),
						'categories' => array()
					);
				}
				$temp = &$result[$product_id];

				$category_id = strval($row['category_id']);
				if (!array_key_exists($category_id, $temp['categories'])) {
					$temp['categories'][$category_id] = $row['category_name'];
				}

			});
			self::close_db();

			$result = array_values($result);
			$res->setFormat('json');
			$res->add(str_replace('\/', '/', json_encode($id !== null ? $result[0] : $result, JSON_PRETTY_PRINT)));
			$res->send(200);

		}

		// ACTUAL FUNCTIONALITY
		public static function test ($req, $res) {

			$results = array();

			// First, test the database connectivity
			try {
				self::open_db();
				self::close_db();
				$results['database'] = 'Connection OK';
			} catch (Exception $e) {
				$results['database'] = $e->getMessage();
			}

			$res->setFormat('json');
			$res->add(json_encode($results, JSON_PRETTY_PRINT));
			$res->send(200);

		}

	}

	class Dummy {
		public $params = array();
		public $buffer = array();
		public function setFormat () {}
		public function send () {}
		public function add ($val) { $this->buffer[] = $val; }
	}

?>