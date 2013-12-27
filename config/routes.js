module.exports = function routes() {
  this.root('mainpanel#show');
  this.resource('account');
  this.match('main', 'mainpanel#show', { via: 'get' });
  this.match('famous', 'mainpanel#famous', { via: 'get' });
  this.match('fail', 'mainpanel#fail', { via: 'get' });
  this.match('de-auth/facebook', 'auth#deAuthFacebook', { via: 'post' });    // ajax call
  this.match('auth/facebook', 'auth#authFacebook', { via: 'get' });
  this.match('callback/facebook', 'auth#callbackFacebook', { via: 'get' });
  this.match('ajax/status', 'ajax#checkStatus', { via: 'get' });    // ajax call
  //this.match('index', 'account#loginForm', { via: 'get' });
  this.match('register', 'account#registrationForm', { via: 'get' });
  this.match('signup', 'account#signup', { via: 'post' });
  this.match('login', 'account#loginForm', { via: 'get' });
  this.match('login', 'account#login', { via: 'post' });
  this.match('logout', 'account#logout', { via: 'get' });
  this.match('contact/import', 'account#importContacts', { via: 'post' });
  this.match('contacts/add', 'contacts#add', { via: 'post'});
  this.match('user/lookup', 'account#lookup', { via: 'post'});
  this.match('forgetpassword', 'account#forgetPasswordForm', { via: 'get'});
  this.match('forgetpassword', 'account#forgetPassword', { via:'post'});
};
