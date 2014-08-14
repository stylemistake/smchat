<header>
	
<div id="title"><?=$title?></div>
<div id="subtitle"><?=$subtitle?></div>
<div id="online-header">Online</div>

<?php if ( !$userdata["loggedin"] ) : ?>
<nav>
	<button id="login">Login</button>
	<button id="register">Register</button>
</nav>
<?php else : ?>
<nav>
	<span>You're logged in as <b><?=$userdata["username"]?></b></span>
	<button id="logout">Logout</button>
</nav>
<?php endif ?>

</header>