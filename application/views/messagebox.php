<?php if ( !$userdata["loggedin"] ) : ?>
<footer>
	<div id="footnote">Please, log in to write messages</div>
</footer>
<?php else : ?>
<footer>
<form id="messagebox" action="">
	<input id="message" maxlength="160" autocomplete="off" placeholder="Put your text here" autofocus>
	<input id="send" type="submit" value="Send">
	<div id="counter">160</div>
</form>
</footer>
<?php endif ?>