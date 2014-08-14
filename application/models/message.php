<?php
class Message extends CI_Model {
	public function __construct() {
		parent::__construct();
	}

	public function xss_clean( $string ) {
		$search=array("<", ">");
		$replace=array("&lt;","&gt;");
		$string = str_replace( $search, $replace, $string );
		return $string;
	}

	public function get() {
		$query = $this->db->query("SELECT * FROM messages ORDER BY id DESC LIMIT 50");
		return $query->result();
	}

	public function get_list( $size ) {
		$query = $this->db->query("SELECT id FROM messages ORDER BY id DESC LIMIT $size");
		return $query->result_array();
	}

	public function get_single( $id ) {
		$query = $this->db->query("SELECT * FROM messages WHERE id = $id LIMIT 1");
		return $query->row_array();
	}

	public function get_multi( $ids ) {
		$sql = "SELECT * FROM messages WHERE id = ? LIMIT 1";
		$this->db->trans_start();
		$result = array();
		foreach( $ids as $id ) {
			$query = $this->db->query( $sql, array($id) );
			$result[] = $query->row_array();
		}
		return $result;
	}

	public function check_post( $message ) {
		if ( strlen($message) < 2 ) return false;
		return true;
	}

	public function post( $username, $message ) {
		$sql = "INSERT INTO messages (name, message) VALUES ( ?, ? )";
		$message = $this->xss_clean( $message );
		$message = trim( substr( $message, 0, 360 ) );
		$this->db->query( $sql, array( $username, $message ) );
		return true;
	}

	public function edit( $id, $message ) {
		$sql = "UPDATE messages SET message = ? WHERE id = ?";
		$message = $this->xss_clean( $message );
		$this->db->query( $sql, array( $message, $id ) );
		return true;
	}

	public function delete( $id ) {
		$sql = "DELETE FROM messages WHERE id = ?";
		$this->db->query( $sql, array($id) );
		return true;
	}
}