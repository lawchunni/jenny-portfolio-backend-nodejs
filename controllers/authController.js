const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const privateKey = process.env.SECRET_KEY;
const refreshKey = process.env.REFRESH_SECRET;
let refreshTokens = [];

const generateAccessToken = (user) => {
  return jwt.sign({ username: user.username }, privateKey, { expiresIn: '1h' });
}

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign({ username: user.username }, refreshKey, { expiresIn: '7d' });
  refreshTokens.push(refreshToken);
  return refreshToken;
}

// Logic to handle user login
const userLogin = async (req, res, db) => {
  const { username, password } = req.body;

  try {
    const user = await db.collection('users').findOne({ username: username });

    if (user && await bcrypt.compare(password, user.password)) {

      // generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const isAdmin = user.isAdmin;
      const preferredName = user.preferredName;

      res.status(200).json({ 
        message: 'Login Successful', 
        username, 
        preferredName, 
        isAdmin, 
        accessToken: accessToken, 
        refreshToken: refreshToken });

    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
      res.status(500).json({ message: 'Interal server error'});
  }
}

// Logic to handle user logout
const userLogout = async (req, res, db) => {
  const { refreshToken } = req.body;

  // remove the refreshToken from the list
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);

  res.json({message: 'User logout successfully'});
}

// Logic to refresh access token
const refreshAccessToken = async (req, res, db) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ message: 'Refresh token required' });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ message: 'Invalid refresh token, no token record' });
  }

  jwt.verify(refreshToken, refreshKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken({ username: user.username});
    res.json({ accessToken: newAccessToken});
  }) 
}

module.exports = {
  userLogin,
  userLogout,
  refreshAccessToken
}