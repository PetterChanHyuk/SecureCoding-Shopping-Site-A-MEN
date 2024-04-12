require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 타임스탬프 함수
const moment = require('moment-timezone');
function getCurrentTimestamp() {
  return moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
}

// 로그를 기록하는 함수
async function logAction(userId, message) {
  const currentTimestamp = getCurrentTimestamp();
  console.log(`[${currentTimestamp}] [User ID: ${userId}] ${message}`);

  // 사용자의 마지막 활동 시간 업데이트
  if (userId && /^\d{5}$/.test(userId)) {
    try {
      await db.query('UPDATE users SET last_activity = ? WHERE id = ?', [currentTimestamp, userId]);
    } catch (err) {
      console.error(`Error updating last activity for user ${userId}: ${err.message}`);
    }
  }
}

// 5자리 랜덤 숫자 생성 함수
function generateRandomUserId() {
  return Math.floor(10000 + Math.random() * 90000);
}

// 암호화 키
const ENCRYPTION_KEY = 'your-32-byte-long-encryption-key'; // 32바이트의 키
const IV_LENGTH = 16; // 초기화 벡터 길이

// 텍스트 암호화 함수
function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 텍스트 복호화 함수
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// 이메일 서비스 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 이메일 인증 토큰 생성 함수
function generateEmailVerificationToken() {
  return crypto.randomBytes(20).toString('hex');
}

// 비밀번호 재설정 토큰 생성 함수
function generateResetToken() {
  return crypto.randomBytes(20).toString('hex');
}

// 회원가입 인증 이메일 발송 함수
async function sendVerificationEmail(email, emailVerificationToken, tokenExpirationTime) {
  const formattedExpirationTime = tokenExpirationTime.format('YYYY-MM-DD HH:mm:ss');
  const verificationLink = `${process.env.VUE_APP_FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
  const mailOptions = {
    from: 'ewoo2821@gmail.com',
    to: email,
    subject: '이메일 인증',
    html: `<p>이메일 인증을 위해 아래 링크를 클릭해주세요.<br>해당 링크는 <strong>${formattedExpirationTime}</strong>까지 유효합니다.<br><br><span style="font-size:'30px'"><a href="${verificationLink}"  style="font-size:200%; text-decoration:none;"">인증하기</a></span></p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logAction(email, `Verification email sent: ${info.response}`);
  } catch (error) {
    logAction(email, `Error sending verification email: ${error.message}`);
    throw new Error('Error sending verification email');
  }
}

// 비밀번호 재설정 이메일 발송 함수
async function sendPasswordResetEmail(email, resetLink, expirationTime) {
  const formattedExpirationTime = moment(expirationTime).format('YYYY-MM-DD HH:mm:ss');
  const mailOptions = {
    from: 'ewoo2821@gmail.com', // 발신자 이메일 주소
    to: email, // 수신자 이메일 주소
    subject: '비밀번호 재설정 요청', // 이메일 제목
    html: `
      <p>비밀번호를 재설정하려면 아래 링크를 클릭하세요:<br>해당 링크는 <strong>${formattedExpirationTime}</strong>까지 유효합니다.<br><br></p>
      <a href="${resetLink}" style="font-size:200%; text-decoration:none;">비밀번호 재설정</a>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logAction(email, `Password reset email sent`);
  } catch (error) {
    logAction(email, `Error sending password reset email: ${error}`);
    throw new Error('Error sending password reset email');
  }
}

// db에 대한 전역변수 설정
let db;

// 만료된 계정 삭제 함수
async function deleteExpiredAccounts(db) {
  try {
    const query = `
      DELETE FROM users 
      WHERE email_verified = 0 AND 
      token_expiration < NOW()`;

    const results = await db.query(query);
    logAction('System', `Deleted expired accounts: ${results[0].affectedRows}`);
  } catch (err) {
    logAction('System', `Error deleting expired accounts: ${err.message}`);
  }
}

// 서버 초기화 및 데이터베이스 설정
async function initializeServer() {
  try {
    // 데이터베이스 연결 설정
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    };

    // MySQL 데이터베이스 연결
    db = await mysql.createConnection(dbConfig);
    logAction('System', 'MySQL successfully connected!');

    // diaryDB 데이터베이스 생성
    const [dbCreateResult] = await db.query("CREATE DATABASE IF NOT EXISTS diaryDB");
    // diaryDB 데이터베이스 존재 여부 확인
    const [dbs] = await db.query("SHOW DATABASES LIKE 'diaryDB'");
    if (dbs.length === 0) {
      // diaryDB 데이터베이스 생성
      await db.query("CREATE DATABASE diaryDB");
      logAction('System', "DiaryDB created!");
    } else {
      logAction('System', "DiaryDB already exists!");
    }

    // diaryDB 데이터베이스 연결
    await db.changeUser({ database: 'diaryDB' });

    // users 테이블 존재 여부 확인 및 생성
    const [usersTables] = await db.query("SHOW TABLES LIKE 'users'");
    if (usersTables.length === 0) {
      const createUsersTable = `
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email_verified BOOLEAN NOT NULL DEFAULT FALSE,
            email_verification_token VARCHAR(255),
            token_expiration DATETIME,
            is_LogIn BOOLEAN NOT NULL DEFAULT FALSE,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
      await db.query(createUsersTable);
      logAction('System', "Table 'users' created!");
    } else {
      logAction('System', "Table 'users' already exists!");
    }

    // diaries 테이블 존재 여부 확인 및 생성
    const [diariesTables] = await db.query("SHOW TABLES LIKE 'diaries'");
    if (diariesTables.length === 0) {
      const createDiariesTable = `
        CREATE TABLE diaries (
            diary_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            date DATE,
            content TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`;
      await db.query(createDiariesTable);
      logAction('System', "Table 'diaries' created!");
    } else {
      logAction('System', "Table 'diaries' already exists!");
    }

    // password_reset_tokens 테이블 생성
    const [PasswordResetTokensTables] = await db.query("SHOW TABLES LIKE 'password_reset_tokens'");
    if (PasswordResetTokensTables.length === 0) {
      const createPasswordResetTokensTable = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expiration DATETIME NOT NULL,
        PRIMARY KEY (token),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`;
      await db.query(createPasswordResetTokensTable);
      logAction('System', "Table 'password_reset_tokens' created!");
    } else {
      logAction('System', "Table 'password_reset_tokens' already exists!");
    }

    // 만료된 계정 삭제
    await deleteExpiredAccounts(db);

  } catch (err) {
    logAction('System', `Failed to initialize server: ${err.message}`);
  }


  // Express 앱 설정
  const app = express();
  app.use(cors({
    origin: `${process.env.VUE_APP_FRONTEND_URL}`,
    credentials: true
  }));
  app.use(bodyParser.json());

  // 회원가입 라우트
  app.post('/userregister', async (req, res) => {
    const { email, password, name, phone } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // 고유 사용자 ID 생성
      let userId;
      let isUnique = false;
      while (!isUnique) {
        userId = generateRandomUserId();
        const [checkUserId] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (checkUserId.length === 0) {
          isUnique = true;
        }
      }

      // 중복 이메일 검사
      const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        return res.status(409).send({ message: '이미 사용 중인 이메일 주소입니다.' });
      }

      // 이메일 인증 토큰 생성
      const emailVerificationToken = generateEmailVerificationToken();
      const currentTimestamp = getCurrentTimestamp();
      const tokenExpirationTime = moment(currentTimestamp).add(3, 'hours');

      // 사용자 정보 저장
      const insertQuery = 'INSERT INTO users (id, email, password, name, phone, email_verification_token, token_expiration) VALUES (?, ?, ?, ?, ?, ?, ?)';
      await db.query(insertQuery, [userId, email, hashedPassword, name, phone, emailVerificationToken, tokenExpirationTime.format('YYYY-MM-DD HH:mm:ss')]);

      logAction(email, `Account registered with ID ${userId}`);

      // 이메일 발송 로직 호출
      try {
        await sendVerificationEmail(email, emailVerificationToken, tokenExpirationTime);
        res.status(200).send({ message: 'Verification email sent successfully' });
      } catch (error) {
        res.status(500).send({ message: 'Error sending verification email' });
        logAction(email, `Error sending verification email: ${error.message}`);
      }
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        // 중복 이메일 오류 처리
        return res.status(409).send({ message: '이미 사용 중인 이메일 주소입니다.' });
      }

      // email 변수 존재여부 확인
      const email = req.body.email || 'Unknown';
      logAction(email, `Server error on registering: ${err.message}`);
      res.status(500).send({ message: 'Server error' });
    }
  });

  // 이메일 인증 라우트
  app.get('/verify-email', async (req, res) => {
    try {
      const token = req.query.token;
      logAction('EmailVerification', `인증 시도: 토큰 ${token}`);

      // 데이터베이스에서 사용자 및 토큰 정보 조회
      const [userQueryResult] = await db.query('SELECT * FROM users WHERE email_verification_token = ?', [token]);

      if (userQueryResult.length === 0) {
        logAction('EmailVerification', `유효하지 않은 토큰: ${token}`);
        return res.status(404).send({ message: '유효하지 않은 토큰입니다.' });
      }

      const user = userQueryResult[0];
      const tokenExpiration = user.token_expiration; // 토큰 만료 시간

      // 현재 시간과 토큰 만료 시간 비교
      if (new Date() > new Date(tokenExpiration)) {
        logAction('EmailVerification', `만료된 토큰: ${token}`);
        return res.status(410).send({ message: '인증 토큰이 만료되었습니다.' });
      }

      // 이메일 인증 상태 업데이트
      await db.query('UPDATE users SET email_verified = TRUE WHERE email_verification_token = ?', [token]);
      logAction('EmailVerification', `이메일 인증 성공: ${user.email}`);
      res.send({ message: '이메일 인증이 성공적으로 완료되었습니다.' });
    } catch (error) {
      console.error(error);
      logAction('EmailVerification', `서버 오류: ${error.message}`);
      res.status(500).send({ message: '서버 오류가 발생했습니다.' });
    }
  });

  // 이메일 중복 확인 라우트
  app.get('/check-email/:email', async (req, res) => {
    const emailToCheck = req.params.email;

    try {
      const [results] = await db.query('SELECT * FROM users WHERE email = ?', [emailToCheck]);

      if (results.length > 0) {
        // 중복 이메일이 이미 존재하는 경우
        logAction(emailToCheck, 'Email already exists');
        return res.status(409).send({ message: '이미 존재하는 메일입니다.' });
      }

      // 중복 이메일이 존재하지 않는 경우
      logAction(emailToCheck, 'Email available');
      res.status(200).send({ message: '사용 가능한 이메일입니다.' });
    } catch (err) {
      logAction(emailToCheck, `Server error on searching email in database: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 전화번호 중복 확인 라우트
  app.get('/check-phone/:phone', async (req, res) => {
    const phoneToCheck = req.params.phone;

    try {
      const [results] = await db.query('SELECT * FROM users WHERE phone = ?', [phoneToCheck]);

      if (results.length > 0) {
        // 중복 전화번호가 이미 존재하는 경우
        logAction(phoneToCheck, 'Phone number already exists');
        return res.status(409).send({ message: '이미 사용 중인 전화번호입니다.' });
      }

      // 중복 전화번호가 존재하지 않는 경우
      logAction(phoneToCheck, 'Phone number available');
      res.status(200).send({ message: '사용 가능한 전화번호입니다.' });
    } catch (err) {
      logAction(phoneToCheck, `Server error on searching phone in database: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 로그인 라우트
  app.post('/userlogin', async (req, res) => {
    const { email, password } = req.body;

    try {
      // 사용자 정보 조회
      const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  
      if (user.length === 0) {
        return res.status(401).send({ message: '잘못된 이메일 또는 비밀번호입니다.' });
      }
  
      const currentUser = user[0];
  
      // 이미 로그인 중인지 확인
      if (currentUser.is_LogIn) {
        return res.status(401).send({ message: '이미 다른 디바이스에서 로그인 중입니다.' });
      }
  
      // 비밀번호 확인
      if (!await bcrypt.compare(password, currentUser.password)) {
        return res.status(401).send({ message: '잘못된 이메일 또는 비밀번호입니다.' });
      }
  
      // 이메일 인증 확인
      if (!currentUser.email_verified) {
        return res.status(401).send({ message: '이메일 인증이 완료되지 않았습니다.' });
      }

      // 로그인 성공
      logAction(email, 'Login successful');
      await db.query('UPDATE users SET is_LogIn = 1 WHERE id = ?', [currentUser.id]);
      await db.query('UPDATE users SET last_activity = NOW() WHERE id = ?', [currentUser.id]);
      res.status(200).send({ message: 'Login successful', userId: currentUser.id });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: 'Server error' });
    }
  });

  // 로그아웃 라우트
  app.post('/userlogout', async (req, res) => {
    const { userId } = req.body;

    try {
        // is_LogIn을 0으로 설정
        await db.query('UPDATE users SET is_LogIn = 0 WHERE id = ?', [userId]);
        res.status(200).send({ message: 'Logout successful' });
    } catch (err) {
        // 오류 처리
        res.status(500).send({ message: 'Server error' });
    }
  });

  // 사용자 이름 조회 라우트
  app.get('/username', async (req, res) => {
    const userId = req.query.userId;
    logAction(userId, `Username request received: ${userId}`);
    if (!userId) {
      logAction(userId, `Username request error: No user ID provided`);
      return res.status(400).send({ message: 'No user ID provided' });
    }

    try {
      const [results] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);

      if (results.length === 0) {
        logAction(userId, `Username request error: User not found`);
        return res.status(404).send({ message: 'User not found' });
      }

      res.send({ name: results[0].name });
    } catch (err) {
      logAction(userId, `Username request error: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 일기저장 라우트
  app.post('/savediary', async (req, res) => {
    const { user_id, date, content } = req.body;
    const encryptedContent = encrypt(content);

    try {
      const [selectResults] = await db.query('SELECT * FROM diaries WHERE user_id = ? AND date = ?', [user_id, date]);

      if (selectResults.length > 0) {
        // 일기가 이미 존재하면 업데이트
        await db.query('UPDATE diaries SET content = ? WHERE user_id = ? AND date = ?', [encryptedContent, user_id, date]);
        logAction(user_id, `SaveDiary request: Diary updated successfully`);
        res.status(200).send({ message: 'Diary updated successfully' });
      } else {
        // 새 일기 삽입
        await db.query('INSERT INTO diaries (user_id, date, content) VALUES (?, ?, ?)', [user_id, date, encryptedContent]);
        logAction(user_id, `SaveDiary request: Diary saved successfully`);
        res.status(200).send({ message: 'Diary saved successfully' });
      }
    } catch (err) {
      logAction(user_id, `SaveDiary request error: ${err.message}`);
      return res.status(500).send({ message: 'Error saving diary' });
    }
  });

  // 특정 날짜의 일기 조회 라우트
  app.get('/diary/:date', async (req, res) => {
    const userId = req.query.userId;
    const date = req.params.date;

    try {
      const [results] = await db.query('SELECT * FROM diaries WHERE user_id = ? AND date = ?', [userId, date]);

      if (results.length === 0) {
        logAction(userId, `SearchDiary request: no contents on this date`);
        return res.status(404).send({ message: 'Diary not found for this date' });
      }

      const decryptedContent = decrypt(results[0].content);
      res.send({ content: decryptedContent });
    } catch (err) {
      logAction(userId, `SearchDiary request error: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 계정 찾기 라우트
  app.post('/findAccount', async (req, res) => {
    const { name, phone } = req.body;

    try {
      const [results] = await db.query('SELECT email FROM users WHERE name = ? AND phone = ?', [name, phone]);

      if (results.length > 0) {
        const email = results[0].email;
        logAction(name, `FindAccount request: Account found with email ${email}`);
        res.send({ email: email });
      } else {
        logAction(name, 'FindAccount request: No account found');
        res.status(404).send({ message: 'No account found' });
      }
    } catch (err) {
      logAction(name, `FindAccount request error: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 비밀번호 재설정 라우트
  app.post('/resetPassword', async (req, res) => {
    const { email, name, phone } = req.body;

    try {
      const [results] = await db.query('SELECT id FROM users WHERE email = ? AND name = ? AND phone = ?', [email, name, phone]);

      if (results.length > 0) {
        const userId = results[0].id;
        logAction(email, `ResetPassword request: User found with ID ${userId}`);
        res.send({ userId: userId });
      } else {
        logAction(email, 'ResetPassword request: No user found');
        res.status(404).send({ message: 'No user found' });
      }
    } catch (err) {
      logAction(email, `ResetPassword request error: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 비밀번호 재설정용 링크 이메일 전송 라우트
  app.post('/requestPasswordReset', async (req, res) => {
    const { email, name, phone } = req.body;
  
    try {
      // 사용자 정보 확인
      const [user] = await db.query('SELECT * FROM users WHERE email = ? AND name = ? AND phone = ?', [email, name, phone]);
  
      if (!user || user.length === 0) {
        return res.status(404).send({ message: '사용자를 찾을 수 없습니다.' });
      }

      // 사용자의 ID 추출
      const userId = user[0].id;
  
      // 비밀번호 재설정 토큰 생성
      const resetToken = generateResetToken();
      const expirationTime = moment().add(3, 'hours').format('YYYY-MM-DD HH:mm:ss');

      // 토큰 저장
      await db.query('INSERT INTO password_reset_tokens (user_id, token, expiration) VALUES (?, ?, ?)', [userId, resetToken, expirationTime]);

      const resetLink = `${process.env.VUE_APP_FRONTEND_URL}/reset-password?token=${resetToken}`;

      try {
        await sendPasswordResetEmail(email, resetLink, expirationTime);
        res.send({ message: '비밀번호 재설정 링크를 이메일로 발송했습니다.' });
      } catch (error) {
        logAction(email, `이메일 발송 중 오류 발생: ${error.message}`);
        res.status(500).send({ message: '이메일 발송 중 오류 발생' });
      }

    } catch (err) {
      // 오류 처리
      logAction(email, `비밀번호 재설정 요청 처리 오류: ${err.message}`);
      res.status(500).send({ message: '서버 오류가 발생했습니다.' });
    }
  });

  // 비밀번호 재설정 토큰 조회 라우트
  app.get('/verify-reset-token', async (req, res) => {
    const { token } = req.query;
  
    try {
      // 데이터베이스에서 토큰 조회
      const [rows] = await db.query('SELECT * FROM password_reset_tokens WHERE token = ?', [token]);
  
      // 토큰이 존재하지 않는 경우
      if (rows.length === 0) {
        logAction('System', `Invalid token attempt: ${token}`);
        return res.status(404).send({ message: '유효하지 않은 토큰입니다.' });
      }
  
      // 토큰 만료 여부 확인
      const tokenData = rows[0];
      const now = new Date();
      if (new Date(tokenData.expiration) < now) {
        // 토큰이 만료된 경우
        logAction('System', `Expired token attempt: ${token}`);
        return res.status(410).send({ message: '토큰이 만료되었습니다.' });
      }
  
      // 토큰이 유효한 경우, 연관된 userId 반환
      logAction('System', `Valid token verification: ${token}`);
      res.send({ userId: tokenData.user_id });
    } catch (err) {
      logAction('System', `Error verifying token: ${err.message}`);
      res.status(500).send({ message: '서버 오류가 발생했습니다.' });
    }
  });
  

  // 비밀번호 업데이트 라우트
  app.post('/updatePassword', async (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId) {
      return res.status(400).send({ message: 'userId is missing or invalid.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
      logAction(userId, `UpdatePassword request: Password updated successfully`);
      res.send({ message: 'Password updated successfully' });
    } catch (err) {
      logAction(userId, `UpdatePassword request error: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 사용자 정보 조회 라우트
  app.get('/userinfo/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
      const [results] = await db.query('SELECT email, name, phone FROM users WHERE id = ?', [userId]);

      if (results.length > 0) {
        const userInfo = results[0];
        logAction(userId, `Userinfo request: User information retrieved`);
        res.send(userInfo);
      } else {
        logAction(userId, 'Userinfo request: User not found');
        res.status(404).send({ message: 'User not found' });
      }
    } catch (err) {
      logAction(userId, `Userinfo request error: ${err.message}`);
      return res.status(500).send({ message: 'Server error' });
    }
  });

  // 현재 시간을 클라이언트로 전송 라우트
  app.get('/current-kst-date', (req, res) => {
    const kstDate = moment().tz('Asia/Seoul').format('YYYY-MM-DD');
    res.send({ date: kstDate });
  });

  // 최근 작성한 일기 날짜 조회 라우트
  app.get('/recent-diaries', async (req, res) => {
    const userId = req.query.userId;

    try {
      // 사용자의 최근 일기 날짜를 diary_id 기준 내림차순으로 조회
      const [diaries] = await db.query(`
        SELECT date FROM diaries 
        WHERE user_id = ? 
        ORDER BY diary_id DESC 
        LIMIT 30
      `, [userId]);

      // 날짜만 추출하여 배열로 반환
      const dates = diaries.map(diary => diary.date);
      res.send({ dates });
    } catch (err) {
      console.error(`Error fetching recent diaries for user ${userId}: ${err.message}`);
      res.status(500).send({ message: 'Server error' });
    }
  });

  // 일기 삭제 라우트
  app.delete('/diary/:date', async (req, res) => {
    const userId = req.query.userId;
    const date = req.params.date;

    try {
      const [result] = await db.query('DELETE FROM diaries WHERE user_id = ? AND date = ?', [userId, date]);

      if (result.affectedRows > 0) {
        logAction(userId, `Diary deleted for date: ${date}`);
        res.status(200).send({ message: 'Diary successfully deleted' });
      } else {
        logAction(userId, `No diary found to delete for date: ${date}`);
        res.status(404).send({ message: 'No diary found for this date' });
      }
    } catch (err) {
      logAction(userId, `Error deleting diary: ${err.message}`);
      res.status(500).send({ message: 'Server error' });
    }
  });

  // 서버 시작
  app.listen(3000, '0.0.0.0', () => {
    logAction('System', 'Server is running on port 3000');
  });
}

// 서버 초기화 실행
initializeServer();

// 주기적으로 만료된 비인증 계정 삭제(매 10분)
setInterval(() => {
  deleteExpiredAccounts(db)
  .then(() => logAction('System', 'Expired accounts check completed'))
  .catch(err => logAction('System', `Error during expired accounts check: ${err.message}`));
}, 10 * 60 * 1000);

// 정기적으로 사용자 로그아웃 체크(매 5분)
setInterval(async () => {
  const TIMEOUT = 30 * 60 * 1000; // 30분 타이머
  await db.query(`
    UPDATE users 
    SET is_LogIn = 0
    WHERE is_LogIn = 1 AND last_activity < NOW() - INTERVAL ? SECOND
  `, [TIMEOUT / 1000]);
}, 5 * 60 * 1000);