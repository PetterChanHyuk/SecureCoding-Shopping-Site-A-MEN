This is MyDiary homepage on that you can write your personal diary.

You have to install node.js and MySQL first.

All modules that you should install through npm are described in package.json and package-lock.json

In server.js you should fill out section with your SQL info.

### In server folder for running backend server
```
node server.js
```

Then diaryDB database will be created with tables in it automatically.

### In client folder for running frontend webpage
```
npm run serve
```

### In .env file at client folder you should type your back-end server IP in.
```
VUE_APP_BACKEND_URL=http://{your computer IP}:3000
```

### In .env file at server folder you should type front-end IP, email(Account, PW), mySQL(Account, PW) in.
```
VUE_APP_FRONTEND_URL=http://{your computer IP}:8080
EMAIL_USER={your email account}
EMAIL_PASS={your email password}
DB_HOST=localhost
DB_USER=root
DB_PASS={your mySQL password}
```
