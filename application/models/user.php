<?php
class User extends CI_Model {
	public $userdata = array();

	public function __construct() {
		parent::__construct();
	}

	public function check_username( $username ) {
		if ( empty($username) ) return false;
		$username = strtolower( $username );
		if ( !preg_match( '/^[0-9a-z.\\-_]*$/', $username ) ) return false;
		if ( strlen( $username ) < 3 && strlen( $username ) > 20 ) return false;
		return true;
	}

	public function check_username_vacancy( $username ) {
		$username = strtolower( $username );
		$sql = "SELECT * FROM users WHERE username = ? LIMIT 1";
		$query = $this->db->query( $sql, array($username) );
		if ( $query->num_rows() == 1 ) return false;
		return true;
	}

	public function check_password( $password ) {
		if ( empty($password) ) return false;
		if ( strlen( $password ) < 6 || strlen( $password ) > 50 ) return false;
		return true;
	}

	public function check_passwords_compare( $password1, $password2 ) {
		if ( md5($password1) == md5($password2) ) return true;
		return false;
	}

	public function login( $username, $password ) {
		$username = strtolower( $username );
		$sql = "SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1";
		$query = $this->db->query( $sql, array($username, md5($password)) );
		if ( $query->num_rows() == 1 ) {
			$this->userdata = $query->row_array();
			$this->userdata["loggedin"] = true;
		} else {
			$this->userdata["username"] = $username;
			$this->userdata["loggedin"] = false;
		}
		$this->session->set_userdata( $this->userdata );
		return $this->userdata["loggedin"];
	}

	public function register( $username, $password ) {
		$username = strtolower( $username );
		$sql = "INSERT INTO users (username,password) VALUES( ?, ? )";
		$query = $this->db->query( $sql, array($username, md5($password)) );
		return $this->login( $username, $password );
	}

	public function get_user_data( $id = false ) {
		$userdata = $this->session->all_userdata();
		if ( empty( $userdata["id"] ) ) return array(
			"id" => 0,
			"loggedin" => false
		);
		$query = $this->db->query("SELECT * FROM users WHERE id = '".$userdata["id"]."' LIMIT 1");
		if ( $query->num_rows() == 1 ) return $userdata;
		return false;
	}

	public function get_online() {
		$list = $this->db->query("
			SELECT id, username, role FROM users
			WHERE activity > now()-timestamp('0000.00.00 00:00:30')
			ORDER BY username LIMIT 50
		");
		return $list->result_array();
	}

	public function check_in() {
		$userdata = $this->session->all_userdata();
		if ( !empty($userdata["loggedin"]) && $userdata["loggedin"] == true ) {
			$sql = "UPDATE users SET activity = now() WHERE username = ?";
			$query = $this->db->query( $sql, array($userdata["username"]) );
			return true;
		}
		return false;
	}

	public function delete( $id ) {
		$sql = "DELETE FROM users WHERE id = ?";
		$query = $this->db->query( $sql, array( $id ) );
		return true;
	}

	public function logout() {
		return $this->session->sess_destroy();
	}
}